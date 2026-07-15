"""
Groq API client wrapper.
Uses Llama 3.3 70B via Groq's ultra-fast inference.
Free tier: 30 requests/min, 14,400 requests/day.
Get API key from: https://console.groq.com/keys
"""

from groq import Groq
from config.settings import GROQ_API_KEY, LLM_MODEL

# Create client
client = None
if GROQ_API_KEY:
    client = Groq(api_key=GROQ_API_KEY)


def invoke_gemini(
    prompt: str,
    max_tokens: int = 3072,
    temperature: float = 0.5,
) -> str:
    """
    Send a prompt to Groq (Llama 3.3 70B) and return the text response.

    Note: Function name kept as invoke_gemini for backward compatibility
    with existing code that calls this function.

    Args:
        prompt: The full prompt string
        max_tokens: Maximum output tokens
        temperature: Creativity level (0.0-1.0)

    Returns:
        Generated text response

    Raises:
        RuntimeError: If API key is missing or API call fails
    """
    if not client:
        raise RuntimeError(
            "GROQ_API_KEY not set. Get one from https://console.groq.com/keys "
            "and add it to your .env file."
        )

    try:
        response = client.chat.completions.create(
            model=LLM_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content
    except Exception as exc:
        raise RuntimeError(f"Groq API call failed: {exc}") from exc
