package com.acme.investment.domain.ai;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record AiConversation(UUID id, UUID portfolioId, String title,
                             OffsetDateTime createdAt, List<AiMessage> messages) {}
