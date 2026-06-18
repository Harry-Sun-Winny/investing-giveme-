package com.acme.investment.domain.news;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record NewsArticle(UUID id, String source, OffsetDateTime publicationDate, String title,
                          String summary, String url, List<String> assetSymbols, List<String> tags) {}
