package com.acme.investment.infrastructure.persistence.portfolio;

import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.UUID;

public interface PortfolioJpaRepository extends JpaRepository<PortfolioEntity, UUID> {
    List<PortfolioEntity> findByUserId(UUID userId);
    boolean existsByUserIdAndName(UUID userId, String name);
}