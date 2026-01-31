package com.faithconnect.bookstacksync.service;

import com.faithconnect.bookstacksync.interceptor.CredentialsInterceptor;
import com.faithconnect.bookstacksync.model.*;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.core.io.FileSystemResource;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpStatusCodeException;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Collections;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
public class BookStackApiServiceImpl implements BookStackApiService {

    private final RestTemplate restTemplate;
    private final BookStackConfig defaultSourceConfig;
    private final BookStackConfig defaultDestinationConfig;

    public BookStackApiServiceImpl(RestTemplate restTemplate, BookStackConfig sourceConfig,
            BookStackConfig destinationConfig) {
        this.restTemplate = restTemplate;
        this.defaultSourceConfig = sourceConfig;
        this.defaultDestinationConfig = destinationConfig;
    }

    /**
     * Get the source configuration, prioritizing request headers over default
     * config
     */
    private BookStackConfig getSourceConfig() {
        BookStackConfig requestConfig = CredentialsInterceptor.getSourceConfig();
        BookStackConfig config = requestConfig != null ? requestConfig : defaultSourceConfig;

        if (config == null || config.getBaseUrl() == null || config.getBaseUrl().isEmpty()) {
            throw new BookStackApiException(
                    "Source configuration missing. Please provide X-Source-Url, X-Source-Token-Id, and X-Source-Token headers.");
        }
        return resolveConfigUrls(config);
    }

    /**
     * Get the destination configuration, prioritizing request headers over default
     * config
     */
    private BookStackConfig getDestinationConfig() {
        BookStackConfig requestConfig = CredentialsInterceptor.getDestinationConfig();
        BookStackConfig config = requestConfig != null ? requestConfig : defaultDestinationConfig;

        if (config == null || config.getBaseUrl() == null || config.getBaseUrl().isEmpty()) {
            throw new BookStackApiException(
                    "Destination configuration missing. Please provide X-Destination-Url, X-Destination-Token-Id, and X-Destination-Token headers.");
        }
        return resolveConfigUrls(config);
    }

    /**
     * Helper to resolve localhost URLs to host.docker.internal when running in
     * Docker
     */
    private BookStackConfig resolveConfigUrls(BookStackConfig config) {
        if (config.getBaseUrl() != null && config.getBaseUrl().contains("localhost")) {
            // Create a copy to avoid mutating the thread-local config unexpectedly
            BookStackConfig newConfig = new BookStackConfig();
            newConfig.setTokenId(config.getTokenId());
            newConfig.setTokenSecret(config.getTokenSecret());
            newConfig.setBaseUrl(config.getBaseUrl().replace("localhost", "host.docker.internal"));
            log.debug("Rewrote localhost URL to: {}", newConfig.getBaseUrl());
            return newConfig;
        }
        return config;
    }

    @Override
    public List<Book> listBooks() {
        try {
            BookStackConfig sourceConfig = getSourceConfig();
            log.debug("Listing books from {}", sourceConfig.getBaseUrl());
            HttpHeaders headers = createHeaders(sourceConfig);
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<ListResponse<Book>> response = restTemplate.exchange(
                    sourceConfig.getBaseUrl() + "/api/books",
                    HttpMethod.GET,
                    requestEntity,
                    new ParameterizedTypeReference<ListResponse<Book>>() {
                    });

            return Objects.requireNonNull(response.getBody()).getData();
        } catch (Exception e) {
            log.error("Error listing books: {}", e.getMessage(), e);
            throw new BookStackApiException("Failed to list books", e);
        }
    }

    @Override
    public List<Book> listDestinationBooks() {
        try {
            BookStackConfig destinationConfig = getDestinationConfig();
            log.debug("Listing books from {}", destinationConfig.getBaseUrl());
            HttpHeaders headers = createHeaders(destinationConfig);
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<ListResponse<Book>> response = restTemplate.exchange(
                    destinationConfig.getBaseUrl() + "/api/books",
                    HttpMethod.GET,
                    requestEntity,
                    new ParameterizedTypeReference<ListResponse<Book>>() {
                    });

            return Objects.requireNonNull(response.getBody()).getData();
        } catch (Exception e) {
            log.error("Error listing books: {}", e.getMessage(), e);
            throw new BookStackApiException("Failed to list books", e);
        }
    }

    @Override
    public Book getBook(Long id) {
        try {
            BookStackConfig sourceConfig = getSourceConfig();
            log.debug("Getting book with ID {} from {}", id, sourceConfig.getBaseUrl());
            HttpHeaders headers = createHeaders(sourceConfig);
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<Book> response = restTemplate.exchange(
                    sourceConfig.getBaseUrl() + "/api/books/" + id,
                    HttpMethod.GET,
                    requestEntity,
                    Book.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("Error getting book with ID {}: {}", id, e.getMessage(), e);
            throw new BookStackApiException("Failed to get book with ID " + id, e);
        }
    }

    @Override
    public Book createBook(Book book) {
        try {
            BookStackConfig destinationConfig = getDestinationConfig();
            log.debug("Creating book in {}", destinationConfig.getBaseUrl());

            // Create headers for the request
            HttpHeaders headers = createHeaders(destinationConfig);
            headers.setContentType(MediaType.MULTIPART_FORM_DATA); // Set Content-Type to multipart/form-data

            // Construct the MultiValueMap to hold form data
            MultiValueMap<String, Object> multipartRequest = new LinkedMultiValueMap<>();
            multipartRequest.add("name", book.getName()); // Add individual fields
            multipartRequest.add("description", book.getDescription()); // Add individual fields
            multipartRequest.add("description_html", book.getDescriptionHtml()); // Add individual fields

            if (book.getDefaultTemplateId() != null) {
                multipartRequest.add("default_template_id", book.getDefaultTemplateId());
            }

            // Add tags (if they are present)
            if (book.getTags() != null && !book.getTags().isEmpty()) {
                for (int i = 0; i < book.getTags().size(); i++) {
                    Tag tag = book.getTags().get(i);
                    multipartRequest.add("tags[" + i + "][name]", tag.getName());
                    multipartRequest.add("tags[" + i + "][value]", tag.getValue());
                    multipartRequest.add("tags[" + i + "][order]", tag.getOrder());
                }
            }

            // Add cover image (if available)
            if (book.getCover() != null && book.getCover().getUrl() != null) {
                try {
                    // Download the image directly using RestTemplate
                    ResponseEntity<byte[]> imageResponse = restTemplate.exchange(
                            book.getCover().getUrl(),
                            HttpMethod.GET,
                            null,
                            byte[].class);

                    if (imageResponse.getStatusCode().is2xxSuccessful() && imageResponse.getBody() != null) {
                        // Create a temporary file for the image
                        Path tempFile = Files.createTempFile("book_cover_", ".jpg");
                        Files.write(tempFile, imageResponse.getBody());

                        // Create a FileSystemResource from the temp file
                        FileSystemResource fileResource = new FileSystemResource(tempFile.toFile());

                        // Add the image to the request
                        multipartRequest.add("image", fileResource);

                        // Register the temp file for deletion when the JVM exits
                        tempFile.toFile().deleteOnExit();

                        log.debug("Added image to request: {}", book.getCover().getName());
                    } else {
                        log.warn("Failed to download image from URL: {}", book.getCover().getUrl());
                    }
                } catch (Exception e) {
                    log.error("Error processing image: {}", e.getMessage(), e);
                    // Continue without the image
                }
            }

            // Create an HttpEntity with the form data and headers
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(multipartRequest, headers);

            try {
                // Send the POST request
                ResponseEntity<Book> response = restTemplate.exchange(
                        destinationConfig.getBaseUrl() + "/api/books",
                        HttpMethod.POST,
                        requestEntity,
                        Book.class);

                return response.getBody(); // Return the created book
            } catch (HttpStatusCodeException e) {
                // Log the response body for better debugging
                log.error("API error response ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
                throw e;
            }

        } catch (Exception e) {
            log.error("Error creating book: {}", e.getMessage(), e);
            throw new BookStackApiException("Failed to create book", e);
        }
    }

    @Override
    public Book updateBook(Long id, Book book) {
        return null;
    }

    @Override
    public boolean deleteBook(Long id) {
        try {
            BookStackConfig destinationConfig = getDestinationConfig();
            log.debug("Deleting book with ID {} from {}", id, destinationConfig.getBaseUrl());
            HttpHeaders headers = createHeaders(destinationConfig);
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    destinationConfig.getBaseUrl() + "/api/books/" + id,
                    HttpMethod.DELETE,
                    requestEntity,
                    String.class);

            return response.hasBody();
        } catch (Exception e) {
            log.error("Error deleting book with ID {}: {}", id, e.getMessage(), e);
            throw new BookStackApiException("Failed to delete book with ID " + id, e);
        }
    }

    @Override
    public boolean destroy() {
        try {
            BookStackConfig destinationConfig = getDestinationConfig();
            log.debug("Destroying resources from {}", destinationConfig.getBaseUrl());
            HttpHeaders headers = createHeaders(destinationConfig);
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<String> response = restTemplate.exchange(
                    destinationConfig.getBaseUrl() + "/api/bulk-delete",
                    HttpMethod.POST,
                    requestEntity,
                    String.class);

            return response.hasBody();
        } catch (Exception e) {
            log.error("Error destroying the resources: {}", e.getMessage(), e);
            throw new BookStackApiException("Failed to destroy the resources ", e);
        }
    }

    @Override
    public List<Chapter> listChapters(Long bookId) {
        try {
            BookStackConfig sourceConfig = getSourceConfig();
            log.debug("Listing chapters for book ID {} from {}", bookId, sourceConfig.getBaseUrl());
            HttpHeaders headers = createHeaders(sourceConfig);
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<ListResponse<Chapter>> response = restTemplate.exchange(
                    sourceConfig.getBaseUrl() + "/api/books/" + bookId + "/chapters",
                    HttpMethod.GET,
                    requestEntity,
                    new ParameterizedTypeReference<ListResponse<Chapter>>() {
                    });

            return Objects.requireNonNull(response.getBody()).getData();
        } catch (Exception e) {
            log.error("Error listing chapters for book ID {}: {}", bookId, e.getMessage(), e);
            throw new BookStackApiException("Failed to list chapters for book ID " + bookId, e);
        }
    }

    @Override
    public Chapter getChapter(Long id) {
        try {
            BookStackConfig sourceConfig = getSourceConfig();
            log.debug("Getting chapter with ID {} from {}", id, sourceConfig.getBaseUrl());
            HttpHeaders headers = createHeaders(sourceConfig);
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<Chapter> response = restTemplate.exchange(
                    sourceConfig.getBaseUrl() + "/api/chapters/" + id,
                    HttpMethod.GET,
                    requestEntity,
                    Chapter.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("Error getting chapter with ID {}: {}", id, e.getMessage(), e);
            throw new BookStackApiException("Failed to get chapter with ID " + id, e);
        }
    }

    @Override
    public Chapter createChapter(Chapter chapter) {
        try {
            BookStackConfig destinationConfig = getDestinationConfig();
            log.debug("Creating chapter in {}", destinationConfig.getBaseUrl());

            // Create headers for the request
            HttpHeaders headers = createHeaders(destinationConfig);
            headers.setContentType(MediaType.MULTIPART_FORM_DATA); // Set Content-Type to multipart/form-data

            // Construct the MultiValueMap to hold form data
            MultiValueMap<String, Object> multipartRequest = new LinkedMultiValueMap<>();
            multipartRequest.add("book_id", chapter.getBookId()); // Add individual fields
            multipartRequest.add("name", chapter.getName()); // Add individual fields
            multipartRequest.add("description", chapter.getDescription()); // Add individual fields
            multipartRequest.add("description_html", chapter.getDescriptionHtml()); // Add individual fields

            if (chapter.getDefaultTemplateId() != null) {
                multipartRequest.add("default_template_id", chapter.getDefaultTemplateId());
            }

            // Add tags (if they are present)
            if (chapter.getTags() != null && !chapter.getTags().isEmpty()) {
                for (int i = 0; i < chapter.getTags().size(); i++) {
                    Tag tag = chapter.getTags().get(i);
                    multipartRequest.add("tags[" + i + "][name]", tag.getName());
                    multipartRequest.add("tags[" + i + "][value]", tag.getValue());
                    multipartRequest.add("tags[" + i + "][order]", tag.getOrder());
                }
            }

            // Create an HttpEntity with the form data and headers
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(multipartRequest, headers);

            try {
                // Send the POST request
                ResponseEntity<Chapter> response = restTemplate.exchange(
                        destinationConfig.getBaseUrl() + "/api/chapters",
                        HttpMethod.POST,
                        requestEntity,
                        Chapter.class);

                return response.getBody(); // Return the created chapter
            } catch (HttpStatusCodeException e) {
                // Log the response body for better debugging
                log.error("API error response ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
                throw e;
            }

        } catch (Exception e) {
            log.error("Error creating chapter: {}", e.getMessage(), e);
            throw new BookStackApiException("Failed to create chapter", e);
        }
    }

    @Override
    public List<Page> listPages(Long bookId) {
        try {
            BookStackConfig sourceConfig = getSourceConfig();
            log.debug("Listing pages for book ID {} from {}", bookId, sourceConfig.getBaseUrl());
            HttpHeaders headers = createHeaders(sourceConfig);
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<ListResponse<Page>> response = restTemplate.exchange(
                    sourceConfig.getBaseUrl() + "/api/books/" + bookId + "/pages",
                    HttpMethod.GET,
                    requestEntity,
                    new ParameterizedTypeReference<ListResponse<Page>>() {
                    });

            return Objects.requireNonNull(response.getBody()).getData();
        } catch (Exception e) {
            log.error("Error listing pages for book ID {}: {}", bookId, e.getMessage(), e);
            throw new BookStackApiException("Failed to list pages for book ID " + bookId, e);
        }
    }

    @Override
    public List<Page> listChapterPages(Long chapterId) {
        return List.of();
    }

    @Override
    public Page getPage(Long id) {
        try {
            BookStackConfig sourceConfig = getSourceConfig();
            log.debug("Getting page with ID {} from {}", id, sourceConfig.getBaseUrl());
            HttpHeaders headers = createHeaders(sourceConfig);
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<Page> response = restTemplate.exchange(
                    sourceConfig.getBaseUrl() + "/api/pages/" + id,
                    HttpMethod.GET,
                    requestEntity,
                    Page.class);

            return response.getBody();
        } catch (Exception e) {
            log.error("Error getting page with ID {}: {}", id, e.getMessage(), e);
            throw new BookStackApiException("Failed to get page with ID " + id, e);
        }
    }

    @Override
    public Page createPage(Page page) {
        try {
            BookStackConfig destinationConfig = getDestinationConfig();
            log.debug("Creating page in {}", destinationConfig.getBaseUrl());
            // Create headers for the request
            HttpHeaders headers = createHeaders(destinationConfig);
            headers.setContentType(MediaType.MULTIPART_FORM_DATA); // Set Content-Type to multipart/form-data

            // Construct the MultiValueMap to hold form data
            MultiValueMap<String, Object> multipartRequest = new LinkedMultiValueMap<>();
            multipartRequest.add("book_id", page.getBookId()); // Add individual fields
            multipartRequest.add("chapter_id", page.getChapterId()); // Add individual fields
            multipartRequest.add("name", page.getName()); // Add individual fields
            multipartRequest.add("html", page.getHtml()); // Add individual fields
            multipartRequest.add("markdown", page.getMarkdown()); // Add individual fields
            multipartRequest.add("priority", page.getPriority()); // Add individual fields

            // Add tags (if they are present)
            if (page.getTags() != null && !page.getTags().isEmpty()) {
                for (int i = 0; i < page.getTags().size(); i++) {
                    Tag tag = page.getTags().get(i);
                    multipartRequest.add("tags[" + i + "][name]", tag.getName());
                    multipartRequest.add("tags[" + i + "][value]", tag.getValue());
                    multipartRequest.add("tags[" + i + "][order]", tag.getOrder());
                }
            }

            // Create an HttpEntity with the form data and headers
            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(multipartRequest, headers);

            try {
                // Send the POST request
                ResponseEntity<Page> response = restTemplate.exchange(
                        destinationConfig.getBaseUrl() + "/api/pages",
                        HttpMethod.POST,
                        requestEntity,
                        Page.class);

                return response.getBody(); // Return the created chapter
            } catch (HttpStatusCodeException e) {
                // Log the response body for better debugging
                log.error("API error response ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
                throw e;
            }

        } catch (Exception e) {
            log.error("Error creating page: {}", e.getMessage(), e);
            throw new BookStackApiException("Failed to create page: " + e.getMessage(), e);
        }
    }

    @Override
    public Page updatePage(Long id, Page page) {
        return null;
    }

    @Override
    public boolean deletePage(Long id) {
        return false;
    }

    @Override
    public byte[] exportPageAsPdf(Long id) {
        return new byte[0];
    }

    @Override
    public String exportPageAsHtml(Long id) {
        return "";
    }

    @Override
    public String exportPageAsText(Long id) {
        return "";
    }

    @Override
    public String exportPageAsMarkdown(Long id) {
        return "";
    }

    @Override
    public boolean verifyCredentials() {
        try {
            log.debug("Verifying credentials for {}", getSourceConfig().getBaseUrl());
            listBooks();
            log.debug("Successfully verified credentials for {}", getSourceConfig().getBaseUrl());
            return true;
        } catch (Exception e) {
            log.error("Failed to verify credentials for {}: {}", getSourceConfig().getBaseUrl(), e.getMessage(), e);
            if (e instanceof HttpClientErrorException.Unauthorized) {
                throw new BookStackApiException("Invalid API credentials for " + getSourceConfig().getBaseUrl(), e);
            }
            throw new BookStackApiException("Failed to verify credentials for " + getSourceConfig().getBaseUrl(), e);
        }
    }

    @Override
    public boolean verifyDestinationCredentials() {
        try {
            log.debug("Verifying credentials for {}", getDestinationConfig().getBaseUrl());
            HttpHeaders headers = createHeaders(getDestinationConfig());
            HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

            ResponseEntity<ListResponse<Book>> response = restTemplate.exchange(
                    getDestinationConfig().getBaseUrl() + "/api/books",
                    HttpMethod.GET,
                    requestEntity,
                    new ParameterizedTypeReference<ListResponse<Book>>() {
                    });

            log.debug("Successfully verified credentials for {}", getDestinationConfig().getBaseUrl());
            return true;
        } catch (Exception e) {
            log.error("Failed to verify credentials for {}: {}", getDestinationConfig().getBaseUrl(), e.getMessage(),
                    e);
            if (e instanceof HttpClientErrorException.Unauthorized) {
                throw new BookStackApiException("Invalid API credentials for " + getDestinationConfig().getBaseUrl(),
                        e);
            }
            throw new BookStackApiException("Failed to verify credentials for " + getDestinationConfig().getBaseUrl(),
                    e);
        }
    }

    @Override
    public void syncBook(Long sourceBookId) {
        try {
            log.info("Starting book sync process...");

            // log.info("Verifying source credentials...");
            verifyCredentials();

            // log.info("Verifying destination credentials...");
            verifyDestinationCredentials();

            // Get the source book
            // log.info("Reading source book...");
            Book sourceBook = getBook(sourceBookId);

            // Create the book in the destination
            log.info("Creating book in destination... " + sourceBook.getName());
            Book destBook = createBook(createBookCopy(sourceBook));

            // Process chapters and pages
            for (Book.Content content : sourceBook.getContents()) {
                if ("chapter".equals(content.getType())) {
                    // Get the chapter from the source
                    Chapter chapter = getChapter(content.getId());

                    // Create the chapter in the destination
                    Chapter destChapter = createChapter(createChapterCopy(chapter, destBook.getId()));

                    // Process pages in this chapter
                    for (Book.PageSummary pageSummary : chapter.getPages()) {
                        // Get the page from the source
                        Page page = getPage(pageSummary.getId());

                        // Create the page in the destination
                        createPage(createPageCopy(page, destBook.getId(), destChapter.getId()));
                    }
                } else if ("page".equals(content.getType())) {
                    // Get the page from the source
                    Page page = getPage(content.getId());

                    // Create the page in the destination
                    createPage(createPageCopy(page, destBook.getId(), null));
                }
            }

            log.info("Book sync completed successfully");
        } catch (Exception e) {
            log.error("Error syncing book: {}", e.getMessage(), e);
            throw new BookStackApiException("Failed to sync book: " + e.getMessage(), e);
        }
    }

    @Override
    public Book exportAndImportBook(Long sourceBookId) {
        try {
            // First export the book as ZIP from source
            BookStackConfig sourceConfig = getSourceConfig();
            log.debug("Exporting book with ID {} as ZIP from {}", sourceBookId, sourceConfig.getBaseUrl());
            HttpHeaders exportHeaders = createHeaders(sourceConfig);
            HttpEntity<Void> exportRequestEntity = new HttpEntity<>(exportHeaders);

            ResponseEntity<byte[]> exportResponse = restTemplate.exchange(
                    sourceConfig.getBaseUrl() + "/api/books/" + sourceBookId + "/export/zip",
                    HttpMethod.GET,
                    exportRequestEntity,
                    byte[].class);

            Book sourceBook = getBook(sourceBookId);

            // Create a temporary file from the exported ZIP data
            Path tempFile = Files.createTempFile("book_export_", ".zip");
            Files.write(tempFile, exportResponse.getBody());

            // Register the temporary file for deletion when the JVM exits
            tempFile.toFile().deleteOnExit();

            // Now import the ZIP file to destination
            BookStackConfig destinationConfig = getDestinationConfig();
            log.debug("Importing book from ZIP file to {}", destinationConfig.getBaseUrl());

            HttpHeaders importHeaders = createHeaders(destinationConfig);
            importHeaders.setContentType(MediaType.MULTIPART_FORM_DATA);

            FileSystemResource fileResource = new FileSystemResource(tempFile.toFile());

            MultiValueMap<String, Object> multipartRequest = new LinkedMultiValueMap<>();
            multipartRequest.add("file", fileResource);
            multipartRequest.add("name", sourceBook.getName());

            HttpEntity<MultiValueMap<String, Object>> importRequestEntity = new HttpEntity<>(multipartRequest,
                    importHeaders);

            try {
                ResponseEntity<BookImportResponse> importResponse = restTemplate.exchange(
                        destinationConfig.getBaseUrl() + "/api/books/import/zip",
                        HttpMethod.POST,
                        importRequestEntity,
                        BookImportResponse.class);

                return importResponse.getBody().getEntity();
            } catch (HttpStatusCodeException e) {
                log.error("API error response ({}): {}", e.getStatusCode(), e.getResponseBodyAsString());
                throw e;
            }
        } catch (Exception e) {
            log.error("Error exporting/importing book with ID {}: {}", sourceBookId, e.getMessage(), e);
            throw new BookStackApiException("Failed to export/import book with ID " + sourceBookId, e);
        }
    }

    private HttpHeaders createHeaders(BookStackConfig config) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setAccept(Collections.singletonList(MediaType.APPLICATION_JSON));
        headers.set("Authorization", "Token " + config.getTokenId() + ":" + config.getTokenSecret());
        return headers;
    }

    private Book createBookCopy(Book sourceBook) {
        Book book = new Book();
        book.setName(sourceBook.getName());
        book.setSlug(sourceBook.getSlug());
        book.setDescription(sourceBook.getDescription());
        book.setDescriptionHtml(sourceBook.getDescriptionHtml());
        book.setContents(Collections.emptyList());
        book.setTags(sourceBook.getTags());

        book.setDefaultTemplateId(sourceBook.getDefaultTemplateId());

        if (sourceBook.getCover() != null) {
            Book.Cover cover = new Book.Cover();
            cover.setName(sourceBook.getCover().getName());
            cover.setUrl(sourceBook.getCover().getUrl());
            cover.setPath(sourceBook.getCover().getPath());
            cover.setType(sourceBook.getCover().getType());
            book.setCover(cover);
        }

        return book;
    }

    private Chapter createChapterCopy(Chapter sourceChapter, Long destBookId) {
        Chapter chapter = new Chapter();
        chapter.setBookId(destBookId);
        chapter.setName(sourceChapter.getName());
        chapter.setSlug(sourceChapter.getSlug());
        chapter.setDescription(sourceChapter.getDescription());
        chapter.setPriority(sourceChapter.getPriority());
        chapter.setPages(Collections.emptyList());
        chapter.setTags(sourceChapter.getTags());
        return chapter;
    }

    private Page createPageCopy(Page sourcePage, Long destBookId, Long destChapterId) {
        Page page = new Page();
        page.setBookId(destBookId);
        page.setChapterId(destChapterId);
        page.setName(sourcePage.getName());
        page.setSlug(sourcePage.getSlug());
        page.setHtml(sourcePage.getHtml());
        page.setMarkdown(sourcePage.getMarkdown());
        page.setPriority(sourcePage.getPriority());
        page.setIsDraft(sourcePage.getIsDraft());
        page.setIsTemplate(sourcePage.getIsTemplate());
        page.setTags(sourcePage.getTags());
        return page;
    }

    public static class BookStackApiException extends RuntimeException {
        public BookStackApiException(String message) {
            super(message);
        }

        public BookStackApiException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    /**
     * Response wrapper for book import API.
     */
    @Data
    private static class BookImportResponse {
        private String message;
        private Book entity;
    }
}