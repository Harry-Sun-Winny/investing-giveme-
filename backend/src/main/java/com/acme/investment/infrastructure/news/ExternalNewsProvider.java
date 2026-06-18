package com.acme.investment.infrastructure.news;

import com.acme.investment.application.ports.NewsProvider;
import com.acme.investment.domain.news.NewsSummary;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ExternalNewsProvider implements NewsProvider {
    @Override
    public List<NewsSummary> latestSummaries() {
        return List.of();
    }
}

