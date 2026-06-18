package com.acme.investment.infrastructure.persistence.ai;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AiConversationJpaRepository extends JpaRepository<AiConversationEntity, UUID> {
    @Query("""
            SELECT c FROM AiConversationEntity c
            LEFT JOIN FETCH c.messages
            WHERE c.user.id = :userId
            ORDER BY c.updatedAt DESC
            """)
    List<AiConversationEntity> findByUserIdOrderByUpdatedAtDesc(@Param("userId") UUID userId);
}
