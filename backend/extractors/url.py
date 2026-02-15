"""URL content extraction using web scraping."""
import httpx
from bs4 import BeautifulSoup
from typing import Tuple, List


async def extract_from_url(url: str) -> Tuple[str, List[dict]]:
    """
    Extract readable text from URL.
    
    Args:
        url: URL to fetch and parse
    
    Returns:
        (normalized_text, timestamps)
        - normalized_text: Extracted article text
        - timestamps: Empty list (no timestamps for URLs)
    
    Raises:
        Exception: If URL fetch or parsing fails
    """
    try:
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
        
        # Parse HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # Remove script and style elements
        for script in soup(["script", "style", "nav", "footer", "header"]):
            script.decompose()
        
        # Get text from main content areas
        # Try common article containers first
        article = soup.find('article') or soup.find('main') or soup.find('body')
        
        if article:
            text = article.get_text(separator='\n', strip=True)
        else:
            text = soup.get_text(separator='\n', strip=True)
        
        # Clean up whitespace
        lines = [line.strip() for line in text.splitlines() if line.strip()]
        normalized_text = '\n'.join(lines)
        
        if not normalized_text or len(normalized_text) < 50:
            raise ValueError("Insufficient text content extracted from URL")
        
        return normalized_text, []
    
    except httpx.HTTPError as e:
        raise Exception(f"URL fetch failed: {str(e)}")
    except Exception as e:
        raise Exception(f"URL extraction failed: {str(e)}")
