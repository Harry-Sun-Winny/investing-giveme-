package com.acme.investment.interfaces.api;

import com.acme.investment.application.NewsAggregationService;
import com.acme.investment.domain.news.NewsArticle;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/news")
public class NewsController {
    private final NewsAggregationService newsAggregationService;

    public NewsController(NewsAggregationService newsAggregationService) {
        this.newsAggregationService = newsAggregationService;
    }

    @GetMapping
    public List<NewsArticle> latest(@RequestParam(required = false) String asset) {
        return newsAggregationService.latestArticles(asset);
    }
}
