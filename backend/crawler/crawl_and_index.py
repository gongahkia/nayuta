#!/usr/bin/env python3
"""
Crawl websites and index them into Whoosh for Nayuta search engine.
This script crawls specified URLs and builds a searchable index.
"""

import os
import sys
import requests
from bs4 import BeautifulSoup
from urllib.parse import urljoin, urlparse
from datetime import datetime
from whoosh.index import create_in, open_dir
from whoosh.fields import Schema, ID, TEXT, KEYWORD, DATETIME
import time
from collections import deque

# Configuration
MAX_PAGES_PER_DOMAIN = 50  # Limit pages per domain
MAX_TOTAL_PAGES = 200      # Total pages to crawl
CRAWL_DELAY = 1.0          # Seconds between requests
USER_AGENT = 'NayutaBot/1.0 (Educational Search Engine)'

# Default seed URLs - you can modify these
DEFAULT_SEED_URLS = [
    "https://en.wikipedia.org/wiki/Machine_learning",
    "https://en.wikipedia.org/wiki/Python_(programming_language)",
    "https://en.wikipedia.org/wiki/Web_development",
    "https://docs.python.org/3/tutorial/",
    "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
]

class SimpleCrawler:
    def __init__(self, seed_urls=None, max_pages=MAX_TOTAL_PAGES):
        self.seed_urls = seed_urls or DEFAULT_SEED_URLS
        self.max_pages = max_pages
        self.visited = set()
        self.to_visit = deque(self.seed_urls)
        self.domain_counts = {}
        self.crawled_data = []
        
    def is_valid_url(self, url):
        """Check if URL should be crawled"""
        try:
            parsed = urlparse(url)
            # Only http/https
            if parsed.scheme not in ['http', 'https']:
                return False
            # Skip common file extensions
            skip_extensions = ['.pdf', '.jpg', '.png', '.gif', '.zip', '.exe', '.mp4', '.mp3']
            if any(url.lower().endswith(ext) for ext in skip_extensions):
                return False
            return True
        except:
            return False
    
    def get_domain(self, url):
        """Extract domain from URL"""
        return urlparse(url).netloc
    
    def fetch_page(self, url):
        """Fetch and parse a web page"""
        try:
            headers = {'User-Agent': USER_AGENT}
            response = requests.get(url, headers=headers, timeout=10)
            response.raise_for_status()
            return response.text, response.url
        except Exception as e:
            print(f"  ✗ Error fetching {url}: {str(e)}")
            return None, None
    
    def extract_content(self, html, url):
        """Extract text content and links from HTML"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Remove script and style elements
            for element in soup(['script', 'style', 'nav', 'footer', 'header']):
                element.decompose()
            
            # Get title
            title = soup.find('title')
            title_text = title.get_text().strip() if title else ""
            
            # Get main content
            main_content = soup.find('main') or soup.find('article') or soup.find('body')
            if main_content:
                content = main_content.get_text(separator=' ', strip=True)
            else:
                content = soup.get_text(separator=' ', strip=True)
            
            # Clean up whitespace
            content = ' '.join(content.split())
            
            # Extract links
            links = []
            for link in soup.find_all('a', href=True):
                absolute_url = urljoin(url, link['href'])
                if self.is_valid_url(absolute_url):
                    links.append(absolute_url)
            
            return {
                'url': url,
                'title': title_text[:500],  # Limit title length
                'content': content[:10000],  # Limit content length
                'links': ','.join(links[:50]),  # Store up to 50 links
                'crawled_at': datetime.now()
            }
        except Exception as e:
            print(f"  ✗ Error parsing {url}: {str(e)}")
            return None
    
    def crawl(self):
        """Main crawl loop"""
        print(f"\n🕷️  Starting crawl with {len(self.seed_urls)} seed URLs...")
        print(f"    Max pages: {self.max_pages}")
        print(f"    Crawl delay: {CRAWL_DELAY}s\n")
        
        pages_crawled = 0
        
        while self.to_visit and pages_crawled < self.max_pages:
            url = self.to_visit.popleft()
            
            # Skip if already visited
            if url in self.visited:
                continue
            
            # Check domain limit
            domain = self.get_domain(url)
            if self.domain_counts.get(domain, 0) >= MAX_PAGES_PER_DOMAIN:
                continue
            
            print(f"[{pages_crawled + 1}/{self.max_pages}] Crawling: {url[:80]}...")
            
            # Mark as visited
            self.visited.add(url)
            self.domain_counts[domain] = self.domain_counts.get(domain, 0) + 1
            
            # Fetch page
            html, final_url = self.fetch_page(url)
            if not html:
                continue
            
            # Extract content
            page_data = self.extract_content(html, final_url or url)
            if page_data:
                self.crawled_data.append(page_data)
                pages_crawled += 1
                print(f"  ✓ Crawled: {page_data['title'][:60]}...")
                
                # Add new links to queue (but don't overwhelm)
                if page_data['links']:
                    new_links = page_data['links'].split(',')[:10]  # Only take first 10 links
                    for link in new_links:
                        if link not in self.visited and len(self.to_visit) < 500:
                            self.to_visit.append(link)
            
            # Be polite - delay between requests
            time.sleep(CRAWL_DELAY)
        
        print(f"\n✓ Crawl complete! Collected {len(self.crawled_data)} pages from {len(self.domain_counts)} domains")
        return self.crawled_data


def index_documents(documents, index_path="whoosh_index"):
    """Index crawled documents into Whoosh"""
    print(f"\n📚 Indexing {len(documents)} documents into {index_path}...")
    
    # Create schema
    schema = Schema(
        url=ID(stored=True, unique=True),
        title=TEXT(stored=True),
        content=TEXT(stored=True),
        links=KEYWORD(stored=True, commas=True, scorable=False, lowercase=True),
        crawled_at=DATETIME(stored=True)
    )
    
    # Create or open index
    if not os.path.exists(index_path):
        os.makedirs(index_path)
        ix = create_in(index_path, schema)
        print(f"  ✓ Created new index at {index_path}")
    else:
        ix = open_dir(index_path)
        print(f"  ✓ Opened existing index at {index_path}")
    
    # Add documents
    writer = ix.writer()
    indexed = 0
    
    for doc in documents:
        try:
            writer.add_document(
                url=doc['url'],
                title=doc['title'],
                content=doc['content'],
                links=doc['links'],
                crawled_at=doc['crawled_at']
            )
            indexed += 1
            if indexed % 10 == 0:
                print(f"  Indexed {indexed}/{len(documents)} documents...")
        except Exception as e:
            print(f"  ✗ Error indexing {doc['url']}: {str(e)}")
    
    writer.commit()
    print(f"\n✓ Successfully indexed {indexed} documents!")
    return indexed


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description='Crawl and index websites for Nayuta')
    parser.add_argument('--urls', nargs='+', help='Seed URLs to start crawling')
    parser.add_argument('--max-pages', type=int, default=MAX_TOTAL_PAGES, help='Maximum pages to crawl')
    parser.add_argument('--index-path', default='../indexer/whoosh_index', help='Path to Whoosh index')
    parser.add_argument('--clear-index', action='store_true', help='Clear existing index before indexing')
    
    args = parser.parse_args()
    
    # Determine seed URLs
    seed_urls = args.urls if args.urls else DEFAULT_SEED_URLS
    
    print("=" * 70)
    print("🌟 Nayuta Web Crawler & Indexer")
    print("=" * 70)
    
    # Clear index if requested
    if args.clear_index and os.path.exists(args.index_path):
        import shutil
        shutil.rmtree(args.index_path)
        print(f"\n🗑️  Cleared existing index at {args.index_path}")
    
    # Crawl
    crawler = SimpleCrawler(seed_urls=seed_urls, max_pages=args.max_pages)
    documents = crawler.crawl()
    
    if not documents:
        print("\n✗ No documents crawled. Exiting.")
        return 1
    
    # Index
    indexed = index_documents(documents, args.index_path)
    
    print("\n" + "=" * 70)
    print(f"✨ Done! Indexed {indexed} pages into search engine")
    print("=" * 70)
    print("\n💡 Next steps:")
    print("   1. Start the backend: ./dev.sh")
    print("   2. Try searching for topics from the crawled pages")
    print("   3. To crawl more pages, run this script again\n")
    
    return 0


if __name__ == "__main__":
    sys.exit(main())
