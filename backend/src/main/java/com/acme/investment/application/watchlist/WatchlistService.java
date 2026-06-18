package com.acme.investment.application.watchlist;

import com.acme.investment.domain.watchlist.Watchlist;
import com.acme.investment.domain.watchlist.WatchlistItem;
import com.acme.investment.infrastructure.persistence.UserJpaRepository;
import com.acme.investment.infrastructure.persistence.watchlist.*;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;

@Service
public class WatchlistService {

    private final WatchlistJpaRepository watchlistRepo;
    private final WatchlistItemJpaRepository itemRepo;
    private final UserJpaRepository userRepo;

    public WatchlistService(WatchlistJpaRepository watchlistRepo,
                            WatchlistItemJpaRepository itemRepo,
                            UserJpaRepository userRepo) {
        this.watchlistRepo = watchlistRepo;
        this.itemRepo = itemRepo;
        this.userRepo = userRepo;
    }

    public List<Watchlist> listByUser(UUID userId) {
        return watchlistRepo.findByUserId(userId).stream().map(WatchlistEntity::toDomain).toList();
    }

    public Watchlist create(UUID userId, String name) {
        if (watchlistRepo.existsByUserIdAndName(userId, name))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Watchlist name already exists");
        var user = userRepo.findById(userId).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        var entity = new WatchlistEntity();
        entity.setUser(user);
        entity.setName(name);
        return watchlistRepo.save(entity).toDomain();
    }

    public void delete(UUID id, UUID userId) {
        var entity = watchlistRepo.findById(id)
                .filter(w -> w.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        watchlistRepo.delete(entity);
    }

    // Items
    public List<WatchlistItem> listItems(UUID watchlistId, UUID userId) {
        verifyOwner(watchlistId, userId);
        return itemRepo.findByWatchlistId(watchlistId).stream()
                .map(e -> new WatchlistItem(e.getId(), watchlistId, e.getAssetSymbol(), e.getAssetName(), e.getAddedAt()))
                .toList();
    }

    public WatchlistItem addItem(UUID watchlistId, UUID userId, String symbol, String name) {
        var watchlist = verifyOwner(watchlistId, userId);
        if (itemRepo.existsByWatchlistIdAndAssetSymbol(watchlistId, symbol))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already in watchlist");
        var item = new WatchlistItemEntity();
        item.setWatchlist(watchlist);
        item.setAssetSymbol(symbol.toUpperCase());
        item.setAssetName(name);
        var saved = itemRepo.save(item);
        return new WatchlistItem(saved.getId(), watchlistId, saved.getAssetSymbol(), saved.getAssetName(), saved.getAddedAt());
    }

    @Transactional
    public void removeItem(UUID watchlistId, UUID userId, String symbol) {
        verifyOwner(watchlistId, userId);
        itemRepo.deleteByWatchlistIdAndAssetSymbol(watchlistId, symbol);
    }

  private WatchlistEntity verifyOwner(UUID watchlistId, UUID userId) {
        return watchlistRepo.findByIdWithUser(watchlistId)
                .filter(w -> w.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN));
    }
}