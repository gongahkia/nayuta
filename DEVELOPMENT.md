# Nayuta Local Development Guide

## 🚀 Quick Start

### One-Command Setup (Recommended)

```bash
./dev.sh
```

This script will:
- ✅ Check prerequisites (Python, Node.js)
- ✅ Set up Python virtual environment
- ✅ Install all dependencies
- ✅ Create a test search index with sample documents
- ✅ Start backend on http://localhost:8000
- ✅ Start frontend on http://localhost:3000
- ✅ Open your browser automatically

**Press `Ctrl+C` to stop all services**

---

## 📋 Manual Setup (Alternative)

If you prefer to run things step-by-step:

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
pip install whoosh fastapi uvicorn python-multipart websockets python-dotenv

# Create test index
cd indexer
python << 'EOF'
from whoosh.index import create_in
from whoosh.fields import Schema, ID, TEXT, KEYWORD, DATETIME
from datetime import datetime
import os

schema = Schema(
    url=ID(stored=True, unique=True),
    title=TEXT(stored=True),
    content=TEXT(stored=True),
    links=KEYWORD(stored=True, commas=True, scorable=False, lowercase=True),
    crawled_at=DATETIME(stored=True)
)

os.makedirs("whoosh_index", exist_ok=True)
ix = create_in("whoosh_index", schema)
writer = ix.writer()

# Add sample documents
docs = [
    {
        "url": "https://example.com/machine-learning",
        "title": "Introduction to Machine Learning",
        "content": "Machine learning is a subset of artificial intelligence...",
        "links": "https://example.com/ai",
        "crawled_at": datetime.now()
    }
]

for doc in docs:
    writer.add_document(**doc)

writer.commit()
print("✓ Index created")
EOF

# Start backend
cd ..
python -m uvicorn query_engine.app.main:app --reload --host 0.0.0.0 --port 8000
```

### 2. Frontend Setup (New Terminal)

```bash
cd frontend

# Install dependencies
npm install

# Start frontend
npm start
```

---

## 🎯 Testing Features

### 1. Basic Search
```
machine learning
```

### 2. Advanced Search Operators

#### Site Filter
```
site:github.com neural networks
site:example.com programming
```

#### Filetype Filter
```
filetype:pdf machine learning
```

#### Title Search
```
intitle:"web development"
intitle:"neural networks"
```

#### Phrase Matching
```
"data science"
"artificial intelligence"
```

#### Exclusion
```
python -snake
machine learning -tensorflow
```

#### Combined Operators
```
site:github.com "neural networks" -tensorflow
site:example.com intitle:tutorial python
```

### 3. Result Explanations

1. Toggle "Show result explanations" checkbox
2. Click the blue **"Why?"** button on any search result
3. Explore:
   - **Total BM25 Score** - Overall relevance
   - **Score Breakdown** - IDF, length normalization, field boost
   - **Matching Terms** - Which query terms matched and their rarity
   - **Field Contributions** - Title vs content contribution
   - **Document Stats** - Length comparison
   - **BM25 Formula** - Mathematical explanation

### 4. Graph Visualization

1. Click the **"🕸️ View Graph"** button
2. Explore:
   - **Interactive Graph** - Drag nodes around
   - **Domain Colors** - Each domain has a unique color
   - **Statistics** - Total nodes, edges, density
   - **Top Hubs** - Pages with most outgoing links
   - **Domains** - Documents grouped by domain
3. Click **"PageRank"** button to:
   - See node sizes scale by importance
   - View PageRank percentages on nodes
4. Try different layouts:
   - **Force** - Force-directed physics simulation
   - **Circular** - Nodes arranged in a circle

### 5. Search History

1. Search multiple queries
2. Refresh the page (or clear search)
3. See history panel with:
   - All your searches
   - Timestamps (relative time)
   - Result counts
   - Click counts
4. Click **"Stats"** to see:
   - Total searches
   - Total clicks
   - Average results per search
5. Try:
   - **Filter** - Search within history
   - **Export** - Download history as JSON
   - **Clear All** - Reset history
6. Click any history item to rerun that search

### 6. Search Help

1. Click the **"?"** button inside the search bar
2. Learn about:
   - All available operators
   - Example queries
   - Tips for power users

---

## 🛠️ Troubleshooting

### Port Already in Use

**Backend (8000):**
```bash
lsof -i :8000
kill -9 <PID>
```

**Frontend (3000):**
```bash
lsof -i :3000
kill -9 <PID>
```

### Backend Won't Start

Check logs:
```bash
tail -f /tmp/nayuta-backend.log
```

Common issues:
- Missing dependencies: `pip install -r requirements.txt`
- No index: Run the dev.sh script to create one

### Frontend Won't Start

Check logs:
```bash
tail -f /tmp/nayuta-frontend.log
```

Common issues:
- Missing dependencies: `npm install`
- Port in use: Frontend will ask to use another port

### CORS Errors

Backend should allow CORS from localhost:3000 by default. If issues persist:

```python
# backend/query_engine/app/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # Make sure this is correct
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Index Not Found

The index is created at `backend/indexer/whoosh_index/`. If missing:

```bash
cd backend/indexer
# Run the index creation script from dev.sh
```

---

## 📁 Project Structure

```
nayuta/
├── dev.sh                          # 🚀 One-command startup script
├── backend/
│   ├── query_engine/
│   │   └── app/
│   │       ├── main.py             # FastAPI endpoints
│   │       ├── ranking.py          # BM25 ranker
│   │       ├── explainer.py        # Score explanation
│   │       └── advanced_parser.py  # Operator parsing
│   ├── services/
│   │   └── graph_service.py        # Graph analysis
│   ├── indexer/
│   │   ├── whoosh_index/           # Search index (created on first run)
│   │   └── schema/
│   └── requirements.txt
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── ExplanationModal.jsx      # Result explanation UI
    │   │   ├── GraphVisualization.jsx    # Graph viewer
    │   │   ├── SearchHelp.jsx            # Operator help
    │   │   └── SearchHistory.jsx         # History panel
    │   ├── services/
    │   │   └── historyService.js         # LocalStorage history
    │   └── App.jsx                        # Main app
    └── package.json
```

---

## 🎨 Features Implemented

### ✅ Feature 1: Result Explanation Dashboard
- BM25 score breakdown with visual bars
- Matching term analysis with rarity classification
- Field contribution charts (title vs content)
- Document statistics comparison
- Complete BM25 formula explanation

### ✅ Feature 2: Crawl Graph Visualization
- Interactive SVG force-directed graph
- PageRank calculation and visualization
- Domain clustering with color coding
- Graph statistics (nodes, edges, hubs, authorities)
- Draggable nodes and multiple layouts

### ✅ Feature 3: Advanced Search Operators
- `site:` - Domain filtering
- `filetype:` - File extension filtering
- `intitle:` - Title-only search
- `inurl:` - URL pattern matching
- `daterange:` - Date range filtering
- `"phrase"` - Exact phrase matching
- `-term` - Term exclusion
- Boolean operators (AND, OR, NOT)
- Visual parsed query display

### ✅ Feature 4: History Management
- LocalStorage-based persistence
- Automatic search tracking
- Click tracking per query
- Statistics dashboard
- Filter, export, and import
- History panel on empty search

---

## 🌐 API Endpoints

### Search
- `GET /search?q=query&explain=true` - Search with optional explanations
- `GET /autocomplete?prefix=text` - Autocomplete suggestions

### Graph
- `GET /graph` - Full graph data (nodes, edges)
- `GET /graph/pagerank` - PageRank scores
- `GET /graph/stats` - Graph statistics
- `GET /graph/domains` - Domain clusters

### System
- `GET /health` - Health check
- `GET /api/docs` - OpenAPI documentation

---

## 💡 Tips

1. **Add More Documents**: Edit `backend/indexer/build_test_index.py` and rerun it
2. **View Logs**: `tail -f /tmp/nayuta-*.log`
3. **Reset History**: Clear browser LocalStorage or click "Clear All" in history
4. **Export Data**: Use the Export buttons in history and graph features
5. **Dark Mode**: Automatically detects system preference

---

## 🐛 Known Limitations

- Graph visualization is CPU-intensive for large graphs (>100 nodes)
- History limited to 100 items
- Whoosh index is single-process (no concurrent writes)
- No authentication/authorization implemented
- Sample data is minimal (10 documents)

---

## 📚 Tech Stack

**Backend:**
- Python 3.10+
- FastAPI (async API framework)
- Whoosh (pure Python search engine)
- Uvicorn (ASGI server)

**Frontend:**
- React 18
- i18next (internationalization)
- Axios (HTTP client)
- LocalStorage (history persistence)
- SVG (graph visualization)

---

## 🚀 Next Steps

To add more features:
1. Run the crawler to index real websites
2. Implement semantic search with sentence transformers
3. Add collaborative filtering for recommendations
4. Create built-in pages (nayuta://settings)
5. Add crawl scheduling UI

---

## 📞 Support

Having issues? Check:
1. Prerequisites are installed (Python 3.10+, Node 18+)
2. Ports 8000 and 3000 are available
3. Logs at `/tmp/nayuta-*.log`
4. Index exists at `backend/indexer/whoosh_index/`

Happy searching! 🔍✨
