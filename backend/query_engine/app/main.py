import time
import sys
from pathlib import Path

# Add backend to path for imports
backend_path = Path(__file__).parent.parent.parent
sys.path.insert(0, str(backend_path))

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Dict, Any
from pydantic import BaseModel

try:
    from config import config
except ImportError:
    from backend.config import config

from .ranking import BM25Ranker

try:
    from services.graph_service import CrawlGraphService
except ImportError:
    from backend.services.graph_service import CrawlGraphService 

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

# Construct absolute path to index
INDEX_PATH = Path(__file__).parent.parent.parent / "indexer" / "whoosh_index"

try:
    ranker = BM25Ranker(index_path=str(INDEX_PATH))
    graph_service = CrawlGraphService(ranker.index)
except Exception as e:
    raise RuntimeError(f"Failed to initialize services: {str(e)}")

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
        results, parsed_query = ranker.query(q, limit=limit, offset=offset, explain=explain)
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
            "total_hits": len(results),
            "parsed_query": parsed_query
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

@app.get("/graph", tags=["Graph"])
async def get_graph_data():
    """Get web graph data for visualization"""
    try:
        graph_data = graph_service.build_graph()
        return graph_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph/pagerank", tags=["Graph"])
async def get_pagerank(iterations: int = 20):
    """Calculate PageRank for all documents"""
    try:
        pagerank = graph_service.calculate_pagerank(iterations=iterations)
        # Return sorted by score
        sorted_pagerank = sorted(
            [{"url": url, "score": score} for url, score in pagerank.items()],
            key=lambda x: x["score"],
            reverse=True
        )
        return {"pagerank": sorted_pagerank}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph/stats", tags=["Graph"])
async def get_graph_stats():
    """Get comprehensive graph statistics"""
    try:
        stats = graph_service.get_graph_statistics()
        return stats
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/graph/domains", tags=["Graph"])
async def get_domain_clusters():
    """Get documents grouped by domain"""
    try:
        clusters = graph_service.get_domain_clusters()
        return {"clusters": clusters}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

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