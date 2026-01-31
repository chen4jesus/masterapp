package com.faithconnect.bookstacksync.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/**
 * Represents a tag associated with a book.
 */
@Data
public class Tag {
    @JsonProperty("name")
    private String name;
    @JsonProperty("value")
    private String value;
    @JsonProperty("order")
    private Integer order;
}