package com.acme.investment.application.audit;

import com.acme.investment.infrastructure.persistence.UserEntity;
import com.acme.investment.infrastructure.persistence.UserJpaRepository;
import com.acme.investment.infrastructure.persistence.audit.AuditLogEntity;
import com.acme.investment.infrastructure.persistence.audit.AuditLogJpaRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class AuditLogService {
    private final AuditLogJpaRepository auditRepo;
    private final UserJpaRepository userRepo;
    private final ObjectMapper objectMapper;

    public AuditLogService(AuditLogJpaRepository auditRepo, UserJpaRepository userRepo,
                           ObjectMapper objectMapper) {
        this.auditRepo = auditRepo;
        this.userRepo = userRepo;
        this.objectMapper = objectMapper;
    }

    public void log(UUID userId, String entityType, UUID entityId, String action,
                    Object before, Object after) {
        UserEntity user = userRepo.findById(userId).orElseThrow();
        AuditLogEntity entry = new AuditLogEntity();
        entry.setUser(user);
        entry.setEntityType(entityType);
        entry.setEntityId(entityId);
        entry.setAction(action);
        entry.setBeforeState(toJson(before));
        entry.setAfterState(toJson(after));
        auditRepo.save(entry);
    }

    private String toJson(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            return "{\"error\":\"serialization_failed\"}";
        }
    }
}
