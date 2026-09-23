"""Local dashboard API. Single process MVP, no public access controls by default."""
import json
import logging
from contextlib import asynccontextmanager
from uuid import UUID
from fastapi import BackgroundTasks, FastAPI, File, Form, HTTPException, UploadFile, Response
from fastapi.middleware.cors import CORSMiddleware

from . import config
from .job_store import JobStore
from .pipeline import process
from .schemas import JobCreateRequest, JobCreateResponse, JobStatusResponse, OriginalContentPayload, HumanizedPayload
from .rules_catalog import load_catalog
from .ai_detector import compare_ai_footprint, AIDetectionComparison
from .docx_exporter import markdown_to_docx

from .plagiarism.store import PlagiarismStore
from .plagiarism.document_parser import calculate_hash, extract_document_text
from .plagiarism.local_checker import run_local_check
from .plagiarism.external_provider import DefaultExternalProvider
from .plagiarism.schemas import (
    PlagiarismCheckCreateRequest,
    PlagiarismCheckCreateResponse,
    PlagiarismCheckStatusResponse,
    PlagiarismReport,
    PlagiarismReviewFlag,
    ReferenceDocCreate,
    ReferenceDocResponse,
)

logger = logging.getLogger(__name__)


def create_app(store: JobStore | None = None, plagiarism_store: PlagiarismStore | None = None):
    store = store or JobStore(config.DB_PATH)
    plag_store = plagiarism_store or PlagiarismStore(config.PLAGIARISM_DB_PATH)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        load_catalog()
        store.mark_interrupted()
        plag_store.mark_interrupted()
        yield

    app = FastAPI(title='Content Humanizer API', version='0.1.0', lifespan=lifespan)
    app.state.store = store
    app.state.plagiarism_store = plag_store
    app.add_middleware(
        CORSMiddleware,
        allow_origins=config.ALLOWED_ORIGINS,
        allow_methods=['GET', 'POST', 'DELETE', 'OPTIONS'],
        allow_headers=['Content-Type', 'Authorization', 'X-Client-Id']
    )

    def worker(job_id: str):
        job = store.get(job_id)
        if not job:
            return
        store.set_processing(job_id)
        try:
            provider = None
            if job['mode'] == 'external':
                if config.OPENAI_API_KEY:
                    from .openai_humanizer import openai_humanize
                    provider = openai_humanize
                else:
                    from .external_provider import external_humanize
                    provider = external_humanize
            result = process(job['original_text'], job['mode'], json.loads(job['seo_keywords']), provider)
            store.complete(job_id, result.model_dump())
        except Exception as exc:
            logger.exception('Job processing failed for job %s', job_id)
            if isinstance(exc, RuntimeError) and any(word in str(exc).lower() for word in ('configuration', 'requires', 'install')):
                message = 'External processing is not configured. Check the backend API key and optional SDK installation.'
            else:
                message = f'Processing failed: {str(exc)[:300]}'
            store.fail(job_id, message)

    def get_existing(job_id: str):
        try:
            UUID(job_id)
        except (TypeError, ValueError):
            raise HTTPException(status_code=404, detail='Job not found.') from None
        job = store.get(job_id)
        if not job:
            raise HTTPException(status_code=404, detail='Job not found.')
        return job

    @app.get('/')
    def root():
        return {'message': 'Content Humanizer API is running', 'docs': '/docs', 'health': '/api/health'}

    @app.get('/api/health')
    def health():
        return {'status': 'ok'}

    @app.post('/api/jobs', response_model=JobCreateResponse, status_code=201)
    def create_job(payload: JobCreateRequest, background_tasks: BackgroundTasks):
        if payload.mode == 'external' and not config.API_KEY and not config.OPENAI_API_KEY:
            raise HTTPException(status_code=422, detail='External mode requires backend API credentials.')
        row = store.create(payload.original_text, payload.mode, payload.seo_keywords)
        background_tasks.add_task(worker, row['job_id'])
        return row

    @app.get('/api/jobs/{job_id}', response_model=JobStatusResponse)
    def get_job(job_id: str):
        row = get_existing(job_id)
        result = HumanizedPayload.model_validate(json.loads(row['result_json'])) if row['result_json'] else None
        return JobStatusResponse(job_id=row['job_id'], status=row['status'],
                                 original_content=OriginalContentPayload(original_text=row['original_text']),
                                 result=result, error_message=row['error_message'],
                                 created_at=row['created_at'], updated_at=row['updated_at'])

    @app.get('/api/jobs/{job_id}/result', response_model=HumanizedPayload)
    def get_result(job_id: str):
        row = get_existing(job_id)
        if row['status'] == 'failed':
            raise HTTPException(status_code=409, detail=row['error_message'])
        if row['status'] != 'completed':
            raise HTTPException(status_code=409, detail='Processing is not complete.')
        return HumanizedPayload.model_validate(json.loads(row['result_json']))

    @app.get('/api/jobs/{job_id}/ai-detection', response_model=AIDetectionComparison)
    def get_ai_detection(job_id: str):
        row = get_existing(job_id)
        if row['status'] != 'completed':
            raise HTTPException(status_code=409, detail='Processing is not complete.')
        res_payload = json.loads(row['result_json']) if row['result_json'] else {}
        humanized_text = res_payload.get('humanized_text', '')
        return compare_ai_footprint(job_id, row['original_text'], humanized_text)

    @app.get('/api/jobs/{job_id}/export/docx')
    def export_docx(job_id: str):
        row = get_existing(job_id)
        if row['status'] != 'completed':
            raise HTTPException(status_code=409, detail='Processing is not complete.')
        res_payload = json.loads(row['result_json']) if row['result_json'] else {}
        humanized_text = res_payload.get('humanized_text', '')
        docx_bytes = markdown_to_docx(humanized_text)
        return Response(
            content=docx_bytes,
            media_type='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            headers={'Content-Disposition': f'attachment; filename="humanized_article_{job_id[:8]}.docx"'}
        )

    @app.get('/api/jobs/{job_id}/export/markdown')
    def export_markdown(job_id: str):
        row = get_existing(job_id)
        if row['status'] != 'completed':
            raise HTTPException(status_code=409, detail='Processing is not complete.')
        res_payload = json.loads(row['result_json']) if row['result_json'] else {}
        humanized_text = res_payload.get('humanized_text', '')
        return Response(
            content=humanized_text.encode('utf-8'),
            media_type='text/markdown',
            headers={'Content-Disposition': f'attachment; filename="humanized_article_{job_id[:8]}.md"'}
        )

    # --- Plagiarism Endpoints ---

    def plagiarism_worker(
        check_id: str,
        job_id: str,
        humanized_text: str,
        original_text: str,
        mode: str,
        include_revision: bool
    ):
        check = plag_store.get_check(check_id)
        if not check or check['status'] != 'queued':
            return
        plag_store.set_check_processing(check_id)
        try:
            if mode == 'external':
                ext_provider = DefaultExternalProvider()
                report = ext_provider.check_similarity(humanized_text, job_id, check_id)
            else:
                report = run_local_check(
                    text=humanized_text,
                    job_id=job_id,
                    check_id=check_id,
                    store=plag_store,
                    original_text=original_text,
                    include_revision_comparison=include_revision,
                    min_passage_chars=config.PLAGIARISM_MIN_PASSAGE_CHARS,
                    min_passage_words=config.PLAGIARISM_MIN_PASSAGE_WORDS,
                    similarity_threshold=config.PLAGIARISM_SIMILARITY_THRESHOLD
                )
            plag_store.complete_check(
                check_id=check_id,
                report=report.model_dump(),
                similarity_percentage=report.similarity_percentage,
                sources_checked=report.sources_checked
            )
        except Exception as exc:
            logger.exception('Plagiarism check failed for check %s', check_id)
            plag_store.fail_check(check_id, str(exc)[:350])

    @app.post('/api/jobs/{job_id}/plagiarism', response_model=PlagiarismCheckCreateResponse, status_code=201)
    def create_plagiarism_check(
        job_id: str,
        payload: PlagiarismCheckCreateRequest,
        background_tasks: BackgroundTasks
    ):
        job = get_existing(job_id)
        if job['status'] == 'failed':
            raise HTTPException(status_code=409, detail=job['error_message'] or 'Cannot check plagiarism on a failed job.')
        if job['status'] != 'completed':
            raise HTTPException(status_code=409, detail='Content humanization is not complete yet.')
        if not job['result_json']:
            raise HTTPException(status_code=422, detail='Humanized result content is empty.')

        result_data = json.loads(job['result_json'])
        humanized_text = result_data.get('humanized_text', '')
        if not humanized_text or not humanized_text.strip():
            raise HTTPException(status_code=422, detail='Humanized text is blank or empty.')

        if payload.check_mode == 'external':
            if not payload.external_consent:
                raise HTTPException(
                    status_code=400,
                    detail='External plagiarism checking requires explicit user consent before content is sent outside.'
                )
            ext_provider = DefaultExternalProvider()
            if not ext_provider.is_configured():
                raise HTTPException(
                    status_code=422,
                    detail='External plagiarism checking is not configured. Please use local internal similarity checking.'
                )

        content_hash = calculate_hash(humanized_text)
        scope = 'internal_reference_collection' if payload.check_mode == 'local' else 'external_provider'
        check = plag_store.create_check(job_id, payload.check_mode, scope, content_hash)

        # Only queue background processing if this is a newly created check (avoid duplicate tasks)
        if check['status'] == 'queued':
            background_tasks.add_task(
                plagiarism_worker,
                check['check_id'],
                job_id,
                humanized_text,
                job['original_text'],
                payload.check_mode,
                payload.include_revision_comparison
            )

        return PlagiarismCheckCreateResponse(
            check_id=check['check_id'],
            job_id=job_id,
            status=check['status'],
            created_at=check['created_at']
        )

    @app.get('/api/jobs/{job_id}/plagiarism', response_model=PlagiarismCheckStatusResponse)
    def get_plagiarism_status(job_id: str):
        get_existing(job_id)
        check = plag_store.get_latest_check_by_job(job_id)
        if not check:
            raise HTTPException(status_code=404, detail='No plagiarism check found for this job.')

        report = None
        if check['report_json']:
            report = PlagiarismReport.model_validate(json.loads(check['report_json']))

        return PlagiarismCheckStatusResponse(
            check_id=check['check_id'],
            job_id=job_id,
            status=check['status'],
            report=report,
            error_message=check['error_message'],
            created_at=check['created_at'],
            updated_at=check['updated_at']
        )

    @app.get('/api/jobs/{job_id}/plagiarism/report', response_model=PlagiarismReport)
    def get_plagiarism_report(job_id: str):
        job = get_existing(job_id)
        check = plag_store.get_latest_check_by_job(job_id)
        if not check:
            raise HTTPException(status_code=404, detail='No plagiarism check found for this job.')
        if check['status'] == 'failed':
            raise HTTPException(status_code=409, detail=check['error_message'] or 'Plagiarism check failed.')
        if check['status'] != 'completed' or not check['report_json']:
            raise HTTPException(status_code=409, detail='Plagiarism check is still processing.')

        report = PlagiarismReport.model_validate(json.loads(check['report_json']))

        # Verify whether humanized content has changed since the check was executed
        if job['result_json']:
            current_humanized = json.loads(job['result_json']).get('humanized_text', '')
            current_hash = calculate_hash(current_humanized)
            if current_hash != check['content_hash']:
                report.review_flags.insert(0, PlagiarismReviewFlag(
                    code='OUTDATED_REPORT',
                    severity='warning',
                    message='The humanized content has changed since this plagiarism check was completed. Submit a new check for current results.'
                ))

        return report

    # --- Reference Document Management Endpoints ---

    @app.get('/api/references', response_model=list[ReferenceDocResponse])
    def list_references():
        return plag_store.list_reference_docs()

    @app.post('/api/references', response_model=ReferenceDocResponse, status_code=201)
    def create_reference(payload: ReferenceDocCreate):
        if not payload.content.strip():
            raise HTTPException(status_code=422, detail='Reference document content cannot be blank.')
        row = plag_store.add_reference_doc(payload.title, payload.content, payload.source_url)
        return row

    @app.post('/api/references/upload', response_model=ReferenceDocResponse, status_code=201)
    async def upload_reference(
        file: UploadFile = File(...),
        title: str | None = Form(None),
        source_url: str | None = Form(None)
    ):
        try:
            content_bytes = await file.read()
            extracted_text = extract_document_text(file.filename or 'upload.txt', content_bytes)
        except ValueError as val_err:
            raise HTTPException(status_code=422, detail=str(val_err))
        except Exception as exc:
            raise HTTPException(status_code=422, detail=f'Failed to process file: {str(exc)}')

        doc_title = title.strip() if title and title.strip() else (file.filename or 'Uploaded Document')
        row = plag_store.add_reference_doc(doc_title, extracted_text, source_url)
        return row

    @app.delete('/api/references/{doc_id}', status_code=204)
    def delete_reference(doc_id: str):
        try:
            UUID(doc_id)
        except (TypeError, ValueError):
            raise HTTPException(status_code=404, detail='Reference document not found.')
        success = plag_store.delete_reference_doc(doc_id)
        if not success:
            raise HTTPException(status_code=404, detail='Reference document not found.')
        return None

    return app

app = create_app()
