import os
from whoosh.index import open_dir
from whoosh.qparser import MultifieldParser, FuzzyTermPlugin, PrefixPlugin
from whoosh.highlight import ContextFragmenter, HtmlFormatter
from whoosh.scoring import BM25F
from whoosh import sorting
from .explainer import SearchExplainer
from .advanced_parser import AdvancedQueryParser

class BM25Ranker:
    def __init__(self, index_path):
        self.index_path = index_path
        self.index = self._open_index()
        self.searcher = self.index.searcher(weighting=BM25F)
        self.query_parser = MultifieldParser(["title", "content"], schema=self.index.schema)
        self.advanced_parser = AdvancedQueryParser(self.index.schema)
        self.explainer = SearchExplainer(self.searcher, self.index)
        self._setup_autocomplete()

    def _open_index(self):
        if not os.path.exists(self.index_path):
            raise FileNotFoundError(f"Whoosh index not found at {self.index_path}")
        return open_dir(self.index_path)

    def _setup_autocomplete(self):
        self.query_parser.add_plugin(PrefixPlugin())
        self.query_parser.add_plugin(FuzzyTermPlugin())

    def query(self, query_str, limit=10, offset=0, explain=False, use_advanced=True):
        # Check if query contains advanced operators
        has_operators = any(op in query_str.lower() for op in ['site:', 'filetype:', 'intitle:', 'inurl:', 'daterange:', '"', '-'])

        if use_advanced and has_operators:
            # Use advanced parser
            parsed_dict, parsed_query = self.advanced_parser.parse_and_build(query_str)
        else:
            # Use simple parser
            parsed_query = self.query_parser.parse(query_str)
            parsed_dict = None

        results = self.searcher.search(
            parsed_query,
            limit=limit,
            offset=offset,
            terms=True,
            scored=True,
            sortedby=sorting.ScoreFacet()
        )

        # Extract query terms for explanation
        query_terms = self._extract_query_terms(query_str)

        return self._format_results(results, query_terms, explain), parsed_dict

    def _format_results(self, results, query_terms, explain=False):
        formatted = []
        for position, hit in enumerate(results, 1):
            snippet = hit.highlights("content", top=1)
            result_data = {
                "url": hit["url"],
                "title": hit.get("title", ""),
                "snippet": snippet if snippet else self._generate_snippet(hit["content"]),
                "score": hit.score
            }

            # Add explanation if requested
            if explain:
                result_data["explanation"] = self.explainer.explain_result(
                    hit, query_terms, position
                )

            formatted.append(result_data)
        return formatted

    def _extract_query_terms(self, query_str):
        """Extract individual terms from query string"""
        # Simple tokenization - split on whitespace and remove special chars
        terms = query_str.lower().split()
        # Remove common operators and punctuation
        cleaned_terms = [
            term.strip('*"()[]{}') for term in terms
            if term not in ['and', 'or', 'not', 'to']
        ]
        return [t for t in cleaned_terms if len(t) > 0]

    def _generate_snippet(self, content, max_length=150):
        if not content:
            return ""
        clean_content = ' '.join(content.split())
        return (clean_content[:max_length] + '...') if len(clean_content) > max_length else clean_content

    def autocomplete(self, prefix, limit=5):
        with self.index.reader() as reader:
            terms = []
            for term in reader.terms("content"):
                if term[1].startswith(prefix.lower()):
                    terms.append(term[1])
                    if len(terms) >= limit:
                        break
            return terms

    def index_size(self):
        return self.searcher.doc_count()

    def close(self):
        self.searcher.close()

if __name__ == "__main__":
    ranker = BM25Ranker("../indexer/whoosh_index")
    try:
        print("Index contains", ranker.index_size(), "documents")
        test_query = input("Enter test query: ")
        results = ranker.query(test_query)
        for i, res in enumerate(results, 1):
            print(f"\nResult {i}:")
            print(f"Title: {res['title']}")
            print(f"URL: {res['url']}")
            print(f"Snippet: {res['snippet']}")
            print(f"Score: {res['score']:.2f}")
    finally:
        ranker.close()