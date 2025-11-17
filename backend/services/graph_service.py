from typing import Dict, List, Any
from collections import defaultdict
from urllib.parse import urlparse
import os


class CrawlGraphService:
    """
    Builds and analyzes the web graph of crawled pages.
    Provides data for visualization of links between crawled documents.
    """

    def __init__(self, index):
        self.index = index

    def build_graph(self) -> Dict[str, Any]:
        """
        Build network graph from indexed documents.

        Returns:
            Dictionary with nodes (pages) and edges (links)
        """
        nodes = []
        edges = []
        domain_stats = defaultdict(int)

        with self.index.searcher() as searcher:
            # Get all documents
            for docnum in range(searcher.doc_count_all()):
                try:
                    doc = searcher.stored_fields(docnum)

                    url = doc.get('url', '')
                    title = doc.get('title', 'Untitled')
                    content = doc.get('content', '')

                    # Extract domain
                    domain = urlparse(url).netloc
                    domain_stats[domain] += 1

                    # Calculate node properties
                    content_length = len(content.split())

                    nodes.append({
                        'id': url,
                        'label': title[:50] + ('...' if len(title) > 50 else ''),
                        'title': title,
                        'domain': domain,
                        'size': content_length,
                        'url': url
                    })

                    # Extract links (if available in schema)
                    if 'links' in doc:
                        links = doc.get('links', '')
                        if links:
                            # Links are comma-separated
                            outgoing_links = [l.strip() for l in links.split(',') if l.strip()]

                            for target_url in outgoing_links:
                                edges.append({
                                    'source': url,
                                    'target': target_url,
                                    'weight': 1
                                })

                except Exception as e:
                    # Skip documents that can't be processed
                    continue

        return {
            'nodes': nodes,
            'edges': edges,
            'stats': {
                'total_nodes': len(nodes),
                'total_edges': len(edges),
                'domains': dict(domain_stats),
                'avg_degree': len(edges) / max(len(nodes), 1)
            }
        }

    def calculate_pagerank(self, iterations: int = 20, damping: float = 0.85) -> Dict[str, float]:
        """
        Calculate PageRank scores for all documents.

        Args:
            iterations: Number of iterations for PageRank algorithm
            damping: Damping factor (default: 0.85)

        Returns:
            Dictionary mapping URLs to PageRank scores
        """
        graph = self.build_graph()
        nodes = {node['id']: node for node in graph['nodes']}
        edges = graph['edges']

        # Build adjacency structures
        outgoing = defaultdict(list)
        incoming = defaultdict(list)

        for edge in edges:
            source = edge['source']
            target = edge['target']
            outgoing[source].append(target)
            incoming[target].append(source)

        # Initialize PageRank scores
        num_nodes = len(nodes)
        pagerank = {url: 1.0 / num_nodes for url in nodes.keys()}

        # Iterate PageRank algorithm
        for _ in range(iterations):
            new_pagerank = {}

            for url in nodes.keys():
                # Calculate contribution from incoming links
                rank_sum = 0.0
                for source_url in incoming[url]:
                    out_degree = len(outgoing[source_url])
                    if out_degree > 0:
                        rank_sum += pagerank[source_url] / out_degree

                # Apply PageRank formula
                new_pagerank[url] = (1 - damping) / num_nodes + damping * rank_sum

            pagerank = new_pagerank

        return pagerank

    def get_domain_clusters(self) -> Dict[str, List[str]]:
        """
        Group documents by domain.

        Returns:
            Dictionary mapping domains to lists of URLs
        """
        clusters = defaultdict(list)

        with self.index.searcher() as searcher:
            for docnum in range(searcher.doc_count_all()):
                try:
                    doc = searcher.stored_fields(docnum)
                    url = doc.get('url', '')
                    domain = urlparse(url).netloc

                    clusters[domain].append(url)
                except:
                    continue

        return dict(clusters)

    def get_graph_statistics(self) -> Dict[str, Any]:
        """
        Calculate comprehensive graph statistics.

        Returns:
            Dictionary with various graph metrics
        """
        graph = self.build_graph()
        nodes = graph['nodes']
        edges = graph['edges']

        # Count node degrees
        in_degree = defaultdict(int)
        out_degree = defaultdict(int)

        for edge in edges:
            out_degree[edge['source']] += 1
            in_degree[edge['target']] += 1

        # Calculate statistics
        degrees = [out_degree[node['id']] + in_degree[node['id']] for node in nodes]
        avg_degree = sum(degrees) / max(len(degrees), 1)
        max_degree = max(degrees) if degrees else 0

        # Find hub and authority nodes
        hubs = sorted(
            [(node['id'], out_degree[node['id']]) for node in nodes],
            key=lambda x: x[1],
            reverse=True
        )[:10]

        authorities = sorted(
            [(node['id'], in_degree[node['id']]) for node in nodes],
            key=lambda x: x[1],
            reverse=True
        )[:10]

        return {
            'total_nodes': len(nodes),
            'total_edges': len(edges),
            'avg_degree': round(avg_degree, 2),
            'max_degree': max_degree,
            'density': round(len(edges) / max((len(nodes) * (len(nodes) - 1)), 1), 4),
            'top_hubs': [{'url': url, 'out_degree': degree} for url, degree in hubs],
            'top_authorities': [{'url': url, 'in_degree': degree} for url, degree in authorities],
            'domains': graph['stats']['domains']
        }

    def get_shortest_path(self, source_url: str, target_url: str) -> List[str]:
        """
        Find shortest path between two URLs using BFS.

        Args:
            source_url: Starting URL
            target_url: Destination URL

        Returns:
            List of URLs representing the shortest path
        """
        graph = self.build_graph()

        # Build adjacency list
        adjacency = defaultdict(list)
        for edge in graph['edges']:
            adjacency[edge['source']].append(edge['target'])

        # BFS to find shortest path
        queue = [(source_url, [source_url])]
        visited = {source_url}

        while queue:
            current, path = queue.pop(0)

            if current == target_url:
                return path

            for neighbor in adjacency[current]:
                if neighbor not in visited:
                    visited.add(neighbor)
                    queue.append((neighbor, path + [neighbor]))

        return []  # No path found
