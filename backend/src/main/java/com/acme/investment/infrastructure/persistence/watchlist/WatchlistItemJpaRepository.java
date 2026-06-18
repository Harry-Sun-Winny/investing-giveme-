package com.acme.investment.infrastructure.persistence.watchlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

public interface WatchlistItemJpaRepository extends JpaRepository<WatchlistItemEntity, UUID> {
    List<WatchlistItemEntity> findByWatchlistId(UUID watchlistId);
    boolean existsByWatchlistIdAndAssetSymbol(UUID watchlistId, String assetSymbol);
    void deleteByWatchlistIdAndAssetSymbol(UUID watchlistId, String assetSymbol);

    @Query("""
            SELECT wi FROM WatchlistItemEntity wi
            JOIN FETCH wi.watchlist w
            JOIN FETCH w.user
            WHERE wi.assetSymbol IN :symbols
            """)
    List<WatchlistItemEntity> findByAssetSymbolIn(@Param("symbols") Collection<String> symbols);
}