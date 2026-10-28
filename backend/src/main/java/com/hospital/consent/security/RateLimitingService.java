package com.hospital.consent.security;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.Refill;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class RateLimitingService {

    private final Map<String, Bucket> authBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> aiBuckets = new ConcurrentHashMap<>();

    private final int authCapacity;
    private final int authRefillTokens;
    private final int authRefillDurationSeconds;

    private final int aiCapacity;
    private final int aiRefillTokens;
    private final int aiRefillDurationSeconds;

    public RateLimitingService(
            @Value("${app.rate-limit.auth-capacity:10}") int authCapacity,
            @Value("${app.rate-limit.auth-refill-tokens:10}") int authRefillTokens,
            @Value("${app.rate-limit.auth-refill-duration-seconds:60}") int authRefillDurationSeconds,
            @Value("${app.rate-limit.ai-capacity:20}") int aiCapacity,
            @Value("${app.rate-limit.ai-refill-tokens:20}") int aiRefillTokens,
            @Value("${app.rate-limit.ai-refill-duration-seconds:60}") int aiRefillDurationSeconds) {
        this.authCapacity = authCapacity;
        this.authRefillTokens = authRefillTokens;
        this.authRefillDurationSeconds = authRefillDurationSeconds;
        this.aiCapacity = aiCapacity;
        this.aiRefillTokens = aiRefillTokens;
        this.aiRefillDurationSeconds = aiRefillDurationSeconds;
    }

    public boolean tryConsumeAuth(String key) {
        Bucket bucket = authBuckets.computeIfAbsent(key, k -> createAuthBucket());
        return bucket.tryConsume(1);
    }

    public boolean tryConsumeAi(String key) {
        Bucket bucket = aiBuckets.computeIfAbsent(key, k -> createAiBucket());
        return bucket.tryConsume(1);
    }

    private Bucket createAuthBucket() {
        Refill refill = Refill.intervally(authRefillTokens, Duration.ofSeconds(authRefillDurationSeconds));
        Bandwidth limit = Bandwidth.classic(authCapacity, refill);
        return Bucket.builder().addLimit(limit).build();
    }

    private Bucket createAiBucket() {
        Refill refill = Refill.intervally(aiRefillTokens, Duration.ofSeconds(aiRefillDurationSeconds));
        Bandwidth limit = Bandwidth.classic(aiCapacity, refill);
        return Bucket.builder().addLimit(limit).build();
    }
}
