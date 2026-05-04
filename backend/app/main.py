from __future__ import annotations

import asyncio
import json

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

from .graph import finance_graph


class AnalyzeRequest(BaseModel):
    """Request contract shared by the dashboard and the graph API."""

    prompt: str
    assumptions: dict = Field(default_factory=dict)


app = FastAPI(title="LangGraph Finance Demo")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict:
    return {"ok": True}


@app.post("/analyze")
def analyze(request: AnalyzeRequest) -> dict:
    """Run the graph once and return the final state."""

    return finance_graph.invoke({"prompt": request.prompt, "assumptions": request.assumptions, "trace": []})


@app.post("/analyze/stream")
async def analyze_stream(request: AnalyzeRequest) -> StreamingResponse:
    """Stream node-by-node progress as Server-Sent Events.

    The React app currently uses `/analyze` and animates the returned trace, but
    this endpoint shows the production pattern for making LangGraph execution
    visible while it is happening.
    """

    async def events():
        final_state = {}
        for update in finance_graph.stream({"prompt": request.prompt, "assumptions": request.assumptions, "trace": []}):
            node, state = next(iter(update.items()))
            final_state = state
            trace_item = state.get("trace", [{}])[-1]

            # Each SSE event is small enough for the UI to append immediately.
            yield f"data: {json.dumps({'type': 'trace', 'node': node, 'trace': trace_item})}\n\n"
            await asyncio.sleep(0.45)
        yield f"data: {json.dumps({'type': 'result', 'result': final_state})}\n\n"

    return StreamingResponse(events(), media_type="text/event-stream")
