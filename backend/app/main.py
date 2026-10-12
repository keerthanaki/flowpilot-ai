import traceback
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from app.db import supabase
from app.llm import ask_llm
from app.extraction import extract_request
from app.schemas import RequestCreate, TaskCreate, TaskStatusUpdate

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


@app.post("/requests/{request_id}/tasks", status_code=201)
def create_task(request_id: str, payload: TaskCreate):
    try:
        found = (
            supabase.table("requests").select("id").eq("id", request_id).execute()
        )
        if found.data:
            result = (
                supabase.table("tasks")
                .insert(
                    {
                        "request_id": request_id,
                        "title": payload.title.strip(),
                        "description": payload.description,
                    }
                )
                .execute()
            )
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Could not create the task")
    if not found.data:
        raise HTTPException(status_code=404, detail="Request not found")
    return result.data[0]


@app.get("/requests/{request_id}/tasks")
def list_tasks(request_id: str):
    try:
        result = (
            supabase.table("tasks")
            .select("*")
            .eq("request_id", request_id)
            .order("created_at", desc=True)
            .execute()
        )
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Could not load tasks")
    return result.data


@app.patch("/tasks/{task_id}")
def update_task_status(task_id: str, payload: TaskStatusUpdate):
    try:
        result = (
            supabase.table("tasks")
            .update({"status": payload.status})
            .eq("id", task_id)
            .execute()
        )
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Could not update the task")
    if not result.data:
        raise HTTPException(status_code=404, detail="Task not found")
    return result.data[0]


@app.get("/ai/test")
def ai_test():
    try:
        reply = ask_llm("Reply with exactly: FlowPilot AI connection OK")
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=502, detail="LLM call failed")
    return {"reply": reply}



@app.post("/requests/{request_id}/extract")
def extract_request_info(request_id: str):
    try:
        found = (
            supabase.table("requests").select("*").eq("id", request_id).execute()
        )
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Could not load the request")
    if not found.data:
        raise HTTPException(status_code=404, detail="Request not found")

    try:
        extracted, missing = extract_request(found.data[0]["raw_text"])
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=502, detail="Extraction failed")

    try:
        saved = (
            supabase.table("requests")
            .update(
                {
                    "extracted": extracted.model_dump(),
                    "missing_fields": missing,
                    "status": "extracted",
                }
            )
            .eq("id", request_id)
            .execute()
        )
    except Exception:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Could not save the extraction")
    return saved.data[0]
