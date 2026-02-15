"""PDF text extraction using PyPDF2."""
from PyPDF2 import PdfReader
from typing import Tuple, List


async def extract_from_pdf(pdf_path: str) -> Tuple[str, List[dict]]:
    """
    Extract text from PDF file.
    
    Args:
        pdf_path: Path to PDF file
    
    Returns:
        (normalized_text, timestamps)
        - normalized_text: Extracted text from all pages
        - timestamps: Empty list (no timestamps for PDFs)
    
    Raises:
        Exception: If PDF parsing fails
    """
    try:
        reader = PdfReader(pdf_path)
        
        text_parts = []
        for page in reader.pages:
            text = page.extract_text()
            if text:
                text_parts.append(text)
        
        # Combine all pages
        normalized_text = '\n\n'.join(text_parts)
        
        # Clean up extra whitespace
        lines = [line.strip() for line in normalized_text.splitlines() if line.strip()]
        normalized_text = '\n'.join(lines)
        
        if not normalized_text or len(normalized_text) < 50:
            raise ValueError("Insufficient text content extracted from PDF")
        
        return normalized_text, []
    
    except Exception as e:
        raise Exception(f"PDF extraction failed: {str(e)}")
