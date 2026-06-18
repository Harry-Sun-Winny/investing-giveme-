package com.acme.investment.infrastructure.persistence.watchlist;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "watchlist_items")
public class WatchlistItemEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "watchlist_id", nullable = false)
    private WatchlistEntity watchlist;

    @Column(name = "asset_symbol", nullable = false)
    private String assetSymbol;

    @Column(name = "asset_name")
    private String assetName;

    @Column(name = "added_at")
    private OffsetDateTime addedAt;

    @PrePersist
    void onCreate() { addedAt = OffsetDateTime.now(); }

    public UUID getId() { return id; }
    public WatchlistEntity getWatchlist() { return watchlist; }
    public void setWatchlist(WatchlistEntity watchlist) { this.watchlist = watchlist; }
    public String getAssetSymbol() { return assetSymbol; }
    public void setAssetSymbol(String assetSymbol) { this.assetSymbol = assetSymbol; }
    public String getAssetName() { return assetName; }
    public void setAssetName(String assetName) { this.assetName = assetName; }
    public OffsetDateTime getAddedAt() { return addedAt; }
}