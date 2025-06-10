import scrapy
from urllib.parse import urljoin
from nayuta.backend.config import START_URLS

class NayutaSpider(scrapy.Spider):

    name = "nayuta_crawler"
    allowed_domains = ["example.com"] # fua to update with actual domains
    start_urls = START_URLS
    custom_settings = {
        'DOWNLOAD_DELAY': 1.0, 
        'ROBOTSTXT_OBEY': True,
        'FEED_FORMAT': 'json',
        'FEED_URI': 'output.json',
        'LOG_LEVEL': 'INFO'
    }

    def parse(self, response):
        body_text = ' '.join(response.css('body *::text').getall()).strip()
        raw_links = response.css('a::attr(href)').getall()
        links = []
        for link in raw_links:
            absolute_link = urljoin(response.url, link)
            if absolute_link.startswith('http'):
                links.append(absolute_link)
        yield {
            "url": response.url,
            "content": body_text,
            "links": links,
            "title": response.css('title::text').get(default='').strip()
        }
        for link in links:
            if any(domain in link for domain in self.allowed_domains):
                yield scrapy.Request(link, callback=self.parse)