package com.acme.investment.infrastructure.persistence.audit;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;

public interface AuditLogJpaRepository extends JpaRepository<AuditLogEntity, UUID> {
    @Query("SELECT a FROM AuditLogEntity a WHERE a.user.id = :userId ORDER BY a.createdAt DESC")
    List<AuditLogEntity> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT a FROM AuditLogEntity a WHERE a.entityType = :entityType AND a.entityId = :entityId ORDER BY a.createdAt DESC")
    List<AuditLogEntity> findByEntityTypeAndEntityId(@Param("entityType") String entityType, @Param("entityId") UUID entityId);
}