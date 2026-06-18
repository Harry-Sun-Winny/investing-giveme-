package com.acme.investment.domain.news;

import java.time.OffsetDateTime;

public record NewsSummary(String source, OffsetDateTime publicationDate, String summary, String link) {
    public NewsSummary {
        if (isBlank(source) || publicationDate == null || isBlank(summary) || isBlank(link)) {
            throw new IllegalArgumentException("News summary requires source, publication date, summary, and link");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

