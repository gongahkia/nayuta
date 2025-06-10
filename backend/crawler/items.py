import scrapy

class NayutaItem(scrapy.Item):
    url = scrapy.Field()
    content = scrapy.Field()
    links = scrapy.Field()
    title = scrapy.Field()
    crawled_at = scrapy.Field()