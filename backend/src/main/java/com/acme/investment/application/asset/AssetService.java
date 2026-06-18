package com.acme.investment.application.asset;

import com.acme.investment.domain.asset.Asset;
import com.acme.investment.infrastructure.persistence.asset.AssetEntity;
import com.acme.investment.infrastructure.persistence.asset.AssetJpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;

@Service
public class AssetService {
    private final AssetJpaRepository assetRepo;

    public AssetService(AssetJpaRepository assetRepo) {
        this.assetRepo = assetRepo;
    }

    public List<Asset> search(String query) {
        if (query == null || query.isBlank()) {
            return assetRepo.findAll().stream().map(AssetEntity::toDomain).toList();
        }
        return assetRepo.search(query.trim()).stream().map(AssetEntity::toDomain).toList();
    }

    public Asset requireBySymbol(String symbol) {
        return assetRepo.findBySymbolIgnoreCase(symbol)
                .map(AssetEntity::toDomain)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Unknown asset symbol: " + symbol));
    }

    public AssetEntity requireEntityBySymbol(String symbol) {
        return assetRepo.findBySymbolIgnoreCase(symbol)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "Unknown asset symbol: " + symbol));
    }
}
