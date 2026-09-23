export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000').replace(/\/$/, '');
export type JobState = 'queued' | 'processing' | 'completed' | 'failed';
export type ReviewFlag = { code: string; severity: 'info' | 'warning' | 'critical'; message: string };
export type Infographic = { type: string; title: string; items: string[]; svg_preview?: string | null };
export type Audit = {
  original_word_count: number; final_word_count: number; word_count_ratio: number;
  validation_status: 'passed' | 'review_required'; review_flags: ReviewFlag[];
  applied_rules: string[]; automated_rule_count: number; editorial_rule_count: number;
  originality_check: string; ai_detection_check: string;
};
export type HumanizedResult = { humanized_text: string; infographics: Infographic[]; audit: Audit };
export type Job = {
  job_id: string; status: JobState; original_content: {original_text: string};
  result: HumanizedResult | null; error_message: string | null; created_at: string; updated_at: string;
};

// Plagiarism Types
export type PlagiarismCheckMode = 'local' | 'external';
export type PlagiarismCheckStatus = 'queued' | 'processing' | 'completed' | 'failed';
export type MatchType = 'exact_match' | 'close_similarity';
export type ReviewCategory = 'exact_match' | 'close_similarity' | 'quoted' | 'cited' | 'needs_review';

export type MatchedSource = {
  source_id: string;
  title: string;
  url?: string | null;
  similarity_percentage: number;
  matches_count: number;
};

export type MatchedPassage = {
  passage_id: string;
  source_id: string;
  source_title: string;
  source_url?: string | null;
  text: string;
  start_offset: number;
  end_offset: number;
  similarity_score: number;
  match_type: MatchType;
  is_quoted: boolean;
  is_cited: boolean;
  review_category: ReviewCategory;
  needs_review: boolean;
  context: string;
};

export type PlagiarismReviewFlag = {
  code: string;
  severity: 'info' | 'warning' | 'critical';
  message: string;
};

export type PlagiarismReport = {
  check_id: string;
  job_id: string;
  status: PlagiarismCheckStatus;
  check_mode: PlagiarismCheckMode;
  scope: string;
  similarity_percentage: number | null;
  sources_checked: number | null;
  matched_sources: MatchedSource[];
  matched_passages: MatchedPassage[];
  review_flags: PlagiarismReviewFlag[];
  checked_content_hash?: string | null;
  checked_at?: string | null;
  error_message?: string | null;
};

export type PlagiarismCheckStatusResponse = {
  check_id: string;
  job_id: string;
  status: PlagiarismCheckStatus;
  report?: PlagiarismReport | null;
  error_message?: string | null;
  created_at: string;
  updated_at: string;
};

export type ReferenceDoc = {
  doc_id: string;
  title: string;
  source_url?: string | null;
  word_count: number;
  content_hash: string;
  created_at: string;
};

async function errorFromResponse(response: Response): Promise<string> {
  try {
    const payload: unknown = await response.json();
    if (payload && typeof payload === 'object' && 'detail' in payload) {
      const detail = (payload as {detail: unknown}).detail;
      return typeof detail === 'string' ? detail : 'The submitted content could not be processed.';
    }
  } catch { /* API may be temporarily unavailable. */ }
  return `Request failed (${response.status}).`;
}

export async function createJob(originalText: string, mode: string = 'external'): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ original_text: originalText, mode: mode })
  });
  if (!response.ok) throw new Error(await errorFromResponse(response));
  const data: { job_id: string } = await response.json();
  return data.job_id;
}

export async function fetchJob(jobId: string): Promise<Job> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}`, {cache: 'no-store'});
  if (!response.ok) throw new Error(await errorFromResponse(response));
  return response.json() as Promise<Job>;
}

// Plagiarism API Calls
export async function startPlagiarismCheck(
  jobId: string,
  mode: PlagiarismCheckMode = 'local',
  consent: boolean = false,
  includeRevision: boolean = false
): Promise<{ check_id: string; status: PlagiarismCheckStatus }> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/plagiarism`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      check_mode: mode,
      external_consent: consent,
      include_revision_comparison: includeRevision,
    }),
  });
  if (!response.ok) throw new Error(await errorFromResponse(response));
  return response.json();
}

export async function fetchPlagiarismStatus(jobId: string): Promise<PlagiarismCheckStatusResponse> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/plagiarism`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await errorFromResponse(response));
  return response.json();
}

export async function fetchPlagiarismReport(jobId: string): Promise<PlagiarismReport> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/plagiarism/report`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await errorFromResponse(response));
  return response.json();
}

// Reference Document Library API Calls
export async function fetchReferences(): Promise<ReferenceDoc[]> {
  const response = await fetch(`${API_BASE_URL}/api/references`, { cache: 'no-store' });
  if (!response.ok) throw new Error(await errorFromResponse(response));
  return response.json();
}

export async function createReference(
  title: string,
  content: string,
  sourceUrl?: string
): Promise<ReferenceDoc> {
  const response = await fetch(`${API_BASE_URL}/api/references`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title,
      content,
      source_url: sourceUrl || null,
    }),
  });
  if (!response.ok) throw new Error(await errorFromResponse(response));
  return response.json();
}

export async function uploadReference(
  file: File,
  title?: string,
  sourceUrl?: string
): Promise<ReferenceDoc> {
  const formData = new FormData();
  formData.append('file', file);
  if (title) formData.append('title', title);
  if (sourceUrl) formData.append('source_url', sourceUrl);

  const response = await fetch(`${API_BASE_URL}/api/references/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) throw new Error(await errorFromResponse(response));
  return response.json();
}

export async function deleteReference(docId: string): Promise<void> {
  const response = await fetch(`${API_BASE_URL}/api/references/${encodeURIComponent(docId)}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error(await errorFromResponse(response));
}

// AI Detection Types & API
export type TextAIDetails = {
  ai_percentage: number;
  verdict: string;
  word_count: number;
  sentence_count: number;
  burstiness_score: number;
  cliches_found: string[];
  contraction_count: number;
};

export type AIDetectionComparison = {
  job_id: string;
  original: TextAIDetails;
  humanized: TextAIDetails;
  ai_reduction_percentage: number;
};

export async function getAiDetection(jobId: string): Promise<AIDetectionComparison> {
  const response = await fetch(`${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/ai-detection`, {
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(await errorFromResponse(response));
  return response.json();
}

export function getDocxExportUrl(jobId: string): string {
  return `${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/export/docx`;
}

export function getMarkdownExportUrl(jobId: string): string {
  return `${API_BASE_URL}/api/jobs/${encodeURIComponent(jobId)}/export/markdown`;
}

