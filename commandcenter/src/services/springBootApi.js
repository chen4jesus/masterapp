import axios from 'axios';

// Use relative URLs instead of hardcoded localhost URLs
// This will make API requests go to the same host that serves the frontend
const SPRING_BOOT_API_URL = '/api/sync';
const SPRING_BOOT_BOOKS_API_URL = '/api/books';

// Debug API URL
const DEBUG_API_URL = '/api/debug';

// Session storage key for configuration
const CONFIG_SESSION_STORAGE_KEY = 'bookstack_sync_config_session';

// Timeout in milliseconds (5 minutes)
const API_TIMEOUT = 300000;

// Create axios instance with default config
const apiClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  },
  // Don't send cookies with requests
  withCredentials: false,
  // Set timeout to 5 minutes
  timeout: API_TIMEOUT
});

class SpringBootApi {
  /**
   * Get the current configuration from session storage
   * @returns {Promise<Object|null>}
   */
  async getConfig() {
    try {
      const configJson = sessionStorage.getItem(CONFIG_SESSION_STORAGE_KEY);
      return configJson ? JSON.parse(configJson) : null;
    } catch (error) {
      console.error('Error getting config from session storage:', error);
      return null;
    }
  }

  /**
   * Save configuration to session storage
   * @param {Object} config
   * @returns {Promise<void>}
   */
  async saveConfig(config) {
    try {
      // Save to session storage (persists during browser session but clears on tab close)
      sessionStorage.setItem(CONFIG_SESSION_STORAGE_KEY, JSON.stringify(config));
      
      // No need to send to backend anymore as we'll pass credentials with each request
      return Promise.resolve();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * List all books from the source BookStack instance
   * @returns {Promise<Array>}
   */
  async listBooks() {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (!config) {
        console.error('No configuration found when trying to list books');
        throw new Error('Configuration is missing');
      }
      
      // Ensure all required source credentials are present
      if (!config.sourceBaseUrl || !config.sourceTokenSecret || !config.sourceTokenId) {
        console.error('Source credentials are incomplete for listing books');
        throw new Error('Source credentials are incomplete');
      }
      
      // Add source credentials to headers
      headers['X-Source-Url'] = config.sourceBaseUrl;
      headers['X-Source-Token'] = config.sourceTokenSecret;
      headers['X-Source-Token-Id'] = config.sourceTokenId;
      
      console.log('Listing books with headers:', Object.keys(headers));
      
      // Use apiClient instead of axios directly to benefit from the timeout setting
      const response = await apiClient.get(`${SPRING_BOOT_API_URL}/books`, { 
        headers,
        timeout: API_TIMEOUT
      });
      
      console.log('Books list response:', response.status, response.data?.length || 0, 'books');
      return response.data;
    } catch (error) {
      console.error('Error listing books:', error);
      this.handleError(error);
    }
  }

  /**
   * Get a book by ID from the source BookStack instance
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async getBook(id) {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (!config) {
        console.error(`No configuration found when trying to get book ${id}`);
        throw new Error('Configuration is missing');
      }
      
      // Ensure all required source credentials are present
      if (!config.sourceBaseUrl || !config.sourceTokenSecret || !config.sourceTokenId) {
        console.error(`Source credentials are incomplete for getting book ${id}`);
        throw new Error('Source credentials are incomplete');
      }
      
      // Add source credentials to headers
      headers['X-Source-Url'] = config.sourceBaseUrl;
      headers['X-Source-Token'] = config.sourceTokenSecret;
      headers['X-Source-Token-Id'] = config.sourceTokenId;
      
      console.log(`Getting book ${id} with headers:`, Object.keys(headers));
      
      const response = await apiClient.get(`${SPRING_BOOT_API_URL}/books/${id}`, { 
        headers,
        timeout: API_TIMEOUT
      });
      
      console.log(`Book ${id} response:`, response.status);
      return response.data;
    } catch (error) {
      console.error(`Error getting book ${id}:`, error);
      this.handleError(error);
    }
  }

  /**
   * Sync a book from source to destination
   * @param {number} sourceBookId
   * @returns {Promise<Object>}
   */
  async syncBook(sourceBookId) {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (!config) {
        console.error('No configuration found when trying to sync book');
        throw new Error('Configuration is missing');
      }
      
      // Ensure all required credentials are present
      if (!config.sourceBaseUrl || !config.sourceTokenSecret || !config.sourceTokenId ||
          !config.destinationBaseUrl || !config.destinationTokenSecret || !config.destinationTokenId) {
        console.error('Credentials are incomplete for book sync');
        throw new Error('Source or destination credentials are incomplete');
      }
      
      // Add source credentials to headers
      headers['X-Source-Url'] = config.sourceBaseUrl;
      headers['X-Source-Token'] = config.sourceTokenSecret;
      headers['X-Source-Token-Id'] = config.sourceTokenId;
      
      // Add destination credentials
      headers['X-Destination-Url'] = config.destinationBaseUrl;
      headers['X-Destination-Token'] = config.destinationTokenSecret;
      headers['X-Destination-Token-Id'] = config.destinationTokenId;
      
      console.log(`Syncing book ${sourceBookId} using combined export-import endpoint`);
      
      // Use the new export-import combined endpoint
      const response = await apiClient.post(`${SPRING_BOOT_BOOKS_API_URL}/${sourceBookId}/export-import`, null, {
        headers,
        timeout: API_TIMEOUT // Increased timeout for larger books
      });
      
      console.log(`Book ${sourceBookId} sync completed via export-import. New book ID: ${response.data.id}`);
      
      return response.data;
    } catch (error) {
      console.error(`Error syncing book ${sourceBookId}:`, error);
      this.handleError(error);
    }
  }

  /**
   * Sync multiple books from source to destination
   * @param {number[]} sourceBookIds
   * @returns {Promise<Object>}
   */
  async syncBooks(sourceBookIds) {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (!config) {
        console.error('No configuration found when trying to sync multiple books');
        throw new Error('Configuration is missing');
      }
      
      // Ensure all required credentials are present
      if (!config.sourceBaseUrl || !config.sourceTokenSecret || !config.sourceTokenId ||
          !config.destinationBaseUrl || !config.destinationTokenSecret || !config.destinationTokenId) {
        console.error('Credentials are incomplete for books sync');
        throw new Error('Source or destination credentials are incomplete');
      }
      
      // Add source credentials to headers
      headers['X-Source-Url'] = config.sourceBaseUrl;
      headers['X-Source-Token'] = config.sourceTokenSecret;
      headers['X-Source-Token-Id'] = config.sourceTokenId;
      
      // Add destination credentials
      headers['X-Destination-Url'] = config.destinationBaseUrl;
      headers['X-Destination-Token'] = config.destinationTokenSecret;
      headers['X-Destination-Token-Id'] = config.destinationTokenId;
      
      console.log(`Syncing ${sourceBookIds.length} books using ZIP export/import`);
      
      // Process each book individually with the new ZIP method
      const results = {};
      
      for (const bookId of sourceBookIds) {
        try {
          await this.syncBook(bookId);
          results[bookId] = true;
        } catch (error) {
          console.error(`Error syncing book ${bookId}:`, error);
          results[bookId] = false;
        }
      }
      
      return results;
    } catch (error) {
      console.error('Error syncing multiple books:', error);
      this.handleError(error);
    }
  }

  /**
   * Verify credentials for source and destination
   * @returns {Promise<Object>}
   */
  async verifyCredentials() {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (!config) {
        console.error('No configuration found when trying to verify credentials');
        throw new Error('Configuration is missing');
      }
      
      // Ensure all required source credentials are present
      if (!config.sourceBaseUrl || !config.sourceTokenSecret || !config.sourceTokenId) {
        console.error('Source credentials are incomplete', { 
          hasUrl: !!config.sourceBaseUrl, 
          hasToken: !!config.sourceTokenSecret, 
          hasTokenId: !!config.sourceTokenId 
        });
        throw new Error('Source credentials are incomplete');
      }
      
      // Add source credentials to headers
      headers['X-Source-Url'] = config.sourceBaseUrl;
      headers['X-Source-Token'] = config.sourceTokenSecret;
      headers['X-Source-Token-Id'] = config.sourceTokenId;
      
      // Add destination credentials if they exist
      if (config.destinationBaseUrl && config.destinationTokenId && config.destinationTokenSecret) {
        headers['X-Destination-Url'] = config.destinationBaseUrl;
        headers['X-Destination-Token'] = config.destinationTokenSecret;
        headers['X-Destination-Token-Id'] = config.destinationTokenId;
      }
      
      console.log('Verifying credentials with headers:', Object.keys(headers));
      
      const response = await apiClient.get(`${SPRING_BOOT_API_URL}/verify`, { 
        headers,
        // Explicitly set timeout for this critical operation
        timeout: API_TIMEOUT
      });
      
      console.log('Credential verification response:', response.status, response.data);
      return response.data;
    } catch (error) {
      console.error('Error verifying credentials:', error);
      this.handleError(error);
    }
  }

  /**
   * Get raw books data for debugging
   * @returns {Promise<string>}
   */
  async getRawBooks() {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (!config) {
        console.error('No configuration found when trying to get raw books data');
        throw new Error('Configuration is missing');
      }
      
      // Ensure all required source credentials are present
      if (!config.sourceBaseUrl || !config.sourceTokenSecret || !config.sourceTokenId) {
        console.error('Source credentials are incomplete for getting raw books data');
        throw new Error('Source credentials are incomplete');
      }
      
      // Add source credentials to headers
      headers['X-Source-Url'] = config.sourceBaseUrl;
      headers['X-Source-Token'] = config.sourceTokenSecret;
      headers['X-Source-Token-Id'] = config.sourceTokenId;
      
      console.log('Getting raw books data with headers:', Object.keys(headers));
      
      const response = await apiClient.get(`${DEBUG_API_URL}/raw-books`, { 
        headers,
        timeout: API_TIMEOUT,
        responseType: 'text' // Ensure we get the raw response as text
      });
      
      console.log('Raw books data response:', response.status);
      return response.data;
    } catch (error) {
      console.error('Error getting raw books data:', error);
      this.handleError(error);
    }
  }

  /**
   * Test API connection and diagnose issues
   * @returns {Promise<Object>}
   */
  async testConnection() {
    try {
      const config = await this.getConfig();
      
      if (!config) {
        return {
          status: 'error',
          details: 'No configuration found. Please configure the application first.'
        };
      }
      
      // Check if we have source credentials
      const hasSourceCredentials = !!(
        config.sourceBaseUrl && 
        config.sourceTokenSecret && 
        config.sourceTokenId
      );
      
      // Check if we have destination credentials
      const hasDestinationCredentials = !!(
        config.destinationBaseUrl && 
        config.destinationTokenSecret && 
        config.destinationTokenId
      );
      
      // Create test headers
      const headers = {};
      
      if (hasSourceCredentials) {
        headers['X-Source-Url'] = config.sourceBaseUrl;
        headers['X-Source-Token'] = config.sourceTokenSecret;
        headers['X-Source-Token-Id'] = config.sourceTokenId;
      }
      
      // Test basic connectivity to the backend
      try {
        // Simple ping to the backend with a short timeout
        const pingResponse = await apiClient.get(`${SPRING_BOOT_API_URL}/ping`, { 
          headers,
          timeout: 5000 // Short timeout for ping
        });
        
        return {
          status: 'success',
          details: {
            backendConnected: true,
            pingResponse: pingResponse.data,
            hasSourceCredentials,
            hasDestinationCredentials,
            configuredSourceUrl: config.sourceBaseUrl,
            configuredDestinationUrl: config.destinationBaseUrl
          }
        };
      } catch (error) {
        // If we can't connect to the backend, return detailed error
        if (axios.isAxiosError(error)) {
          return {
            status: 'error',
            details: {
              backendConnected: false,
              errorMessage: error.message,
              errorCode: error.code,
              errorResponse: error.response?.data,
              errorStatus: error.response?.status,
              hasSourceCredentials,
              hasDestinationCredentials,
              configuredSourceUrl: config.sourceBaseUrl,
              configuredDestinationUrl: config.destinationBaseUrl
            }
          };
        }
        
        return {
          status: 'error',
          details: {
            backendConnected: false,
            errorMessage: String(error),
            hasSourceCredentials,
            hasDestinationCredentials
          }
        };
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      return {
        status: 'error',
        details: {
          errorMessage: String(error)
        }
      };
    }
  }

  /**
   * List all books from the destination BookStack instance
   * @returns {Promise<Array>}
   */
  async listDestinationBooks() {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (!config) {
        console.error('No configuration found when trying to list destination books');
        throw new Error('Configuration is missing');
      }
      
      // Ensure all required destination credentials are present
      if (!config.destinationBaseUrl || !config.destinationTokenSecret || !config.destinationTokenId) {
        console.error('Destination credentials are incomplete for listing books');
        throw new Error('Destination credentials are incomplete');
      }
      
      // Add destination credentials to headers
      headers['X-Destination-Url'] = config.destinationBaseUrl;
      headers['X-Destination-Token'] = config.destinationTokenSecret;
      headers['X-Destination-Token-Id'] = config.destinationTokenId;
      
      console.log('Listing destination books with headers:', Object.keys(headers));
      
      // Use apiClient instead of axios directly to benefit from the timeout setting
      const response = await apiClient.get(`${SPRING_BOOT_API_URL}/destination/books`, { 
        headers,
        timeout: API_TIMEOUT
      });
      
      console.log('Destination books list response:', response.status, response.data?.length || 0, 'books');
      return response.data;
    } catch (error) {
      console.error('Error listing destination books:', error);
      this.handleError(error);
    }
  }

  /**
   * Delete a book from the destination BookStack instance
   * @param {number} bookId
   * @returns {Promise<void>}
   */
  async deleteDestinationBook(bookId) {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (!config) {
        console.error(`No configuration found when trying to delete destination book ${bookId}`);
        throw new Error('Configuration is missing');
      }
      
      // Ensure all required destination credentials are present
      if (!config.destinationBaseUrl || !config.destinationTokenSecret || !config.destinationTokenId) {
        console.error(`Destination credentials are incomplete for deleting book ${bookId}`);
        throw new Error('Destination credentials are incomplete');
      }
      
      // Add destination credentials to headers
      headers['X-Destination-Url'] = config.destinationBaseUrl;
      headers['X-Destination-Token'] = config.destinationTokenSecret;
      headers['X-Destination-Token-Id'] = config.destinationTokenId;
      
      console.log(`Deleting destination book ${bookId} with headers:`, Object.keys(headers));
      
      const response = await apiClient.delete(`${SPRING_BOOT_API_URL}/destination/books/${bookId}`, { 
        headers,
        timeout: API_TIMEOUT
      });
      
      console.log(`Destination book ${bookId} delete response:`, response.status);
      return response.data;
    } catch (error) {
      console.error(`Error deleting destination book ${bookId}:`, error);
      this.handleError(error);
    }
  }

  /**
   * Delete multiple books from the destination BookStack instance one by one
   * @param {number[]} bookIds
   * @returns {Promise<Object>}
   */
  async deleteDestinationBooksOneByOne(bookIds) {
    try {
      console.log(`Deleting ${bookIds.length} destination books one by one`);
      
      const results = {};
      
      // Process each book sequentially
      for (const bookId of bookIds) {
        try {
          // Delete the individual book
          await this.deleteDestinationBook(bookId);
          results[bookId] = true;
        } catch (error) {
          console.error(`Error deleting destination book ${bookId}:`, error);
          results[bookId] = false;
        }
      }
      
      console.log(`Finished deleting books one by one. Results:`, results);
      return results;
    } catch (error) {
      console.error(`Error in deleteDestinationBooksOneByOne:`, error);
      this.handleError(error);
    }
  }

  /**
   * Handle API errors
   * @param {unknown} error
   */
  handleError(error) {
    if (axios.isAxiosError(error)) {
      if (error.response) {
        console.error('API Error Response:', {
          status: error.response.status,
          data: error.response.data,
          headers: error.response.headers,
          config: {
            url: error.config?.url,
            method: error.config?.method,
          }
        });

        const errorMessage = error.response.data?.message || 
                           error.response.data?.error || 
                           error.response.data?.status ||
                           error.message;
        throw new Error(`API Error: ${error.response.status} - ${errorMessage}`);
      } else if (error.request) {
        throw new Error('No response received from server');
      } else {
        throw new Error(`Request Error: ${error.message}`);
      }
    }
    throw error;
  }

  /**
   * Destroy all books in destination
   * @returns {Promise<void>}
   */
  async destroy() {
    try {
      const config = await this.getConfig();
      const headers = {};

      if (!config) {
        console.error(`No configuration found when trying to destroy destination resources`);
        throw new Error('Configuration is missing');
      }

      // Ensure all required destination credentials are present
      if (!config.destinationBaseUrl || !config.destinationTokenSecret || !config.destinationTokenId) {
        console.error(`Destination credentials are incomplete for destroy operation`);
        throw new Error('Destination credentials are incomplete');
      }

      // Add destination credentials to headers
      headers['X-Destination-Url'] = config.destinationBaseUrl;
      headers['X-Destination-Token'] = config.destinationTokenSecret;
      headers['X-Destination-Token-Id'] = config.destinationTokenId;

      console.log(`Destroying destination resources with headers:`, Object.keys(headers));

      const response = await apiClient.delete(`${SPRING_BOOT_API_URL}/destroy`, {
        headers,
        timeout: API_TIMEOUT
      });

      console.log(`Destroy response:`, response.status);
    } catch (error) {
      console.error(`Error destroying destination resources:`, error);
      this.handleError(error);
    }
  }
  /**
   * Create a new book
   * @param {Object} bookData - { name, description, defaultTemplateId, ownedBy, tags }
   * @returns {Promise<Object>}
   */
  async createBook(bookData) {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (config) {
        if (config.sourceBaseUrl && config.sourceTokenSecret && config.sourceTokenId) {
          headers['X-Source-Url'] = config.sourceBaseUrl;
          headers['X-Source-Token'] = config.sourceTokenSecret;
          headers['X-Source-Token-Id'] = config.sourceTokenId;
        }
      }

      console.log('Creating new book:', bookData.name);
      
      const response = await apiClient.post(`${SPRING_BOOT_BOOKS_API_URL}`, bookData, { 
        headers 
      });
      
      return response.data;
    } catch (error) {
      console.error('Error creating book:', error);
      this.handleError(error);
    }
  }

  /**
   * Update a book
   * @param {number} id
   * @param {Object} bookData
   * @returns {Promise<Object>}
   */
  async updateBook(id, bookData) {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (config) {
        if (config.sourceBaseUrl && config.sourceTokenSecret && config.sourceTokenId) {
          headers['X-Source-Url'] = config.sourceBaseUrl;
          headers['X-Source-Token'] = config.sourceTokenSecret;
          headers['X-Source-Token-Id'] = config.sourceTokenId;
        }
      }

      console.log('Updating book:', id);
      
      const response = await apiClient.put(`${SPRING_BOOT_BOOKS_API_URL}/${id}`, bookData, { 
        headers 
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error updating book ${id}:`, error);
      this.handleError(error);
    }
  }

  /**
   * Delete a book (Service level)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async deleteBook(id) {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (config) {
        if (config.sourceBaseUrl && config.sourceTokenSecret && config.sourceTokenId) {
          headers['X-Source-Url'] = config.sourceBaseUrl;
          headers['X-Source-Token'] = config.sourceTokenSecret;
          headers['X-Source-Token-Id'] = config.sourceTokenId;
        }
      }

      console.log('Deleting book:', id);
      
      const response = await apiClient.delete(`${SPRING_BOOT_BOOKS_API_URL}/${id}`, { 
        headers 
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error deleting book ${id}:`, error);
      this.handleError(error);
    }
  }

  /**
   * List chapters for a book
   * @param {number} bookId
   * @returns {Promise<Array>}
   */
  async listChapters(bookId) {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (config) {
        if (config.sourceBaseUrl && config.sourceTokenSecret && config.sourceTokenId) {
          headers['X-Source-Url'] = config.sourceBaseUrl;
          headers['X-Source-Token'] = config.sourceTokenSecret;
          headers['X-Source-Token-Id'] = config.sourceTokenId;
        }
      }

      console.log(`Listing chapters for book ${bookId}`);
      
      const response = await apiClient.get(`${SPRING_BOOT_BOOKS_API_URL}/${bookId}/chapters`, { 
        headers,
        timeout: API_TIMEOUT
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error listing chapters for book ${bookId}:`, error);
      this.handleError(error);
    }
  }

  /**
   * List pages for a book
   * @param {number} bookId
   * @returns {Promise<Array>}
   */
  async listPages(bookId) {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (config) {
        if (config.sourceBaseUrl && config.sourceTokenSecret && config.sourceTokenId) {
          headers['X-Source-Url'] = config.sourceBaseUrl;
          headers['X-Source-Token'] = config.sourceTokenSecret;
          headers['X-Source-Token-Id'] = config.sourceTokenId;
        }
      }

      console.log(`Listing pages for book ${bookId}`);
      
      const response = await apiClient.get(`${SPRING_BOOT_BOOKS_API_URL}/${bookId}/pages`, { 
        headers,
        timeout: API_TIMEOUT
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error listing pages for book ${bookId}:`, error);
      this.handleError(error);
    }
  }

  /**
   * Sync a book using the standard sync method (non-export/import)
   * @param {number} id
   * @returns {Promise<Object>}
   */
  async syncBookStandard(id) {
    try {
      const config = await this.getConfig();
      const headers = {};
      
      if (!config) {
        throw new Error('Configuration is missing');
      }

      // Add credentials
      if (config.sourceBaseUrl && config.sourceTokenSecret && config.sourceTokenId) {
        headers['X-Source-Url'] = config.sourceBaseUrl;
        headers['X-Source-Token'] = config.sourceTokenSecret;
        headers['X-Source-Token-Id'] = config.sourceTokenId;
      }
      
      if (config.destinationBaseUrl && config.destinationTokenSecret && config.destinationTokenId) {
        headers['X-Destination-Url'] = config.destinationBaseUrl;
        headers['X-Destination-Token'] = config.destinationTokenSecret;
        headers['X-Destination-Token-Id'] = config.destinationTokenId;
      }

      console.log(`Syncing book ${id} (standard method)`);
      
      const response = await apiClient.post(`${SPRING_BOOT_BOOKS_API_URL}/${id}/sync`, null, { 
        headers,
        timeout: API_TIMEOUT
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error syncing book ${id}:`, error);
      this.handleError(error);
    }
  }
}

export default SpringBootApi;
