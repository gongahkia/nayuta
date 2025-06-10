import os
from pathlib import Path
from dotenv import load_dotenv  

load_dotenv(verbose=True, override=True)

class Config:

    """Central configuration for Nayuta Search Engine components"""
    
    # ================ PATHS ================

    BASE_DIR = Path(__file__).parent.parent
    DATA_DIR = BASE_DIR / "data"
    
    # ================ CRAWLER ================

    CRAWLER = {
        "START_URLS": ["https://example.com"],  
        "ALLOWED_DOMAINS": ["example.com"],     
        "CRAWL_DELAY": 1.0,                     
        "MAX_PAGES": 1000,                      
        "USER_AGENT": os.getenv("CRAWLER_UA", "Mozilla/5.0 (compatible; NayutaBot/1.0; +https://github.com/gongahkia/nayuta)"),
        "PROXIES": os.getenv("CRAWLER_PROXIES", "").split(",") if os.getenv("CRAWLER_PROXIES") else [],
        "POLITENESS": {
            "RESPECT_ROBOTSTXT": True,
            "MAX_CONCURRENT_REQUESTS": 4
        }
    }
    
    # ================ INDEXER ================

    INDEXER = {
        "WHOOSH_INDEX_PATH": BASE_DIR / "indexer" / "whoosh_index",
        "ELASTIC_INDEX": "nayuta",
        "BATCH_SIZE": 100,                      
        "TEXT_PROCESSING": {
            "STEM_LANGUAGE": "english",
            "REMOVE_STOP_WORDS": True,
            "MIN_TOKEN_LENGTH": 3
        }
    }
    
    # ================ QUERY ENGINE ================

    QUERY_ENGINE = {
        "HOST": "0.0.0.0",
        "PORT": 8000,
        "CORS_ORIGINS": os.getenv("CORS_ORIGINS", "*").split(","),
        "PAGE_SIZE": 10,
        "MAX_SUGGESTIONS": 5,
        "SNIPPET_LENGTH": 150
    }
    
    # ================ SEARCH PROVIDERS ================

    ELASTICSEARCH = {
        "HOSTS": os.getenv("ES_HOSTS", "localhost:9200").split(","),
        "TIMEOUT": 30
    }
    
    WHOOSH = {
        "INDEX_SCHEMA": "schema/document_schema.py"
    }
    
    # ================ TEXT PROCESSING ================

    TEXT_PROCESSING = {
        "MAIN_CONTENT_FIELD": "content",
        "SNIPPET_FIELD": "content",
        "MAX_SNIPPET_LENGTH": 200
    }
    
    # ================ LOGGING ================

    LOGGING = {
        "LEVEL": "INFO",
        "CRAWLER_LOG": DATA_DIR / "logs/crawler.log",
        "INDEXER_LOG": DATA_DIR / "logs/indexer.log",
        "QUERY_LOG": DATA_DIR / "logs/query.log",
        "MAX_SIZE_MB": 10,
        "BACKUP_COUNT": 3
    }
    
    # ================ SECURITY ================

    SECURITY = {
        "API_KEYS": {
            "SCRAPER_API": os.getenv("SCRAPER_API_KEY"),
            "GOOGLE_CSE": os.getenv("GOOGLE_CSE_KEY")
        }
    }
    
    @classmethod
    def show(cls):
        """Print current configuration (excluding sensitive data)"""
        import pprint
        safe_config = cls.__dict__.copy()
        safe_config.pop("SECURITY", None)
        pprint.pprint(safe_config)

    def __repr__(self):
        return f"<NayutaConfig {self.QUERY_ENGINE['HOST']}:{self.QUERY_ENGINE['PORT']}>"

config = Config()