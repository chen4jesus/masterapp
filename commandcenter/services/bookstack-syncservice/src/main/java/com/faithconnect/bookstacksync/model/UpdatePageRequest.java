package com.faithconnect.bookstacksync.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

import javax.validation.constraints.Size;
import java.util.List;

/**
 * Request DTO for updating an existing page in BookStack.
 * 
 * Any HTML content provided should be kept to a single-block depth of plain HTML elements to remain
 * compatible with the BookStack front-end and editors. Any images included via base64 data URIs
 * will be extracted and saved as gallery images against the page during upload.
 */
@Data
public class UpdatePageRequest {
    
    /**
     * The ID of the book where this page should be located.
     * Optional. If provided, will move the page to this book.
     */
    @JsonProperty("book_id")
    private Long bookId;
    
    /**
     * The ID of the chapter where this page should be located.
     * Optional. If provided, will move the page to this chapter.
     */
    @JsonProperty("chapter_id")
    private Long chapterId;
    
    /**
     * The name of the page.
     * Optional, maximum length 255 characters.
     */
    @Size(max = 255, message = "Name must be less than 255 characters")
    private String name;
    
    /**
     * The HTML content of the page.
     * Optional. If provided, will replace the current HTML content.
     * Should be kept to a single-block depth of plain HTML elements.
     * Any images included via base64 data URIs will be extracted and saved as gallery images.
     */
    private String html;
    
    /**
     * The Markdown content of the page.
     * Optional. If provided, will replace the current Markdown content.
     */
    private String markdown;
    
    /**
     * Tags to associate with the page.
     * Optional. If provided, will replace all existing tags.
     */
    private List<PageTag> tags;
    
    /**
     * The priority of the page.
     * Optional. Determines the order of pages within a book or chapter.
     */
    private Integer priority;
    
    /**
     * Whether the page is a draft.
     * Optional.
     */
    @JsonProperty("draft")
    private Boolean isDraft;
    
    /**
     * Whether the page is a template.
     * Optional.
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