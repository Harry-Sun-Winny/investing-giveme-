package com.acme.investment.infrastructure.persistence.notification;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface NotificationJpaRepository extends JpaRepository<NotificationEntity, UUID> {
    List<NotificationEntity> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
