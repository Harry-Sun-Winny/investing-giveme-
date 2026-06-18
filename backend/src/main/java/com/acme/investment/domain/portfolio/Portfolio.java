package com.acme.investment.domain.portfolio;
import java.time.OffsetDateTime;
import java.util.UUID;
public record Portfolio(
    UUID id,
    UUID userId,
    String name,
    String baseCurrency,
    String type,
    OffsetDateTime createdAt,
    OffsetDateTime updatedAt
) {}