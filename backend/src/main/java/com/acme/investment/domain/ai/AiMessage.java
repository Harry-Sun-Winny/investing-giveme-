package com.acme.investment.domain.ai;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AiMessage(UUID id, String role, String content, OffsetDateTime createdAt) {}
