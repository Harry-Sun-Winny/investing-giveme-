package com.acme.investment.infrastructure.persistence.goal;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.UUID;
public interface GoalJpaRepository extends JpaRepository<GoalEntity, UUID> {
    @Query("SELECT g FROM GoalEntity g WHERE g.user.id = :userId")
    List<GoalEntity> findByUserId(@Param("userId") UUID userId);
}