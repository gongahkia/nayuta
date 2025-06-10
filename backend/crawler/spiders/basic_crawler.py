import scrapy
from nayuta.backend.config import START_URLS

class NayutaSpider(scrapy.Spider):
    name = "nayuta_crawler"
    allowed_domains = ["example.com"]
    start_urls = START_URLS

    def parse(self, response):
        yield {
            "url": response.url,
            "content": response.css("body::text").get(),
            "links": response.css("a::attr(href)").getall()
        }