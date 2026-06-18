package com.acme.investment.infrastructure.persistence.watchlist;
import com.acme.investment.domain.watchlist.Watchlist;
import com.acme.investment.infrastructure.persistence.UserEntity;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
@Entity
@Table(name = "watchlists")
public class WatchlistEntity {
    @Id @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;
    @Column(nullable = false)
    private String name;
    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @OneToMany(mappedBy = "watchlist", fetch = FetchType.LAZY)
    private List<WatchlistItemEntity> items = new ArrayList<>();

    @PrePersist void onCreate() { createdAt = OffsetDateTime.now(); }
    public Watchlist toDomain() { return new Watchlist(id, user.getId(), name, createdAt); }
    public UUID getId() { return id; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public List<WatchlistItemEntity> getItems() { return items; }
}