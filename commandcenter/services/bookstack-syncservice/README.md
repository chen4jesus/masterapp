# BookStack Sync

A Spring Boot application that synchronizes content between two BookStack instances. This tool allows you to maintain consistent documentation across multiple BookStack deployments by copying books, chapters, and pages from a source instance to a destination instance.

## Features

- **Book Synchronization**: Copy books with their structure and content from source to destination
- **Chapter Management**: Synchronize chapters while preserving their hierarchy and metadata
- **Page Content Transfer**: Copy page content including HTML, markdown, and formatting
- **Metadata Preservation**: Maintain slugs, descriptions, and tags during synchronization
- **API Verification**: Test API credentials for both source and destination instances
- **RESTful Interface**: Simple HTTP API for triggering synchronization operations

## Prerequisites

- Java 17 or higher
- Maven 3.6 or higher
- Two BookStack instances with API access enabled
- API tokens with appropriate permissions on both instances

## Configuration

Configure the application by updating the `application.properties` file:

```properties
# Server configuration
server.port=8080

# BookStack Source API Configuration
bookstack.source.baseUrl=https://source-bookstack-instance.com
bookstack.source.tokenId=your-source-token-id
bookstack.source.tokenSecret=your-source-token-secret

# BookStack Destination API Configuration
bookstack.destination.baseUrl=https://destination-bookstack-instance.com
bookstack.destination.tokenId=your-destination-token-id
bookstack.destination.tokenSecret=your-destination-token-secret

# Logging configuration
logging.level.com.faithconnect.bookstacksync=DEBUG
```

## Building the Application

```bash
mvn clean package
```

## Running the Application

```bash
java -jar target/bookstack-sync-0.0.1-SNAPSHOT.jar
```

Or using Maven:

```bash
mvn spring-boot:run
```

## API Endpoints

### Book Operations

- `GET /api/sync/books` - List all books from the source BookStack instance
- `GET /api/sync/books/{id}` - Get a specific book by ID from the source instance
- `POST /api/sync/books/{id}` - Synchronize a book from source to destination instance

### Verification

- `GET /api/sync/verify` - Verify API credentials for both source and destination instances

## Example Usage

### List All Books

```bash
curl -X GET http://localhost:8080/api/sync/books
```

Response:
```json
[
  {
    "id": 1,
    "name": "API Documentation",
    "slug": "api-documentation",
    "description": "Documentation for our REST API"
  },
  {
    "id": 2,
    "name": "User Guide",
    "slug": "user-guide",
    "description": "End user documentation"
  }
]
```

### Get Book Details

```bash
curl -X GET http://localhost:8080/api/sync/books/1
```

### Synchronize a Book

```bash
curl -X POST http://localhost:8080/api/sync/books/1
```

Response:
```json
{
  "status": "success",
  "message": "Book sync completed successfully"
}
```

### Verify Credentials

```bash
curl -X GET http://localhost:8080/api/sync/verify
```

Response:
```json
{
  "sourceCredentialsValid": true
}
```

## Synchronization Process

When synchronizing a book, the application:

1. Retrieves the book and its structure from the source instance
2. Creates a copy of the book in the destination instance
3. Creates all chapters in the correct hierarchy
4. Creates all pages with their content and attachments
5. Preserves metadata including tags, descriptions, and slugs

## Error Handling

The application provides detailed error messages for common issues:

- Invalid API credentials
- Network connectivity problems
- BookStack API errors
- Content validation failures

## Security Considerations

- Store API tokens securely and never commit them to version control
- Consider using environment variables or a secrets manager for production
- Implement authentication for the sync API in production environments
- Use HTTPS for all communications with BookStack instances

## Development

This application is built with:

- Spring Boot 3.2.0
- Java 17
- Maven for dependency management
- Lombok for reducing boilerplate code
- Jackson for JSON processing

## License

This project is licensed under the MIT License - see the LICENSE file for details. 

## Docker Deployment

This application can be easily deployed using Docker and Docker Compose. The repository includes all necessary files for a one-line deployment on any VPS server.

### Prerequisites for Docker Deployment

- Docker installed on your server
- Docker Compose installed on your server
- Git (optional, for pulling updates)

### One-Line Deployment

#### On Linux/macOS:

```bash
# Clone the repository (if not already done)
git clone https://your-repository-url.git
cd bookstack-sync-spring

# Run the deployment script
./deploy.sh
```

#### On Windows:

```bash
# Clone the repository (if not already done)
git clone https://your-repository-url.git
cd bookstack-sync-spring

# Run the deployment script
deploy.bat
```

### Manual Deployment Steps

If you prefer to deploy manually, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://your-repository-url.git
   cd bookstack-sync-spring
   ```

2. Create a `.env` file from the template:
   ```bash
   cp .env.template .env
   ```

3. Edit the `.env` file with your BookStack API credentials:
   ```
   # BookStack Source API Configuration
   SOURCE_BOOKSTACK_URL=https://your-source-bookstack.com
   SOURCE_BOOKSTACK_TOKEN_ID=your_source_token_id
   SOURCE_BOOKSTACK_TOKEN_SECRET=your_source_token_secret

   # BookStack Destination API Configuration
   DEST_BOOKSTACK_URL=https://your-destination-bookstack.com
   DEST_BOOKSTACK_TOKEN_ID=your_destination_token_id
   DEST_BOOKSTACK_TOKEN_SECRET=your_destination_token_secret
   ```

4. Build and start the Docker containers:
   ```bash
   docker-compose up -d --build
   ```

5. Verify the application is running:
   ```bash
   curl http://localhost:8080/actuator/health
   ```

### Docker Configuration

The Docker setup includes:

- Multi-stage build for efficient image size
- JRE Alpine base image for minimal footprint
- Non-root user for security
- Health checks for monitoring
- Volume for persistent logs
- Environment variables for configuration

### Updating the Application

To update the application to the latest version:

```bash
git pull
docker-compose up -d --build
```

### Troubleshooting

If you encounter issues with the Docker deployment:

1. Check the container logs:
   ```bash
   docker-compose logs -f
   ```

2. Verify the container is running:
   ```bash
   docker-compose ps
   ```

3. Check the application health:
   ```bash
   curl http://localhost:8080/actuator/health
   ```

4. Restart the container:
   ```bash
   docker-compose restart
   ``` 