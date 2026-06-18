package com.acme.investment.interfaces.api;

import com.acme.investment.application.notification.NotificationService;
import com.acme.investment.domain.notification.Notification;
import com.acme.investment.infrastructure.persistence.UserJpaRepository;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
public class NotificationController {
    private final NotificationService notificationService;
    private final UserJpaRepository userRepo;

    public NotificationController(NotificationService notificationService, UserJpaRepository userRepo) {
        this.notificationService = notificationService;
        this.userRepo = userRepo;
    }

    private UUID resolveUserId(UserDetails u) {
        return userRepo.findByEmail(u.getUsername()).orElseThrow().getId();
    }

    @GetMapping
    public List<Notification> list(@AuthenticationPrincipal UserDetails u) {
        return notificationService.listByUser(resolveUserId(u));
    }

    @PatchMapping("/{id}/read")
    public Notification markRead(@PathVariable UUID id, @AuthenticationPrincipal UserDetails u) {
        return notificationService.markRead(id, resolveUserId(u));
    }

    @PostMapping("/read-all")
    public void markAllRead(@AuthenticationPrincipal UserDetails u) {
        notificationService.markAllRead(resolveUserId(u));
    }
}
