from fastapi import FastAPI
from backend.query_engine.app.ranking import BM25Ranker

app = FastAPI()
rank = BM25Ranker()

@app.get("/search")
async def search(q: str):
    return rank.query(q)
