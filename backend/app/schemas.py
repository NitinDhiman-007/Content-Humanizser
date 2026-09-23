"""Validated transport contracts for the two JSON panels."""
from datetime import datetime
from typing import Literal
from pydantic import BaseModel, Field, field_validator
from .config import MAX_CHARACTERS

JobStatus = Literal['queued', 'processing', 'completed', 'failed']

class JobCreateRequest(BaseModel):
    original_text: str = Field(min_length=1, max_length=MAX_CHARACTERS)
    mode: Literal['local', 'external'] = 'local'
    seo_keywords: list[str] = Field(default_factory=list, max_length=20)

    @field_validator('original_text')
    @classmethod
    def check_not_blank(cls, value: str) -> str:
        if not value.strip():
            raise ValueError('Enter blog text before submitting.')
        return value  # Preserve whitespace and the submitted content byte for byte.

    @field_validator('seo_keywords')
    @classmethod
    def check_keywords(cls, value: list[str]) -> list[str]:
        if any(len(keyword) > 120 for keyword in value):
            raise ValueError('An SEO keyword is too long.')
        return value

class JobCreateResponse(BaseModel):
    job_id: str
    status: JobStatus
    created_at: datetime

class InfographicSpec(BaseModel):
    type: Literal['process', 'workflow', 'comparison', 'grouped']
    title: str
    items: list[str]
    svg_preview: str | None = None

class ReviewFlag(BaseModel):
    code: str
    severity: Literal['info', 'warning', 'critical']
    message: str

class AuditReport(BaseModel):
    original_word_count: int
    final_word_count: int
    word_count_ratio: float
    validation_status: Literal['passed', 'review_required']
    review_flags: list[ReviewFlag]
    applied_rules: list[str] = Field(default_factory=list)
    automated_rule_count: int = 0
    editorial_rule_count: int = 100
    originality_check: str = 'not tested'
    ai_detection_check: str = 'not tested'

class HumanizedPayload(BaseModel):
    humanized_text: str
    infographics: list[InfographicSpec]
    audit: AuditReport

class OriginalContentPayload(BaseModel):
    original_text: str

class JobStatusResponse(BaseModel):
    job_id: str
    status: JobStatus
    original_content: OriginalContentPayload
    result: HumanizedPayload | None = None
    error_message: str | None = None
    created_at: datetime
    updated_at: datetime
