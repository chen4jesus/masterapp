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
import org.springframework.web.multipart.MultipartFile;

import javax.validation.Valid;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Controller for Book-related operations.
 * Provides endpoints for managing books in the BookStack system.
 */
@Slf4j
@RestController
@RequestMapping("/api/books")
@RequiredArgsConstructor
@Validated
public class BookController {

    private final BookStackApiService bookStackApiService;

    /**
     * List all books.
     *
     * @return A list of all books
     */
    @GetMapping
    public ResponseEntity<List<Book>> listBooks() {
        log.debug("Listing all books");
        try {
            List<Book> books = bookStackApiService.listBooks();
            return ResponseEntity.ok(books);
        } catch (Exception e) {
            log.error("Error listing books: {}", e.getMessage(), e);
            throw new BookStackApiException("Failed to list books", e);
        }
    }

    /**
     * Get a book by ID.
     *
     * @param id The ID of the book to retrieve
     * @return The book with the specified ID
     */
    @GetMapping("/{id}")
    public ResponseEntity<Book> getBook(@PathVariable Long id) {
        log.debug("Getting book with ID: {}", id);
        try {
            Book book = bookStackApiService.getBook(id);
            return ResponseEntity.ok(book);
        } catch (Exception e) {
            log.error("Error getting book with ID {}: {}", id, e.getMessage(), e);
            throw new BookStackApiException("Failed to get book with ID " + id, e);
        }
    }

    /**
     * Create a new book.
     *
     * @param request The book creation request
     * @return The created book
     */
    @PostMapping
    public ResponseEntity<Book> createBook(@Valid @RequestBody CreateBookRequest request) {
        log.debug("Creating new book: {}", request.getName());
        try {
            // Convert DTO to Book entity
            Book book = new Book();
            book.setName(request.getName());
            book.setDescription(request.getDescription());
            book.setDefaultTemplateId(request.getDefaultTemplateId());
            
            // Set owner if provided
            if (request.getOwnedBy() != null) {
                Book.User owner = new Book.User();
                owner.setId(request.getOwnedBy());
                book.setOwnedBy(owner);
            }
            
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
                book.setTags(tags);
            }
            
            Book createdBook = bookStackApiService.createBook(book);
            return ResponseEntity.status(HttpStatus.CREATED).body(createdBook);
        } catch (Exception e) {
            log.error("Error creating book: {}", e.getMessage(), e);
            throw new BookStackApiException("Failed to create book", e);
        }
    }

    /**
     * Update an existing book.
     *
     * @param id The ID of the book to update
     * @param request The book update request
     * @return The updated book
     */
    @PutMapping("/{id}")
    public ResponseEntity<Book> updateBook(@PathVariable Long id, @Valid @RequestBody UpdateBookRequest request) {
        log.debug("Updating book with ID: {}", id);
        try {
            // Get the existing book
            Book existingBook = bookStackApiService.getBook(id);
            
            // Update fields if provided
            if (request.getName() != null) {
                existingBook.setName(request.getName());
            }
            
            if (request.getDescription() != null) {
                existingBook.setDescription(request.getDescription());
            }
            
            if (request.getDefaultTemplateId() != null) {
                existingBook.setDefaultTemplateId(request.getDefaultTemplateId());
            }
            
            // Update owner if provided
            if (request.getOwnedBy() != null) {
                Book.User owner = new Book.User();
                owner.setId(request.getOwnedBy());
                existingBook.setOwnedBy(owner);
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
                existingBook.setTags(tags);
            }
            
            Book updatedBook = bookStackApiService.updateBook(id, existingBook);
            return ResponseEntity.ok(updatedBook);
        } catch (Exception e) {
            log.error("Error updating book with ID {}: {}", id, e.getMessage(), e);
            throw new BookStackApiException("Failed to update book with ID " + id, e);
        }
    }

    /**
     * Delete a book.
     *
     * @param id The ID of the book to delete
     * @return A success message
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteBook(@PathVariable Long id) {
        log.debug("Deleting book with ID: {}", id);
        try {
            boolean deleted = bookStackApiService.deleteBook(id);
            
            Map<String, String> response = new HashMap<>();
            if (deleted) {
                response.put("status", "success");
                response.put("message", "Book deleted successfully");
                return ResponseEntity.ok(response);
            } else {
                response.put("status", "error");
                response.put("message", "Failed to delete book");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }
        } catch (Exception e) {
            log.error("Error deleting book with ID {}: {}", id, e.getMessage(), e);
            throw new BookStackApiException("Failed to delete book with ID " + id, e);
        }
    }

    /**
     * List all chapters in a book.
     *
     * @param bookId The ID of the book
     * @return A list of chapters in the book
     */
    @GetMapping("/{bookId}/chapters")
    public ResponseEntity<List<Chapter>> listChapters(@PathVariable Long bookId) {
        log.debug("Listing chapters for book with ID: {}", bookId);
        try {
            List<Chapter> chapters = bookStackApiService.listChapters(bookId);
            return ResponseEntity.ok(chapters);
        } catch (Exception e) {
            log.error("Error listing chapters for book with ID {}: {}", bookId, e.getMessage(), e);
            throw new BookStackApiException("Failed to list chapters for book with ID " + bookId, e);
        }
    }

    /**
     * List all pages in a book.
     *
     * @param bookId The ID of the book
     * @return A list of pages in the book
     */
    @GetMapping("/{bookId}/pages")
    public ResponseEntity<List<Page>> listPages(@PathVariable Long bookId) {
        log.debug("Listing pages for book with ID: {}", bookId);
        try {
            List<Page> pages = bookStackApiService.listPages(bookId);
            return ResponseEntity.ok(pages);
        } catch (Exception e) {
            log.error("Error listing pages for book with ID {}: {}", bookId, e.getMessage(), e);
            throw new BookStackApiException("Failed to list pages for book with ID " + bookId, e);
        }
    }

    /**
     * Sync a book from the source to the destination.
     *
     * @param id The ID of the book to sync
     * @return A success message
     */
    @PostMapping("/{id}/sync")
    public ResponseEntity<Map<String, String>> syncBook(@PathVariable Long id) {
        log.debug("Syncing book with ID: {}", id);
        try {
            bookStackApiService.syncBook(id);
            Map<String, String> response = new HashMap<>();
            response.put("status", "success");
            response.put("message", "Book sync completed successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error syncing book with ID {}: {}", id, e.getMessage(), e);
            throw new BookStackApiException("Failed to sync book with ID " + id, e);
        }
    }


    /**
     * Export a book from source system and import it directly to destination system.
     * 
     * This is a streamlined operation that combines export and import in one step.
     * It exports the book from the source system as ZIP and immediately imports it 
     * to the destination system, handling all the intermediate steps automatically.
     *
     * @param id The ID of the book in the source system to export and import
     * @return The imported book in the destination system
     */
    @PostMapping("/{id}/export-import")
    public ResponseEntity<Book> exportAndImportBook(@PathVariable Long id) {
        log.info("|Start|Exporting and importing book with ID: {}", id);
        try {
            Book importedBook = bookStackApiService.exportAndImportBook(id);
            log.info("| End |Exporting and importing book with ID: {}", id);
            return ResponseEntity.status(HttpStatus.CREATED).body(importedBook);
        } catch (Exception e) {
            log.error("Error exporting and importing book with ID {}: {}", id, e.getMessage(), e);
            throw new BookStackApiException("Failed to export and import book with ID " + id, e);
        }
    }

    /**
     * Exception for Book API errors.
     */
    public static class BookStackApiException extends RuntimeException {
        public BookStackApiException(String message) {
            super(message);
        }

        public BookStackApiException(String message, Throwable cause) {
            super(message, cause);
        }
    }
} 