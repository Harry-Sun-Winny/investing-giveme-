package com.acme.investment.domain.watchlist;

import java.time.OffsetDateTime;
import java.util.UUID;

public record WatchlistItem(UUID id, UUID watchlistId, String assetSymbol, String assetName, OffsetDateTime addedAt) {}