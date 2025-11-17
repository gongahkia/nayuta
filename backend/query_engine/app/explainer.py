import math
from whoosh.scoring import BM25F
from typing import Dict, List, Any


class SearchExplainer:
    """
    Explains BM25 search result rankings by breaking down score components.
    Provides educational transparency into the ranking algorithm.
    """

    def __init__(self, searcher, index):
        self.searcher = searcher
        self.index = index
        self.weighting = BM25F()

    def explain_result(self, hit, query_terms: List[str], position: int) -> Dict[str, Any]:
        """
        Generate detailed explanation for why a result ranked at its position.

        Args:
            hit: Whoosh search result Hit object
            query_terms: List of terms from the parsed query
            position: Result position in ranking (1-indexed)

        Returns:
            Dictionary with detailed score breakdown
        """
        explanation = {
            'position': position,
            'total_score': round(hit.score, 4),
            'breakdown': self._calculate_score_breakdown(hit, query_terms),
            'matching_terms': self._get_matching_terms(hit, query_terms),
            'field_contributions': self._get_field_contributions(hit, query_terms),
            'document_stats': self._get_document_stats(hit),
            'formula_explanation': self._get_formula_explanation()
        }

        return explanation

    def _calculate_score_breakdown(self, hit, query_terms: List[str]) -> Dict[str, float]:
        """Calculate individual components of BM25 score"""
        breakdown = {
            'term_frequency_component': 0.0,
            'idf_component': 0.0,
            'length_normalization': 0.0,
            'field_boost': 0.0
        }

        # BM25 parameters (default Whoosh values)
        k1 = 1.2  # Term frequency saturation parameter
        b = 0.75  # Length normalization parameter

        doc_count = self.searcher.doc_count_all()

        for term in query_terms:
            term_lower = term.lower()

            # Calculate IDF (Inverse Document Frequency)
            df = self.searcher.doc_frequency("content", term_lower)
            if df > 0:
                idf = math.log((doc_count - df + 0.5) / (df + 0.5) + 1.0)
                breakdown['idf_component'] += idf

        # Estimate length normalization impact
        # This is a simplified calculation since Whoosh doesn't expose all internals
        try:
            content_length = len(hit.get('content', '').split())
            avg_length = self._estimate_average_doc_length()
            if avg_length > 0:
                length_ratio = content_length / avg_length
                breakdown['length_normalization'] = round(1.0 / (1.0 + b * (length_ratio - 1.0)), 4)
        except:
            breakdown['length_normalization'] = 1.0

        # Field boost (title vs content)
        breakdown['field_boost'] = 2.0 if self._has_title_match(hit, query_terms) else 1.0

        # Round all values
        for key in breakdown:
            breakdown[key] = round(breakdown[key], 4)

        return breakdown

    def _get_matching_terms(self, hit, query_terms: List[str]) -> List[Dict[str, Any]]:
        """Extract which query terms matched in the document"""
        matching = []

        content_text = hit.get('content', '').lower()
        title_text = hit.get('title', '').lower()

        for term in query_terms:
            term_lower = term.lower()

            # Count occurrences
            content_count = content_text.count(term_lower)
            title_count = title_text.count(term_lower)

            if content_count > 0 or title_count > 0:
                # Calculate document frequency
                df = self.searcher.doc_frequency("content", term_lower)
                doc_count = self.searcher.doc_count_all()

                # Calculate IDF
                idf = 0.0
                if df > 0:
                    idf = math.log((doc_count - df + 0.5) / (df + 0.5) + 1.0)

                matching.append({
                    'term': term,
                    'content_frequency': content_count,
                    'title_frequency': title_count,
                    'document_frequency': df,
                    'total_documents': doc_count,
                    'idf_score': round(idf, 4),
                    'rarity': self._calculate_rarity(df, doc_count)
                })

        # Sort by IDF score (rarest terms first)
        matching.sort(key=lambda x: x['idf_score'], reverse=True)
        return matching

    def _get_field_contributions(self, hit, query_terms: List[str]) -> Dict[str, float]:
        """Calculate how much each field contributed to the score"""
        contributions = {
            'title': 0.0,
            'content': 0.0
        }

        title_text = hit.get('title', '').lower()
        content_text = hit.get('content', '').lower()

        # Title gets 2x boost in BM25F
        title_matches = sum(1 for term in query_terms if term.lower() in title_text)
        content_matches = sum(1 for term in query_terms if term.lower() in content_text)

        total_matches = title_matches * 2.0 + content_matches

        if total_matches > 0:
            contributions['title'] = round((title_matches * 2.0 / total_matches) * hit.score, 4)
            contributions['content'] = round((content_matches / total_matches) * hit.score, 4)

        return contributions

    def _get_document_stats(self, hit) -> Dict[str, Any]:
        """Get statistics about the document"""
        content = hit.get('content', '')
        title = hit.get('title', '')

        return {
            'content_length': len(content.split()),
            'title_length': len(title.split()),
            'avg_content_length': self._estimate_average_doc_length(),
            'length_ratio': round(len(content.split()) / max(self._estimate_average_doc_length(), 1), 2)
        }

    def _get_formula_explanation(self) -> Dict[str, str]:
        """Return human-readable BM25 formula explanation"""
        return {
            'formula': 'BM25(q, d) = Σ IDF(qi) × (f(qi, d) × (k1 + 1)) / (f(qi, d) + k1 × (1 - b + b × |d| / avgdl))',
            'components': {
                'IDF': 'Inverse Document Frequency - how rare the term is',
                'f(qi, d)': 'Term frequency in document',
                'k1': 'Term frequency saturation (default: 1.2)',
                'b': 'Length normalization (default: 0.75)',
                '|d|': 'Document length',
                'avgdl': 'Average document length in collection'
            },
            'explanation': 'BM25 balances term frequency, term rarity, and document length to rank relevance'
        }

    def _has_title_match(self, hit, query_terms: List[str]) -> bool:
        """Check if any query term appears in title"""
        title = hit.get('title', '').lower()
        return any(term.lower() in title for term in query_terms)

    def _estimate_average_doc_length(self) -> float:
        """Estimate average document length across the index"""
        # This is an approximation since Whoosh doesn't expose this directly
        # In production, this would be cached or pre-calculated
        try:
            with self.index.reader() as reader:
                total_tokens = 0
                doc_count = 0

                # Sample up to 100 documents
                for docnum in range(min(100, reader.doc_count_all())):
                    try:
                        doc = reader.stored_fields(docnum)
                        content = doc.get('content', '')
                        total_tokens += len(content.split())
                        doc_count += 1
                    except:
                        continue

                return total_tokens / max(doc_count, 1)
        except:
            return 100.0  # Fallback default

    def _calculate_rarity(self, df: int, total_docs: int) -> str:
        """Categorize term rarity"""
        if df == 0:
            return 'not_found'

        percentage = (df / max(total_docs, 1)) * 100

        if percentage < 1:
            return 'very_rare'
        elif percentage < 5:
            return 'rare'
        elif percentage < 20:
            return 'common'
        else:
            return 'very_common'
