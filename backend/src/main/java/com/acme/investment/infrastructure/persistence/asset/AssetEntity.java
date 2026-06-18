package com.acme.investment.infrastructure.persistence.asset;

import com.acme.investment.domain.asset.Asset;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "assets")
public class AssetEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String symbol;

    @Column(nullable = false)
    private String name;

    @Column(name = "asset_type", nullable = false)
    private String assetType;

    private String exchange;

    @Column(nullable = false, columnDefinition = "CHAR(3)")
    private String currency;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    public Asset toDomain() {
        return new Asset(id, symbol, name, assetType, exchange, currency);
    }

    public UUID getId() { return id; }
    public String getSymbol() { return symbol; }
    public String getName() { return name; }
    public String getAssetType() { return assetType; }
    public String getExchange() { return exchange; }
    public String getCurrency() { return currency; }
    public void setSymbol(String symbol) { this.symbol = symbol; }
public void setName(String name) { this.name = name; }
public void setAssetType(String assetType) { this.assetType = assetType; }
public void setExchange(String exchange) { this.exchange = exchange; }
public void setCurrency(String currency) { this.currency = currency; }
}
