package com.acme.investment.infrastructure.persistence.news;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NewsArticleJpaRepository extends JpaRepository<NewsArticleEntity, UUID> {
    Optional<NewsArticleEntity> findByUrl(String url);

    long deleteByPublicationDateBefore(java.time.OffsetDateTime cutoff);

    @Query("""
            SELECT DISTINCT n FROM NewsArticleEntity n
            LEFT JOIN FETCH n.assets
            ORDER BY n.publicationDate DESC
            """)
    List<NewsArticleEntity> findLatest(Pageable pageable);

    @Query("""
            SELECT DISTINCT n FROM NewsArticleEntity n
            JOIN FETCH n.assets a
            WHERE UPPER(a.symbol) = UPPER(:symbol)
            ORDER BY n.publicationDate DESC
            """)
    List<NewsArticleEntity> findByAssetSymbol(@Param("symbol") String symbol, Pageable pageable);
}
