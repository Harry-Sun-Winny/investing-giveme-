package com.acme.investment.domain.asset;

import java.util.UUID;

public record Asset(UUID id, String symbol, String name, String assetType, String exchange, String currency) {}
