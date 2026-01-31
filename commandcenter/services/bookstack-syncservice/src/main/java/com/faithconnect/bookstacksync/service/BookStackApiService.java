package com.faithconnect.bookstacksync.service;

import com.faithconnect.bookstacksync.model.Book;
import com.faithconnect.bookstacksync.model.Chapter;
import com.faithconnect.bookstacksync.model.Page;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Service interface for interacting with the BookStack API.
 */
public interface BookStackApiService {

    // Book operations
    /**
     * List all books.
     *
     * @return A list of all books
     */
    List<Book> listBooks();

    List<Book> listDestinationBooks();

    /**
     * Get a book by ID.
     *
     * @param id The ID of the book to retrieve
     * @return The book with the specified ID
     */
    Book getBook(Long id);
    
    /**
     * Create a new book.
     *
     * @param book The book to create
     * @return The created book
     */
    Book createBook(Book book);
    
    /**
     * Update an existing book.
     *
     * @param id The ID of the book to update
     * @param book The updated book data
     * @return The updated book
     */
    Book updateBook(Long id, Book book);
    
    /**
     * Delete a book.
     *
     * @param id The ID of the book to delete
     * @return true if the book was deleted successfully, false otherwise
     */
    boolean deleteBook(Long id);

    boolean destroy();

    // Chapter operations
    /**
     * List all chapters in a book.
     *
     * @param bookId The ID of the book
     * @return A list of chapters in the book
     */
    List<Chapter> listChapters(Long bookId);
    
    /**
     * Get a chapter by ID.
     *
     * @param id The ID of the chapter to retrieve
     * @return The chapter with the specified ID
     */
    Chapter getChapter(Long id);
    
    /**
     * Create a new chapter.
     *
     * @param chapter The chapter to create
     * @return The created chapter
     */
    Chapter createChapter(Chapter chapter);
    
    // Page operations
    /**
     * List all pages in a book.
     *
     * @param bookId The ID of the book
     * @return A list of pages in the book
     */
    List<Page> listPages(Long bookId);
    
    /**
     * List all pages in a chapter.
     *
     * @param chapterId The ID of the chapter
     * @return A list of pages in the chapter
     */
    List<Page> listChapterPages(Long chapterId);
    
    /**
     * Get a page by ID.
     *
     * @param id The ID of the page to retrieve
     * @return The page with the specified ID
     */
    Page getPage(Long id);
    
    /**
     * Create a new page.
     *
     * @param page The page to create
     * @return The created page
     */
    Page createPage(Page page);
    
    /**
     * Update an existing page.
     *
     * @param id The ID of the page to update
     * @param page The updated page data
     * @return The updated page
     */
    Page updatePage(Long id, Page page);
    
    /**
     * Delete a page.
     *
     * @param id The ID of the page to delete
     * @return true if the page was deleted successfully, false otherwise
     */
    boolean deletePage(Long id);
    
    /**
     * Export a page as PDF.
     *
     * @param id The ID of the page to export
     * @return The PDF content as a byte array
     */
    byte[] exportPageAsPdf(Long id);
    
    /**
     * Export a page as HTML.
     *
     * @param id The ID of the page to export
     * @return The HTML content as a string
     */
    String exportPageAsHtml(Long id);
    
    /**
     * Export a page as plain text.
     *
     * @param id The ID of the page to export
     * @return The plain text content as a string
     */
    String exportPageAsText(Long id);
    
    /**
     * Export a page as Markdown.
     *
     * @param id The ID of the page to export
     * @return The Markdown content as a string
     */
    String exportPageAsMarkdown(Long id);

    // Verification
    /**
     * Verify that the source API credentials are valid.
     *
     * @return true if the credentials are valid, false otherwise
     */
    boolean verifyCredentials();
    
    /**
     * Verify that the destination API credentials are valid.
     *
     * @return true if the credentials are valid, false otherwise
     */
    boolean verifyDestinationCredentials();
    
    // Sync operation
    /**
     * Sync a book from the source to the destination.
     *
     * @param sourceBookId The ID of the book to sync
     */
    void syncBook(Long sourceBookId);
    
    /**
     * Export a book from source system and import it directly to destination system.
     * This is a streamlined operation that combines export and import in one step.
     *
     * @param sourceBookId The ID of the book in the source system to export and import
     * @return The imported book in the destination system
     */
    Book exportAndImportBook(Long sourceBookId);
} 