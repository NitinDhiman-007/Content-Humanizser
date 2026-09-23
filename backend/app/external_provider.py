"""Optional third-party SDK; the SDK sends text to a remote service."""
from .config import API_KEY, BASE_URL


def external_humanize(text: str) -> str:
    if not API_KEY:
        raise RuntimeError('External mode requires HUMANIZE_AI_TEXT_API_KEY in the backend environment.'.replace('\u200b',''))
    try:
        from humanize_ai_text import HumanizedAI
    except ImportError as exc:
        raise RuntimeError('Install the optional external package using requirements-external.txt.') from exc
    client = HumanizedAI(api_key=API_KEY, base_url=BASE_URL)
    result = client.run(text)
    if not isinstance(result, dict) or result.get('success') is False:
        raise RuntimeError('External humanizer returned an unsuccessful response.')
    output = result.get('humanizedText')
    if not isinstance(output, str):
        raise RuntimeError('External humanizer response did not contain valid humanizedText.')
    return output
