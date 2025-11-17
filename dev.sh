#!/bin/bash

# Nayuta Local Development Startup Script
# This script sets up and runs both backend and frontend for local development

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ $1${NC}"
}

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
INDEX_DIR="$BACKEND_DIR/indexer/whoosh_index"

print_header "🚀 Nayuta Local Development Setup"

# Check prerequisites
print_info "Checking prerequisites..."

if ! command -v python3 &> /dev/null; then
    print_error "Python 3 is not installed. Please install Python 3.10+"
    exit 1
fi

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm"
    exit 1
fi

print_success "All prerequisites found"

# Backend setup
print_header "🐍 Setting up Backend"

cd "$BACKEND_DIR"

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    print_info "Creating Python virtual environment..."
    python3 -m venv venv
    print_success "Virtual environment created"
else
    print_success "Virtual environment already exists"
fi

# Activate virtual environment
print_info "Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
print_info "Installing Python dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r requirements.txt

# Install additional dependencies for new features
print_info "Installing additional dependencies..."
pip install --quiet whoosh fastapi uvicorn python-multipart websockets python-dotenv

print_success "Backend dependencies installed"

# Create test index if it doesn't exist
if [ ! -d "$INDEX_DIR" ] || [ ! "$(ls -A $INDEX_DIR)" ]; then
    print_header "📚 Creating Test Search Index"

    mkdir -p "$INDEX_DIR"

    cat > "$BACKEND_DIR/indexer/build_test_index.py" << 'INDEXEOF'
import os
import sys
from whoosh.index import create_in
from whoosh.fields import Schema, ID, TEXT, KEYWORD, DATETIME
from datetime import datetime

# Create schema
schema = Schema(
    url=ID(stored=True, unique=True),
    title=TEXT(stored=True),
    content=TEXT(stored=True),
    links=KEYWORD(stored=True, commas=True, scorable=False, lowercase=True),
    crawled_at=DATETIME(stored=True)
)

# Create index
index_dir = "whoosh_index"
if not os.path.exists(index_dir):
    os.mkdir(index_dir)

ix = create_in(index_dir, schema)
writer = ix.writer()

# Add sample documents for testing
sample_docs = [
    {
        "url": "https://example.com/machine-learning",
        "title": "Introduction to Machine Learning",
        "content": "Machine learning is a subset of artificial intelligence that focuses on training algorithms to learn from data. Deep learning uses neural networks with multiple layers. Common algorithms include linear regression, decision trees, and neural networks.",
        "links": "https://example.com/ai,https://example.com/neural-networks,https://example.com/deep-learning",
        "crawled_at": datetime.now()
    },
    {
        "url": "https://example.com/python-tutorial",
        "title": "Python Programming Tutorial",
        "content": "Python is a high-level programming language known for its simplicity and readability. It's great for data science, web development, automation, and machine learning. Learn Python basics including variables, functions, loops, and object-oriented programming.",
        "links": "https://example.com/programming,https://example.com/data-science",
        "crawled_at": datetime.now()
    },
    {
        "url": "https://example.com/web-development",
        "title": "Modern Web Development Guide",
        "content": "Web development involves HTML for structure, CSS for styling, and JavaScript for interactivity. Modern frameworks like React, Vue, and Angular make building responsive websites easier. Learn about responsive design, APIs, and full-stack development.",
        "links": "https://example.com/html,https://example.com/react,https://example.com/javascript",
        "crawled_at": datetime.now()
    },
    {
        "url": "https://github.com/example/neural-networks",
        "title": "Neural Networks Implementation",
        "content": "A complete neural network implementation in Python. Includes backpropagation algorithm, gradient descent optimization, and various activation functions like ReLU, sigmoid, and tanh. Perfect for learning deep learning fundamentals.",
        "links": "https://github.com/example/ml,https://github.com/example/python",
        "crawled_at": datetime.now()
    },
    {
        "url": "https://arxiv.org/paper/transformers",
        "title": "Attention Is All You Need - Transformer Architecture",
        "content": "The Transformer architecture revolutionized natural language processing. Self-attention mechanisms enable parallel processing of sequences. Used in models like BERT, GPT, and T5. This paper introduced the attention mechanism that powers modern AI.",
        "links": "https://arxiv.org/nlp,https://arxiv.org/ai",
        "crawled_at": datetime.now()
    },
    {
        "url": "https://example.com/data-science",
        "title": "Data Science Fundamentals",
        "content": "Data science combines statistics, programming, and domain expertise. Python and R are popular tools for data analysis. Learn about data visualization, statistical modeling, hypothesis testing, and predictive analytics.",
        "links": "https://example.com/python,https://example.com/statistics,https://example.com/visualization",
        "crawled_at": datetime.now()
    },
    {
        "url": "https://example.com/algorithms",
        "title": "Algorithm Design and Analysis",
        "content": "Understanding algorithms is fundamental to computer science. Learn about sorting algorithms like quicksort and mergesort, search algorithms like binary search, and graph algorithms. Big O notation helps analyze algorithm efficiency.",
        "links": "https://example.com/computer-science,https://example.com/programming",
        "crawled_at": datetime.now()
    },
    {
        "url": "https://github.com/example/react-app",
        "title": "React Application Tutorial",
        "content": "Build modern web applications with React. Learn about components, hooks, state management, and routing. React makes it easy to build interactive user interfaces. Includes examples of useState, useEffect, and custom hooks.",
        "links": "https://github.com/example/javascript,https://github.com/example/web",
        "crawled_at": datetime.now()
    },
    {
        "url": "https://example.com/docker-kubernetes",
        "title": "Docker and Kubernetes Guide",
        "content": "Containerization with Docker and orchestration with Kubernetes. Learn how to build, deploy, and scale applications. Docker containers package applications with their dependencies. Kubernetes manages container deployments at scale.",
        "links": "https://example.com/devops,https://example.com/containers",
        "crawled_at": datetime.now()
    },
    {
        "url": "https://example.com/database-design",
        "title": "Database Design Best Practices",
        "content": "Learn SQL and database design principles. Normalization, indexes, and query optimization. Compare relational databases like PostgreSQL and MySQL with NoSQL databases like MongoDB. Understand ACID properties and transactions.",
        "links": "https://example.com/sql,https://example.com/backend",
        "crawled_at": datetime.now()
    }
]

for doc in sample_docs:
    writer.add_document(**doc)

writer.commit()
print(f"✓ Created test index with {len(sample_docs)} documents in {index_dir}")
INDEXEOF

    cd "$BACKEND_DIR/indexer"
    python build_test_index.py
    cd "$BACKEND_DIR"

    print_success "Test index created with sample documents"
else
    print_success "Search index already exists"
fi

# Frontend setup
print_header "⚛️  Setting up Frontend"

cd "$FRONTEND_DIR"

if [ ! -d "node_modules" ]; then
    print_info "Installing Node.js dependencies (this may take a minute)..."
    npm install
    print_success "Frontend dependencies installed"
else
    print_success "Frontend dependencies already installed"
fi

# Start services
print_header "🎬 Starting Services"

# Function to cleanup on exit
cleanup() {
    print_info "Shutting down services..."
    kill $(jobs -p) 2>/dev/null
    deactivate 2>/dev/null
    print_success "Services stopped"
    exit 0
}

trap cleanup INT TERM

# Start backend
print_info "Starting backend server on http://localhost:8000..."
cd "$BACKEND_DIR"
source venv/bin/activate
python -m uvicorn query_engine.app.main:app --reload --host 0.0.0.0 --port 8000 > /tmp/nayuta-backend.log 2>&1 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Check if backend started successfully
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    print_error "Backend failed to start. Check logs:"
    tail -20 /tmp/nayuta-backend.log
    exit 1
fi

print_success "Backend running on http://localhost:8000"
print_info "Backend logs: tail -f /tmp/nayuta-backend.log"

# Start frontend
print_info "Starting frontend server on http://localhost:3000..."
cd "$FRONTEND_DIR"
BROWSER=none npm start > /tmp/nayuta-frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 5

# Check if frontend started successfully
if ! kill -0 $FRONTEND_PID 2>/dev/null; then
    print_error "Frontend failed to start. Check logs:"
    tail -20 /tmp/nayuta-frontend.log
    exit 1
fi

print_success "Frontend running on http://localhost:3000"
print_info "Frontend logs: tail -f /tmp/nayuta-frontend.log"

# Print success message
print_header "✨ Nayuta is Ready!"

echo ""
echo -e "${GREEN}🌟 Application URLs:${NC}"
echo -e "   Frontend: ${BLUE}http://localhost:3000${NC}"
echo -e "   Backend API: ${BLUE}http://localhost:8000${NC}"
echo -e "   API Docs: ${BLUE}http://localhost:8000/api/docs${NC}"
echo ""
echo -e "${GREEN}🎯 Try these example searches:${NC}"
echo -e "   • ${YELLOW}machine learning${NC}"
echo -e "   • ${YELLOW}site:github.com neural networks${NC}"
echo -e "   • ${YELLOW}python \"data science\"${NC}"
echo -e "   • ${YELLOW}intitle:\"web development\"${NC}"
echo ""
echo -e "${GREEN}🎨 Features to explore:${NC}"
echo -e "   • Toggle 'Show explanations' and click 'Why?' on results"
echo -e "   • Click '🕸️ View Graph' to see the web graph"
echo -e "   • Click '?' in the search bar for operator help"
echo -e "   • Search multiple times to see history panel"
echo ""
echo -e "${YELLOW}📝 View logs:${NC}"
echo -e "   Backend:  tail -f /tmp/nayuta-backend.log"
echo -e "   Frontend: tail -f /tmp/nayuta-frontend.log"
echo ""
echo -e "${RED}Press Ctrl+C to stop all services${NC}"
echo ""

# Open browser (optional)
if command -v open &> /dev/null; then
    sleep 2
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    sleep 2
    xdg-open http://localhost:3000
fi

# Keep script running and show logs
tail -f /tmp/nayuta-backend.log /tmp/nayuta-frontend.log &
TAIL_PID=$!

# Wait for user interrupt
wait $BACKEND_PID $FRONTEND_PID
