from typing import Literal, Optional
from pydantic import BaseModel, Field


class RequestCreate(BaseModel):
    raw_text: str = Field(min_length=10, max_length=5000)


class TaskCreate(BaseModel):
    title: str = Field(min_length=3, max_length=200)
    description: Optional[str] = Field(default=None, max_length=2000)


class TaskStatusUpdate(BaseModel):
    status: Literal["open", "in_progress", "done"]


class ExtractedRequest(BaseModel):
    """Fields the LLM may extract. Anything not stated in the text must be null."""

    request_type: Optional[Literal["quotation", "other"]] = None
    customer_name: Optional[str] = None
    product: Optional[str] = None
    quantity: Optional[int] = None
    delivery_date: Optional[str] = None
    customer_contact: Optional[str] = None
