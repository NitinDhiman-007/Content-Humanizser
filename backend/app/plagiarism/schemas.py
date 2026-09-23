"""Pydantic transport contracts for plagiarism and similarity checking."""
from typing import Literal
from pydantic import BaseModel, Field

PlagiarismCheckMode = Literal['local', 'external']
PlagiarismCheckStatus = Literal['queued', 'processing', 'completed', 'failed']
MatchType = Literal['exact_match', 'close_similarity']
ReviewCategory = Literal['exact_match', 'close_similarity', 'quoted', 'cited', 'needs_review']


class MatchedSource(BaseModel):
    source_id: str
    title: str
    url: str | None = None
    similarity_percentage: float = 0.0
    matches_count: int = 0


class MatchedPassage(BaseModel):
    passage_id: str
    source_id: str
    source_title: str
    source_url: str | None = None
    text: str
    start_offset: int
    end_offset: int
    similarity_score: float = 1.0
    match_type: MatchType = 'exact_match'
    is_quoted: bool = False
    is_cited: bool = False
    review_category: ReviewCategory = 'needs_review'
    needs_review: bool = True
    context: str = ''


class PlagiarismReviewFlag(BaseModel):
    code: str
    severity: Literal['info', 'warning', 'critical']
    message: str


class PlagiarismReport(BaseModel):
    check_id: str
    job_id: str
    status: PlagiarismCheckStatus
    check_mode: PlagiarismCheckMode
    scope: str
    similarity_percentage: float | None = None
    sources_checked: int | None = None
    matched_sources: list[MatchedSource] = Field(default_factory=list)
    matched_passages: list[MatchedPassage] = Field(default_factory=list)
    review_flags: list[PlagiarismReviewFlag] = Field(default_factory=list)
    checked_content_hash: str | None = None
    checked_at: str | None = None
    error_message: str | None = None


class PlagiarismCheckCreateRequest(BaseModel):
    check_mode: PlagiarismCheckMode = 'local'
    include_revision_comparison: bool = False
    external_consent: bool = False


class PlagiarismCheckCreateResponse(BaseModel):
    check_id: str
    job_id: str
    status: PlagiarismCheckStatus
    created_at: str


class PlagiarismCheckStatusResponse(BaseModel):
    check_id: str
    job_id: str
    status: PlagiarismCheckStatus
    report: PlagiarismReport | None = None
    error_message: str | None = None
    created_at: str
    updated_at: str


class ReferenceDocCreate(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    content: str = Field(min_length=1)
    source_url: str | None = None


class ReferenceDocResponse(BaseModel):
    doc_id: str
    title: str
    source_url: str | None = None
    word_count: int
    content_hash: str
    created_at: str
