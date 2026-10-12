from google import genai

from app.config import GEMINI_API_KEY, GEMINI_MODEL

if not GEMINI_API_KEY:
    raise RuntimeError("Missing GEMINI_API_KEY in backend/.env")

client = genai.Client(api_key=GEMINI_API_KEY)


def ask_llm(prompt: str) -> str:
    """Send a prompt to Gemini and return the text reply."""
    response = client.models.generate_content(model=GEMINI_MODEL, contents=prompt)
    return response.text or ""


def ask_llm_structured(prompt: str, schema):
    """Ask Gemini for JSON matching a Pydantic model; return a validated object."""
    from google.genai import types

    response = client.models.generate_content(
        model=GEMINI_MODEL,
        contents=prompt,
        config=types.GenerateContentConfig(
            response_mime_type="application/json",
            response_schema=schema,
            temperature=0,
        ),
    )
    return schema.model_validate_json(response.text)
