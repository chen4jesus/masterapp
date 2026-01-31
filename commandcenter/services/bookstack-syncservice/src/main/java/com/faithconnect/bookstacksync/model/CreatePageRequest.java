package com.faithconnect.bookstacksync.model;

import com.faithconnect.bookstacksync.model.validation.RequireOneOf;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Size;
import java.util.List;

/**
 * Request DTO for creating a new page in BookStack.
 * 
 * The ID of a parent book or chapter is required to indicate where this page should be located.
 * 
 * Any HTML content provided should be kept to a single-block depth of plain HTML elements to remain
 * compatible with the BookStack front-end and editors. Any images included via base64 data URIs
 * will be extracted and saved as gallery images against the page during upload.
 */
@Data
@RequireOneOf(fields = {"bookId", "chapterId"}, fieldGroup = "parent identifiers", 
              message = "Either book_id or chapter_id must be provided")
@RequireOneOf(fields = {"html", "markdown"}, fieldGroup = "content fields", 
              message = "Either html or markdown content must be provided")
public class CreatePageRequest {
    
    /**
     * The ID of the book where this page should be located.
     * Required if chapter_id is not provided.
     */
    @JsonProperty("book_id")
    private Long bookId;
    
    /**
     * The ID of the chapter where this page should be located.
     * Required if book_id is not provided.
     */
    @JsonProperty("chapter_id")
    private Long chapterId;
    
    /**
     * The name of the page.
     * Required, maximum length 255 characters.
     */
    @NotBlank(message = "Name is required")
    @Size(max = 255, message = "Name must be less than 255 characters")
    private String name;
    
    /**
     * The HTML content of the page.
     * Required if markdown is not provided.
     * Should be kept to a single-block depth of plain HTML elements.
     * Any images included via base64 data URIs will be extracted and saved as gallery images.
     */
    private String html;
    
    /**
     * The Markdown content of the page.
     * Required if html is not provided.
     */
    private String markdown;
    
    /**
     * Tags to associate with the page.
     * Optional.
     */
    private List<PageTag> tags;
    
    /**
     * The priority of the page.
     * Optional. Determines the order of pages within a book or chapter.
     */
    private Integer priority;
    
    /**
     * Whether the page is a draft.
     * Optional, defaults to false.
     */
    @JsonProperty("draft")
    private Boolean isDraft;
    
    /**
     * Whether the page is a template.
     * Optional, defaults to false.
     */
    @JsonProperty("template")
    private Boolean isTemplate;
    
    /**
     * Represents a tag to be associated with a page.
     */
    @Data
    public static class PageTag {
        /**
         * The name of the tag.
         * Required.
         */
        @NotBlank(message = "Tag name is required")
        private String name;
        
        /**
         * The value of the tag.
         * Required.
         */
        @NotBlank(message = "Tag value is required")
        private String value;
        
        /**
         * The order of the tag.
         * Optional, defaults to 0.
         */
        private Integer order = 0;
    }
} 