import os

# Dummy key so importing app.llm works in tests. No real API call is made.
os.environ.setdefault("GEMINI_API_KEY", "test-key")
