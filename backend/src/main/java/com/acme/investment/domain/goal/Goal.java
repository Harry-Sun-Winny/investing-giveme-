package com.acme.investment.domain.goal;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
public record Goal(UUID id, UUID userId, String name, BigDecimal targetAmount,
    BigDecimal currentAmount, String currency, LocalDate targetDate,
    String status, OffsetDateTime createdAt) {}