package com.faithconnect.bookstacksync.controller;

import com.faithconnect.bookstacksync.model.Book;
import com.faithconnect.bookstacksync.service.BookStackApiService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/sync")
public class BookStackSyncController {

    private final BookStackApiService bookStackApiService;
    private final RestTemplate restTemplate;

    @Autowired
    public BookStackSyncController(RestTemplate restTemplate, BookStackApiService bookStackApiService) {
        this.bookStackApiService = bookStackApiService;
        this.restTemplate = restTemplate;
    }

    @GetMapping("/books")
    public ResponseEntity<List<Book>> listBooks() {
        try {
            return ResponseEntity.ok(bookStackApiService.listBooks());
        } catch (Exception e) {
            log.error("Error listing books: {}", e.getMessage(), e);
            throw new BookStackApiException("Failed to list books", e);
        }
    }

    @GetMapping("/destination/books")
    public ResponseEntity<List<Book>> listDestinationBooks() {
        try {
            return ResponseEntity.ok(bookStackApiService.listDestinationBooks());
        } catch (Exception e) {
            log.error("Error listing books: {}", e.getMessage(), e);
            throw new BookStackApiException("Failed to list books", e);
        }
    }

    @GetMapping("/books/{id}")
    public ResponseEntity<Book> getBook(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(bookStackApiService.getBook(id));
        } catch (Exception e) {
            log.error("Error getting book with ID {}: {}", id, e.getMessage(), e);
            throw new BookStackApiException("Failed to get book with ID " + id, e);
        }
    }

    @PostMapping("/books/{id}")
    public ResponseEntity<Map<String, String>> syncBook(@PathVariable Long id) {
        try {
            bookStackApiService.syncBook(id);
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Book sync completed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error syncing book with ID {}: {}", id, e.getMessage(), e);
            throw new BookStackApiException("Failed to sync book with ID " + id + ", Reason: " + e.getMessage(), e);
        }
    }

    @DeleteMapping("/destination/books/{id}")
    public ResponseEntity<Map<String, String>> deleteBook(@PathVariable Long id) {
        try {
            bookStackApiService.deleteBook(id);

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Book deletion completed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting book with ID {}: {}", id, e.getMessage(), e);
            throw new BookStackApiException("Failed to delete book with ID " + id + ", Reason: " + e.getMessage(), e);
        }
    }

    @DeleteMapping("/destroy")
    public ResponseEntity<Map<String, String>> bulkDestroy() {
        try {
            bookStackApiService.destroy();

            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Bulk destroy completed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error deleting book with ID: {}", e.getMessage(), e);
            throw new BookStackApiException("Failed to destroy the resources, Reason: " + e.getMessage(), e);
        }
    }

    @GetMapping("/verify")
    public ResponseEntity<Map<String, Boolean>> verifyCredentials() {
        try {
            boolean sourceValid = bookStackApiService.verifyCredentials();
            
            // Verify destination credentials if they are provided
            boolean destinationValid = false;
            try {
                destinationValid = bookStackApiService.verifyDestinationCredentials();
            } catch (Exception e) {
                log.warn("Error verifying destination credentials: {}", e.getMessage());
                // We don't throw an exception here, just mark as invalid
            }
            
            Map<String, Boolean> response = new HashMap<>();
            response.put("sourceCredentialsValid", sourceValid);
            response.put("destinationCredentialsValid", destinationValid);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error verifying credentials: {}", e.getMessage(), e);
            throw new BookStackApiException("Failed to verify credentials", e);
        }
    }

    @ExceptionHandler(BookStackApiException.class)
    public ResponseEntity<Map<String, String>> handleBookStackApiException(BookStackApiException e) {
        Map<String, String> response = new HashMap<>();
        response.put("status", "error");
        response.put("message", e.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    public static class BookStackApiException extends RuntimeException {
        public BookStackApiException(String message) {
            super(message);
        }

        public BookStackApiException(String message, Throwable cause) {
            super(message, cause);
        }
    }
} 