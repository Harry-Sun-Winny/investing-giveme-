package com.acme.investment.infrastructure.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class JwtService {
    private final String secret;
    private final long ttlMinutes;

    public JwtService(@Value("${security.jwt.secret}") String secret,
                      @Value("${security.jwt.ttl-minutes}") long ttlMinutes) {
        this.secret = secret;
        this.ttlMinutes = ttlMinutes;
    }

    public String createToken(String subject) {
        Instant now = Instant.now();
        return Jwts.builder()
                .subject(subject)
                .issuedAt(Date.from(now))
                .expiration(Date.from(now.plusSeconds(ttlMinutes * 60)))
                .signWith(Keys.hmacShaKeyFor(padSecret(secret).getBytes(StandardCharsets.UTF_8)))
                .compact();
    }

    public String parseSubject(String token) {
        return Jwts.parser()
                .verifyWith(Keys.hmacShaKeyFor(padSecret(secret).getBytes(StandardCharsets.UTF_8)))
                .build()
                .parseSignedClaims(token)
                .getPayload()
                .getSubject();
    }

    private String padSecret(String value) {
        if (value.length() >= 32) {
            return value;
        }
        return (value + "00000000000000000000000000000000").substring(0, 32);
    }
}

