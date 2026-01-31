package com.faithconnect.bookstacksync.config;

import com.faithconnect.bookstacksync.model.BookStackConfig;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class BookStackConfiguration {

    @Bean
    @ConfigurationProperties(prefix = "bookstack.source")
    public BookStackConfig sourceConfig() {
        return new BookStackConfig();
    }

    @Bean
    @ConfigurationProperties(prefix = "bookstack.destination")
    public BookStackConfig destinationConfig() {
        return new BookStackConfig();
    }
} 