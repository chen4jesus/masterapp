package com.faithconnect.bookstacksync.interceptor;

import com.faithconnect.bookstacksync.model.BookStackConfig;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * Interceptor to extract BookStack credentials from request headers.
 * This ensures credentials are only used for the current request and not stored.
 */
@Slf4j
@Component
public class CredentialsInterceptor implements HandlerInterceptor {

    private static final ThreadLocal<BookStackConfig> sourceConfigThreadLocal = new ThreadLocal<>();
    private static final ThreadLocal<BookStackConfig> destinationConfigThreadLocal = new ThreadLocal<>();

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Extract source credentials from headers
        String sourceUrl = request.getHeader("X-Source-Url");
        String sourceTokenId = request.getHeader("X-Source-Token-Id");
        String sourceTokenSecret = request.getHeader("X-Source-Token");

        // Extract destination credentials from headers
        String destinationUrl = request.getHeader("X-Destination-Url");
        String destinationTokenId = request.getHeader("X-Destination-Token-Id");
        String destinationTokenSecret = request.getHeader("X-Destination-Token");

        // Set source credentials in thread-local if provided
        if (sourceUrl != null && sourceTokenId != null && sourceTokenSecret != null) {
            BookStackConfig sourceConfig = new BookStackConfig();
            sourceConfig.setBaseUrl(sourceUrl);
            sourceConfig.setTokenId(sourceTokenId);
            sourceConfig.setTokenSecret(sourceTokenSecret);
            sourceConfigThreadLocal.set(sourceConfig);
            log.debug("Source credentials set from request headers");
        }

        // Set destination credentials in thread-local if provided
        if (destinationUrl != null && destinationTokenId != null && destinationTokenSecret != null) {
            BookStackConfig destinationConfig = new BookStackConfig();
            destinationConfig.setBaseUrl(destinationUrl);
            destinationConfig.setTokenId(destinationTokenId);
            destinationConfig.setTokenSecret(destinationTokenSecret);
            destinationConfigThreadLocal.set(destinationConfig);
            log.debug("Destination credentials set from request headers");
        }

        return true;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        // Clean up thread-local variables after request is complete
        sourceConfigThreadLocal.remove();
        destinationConfigThreadLocal.remove();
        log.debug("Credentials cleared from thread-local");
    }

    /**
     * Get source configuration from thread-local.
     * @return The source configuration or null if not set
     */
    public static BookStackConfig getSourceConfig() {
        return sourceConfigThreadLocal.get();
    }

    /**
     * Get destination configuration from thread-local.
     * @return The destination configuration or null if not set
     */
    public static BookStackConfig getDestinationConfig() {
        return destinationConfigThreadLocal.get();
    }
} 