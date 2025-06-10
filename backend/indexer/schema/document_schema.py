from whoosh.fields import *

schema = Schema(
    url=ID(stored=True),
    content=TEXT(stored=True),
    links=KEYWORD(stored=True)
)