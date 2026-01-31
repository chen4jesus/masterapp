package com.faithconnect.bookstacksync.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.Size;
import java.util.List;

/**
 * Request DTO for updating an existing book in BookStack.
 */
@Data
public class UpdateBookRequest {
    
    /**
     * The name of the book.
     * Optional, maximum length 255 characters.
     */
    @Size(max = 255, message = "Name must be less than 255 characters")
    private String name;
    
    /**
     * The description of the book.
     * Optional.
     */
    private String description;
    
    /**
     * The ID of the user who owns the book.
     * Optional.
     */
    @JsonProperty("owned_by")
    private Long ownedBy;
    
    /**
     * The ID of the default template for pages in this book.
     * Optional.
     */
    @JsonProperty("default_template_id")
    private Long defaultTemplateId;
    
    /**
     * Tags to associate with the book.
     * Optional. If provided, will replace all existing tags.
     */
    private List<BookTag> tags;
    
    /**
     * Represents a tag to be associated with a book.
     */
    @Data
    public static class BookTag {
        /**
         * The name of the tag.
         * Required if tags are provided.
         */
        private String name;
        
        /**
         * The value of the tag.
         * Required if tags are provided.
         */
        private String value;
        
        /**
         * The order of the tag.
         * Optional, defaults to 0.
         */
        private Integer order = 0;
    }
} 