package com.acme.investment.domain.watchlist;
import java.time.OffsetDateTime;
import java.util.UUID;
public record Watchlist(UUID id, UUID userId, String name, OffsetDateTime createdAt) {}