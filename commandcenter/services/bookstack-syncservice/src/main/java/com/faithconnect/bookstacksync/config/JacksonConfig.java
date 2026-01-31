package com.faithconnect.bookstacksync.config;

import com.faithconnect.bookstacksync.model.Book;
import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.module.SimpleModule;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.converter.json.Jackson2ObjectMapperBuilder;

import java.io.IOException;

@Configuration
public class JacksonConfig {

    @Bean
    public ObjectMapper objectMapper(Jackson2ObjectMapperBuilder builder) {
        ObjectMapper objectMapper = builder.build();
        SimpleModule module = new SimpleModule();
        module.addDeserializer(Book.User.class, new UserDeserializer());
        objectMapper.registerModule(module);
        return objectMapper;
    }

    /**
     * Custom deserializer for Book.User that can handle both object and numeric values
     */
    public static class UserDeserializer extends JsonDeserializer<Book.User> {
        @Override
        public Book.User deserialize(JsonParser p, DeserializationContext ctxt) throws IOException, JsonProcessingException {
            JsonNode node = p.getCodec().readTree(p);
            Book.User user = new Book.User();

            if (node.isObject()) {
                // Handle object format
                if (node.has("id")) {
                    user.setId(node.get("id").asLong());
                }
                if (node.has("name")) {
                    user.setName(node.get("name").asText());
                }
                if (node.has("slug")) {
                    user.setSlug(node.get("slug").asText());
                }
            } else if (node.isNumber()) {
                // Handle numeric format
                user.setId(node.asLong());
            }

            return user;
        }
    }
} 