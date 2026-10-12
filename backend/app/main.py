import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.db import supabase
from app.schemas import RequestCreate

app = FastAPI(title="FlowPilot AI")

# CORS lets the React app (port 5173) call this API (port 8000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok", "service": "flowpilot-api"}


@app.post("/requests", status_code=201)
def create_request(payload: RequestCreate):
    try:
        result = (
            supabase.table("requests")
            .insert({"raw_text": payload.raw_text.strip()})
            .execute()
        )
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Could not save the request")
    return result.data[0]


@app.get("/requests")
def list_requests():
    try:
        result = (
            supabase.table("requests")
            .select("*")
            .order("created_at", desc=True)
            .execute()
        )
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Could not load requests")
    return result.data

