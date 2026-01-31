package com.faithconnect.bookstacksync.controller;

import com.faithconnect.bookstacksync.model.*;
import com.faithconnect.bookstacksync.service.BookStackApiService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for Page-related operations.
 * Provides endpoints for managing pages in the BookStack system.
 */
@Slf4j
@RestController
@RequestMapping("/api/pages")
@RequiredArgsConstructor
@Validated
public class PageController {

    private final BookStackApiService bookStackApiService;

    /**
     * Get a page by ID.
     *
     * @param id The ID of the page to retrieve
     * @return The page with the specified ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Page> getPage(@PathVariable Long id) {
        log.debug("Getting page with ID: {}", id);
        try {
            Page page = bookStackApiService.getPage(id);
            return ResponseEntity.ok(page);
        } catch (Exception e) {
            log.error("Error getting page with ID {}: {}", id, e.getMessage(), e);
            throw new PageApiException("Failed to get page with ID " + id, e);
        }
    }

    /**
     * Create a new page.
     * 
     * The ID of a parent book or chapter is required to indicate where this page should be located.
     * 
     * Any HTML content provided should be kept to a single-block depth of plain HTML elements to remain
     * compatible with the BookStack front-end and editors. Any images included via base64 data URIs
     * will be extracted and saved as gallery images against the page during upload.
     *
     * @param request The page creation request
     * @return The created page
     */
    @PostMapping
    public ResponseEntity<Page> createPage(@Valid @RequestBody CreatePageRequest request) {
        log.debug("Creating new page: {}", request.getName());
        try {
            // Convert DTO to Page entity
            Page page = new Page();
            page.setBookId(request.getBookId());
            page.setChapterId(request.getChapterId());
            page.setName(request.getName());
            page.setHtml(request.getHtml());
            page.setMarkdown(request.getMarkdown());
            page.setPriority(request.getPriority());
            page.setIsDraft(request.getIsDraft());
            page.setIsTemplate(request.getIsTemplate());
            
            // Convert tags if provided
            if (request.getTags() != null && !request.getTags().isEmpty()) {
                List<Tag> tags = request.getTags().stream()
                        .map(tagDto -> {
                            Tag tag = new Tag();
                            tag.setName(tagDto.getName());
                            tag.setValue(tagDto.getValue());
                            tag.setOrder(tagDto.getOrder());
                            return tag;
                        })
                        .collect(Collectors.toList());
                page.setTags(tags);
            }
            
            Page createdPage = bookStackApiService.createPage(page);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdPage);
        } catch (Exception e) {
            log.error("Error creating page: {}", e.getMessage(), e);
            throw new PageApiException("Failed to create page", e);
        }
    }

    /**
     * Update an existing page.
     *
     * @param id The ID of the page to update
     * @param request The page update request
     * @return The updated page
     */
    @PutMapping("/{id}")
    public ResponseEntity<Page> updatePage(@PathVariable Long id, @Valid @RequestBody UpdatePageRequest request) {
        log.debug("Updating page with ID: {}", id);
        try {
            // Get the existing page
            Page existingPage = bookStackApiService.getPage(id);
            
            // Update fields if provided
            if (request.getName() != null) {
                existingPage.setName(request.getName());
            }
            
            if (request.getBookId() != null) {
                existingPage.setBookId(request.getBookId());
            }
            
            if (request.getChapterId() != null) {
                existingPage.setChapterId(request.getChapterId());
            }
            
            if (request.getHtml() != null) {
                existingPage.setHtml(request.getHtml());
            }
            
            if (request.getMarkdown() != null) {
                existingPage.setMarkdown(request.getMarkdown());
            }
            
            if (request.getPriority() != null) {
                existingPage.setPriority(request.getPriority());
            }
            
            if (request.getIsDraft() != null) {
                existingPage.setIsDraft(request.getIsDraft());
            }
            
            if (request.getIsTemplate() != null) {
                existingPage.setIsTemplate(request.getIsTemplate());
            }
            
            // Update tags if provided
            if (request.getTags() != null) {
                List<Tag> tags = request.getTags().stream()
                        .map(tagDto -> {
                            Tag tag = new Tag();
                            tag.setName(tagDto.getName());
                            tag.setValue(tagDto.getValue());
                            tag.setOrder(tagDto.getOrder());
                            return tag;
                        })
                        .collect(Collectors.toList());
                existingPage.setTags(tags);
            }
            
            Page updatedPage = bookStackApiService.updatePage(id, existingPage);
            return ResponseEntity.ok(updatedPage);
        } catch (Exception e) {
            log.error("Error updating page with ID {}: {}", id, e.getMessage(), e);
            throw new PageApiException("Failed to update page with ID " + id, e);
        }
    }

    /**
     * Delete a page.
     *
     * @param id The ID of the page to delete
     * @return A success message
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deletePage(@PathVariable Long id) {
        log.debug("Deleting page with ID: {}", id);
        try {
            boolean deleted = bookStackApiService.deletePage(id);
            
            Map<String, String> response = new HashMap<>();
            if (deleted) {
                response.put("status", "success");
                response.put("message", "Page deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "error");
                response.put("message", "Failed to delete page");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
        } catch (Exception e) {
            log.error("Error deleting page with ID {}: {}", id, e.getMessage(), e);
            throw new PageApiException("Failed to delete page with ID " + id, e);
        }
    }

    /**
     * Export a page as PDF.
     *
     * @param id The ID of the page to export
     * @return The PDF content
     */
    @GetMapping("/{id}/export/pdf")
    public ResponseEntity<byte[]> exportPageAsPdf(@PathVariable Long id) {
        log.debug("Exporting page with ID {} as PDF", id);
        try {
            byte[] pdfContent = bookStackApiService.exportPageAsPdf(id);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.setContentDispositionFormData("attachment", "page-" + id + ".pdf");
            
            return new ResponseEntity<>(pdfContent, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error exporting page with ID {} as PDF: {}", id, e.getMessage(), e);
            throw new PageApiException("Failed to export page with ID " + id + " as PDF", e);
        }
    }

    /**
     * Export a page as HTML.
     *
     * @param id The ID of the page to export
     * @return The HTML content
     */
    @GetMapping("/{id}/export/html")
    public ResponseEntity<String> exportPageAsHtml(@PathVariable Long id) {
        log.debug("Exporting page with ID {} as HTML", id);
        try {
            String htmlContent = bookStackApiService.exportPageAsHtml(id);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_HTML);
            
            return new ResponseEntity<>(htmlContent, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error exporting page with ID {} as HTML: {}", id, e.getMessage(), e);
            throw new PageApiException("Failed to export page with ID " + id + " as HTML", e);
        }
    }

    /**
     * Export a page as plain text.
     *
     * @param id The ID of the page to export
     * @return The plain text content
     */
    @GetMapping("/{id}/export/text")
    public ResponseEntity<String> exportPageAsText(@PathVariable Long id) {
        log.debug("Exporting page with ID {} as text", id);
        try {
            String textContent = bookStackApiService.exportPageAsText(id);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_PLAIN);
            
            return new ResponseEntity<>(textContent, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error exporting page with ID {} as text: {}", id, e.getMessage(), e);
            throw new PageApiException("Failed to export page with ID " + id + " as text", e);
        }
    }

    /**
     * Export a page as Markdown.
     *
     * @param id The ID of the page to export
     * @return The Markdown content
     */
    @GetMapping("/{id}/export/markdown")
    public ResponseEntity<String> exportPageAsMarkdown(@PathVariable Long id) {
        log.debug("Exporting page with ID {} as Markdown", id);
        try {
            String markdownContent = bookStackApiService.exportPageAsMarkdown(id);
            
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.TEXT_MARKDOWN);
            
            return new ResponseEntity<>(markdownContent, headers, HttpStatus.OK);
        } catch (Exception e) {
            log.error("Error exporting page with ID {} as Markdown: {}", id, e.getMessage(), e);
            throw new PageApiException("Failed to export page with ID " + id + " as Markdown", e);
        }
    }

    /**
     * Exception for Page API errors.
     */
    public static class PageApiException extends RuntimeException {
        public PageApiException(String message) {
            super(message);
        }

        public PageApiException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}
