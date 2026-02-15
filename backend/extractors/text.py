"""Plain text extraction (passthrough)."""
from typing import Tuple, List


async def extract_from_text(content: str) -> Tuple[str, List[dict]]:
    """
    Extract text from plain text input (passthrough).
    
    Args:
        content: Plain text content
    
    Returns:
        (normalized_text, timestamps)
        - normalized_text: Input text (cleaned)
        - timestamps: Empty list (no timestamps for plain text)
    
    Raises:
        Exception: If text is invalid
    """
    try:
        # Basic cleanup
        lines = [line.strip() for line in content.splitlines() if line.strip()]
        normalized_text = '\n'.join(lines)
        
        if not normalized_text or len(normalized_text) < 10:
            raise ValueError("Text content too short")
        
        return normalized_text, []
    
    except Exception as e:
        raise Exception(f"Text extraction failed: {str(e)}")
