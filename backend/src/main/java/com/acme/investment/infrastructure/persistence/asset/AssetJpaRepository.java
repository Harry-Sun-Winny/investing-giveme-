package com.acme.investment.infrastructure.persistence.asset;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface AssetJpaRepository extends JpaRepository<AssetEntity, UUID> {
    Optional<AssetEntity> findBySymbolIgnoreCase(String symbol);

    @Query("""
            SELECT a FROM AssetEntity a
            WHERE LOWER(a.symbol) LIKE LOWER(CONCAT(:query, '%'))
               OR LOWER(a.name) LIKE LOWER(CONCAT('%', :query, '%'))
            ORDER BY a.symbol
            """)
    List<AssetEntity> search(@Param("query") String query);
}
