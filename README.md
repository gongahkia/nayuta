[![](https://img.shields.io/badge/nayuta_1.0.0-passing-light_green)](https://github.com/gongahkia/nayuta/releases/tag/1.0.0) 
[![](https://img.shields.io/badge/nayuta_2.0.0-passing-green)](https://github.com/gongahkia/nayuta/releases/tag/2.0.0) 

# `Nayuta` 🧮

A [Search Engine](https://en.wikipedia.org/wiki/Search_engine) written from scratch.

This includes the [Crawlers, Indexer, Query Engine](#screenshot), [Search Engine Client](#screenshot) and [Crawl Graph](#screenshot).

Ships with first-class [multi-language support](#multi-language-support).

## Screenshot

![](./asset/reference/v2/1.png)
![](./asset/reference/v2/2.png)
![](./asset/reference/v2/3.png)
![](./asset/reference/v2/4.png)

## Stack

* *Frontend*: [React](https://react.dev/), [JavaScript](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
* *Backend*: [Python](https://www.python.org/)
    1. *Web Crawler* : [Scrapy](https://www.scrapy.org/), [Playwright](https://playwright.dev/)
    2. *Indexer* : [Whoosh](https://github.com/whoosh-community/whoosh), [Elasticsearch](https://www.elastic.co/elasticsearch)
    3. *Query Engine* : [FastAPI](https://fastapi.tiangolo.com/)
    4. *Search Jobs Scheduler*: [Celery](https://docs.celeryq.dev/en/stable/index.html)
* *Package*: [Docker](https://www.docker.com/)
* *Cache*: [Redis](https://redis.io/)
* *Deployment*: [AWS ECS](https://aws.amazon.com/ecs/), [Nginx](https://nginx.org/)

## Usage

> [!IMPORTANT]  
> Read the [legal disclaimer](#legal-disclaimer) before installing `Nayuta`.

The below instructions are for locally hosting `Nayuta`. The [Dockerfile](./docker-compose.yml) builds the [Backend](./backend/), then the [Frontend](./frontend/).

```console
$ git clone https://github.com/gongahkia/nayuta && cd nayuta
$ docker-compose down -v
$ docker-compose up --build
```

## Architecture

### Overview

```mermaid
sequenceDiagram
    Actor User as User
    participant Frontend as React Frontend
    participant API as FastAPI Backend
    participant Ranker as BM25 Ranker
    participant Index as Search Index
    participant Crawler as Scrapy Crawler
    participant Queue as Redis Queue

    User->>Frontend: Open app (localhost:3000)
    Frontend->>API: GET /health
    API-->>Frontend: Status OK
    Frontend->>User: Render UI with loading spinner

    par Initialization
        Frontend->>Frontend: Initialize i18n translations
        API->>Crawler: Check crawl status
        Crawler->>Queue: Poll for crawl tasks
    end

    User->>Frontend: Enter search query "AI trends"
    Frontend->>API: POST /search?q=AI+trends
    API->>Ranker: Process BM25 ranking
    Ranker->>Index: Query inverted index
    Index-->>Ranker: Return 50 results
    Ranker->>API: Apply relevance scoring
    API-->>Frontend: Return top 10 results
    Frontend->>User: Display results with snippets

    loop Real-time Updates
        User->>Frontend: Type additional characters
        Frontend->>API: WS /ws/search (partial query)
        API->>Ranker: Get partial matches
        Ranker-->>API: Return live suggestions
        API-->>Frontend: Stream results
        Frontend->>User: Update UI instantly
    end

    User->>Frontend: Click "Next Page"
    Frontend->>API: GET /search?q=AI+trends&offset=10
    API-->>Frontend: Return results 11-20
    Frontend->>User: Update pagination

    User->>Frontend: Switch to Japanese
    Frontend->>Frontend: i18n.changeLanguage('ja')
    Frontend->>API: Update Accept-Language header
    Frontend->>User: Render Japanese UI

    rect rgb(240, 240, 240)
    Note over Crawler,Queue: Background Processes
        Crawler->>Queue: Fetch new URLs
        Queue-->>Crawler: URL batch
        Crawler->>Crawler: Crawl pages
        Crawler->>Index: Send parsed documents
        Index-->>Crawler: Confirm indexing
    end
```

### [Frontend](./frontend/)

```mermaid
graph TD
    A[User] --> B[App.jsx]
    subgraph React Components
        B --> C[SearchBar.jsx]
        B --> D[ResultsList.jsx]
        B --> E[Loader.jsx]
        B --> F[Footer.jsx]
        B --> G[LanguageSwitcher.jsx]
    end
    
    subgraph i18n Internationalization
        H[locales/] -->|translation.json| I(en,ms,zh,ta,ja,ko)
        J[i18n.js] --> H
        G --> J
    end
    
    subgraph API Integration
        C --> K[search.js]
        K -->|HTTP| L[FastAPI Backend]
        D -->|Paginated Results| K
    end
    
    subgraph Styling
        M[main.css] --> B
        M --> C
        M --> D
        M --> F
    end
    
    style A fill:#f9f,stroke:#333
    style B fill:#7f7,stroke:#333
    style C fill:#77f,stroke:#333
    style D fill:#77f,stroke:#333
    style J fill:#f77,stroke:#333
    style K fill:#ff7,stroke:#333
```

### [Backend](./backend/)

```mermaid
graph TD
    A[User Request] --> B[FastAPI Server]
    subgraph Nayuta Backend Architecture
        B --> C[Query Engine]
        C --> D[BM25 Ranking]
        C --> E[Autocomplete]
        C --> F[WebSocket Handler]
        
        D --> G[Whoosh Index]
        D --> H[Elasticsearch Index]
        
        C --> I[Redis Cache]
        
        J[Web Crawler] --> K[Scrapy Spider]
        K --> L[Scheduler]
        K --> M[Downloader]
        K --> N[Parser]
        J --> O[Redis Queue]
        
        N --> P[Raw Documents]
        P --> Q[Indexer]
        Q --> R[Text Processing]
        R --> G
        R --> H
    end
    
    style A fill:#f9f,stroke:#333
    style B fill:#7f7,stroke:#333
    style J fill:#77f,stroke:#333
    style Q fill:#f77,stroke:#333
    style G fill:#ff7,stroke:#333
    style H fill:#ff7,stroke:#333
```

### [Schema](./backend/indexer/schema/)

```mermaid
classDiagram
    class Document {
        +String url
        +String title
        +String content
        +String[] links
        +DateTime crawled_at
    }

    class WhooshSchema {
        <<Schema>>
        -url: ID(stored, unique)
        -title: TEXT(stored, analyzer=StemmingAnalyzer)
        -content: TEXT(stored, analyzer=StemmingAnalyzer)
        -links: KEYWORD(commas, stored)
        -crawled_at: DATETIME(stored)
    }

    class ElasticsearchMapping {
        <<Mapping>>
        -url: keyword
        -title: text
        -content: text(analyzer=standard)
        -links: keyword
        -crawled_at: date(format="strict_date_optional_time||epoch_millis")
    }

    Document -- WhooshSchema : Indexed in
    Document -- ElasticsearchMapping : Indexed in
```

## Reference

The name `Nayuta` is in reference to [Nayuta](https://chainsaw-man.fandom.com/wiki/Nayuta) (ナユタ), the reincarnation of the [Control Devil](https://chainsaw-man.fandom.com/wiki/Control_Devil) who is raised as [Denji](https://chainsaw-man.fandom.com/wiki/Denji)'s younger sister in the [Academy Saga](https://chainsaw-man.fandom.com/wiki/Academy_Saga) of the ongoing manga series [Chainsaw Man](https://chainsaw-man.fandom.com/wiki/Chainsaw_Man_Wiki).

Nayuta also roughly translates to [a large number](https://en.wikipedia.org/wiki/Japanese_numerals#Large_numbers) denoting $10^{60}$ or $10^{72}$ in Japanese.

<div align="center">
    <img src="./asset/logo/nayuta.webp" width="30%">
</div>

## Research

* [*Okapi BM25 Algorithm*](https://en.wikipedia.org/wiki/Okapi_BM25) by Wikipedia
* [*A simple search engine from scratch\**](https://bernsteinbear.com/blog/simple-search/) by Max Bernstein, Chris Gregory
* [*Search Engines Information Retrieval in Practice*](https://ciir.cs.umass.edu/irbook/) by W.Bruce Croft, Donald Metzler, Trevor Strohman
* [*Udacity CS101 Resources*](https://www.cs.virginia.edu/~evans/courses/cs101/) by David Evans
* [*Building a search engine from scratch*](https://www.0x65.dev/blog/2019-12-06/building-a-search-engine-from-scratch.html) by Tech @ Cliqz
* [*How to build a search engine?*](https://www.reddit.com/r/learnprogramming/comments/qwxgn9/how_to_build_a_search_engine/) by r/learnprogramming

## Legal Disclaimer

### For Informational Purposes Only

The information provided on Nayuta is for general informational purposes only. While we strive to ensure the accuracy and reliability of the search results and indexed content displayed, Nayuta makes no guarantees, representations, or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the information. Users should independently verify any information before making decisions based on it.

### No Professional Advice

Nayuta does not provide professional advice or consultation services of any kind. The search results and indexed content should not be considered as a substitute for professional advice from qualified practitioners or experts in relevant fields. Users are encouraged to consult with appropriate professionals regarding their specific needs and requirements.

### No Endorsement

The inclusion of any websites, domains, or content in Nayuta's search results does not constitute an endorsement or recommendation of those sites or their content. Nayuta is not affiliated with any of the indexed content providers unless explicitly stated otherwise.

### Third-Party Content

Nayuta indexes and displays information sourced from third-party websites and domains. We do not control, monitor, or guarantee the accuracy, reliability, or appropriateness of such third-party content. The search results and indexed information are derived from publicly available sources through automated scraping processes, and Nayuta does not claim ownership of this content. Using information obtained from these sources is at your own risk, and Nayuta is not responsible for any content, claims, or damages resulting from their use.

### Use at Your Own Risk

Users access, use, and rely on search results and indexed content provided by Nayuta at their own risk. Information may become outdated, inaccurate, or inappropriate without notice, and content landscapes may change rapidly. Nayuta disclaims all liability for any loss, injury, or damage, direct or indirect, arising from reliance on the information provided through this platform. This includes but is not limited to misinformation, outdated information, incorrect interpretations, malicious content, or decisions made based on the search results displayed.

### Limitation of Liability

To the fullest extent permitted by law:

* Nayuta shall not be liable for any direct, indirect, incidental, consequential, or punitive damages arising out of your use of this search engine or reliance on any indexed content or search results.
* Nayuta disclaims all liability for errors or omissions in the content provided through our indexing and search functionality.
* Our total liability under any circumstances shall not exceed the amount paid by you (if any) for using Nayuta.

### User Responsibility

Users are solely responsible for:

* Verifying the accuracy and currency of any information obtained through Nayuta's search results.
* Seeking appropriate professional advice for their specific circumstances when needed.
* Complying with all applicable laws, regulations, and terms of service of indexed websites.
* Understanding that search results are automated compilations and not editorial recommendations.
* Exercising independent judgment when interpreting and using information found through Nayuta.
* Respecting the intellectual property rights and terms of use of original content sources.

### Copyright and Intellectual Property

Nayuta respects intellectual property rights and operates by indexing publicly available web content through automated scraping processes. We do not claim ownership of indexed content and aim to provide fair use access for search purposes. If you believe your copyrighted work has been inappropriately indexed or displayed on Nayuta, please contact us with specific details to request its removal from our index.

### Data Collection and Privacy

Nayuta may collect user data including search queries, usage patterns, and technical information to improve service functionality and performance. By using Nayuta, you consent to our data collection practices as outlined in our separate Privacy Policy.

### Search Accuracy and Completeness

Nayuta's search results are generated through automated indexing and ranking algorithms. We make no guarantees about the completeness of our index, the relevance of search results, or the availability of specific content. Search algorithms may change without notice, and indexed content may become unavailable due to changes in source websites or technical limitations.

### Service Availability

Nayuta is provided on an "as is" and "as available" basis. We do not guarantee continuous, uninterrupted, or error-free operation of the search engine. The service may be temporarily unavailable due to maintenance, technical issues, or other factors beyond our control.

### Changes to Content and Service

Nayuta reserves the right to modify, update, or remove any indexed content, search functionality, or service features at any time without prior notice. The domains indexed, search algorithms, and availability of specific content may change without notice due to various factors including technical requirements, legal considerations, or updates to our indexing policies.

### Jurisdiction

This disclaimer and your use of Nayuta shall be governed by and construed in accordance with the laws of Singapore. Any disputes arising out of or in connection with this disclaimer shall be subject to the exclusive jurisdiction of the courts in Singapore.
