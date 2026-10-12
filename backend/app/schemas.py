from pydantic import BaseModel, Field


class RequestCreate(BaseModel):
    raw_text: str = Field(min_length=10, max_length=5000)
