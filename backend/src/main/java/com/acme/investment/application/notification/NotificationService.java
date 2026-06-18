package com.acme.investment.application.notification;

import com.acme.investment.domain.notification.Notification;
import com.acme.investment.infrastructure.persistence.UserEntity;
import com.acme.investment.infrastructure.persistence.UserJpaRepository;
import com.acme.investment.infrastructure.persistence.asset.AssetEntity;
import com.acme.investment.infrastructure.persistence.news.NewsArticleEntity;
import com.acme.investment.infrastructure.persistence.notification.NotificationEntity;
import com.acme.investment.infrastructure.persistence.notification.NotificationJpaRepository;
import com.acme.investment.infrastructure.persistence.watchlist.WatchlistItemEntity;
import com.acme.investment.infrastructure.persistence.watchlist.WatchlistItemJpaRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Service
public class NotificationService {
    private final NotificationJpaRepository notificationRepo;
    private final UserJpaRepository userRepo;
    private final WatchlistItemJpaRepository watchlistItemRepo;

    public NotificationService(NotificationJpaRepository notificationRepo,
                               UserJpaRepository userRepo,
                               WatchlistItemJpaRepository watchlistItemRepo) {
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
        this.watchlistItemRepo = watchlistItemRepo;
    }

    public List<Notification> listByUser(UUID userId) {
        return notificationRepo.findByUserIdOrderByCreatedAtDesc(userId).stream()
                .map(NotificationEntity::toDomain).toList();
    }

    @Transactional
    public Notification markRead(UUID notificationId, UUID userId) {
        NotificationEntity entity = notificationRepo.findById(notificationId)
                .filter(n -> n.getUser().getId().equals(userId))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND));
        entity.setReadAt(OffsetDateTime.now());
        return notificationRepo.save(entity).toDomain();
    }

    @Transactional
    public void markAllRead(UUID userId) {
        userRepo.findById(userId).orElseThrow();
        for (NotificationEntity n : notificationRepo.findByUserIdOrderByCreatedAtDesc(userId)) {
            if (n.getReadAt() == null) {
                n.setReadAt(OffsetDateTime.now());
            }
        }
    }

    @Transactional
    public void onNewsPublished(NewsArticleEntity article) {
        if (article.getAssets().isEmpty()) {
            return;
        }
        Set<String> symbols = new HashSet<>();
        for (AssetEntity asset : article.getAssets()) {
            symbols.add(asset.getSymbol());
        }
        Set<UUID> notifiedUsers = new HashSet<>();
        for (WatchlistItemEntity item : watchlistItemRepo.findByAssetSymbolIn(symbols)) {
            UserEntity user = item.getWatchlist().getUser();
            if (!notifiedUsers.add(user.getId())) {
                continue;
            }
            create(user, "NEWS_ALERT",
                    "News: " + article.getTitle(),
                    article.getSummary() + " — Source: " + article.getSource());
        }
    }

    public void create(UserEntity user, String type, String title, String body) {
        NotificationEntity entity = new NotificationEntity();
        entity.setUser(user);
        entity.setType(type);
        entity.setTitle(title);
        entity.setBody(body);
        notificationRepo.save(entity);
    }
}
