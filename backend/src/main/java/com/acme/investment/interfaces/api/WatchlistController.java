package com.acme.investment.interfaces.api;

import com.acme.investment.application.watchlist.WatchlistService;
import com.acme.investment.domain.watchlist.Watchlist;
import com.acme.investment.domain.watchlist.WatchlistItem;
import com.acme.investment.infrastructure.persistence.UserJpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/watchlists")
public class WatchlistController {

    private final WatchlistService watchlistService;
    private final UserJpaRepository userRepo;

    public WatchlistController(WatchlistService watchlistService, UserJpaRepository userRepo) {
        this.watchlistService = watchlistService;
        this.userRepo = userRepo;
    }

    private UUID resolveUserId(UserDetails u) {
        return userRepo.findByEmail(u.getUsername()).orElseThrow().getId();
    }

    @GetMapping
    public List<Watchlist> list(@AuthenticationPrincipal UserDetails u) {
        return watchlistService.listByUser(resolveUserId(u));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public Watchlist create(@RequestBody CreateWatchlistRequest req, @AuthenticationPrincipal UserDetails u) {
        return watchlistService.create(resolveUserId(u), req.name());
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable UUID id, @AuthenticationPrincipal UserDetails u) {
        watchlistService.delete(id, resolveUserId(u));
    }

    // Items endpoints
    @GetMapping("/{watchlistId}/items")
    public List<WatchlistItem> listItems(@PathVariable UUID watchlistId,
                                         @AuthenticationPrincipal UserDetails u) {
        return watchlistService.listItems(watchlistId, resolveUserId(u));
    }

    @PostMapping("/{watchlistId}/items")
    @ResponseStatus(HttpStatus.CREATED)
    public WatchlistItem addItem(@PathVariable UUID watchlistId,
                                  @RequestBody AddItemRequest req,
                                  @AuthenticationPrincipal UserDetails u) {
        return watchlistService.addItem(watchlistId, resolveUserId(u), req.assetSymbol(), req.assetName());
    }

    @DeleteMapping("/{watchlistId}/items/{symbol}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeItem(@PathVariable UUID watchlistId,
                           @PathVariable String symbol,
                           @AuthenticationPrincipal UserDetails u) {
        watchlistService.removeItem(watchlistId, resolveUserId(u), symbol);
    }

    public record CreateWatchlistRequest(String name) {}
    public record AddItemRequest(String assetSymbol, String assetName) {}
}