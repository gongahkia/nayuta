# Crawling and Indexing Real Websites

This directory contains tools to crawl real websites and index them for Nayuta search.

## Quick Start

### 1. Install Dependencies

```bash
cd backend
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Crawl and Index Websites

**Use default seed URLs (Wikipedia, Python docs, MDN):**
```bash
cd backend/crawler
python crawl_and_index.py
```

**Crawl specific URLs:**
```bash
python crawl_and_index.py --urls https://example.com https://another-site.com
```

**Crawl more pages:**
```bash
python crawl_and_index.py --max-pages 500
```

**Clear existing index and start fresh:**
```bash
python crawl_and_index.py --clear-index
```

### 3. Options

- `--urls`: List of seed URLs to start crawling
- `--max-pages`: Maximum total pages to crawl (default: 200)
- `--index-path`: Path to Whoosh index directory (default: ../indexer/whoosh_index)
- `--clear-index`: Remove existing index before crawling

## Examples

### Crawl Python Documentation
```bash
python crawl_and_index.py --urls https://docs.python.org/3/tutorial/ --max-pages 100
```

### Crawl Tech Blogs
```bash
python crawl_and_index.py --urls \
  https://blog.github.com \
  https://engineering.fb.com \
  https://developers.googleblog.com \
  --max-pages 300
```

### Crawl Educational Sites
```bash
python crawl_and_index.py --urls \
  https://en.wikipedia.org/wiki/Computer_science \
  https://www.khanacademy.org \
  https://stackoverflow.com/questions/tagged/python \
  --max-pages 200
```

## How It Works

1. **Crawling**: The script starts from seed URLs and follows links
2. **Extraction**: Extracts title, content, and links from each page
3. **Indexing**: Stores documents in Whoosh full-text search index
4. **Limits**: Respects crawl delays and limits pages per domain

## Configuration

Edit the script constants to customize:
- `MAX_PAGES_PER_DOMAIN`: Pages per domain (default: 50)
- `MAX_TOTAL_PAGES`: Total pages (default: 200)  
- `CRAWL_DELAY`: Delay between requests in seconds (default: 1.0)
- `DEFAULT_SEED_URLS`: Default starting URLs

## Tips

- Start with a small `--max-pages` value (20-50) to test
- Use `--clear-index` when switching to different topics
- The crawler respects robots.txt and adds delays between requests
- Crawled data is stored persistently in the Whoosh index

## After Crawling

1. Start Nayuta: `./dev.sh` (from project root)
2. Open http://localhost:3000
3. Search for topics from the crawled pages!
