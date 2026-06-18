package com.acme.investment.infrastructure.persistence.notification;

import com.acme.investment.domain.notification.Notification;
import com.acme.investment.infrastructure.persistence.UserEntity;
import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "notifications")
public class NotificationEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserEntity user;

    @Column(nullable = false, length = 40)
    private String type;

    @Column(nullable = false, length = 160)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String body;

    @Column(name = "read_at")
    private OffsetDateTime readAt;

    @Column(name = "created_at")
    private OffsetDateTime createdAt;

    @PrePersist
    void onCreate() {
        createdAt = OffsetDateTime.now();
    }

    public Notification toDomain() {
        return new Notification(id, type, title, body, readAt, createdAt);
    }

    public UUID getId() { return id; }
    public UserEntity getUser() { return user; }
    public void setUser(UserEntity user) { this.user = user; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getBody() { return body; }
    public void setBody(String body) { this.body = body; }
    public OffsetDateTime getReadAt() { return readAt; }
    public void setReadAt(OffsetDateTime readAt) { this.readAt = readAt; }
}
