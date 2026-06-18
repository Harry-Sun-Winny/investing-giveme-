package com.acme.investment.domain.common;

import java.time.OffsetDateTime;

public record SourceCitation(String source, String title, String url, OffsetDateTime publicationDate) {
    public SourceCitation {
        if (isBlank(source) || isBlank(title) || isBlank(url) || publicationDate == null) {
            throw new IllegalArgumentException("Citation requires source, title, url, and publication date");
        }
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}

