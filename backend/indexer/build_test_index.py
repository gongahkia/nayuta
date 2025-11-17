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
