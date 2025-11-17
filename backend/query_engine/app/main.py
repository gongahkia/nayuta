import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
from backend.config import config
from .ranking import BM25Ranker 

app = FastAPI(
    title="Nayuta Query Engine",
    description="API for Nayuta Search Engine's query processing",
    version="0.1.0",
    docs_url="/api/docs",
    redoc_url=None
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=config.QUERY_ENGINE["CORS_ORIGINS"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

try:
    ranker = BM25Ranker(index_path="../indexer/whoosh_index")
except Exception as e:
    raise RuntimeError(f"Failed to initialize ranker: {str(e)}")

class SearchResult(BaseModel):
    url: str
    title: str
    snippet: str
    score: float

class SearchResponse(BaseModel):
    results: List[SearchResult]
    query_time: float
    total_hits: int

@app.get("/search", response_model=SearchResponse, tags=["Search"])
async def search(
    q: str,
    limit: int = 10,
    offset: int = 0,
    explain: bool = False
):
    """Main search endpoint with optional result explanation"""
    try:
        start_time = time.perf_counter()
        results = ranker.query(q, limit=limit, offset=offset, explain=explain)
        elapsed = time.perf_counter() - start_time

        return {
            "results": [
                {
                    "url": res["url"],
                    "title": res.get("title", ""),
                    "snippet": res.get("snippet", ""),
                    "score": res.get("score", 0.0),
                    "explanation": res.get("explanation")
                } for res in results
            ],
            "query_time": elapsed,
            "total_hits": len(results)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/autocomplete", tags=["Search"])
async def autocomplete(prefix: str, limit: int = 5):
    """Autocomplete suggestions endpoint"""
    try:
        suggestions = ranker.autocomplete(prefix, limit)
        return {"suggestions": suggestions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health", tags=["System"])
async def health_check():
    """Service health check"""
    return {
        "status": "OK",
        "index_size": ranker.index_size(),
        "version": "0.1.0"
    }

@app.websocket("/ws/search")
async def websocket_search(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            query = await websocket.receive_text()
            results = ranker.query(query, limit=5)
            await websocket.send_json({
                "results": [
                    {"url": res["url"], "title": res.get("title", "")}
                    for res in results
                ]
            })
    except WebSocketDisconnect:
        print("Client disconnected")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)