"""External plagiarism provider adapter contract and disabled placeholder."""
from __future__ import annotations
import os
from abc import ABC, abstractmethod
from .schemas import PlagiarismReport


class PlagiarismProvider(ABC):
    """Abstract contract for licensed external plagiarism services."""

    @abstractmethod
    def is_configured(self) -> bool:
        """Return True only if verified credentials and endpoint are present."""
        pass

    @abstractmethod
    def check_similarity(self, text: str, job_id: str, check_id: str) -> PlagiarismReport:
        """Submit text, poll/retrieve report, and return normalized PlagiarismReport."""
        pass


class DefaultExternalProvider(PlagiarismProvider):
    """
    Default adapter for external licensed provider.
    Remains disabled until a verified third-party contract and credentials are configured.
    """

    def __init__(self):
        self.api_key = os.getenv('PLAGIARISM_API_KEY', '').strip()
        self.api_url = os.getenv('PLAGIARISM_API_URL', '').strip()

    def is_configured(self) -> bool:
        # Strictly disabled until verified non-empty credentials exist
        return bool(self.api_key and self.api_url)

    def check_similarity(self, text: str, job_id: str, check_id: str) -> PlagiarismReport:
        if not self.is_configured():
            raise RuntimeError(
                'External plagiarism checking is not configured. '
                'Configure PLAGIARISM_API_KEY and PLAGIARISM_API_URL or use internal local similarity checking.'
            )
        # Note: When a real licensed provider (e.g. Copyleaks, Turnitin) contract is officially verified,
        # its authenticated HTTP dispatch and response normalization should be implemented here.
        raise NotImplementedError('Verified external provider integration is not yet active.')
