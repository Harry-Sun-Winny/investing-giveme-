package com.acme.investment.infrastructure.persistence.watchlist;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface WatchlistJpaRepository extends JpaRepository<WatchlistEntity, UUID> {

    @Query("SELECT w FROM WatchlistEntity w WHERE w.user.id = :userId")
    List<WatchlistEntity> findByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(w) > 0 FROM WatchlistEntity w WHERE w.user.id = :userId AND w.name = :name")
    boolean existsByUserIdAndName(@Param("userId") UUID userId, @Param("name") String name);

    @Query("SELECT w FROM WatchlistEntity w JOIN FETCH w.user WHERE w.id = :id")
    Optional<WatchlistEntity> findByIdWithUser(@Param("id") UUID id);
}