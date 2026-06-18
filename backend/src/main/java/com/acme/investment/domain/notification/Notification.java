package com.acme.investment.domain.notification;

import java.time.OffsetDateTime;
import java.util.UUID;

public record Notification(UUID id, String type, String title, String body,
                           OffsetDateTime readAt, OffsetDateTime createdAt) {}
