package com.acme.investment.infrastructure.persistence.holding;

import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PortfolioPositionJpaRepository extends JpaRepository<PortfolioPositionEntity, UUID> {
    @Query("""
            SELECT p FROM PortfolioPositionEntity p
            JOIN FETCH p.portfolio
            JOIN FETCH p.asset
            WHERE p.portfolio.id = :portfolioId
            """)
    List<PortfolioPositionEntity> findByPortfolioId(@Param("portfolioId") UUID portfolioId);

    void deleteByPortfolioId(UUID portfolioId);
}
