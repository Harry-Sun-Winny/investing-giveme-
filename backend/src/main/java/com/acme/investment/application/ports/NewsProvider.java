package com.acme.investment.application.ports;

import com.acme.investment.domain.news.NewsSummary;
import java.util.List;

public interface NewsProvider {
    List<NewsSummary> latestSummaries();
}

