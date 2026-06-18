package com.acme.investment.domain.holding;

import java.math.BigDecimal;
import java.util.UUID;

public record Holding(UUID id, UUID portfolioId, UUID assetId, String symbol, String name,
                      BigDecimal quantity, BigDecimal averageCost) {}
