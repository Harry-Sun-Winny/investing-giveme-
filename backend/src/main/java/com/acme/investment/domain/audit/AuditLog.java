package com.acme.investment.domain.audit;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AuditLog(
    UUID id,
    UUID userId,
    String entityType,
    UUID entityId,
    String action,
    String beforeState,
    String afterState,
    String ipAddress,
    OffsetDateTime createdAt
) {}