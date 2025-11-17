import re
from typing import Dict, List, Any, Optional
from datetime import datetime
from whoosh.qparser import QueryParser, MultifieldParser
from whoosh.query import Term, And, Or, Not, Phrase, DateRange


class AdvancedQueryParser:
    """
    Parse advanced search operators like site:, filetype:, intitle:, etc.
    Supports Google-style search syntax for power users.
    """

    def __init__(self, schema):
        self.schema = schema
        self.base_parser = MultifieldParser(["title", "content"], schema=schema)

    def parse(self, query_str: str) -> Dict[str, Any]:
        """
        Parse query string with advanced operators.

        Supported operators:
        - site:example.com - Restrict to domain
        - filetype:pdf - Filter by file extension
        - intitle:"phrase" - Search in title only
        - inurl:keyword - Match URL pattern
        - daterange:2024-01-01..2024-12-31 - Time filter
        - "exact phrase" - Phrase matching
        - -exclude - Negative terms
        - OR, AND, NOT - Boolean operators

        Returns:
            Dictionary with parsed components and Whoosh query
        """
        parsed = {
            'original': query_str,
            'site': None,
            'filetype': None,
            'intitle': None,
            'inurl': None,
            'daterange': None,
            'exact_phrases': [],
            'excluded_terms': [],
            'base_terms': [],
            'operators': []
        }

        remaining_query = query_str

        # Extract site: operator
        site_match = re.search(r'site:(\S+)', remaining_query, re.IGNORECASE)
        if site_match:
            parsed['site'] = site_match.group(1).lower()
            remaining_query = remaining_query.replace(site_match.group(0), '')

        # Extract filetype: operator
        filetype_match = re.search(r'filetype:(\w+)', remaining_query, re.IGNORECASE)
        if filetype_match:
            parsed['filetype'] = filetype_match.group(1).lower()
            remaining_query = remaining_query.replace(filetype_match.group(0), '')

        # Extract intitle: operator
        intitle_match = re.search(r'intitle:"([^"]+)"', remaining_query, re.IGNORECASE)
        if intitle_match:
            parsed['intitle'] = intitle_match.group(1)
            remaining_query = remaining_query.replace(intitle_match.group(0), '')
        else:
            intitle_simple = re.search(r'intitle:(\S+)', remaining_query, re.IGNORECASE)
            if intitle_simple:
                parsed['intitle'] = intitle_simple.group(1)
                remaining_query = remaining_query.replace(intitle_simple.group(0), '')

        # Extract inurl: operator
        inurl_match = re.search(r'inurl:(\S+)', remaining_query, re.IGNORECASE)
        if inurl_match:
            parsed['inurl'] = inurl_match.group(1).lower()
            remaining_query = remaining_query.replace(inurl_match.group(0), '')

        # Extract daterange: operator
        daterange_match = re.search(
            r'daterange:(\d{4}-\d{2}-\d{2})\.\.(\d{4}-\d{2}-\d{2})',
            remaining_query,
            re.IGNORECASE
        )
        if daterange_match:
            parsed['daterange'] = {
                'start': daterange_match.group(1),
                'end': daterange_match.group(2)
            }
            remaining_query = remaining_query.replace(daterange_match.group(0), '')

        # Extract exact phrases (quoted text)
        phrase_matches = re.findall(r'"([^"]+)"', remaining_query)
        if phrase_matches:
            parsed['exact_phrases'] = phrase_matches
            for phrase in phrase_matches:
                remaining_query = remaining_query.replace(f'"{phrase}"', '')

        # Extract excluded terms (words starting with -)
        excluded_matches = re.findall(r'-(\w+)', remaining_query)
        if excluded_matches:
            parsed['excluded_terms'] = excluded_matches
            for term in excluded_matches:
                remaining_query = remaining_query.replace(f'-{term}', '')

        # Extract Boolean operators
        if ' OR ' in remaining_query.upper():
            parsed['operators'].append('OR')
        if ' AND ' in remaining_query.upper():
            parsed['operators'].append('AND')
        if ' NOT ' in remaining_query.upper():
            parsed['operators'].append('NOT')

        # Remaining terms are base query
        base_terms = remaining_query.strip().split()
        parsed['base_terms'] = [t for t in base_terms if len(t) > 0 and t.upper() not in ['AND', 'OR', 'NOT']]

        return parsed

    def build_whoosh_query(self, parsed: Dict[str, Any]):
        """
        Build Whoosh query from parsed components.

        Returns:
            Whoosh Query object
        """
        query_parts = []

        # Base query from remaining terms
        if parsed['base_terms']:
            base_query_str = ' '.join(parsed['base_terms'])
            try:
                base_query = self.base_parser.parse(base_query_str)
                query_parts.append(base_query)
            except:
                pass

        # Site filter (match domain in URL)
        if parsed['site']:
            # Use wildcard to match full domain
            query_parts.append(Term('url', f"*{parsed['site']}*"))

        # Filetype filter
        if parsed['filetype']:
            query_parts.append(Term('url', f"*.{parsed['filetype']}"))

        # Title filter
        if parsed['intitle']:
            title_parser = QueryParser('title', schema=self.schema)
            try:
                title_query = title_parser.parse(parsed['intitle'])
                query_parts.append(title_query)
            except:
                pass

        # URL filter
        if parsed['inurl']:
            query_parts.append(Term('url', f"*{parsed['inurl']}*"))

        # Date range filter
        if parsed['daterange'] and 'crawled_at' in self.schema:
            try:
                start_date = datetime.strptime(parsed['daterange']['start'], '%Y-%m-%d')
                end_date = datetime.strptime(parsed['daterange']['end'], '%Y-%m-%d')
                query_parts.append(DateRange('crawled_at', start_date, end_date))
            except:
                pass

        # Exact phrases
        for phrase in parsed['exact_phrases']:
            phrase_query = Phrase('content', phrase.split())
            query_parts.append(phrase_query)

        # Excluded terms (NOT query)
        for term in parsed['excluded_terms']:
            query_parts.append(Not(Term('content', term.lower())))

        # Combine all parts with AND
        if not query_parts:
            # Return a match-all query if no parts
            return self.base_parser.parse("*")

        if len(query_parts) == 1:
            return query_parts[0]

        return And(query_parts)

    def parse_and_build(self, query_str: str):
        """
        Convenience method to parse and build query in one step.

        Returns:
            Tuple of (parsed_dict, whoosh_query)
        """
        parsed = self.parse(query_str)
        whoosh_query = self.build_whoosh_query(parsed)
        return parsed, whoosh_query
