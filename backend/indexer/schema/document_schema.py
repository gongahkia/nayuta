from whoosh.fields import Schema, ID, TEXT, KEYWORD, DATETIME

schema = Schema(
    url=ID(stored=True, unique=True),
    title=TEXT(stored=True),
    content=TEXT(stored=True),
    links=KEYWORD(stored=True, commas=True, scorable=False, lowercase=True), 
    crawled_at=DATETIME(stored=True)
)