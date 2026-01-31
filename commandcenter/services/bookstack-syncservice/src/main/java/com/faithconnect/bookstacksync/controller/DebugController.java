package com.faithconnect.bookstacksync.controller;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

@Slf4j
@RestController
@RequestMapping("/api/debug")
@RequiredArgsConstructor
public class DebugController {

    private final RestTemplate restTemplate;

    @GetMapping("/raw-books")
    public ResponseEntity<String> getRawBooks() {
        try {
            // Create headers with authentication
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("Authorization", "Token OxVMBtvyO1Nywgh65rGNWvsJmzuSZu9C:YWJzdwN9AQYlaCBtlSQMXHux8vRsHq2o");
            
            // Create request entity
            org.springframework.http.HttpEntity<Void> requestEntity = new org.springframework.http.HttpEntity<>(headers);
            
            // Make the request and return the raw response
            ResponseEntity<String> response = restTemplate.exchange(
                    "https://read.faithconnect.us/api/books",
                    org.springframework.http.HttpMethod.GET,
                    requestEntity,
                    String.class
            );
            
            log.info("Raw API response: {}", response.getBody());
            return response;
        } catch (Exception e) {
            log.error("Error fetching raw books data: {}", e.getMessage(), e);
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }
} 