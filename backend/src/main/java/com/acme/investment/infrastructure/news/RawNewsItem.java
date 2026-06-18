package com.acme.investment.infrastructure.news;

import java.time.OffsetDateTime;

public record RawNewsItem(String source, String title, String url, String content,
                          OffsetDateTime publicationDate) {}
