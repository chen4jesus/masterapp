import {Component} from './component';
import {fadeIn, fadeOut} from '../services/animations.ts';

/**
 * Bible verse modal component that displays Bible verses when a reference is clicked.
 */
export class BibleVerseModal extends Component {

    setup() {
        this.container = this.$el;
        this.content = this.$refs.content;
        this.closeButtons = this.$manyRefs.verseClose || document.getElementById('verseClose') ? [document.getElementById('verseClose')] : [];
        this.title = this.$manyRefs.verseTitle ? this.$manyRefs.verseTitle[0] : document.getElementById('verseTitle') ? document.getElementById('verseTitle') : null;
        this.verseContent = this.$manyRefs.verseContent ? this.$manyRefs.verseContent[0] : document.getElementById('verseContent') ? document.getElementById('verseContent') : null;
        
        console.debug('Container:', this.container);
        console.debug('Content:', this.content);
        console.debug('Title:', this.title);
        console.debug('VerseContent:', this.verseContent);
        console.debug('CloseButtons:', this.closeButtons);
        
        // Check if all required elements are found
        if (!this.container) {
            console.error('BibleVerseModal: Container element not found');
        }
        if (!this.title) {
            console.error('BibleVerseModal: Title element not found');
        }
        if (!this.verseContent) {
            console.error('BibleVerseModal: Verse content element not found');
        }
        
        this.onkeyup = null;
        this.dataLoaded = false;
        this.isLoading = false;
        
        // Initialize the cache for Bible verses
        this.verseCache = {};
        
        // Setup event listeners
        this.setupListeners();
        
        // Preload common Bible verses in the background
        this.preloadCommonVerses();
    }

    /**
     * Preload common Bible verses to improve user experience
     */
    async preloadCommonVerses() {
        console.debug('Starting to preload common Bible verses');
        
        // List of common Bible references to preload
        const commonReferences = [
            '约 3:16',  // John 3:16
        ];
        
        let successCount = 0;
        let failureCount = 0;
        
        // Preload these references in the background
        for (const reference of commonReferences) {
            try {
                console.debug(`Preloading Bible verses for: ${reference}`);
                
                const parsedRef = await this.parseReference(reference);
                if (parsedRef) {
                    // Fetch and cache the verses
                    const verses = await this.fetchVerses(parsedRef);
                    
                    if (verses && verses.length > 0) {
                        console.debug(`Successfully preloaded ${verses.length} Bible verses for: ${reference}`);
                        successCount++;
                    } else {
                        console.warn(`No verses found when preloading: ${reference}`);
                        failureCount++;
                    }
                } else {
                    console.warn(`Failed to parse reference when preloading: ${reference}`);
                    failureCount++;
                }
            } catch (error) {
                console.error(`Error preloading Bible verses for: ${reference}`, error);
                failureCount++;
            }
        }
        
        this.dataLoaded = true;
        console.debug(`Bible verse preloading completed. Success: ${successCount}, Failure: ${failureCount}`);
        
        // If all preloads failed, try to preload all verses as a fallback
        if (failureCount === commonReferences.length) {
            console.warn('All preloads failed. Attempting to preload all verses as a fallback');
            try {
                const response = await fetch('/api/bible/all');
                const data = await response.json();
                
                if (data.success && data.data && Array.isArray(data.data)) {
                    console.debug(`Successfully preloaded all ${data.data.length} Bible verses`);
                    
                    // Store all verses in a special cache key
                    this.allVerses = data.data;
                } else {
                    console.error('Failed to preload all Bible verses');
                }
            } catch (error) {
                console.error('Error preloading all Bible verses:', error);
            }
        }
    }

    setupListeners() {
        // Close when clicking outside the modal content
        let lastMouseDownTarget = null;
        this.container.addEventListener('mousedown', event => {
            lastMouseDownTarget = event.target;
        });

        this.container.addEventListener('click', event => {
            if (event.target === this.container && lastMouseDownTarget === this.container) {
                this.hide();
            }
        });

        // Close when clicking close buttons
        for (const button of this.closeButtons) {
            button.addEventListener('click', () => this.hide());
        }
        
        // Also add event listener to the close button by ID
        const closeButton = document.getElementById('verseClose');
        if (closeButton && !this.closeButtons.includes(closeButton)) {
            closeButton.addEventListener('click', () => this.hide());
        }
        
        // Listen for verse reference clicks in the document
        document.addEventListener('click', this.handleVerseClick.bind(this));
        
        // Add double-click handler for verse references
        document.addEventListener('dblclick', this.handleVerseDoubleClick.bind(this));
        
        // Listen for custom event to open the modal
        document.addEventListener('open-bible-modal', (event) => {
            const reference = event.detail?.reference;
            if (reference) {
                this.showVerses(reference);
            } else {
                this.showDefaultVerse();
                this.show();
            }
        });
        
        // Add click handler for elements with data-action="open-bible-modal"
        document.addEventListener('click', (event) => {
            const openButton = event.target.closest('[data-action="open-bible-modal"]');
            if (openButton) {
                event.preventDefault();
                const reference = openButton.getAttribute('data-reference');
                if (reference) {
                    this.showVerses(reference);
                } else {
                    this.showDefaultVerse();
                    this.show();
                }
            }
        });
    }
    
    /**
     * Handle clicks on verse references in the document
     */
    handleVerseClick(event) {
        const target = event.target;
        
        // Check if the clicked element has the bible-verse class or is a child of an element with that class
        const verseElement = target.closest('.bible-verse');
        if (!verseElement) return;
        
        event.preventDefault();
        
        const reference = verseElement.getAttribute('data-reference');
        if (reference) {
            this.showVerses(reference);
        }
    }
    
    /**
     * Handle double-clicks on verse references in the document
     * This will populate editor with the verse reference
     */
    handleVerseDoubleClick(event) {
        const target = event.target;
        
        // Check if the clicked element has the bible-verse class or is a child of an element with that class
        const verseElement = target.closest('.bible-verse');
        if (!verseElement) return;
        
        event.preventDefault();
        
        const reference = verseElement.getAttribute('data-reference');
        if (reference) {
            // Populate the editor with the verse reference
            this.populateEditorWithVerse(reference);
        }
    }
    
    /**
     * Populate the editor with the verse reference
     * @param {String} reference - The Bible reference string
     */
    populateEditorWithVerse(reference) {
        // Find the active editor
        const activeEditor = document.querySelector('.CodeMirror.CodeMirror-focused') || 
                            document.querySelector('.ProseMirror-focused') ||
                            document.querySelector('.editor-focused') ||
                            document.querySelector('[contenteditable="true"]:focus');
                            
        if (activeEditor) {
            // Handle different editor types
            if (activeEditor.classList.contains('CodeMirror')) {
                // CodeMirror editor
                const cmInstance = activeEditor.CodeMirror;
                if (cmInstance && typeof cmInstance.replaceSelection === 'function') {
                    cmInstance.replaceSelection(reference);
                    console.debug(`Populated CodeMirror editor with: ${reference}`);
                    return;
                }
            } else if (activeEditor.classList.contains('ProseMirror')) {
                // ProseMirror editor
                const view = activeEditor._pmView || window.editorView;
                if (view && view.dispatch) {
                    const { state } = view;
                    view.dispatch(state.tr.insertText(reference, state.selection.from, state.selection.to));
                    console.debug(`Populated ProseMirror editor with: ${reference}`);
                    return;
                }
            } else if (activeEditor.isContentEditable) {
                // Generic contentEditable element
                const selection = window.getSelection();
                if (selection.rangeCount) {
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    range.insertNode(document.createTextNode(reference));
                    console.debug(`Populated contentEditable with: ${reference}`);
                    return;
                }
            }
        }
        
        // Fallback: try to dispatch a custom event for editors to handle
        const customEvent = new CustomEvent('bible-verse-selected', {
            detail: { reference }
        });
        document.dispatchEvent(customEvent);
        console.debug(`Dispatched custom event with reference: ${reference}`);
        
        // Also add to clipboard as a convenience
        navigator.clipboard.writeText(reference)
            .then(() => console.debug(`Copied "${reference}" to clipboard`))
            .catch(err => console.error('Failed to copy to clipboard:', err));
    }
    
    /**
     * Parse a Bible reference string using the API
     * @param {String} reference - The Bible reference string
     * @returns {Promise<Object>} - Promise resolving to parsed reference object
     */
    async parseReference(reference) {
        try {
            const response = await fetch(`/api/bible/parse?reference=${encodeURIComponent(reference)}`);
            const data = await response.json();
            
            if (!data.success) {
                console.error('Error parsing reference:', data.message);
                return null;
            }
            
            return data.data;
        } catch (error) {
            console.error('Error parsing reference:', error);
            return null;
        }
    }
    
    /**
     * Fetch verses from the API based on the parsed reference
     * @param {Object} parsedRef - The parsed reference object
     * @returns {Promise<Array>} - Promise resolving to array of verse objects
     */
    async fetchVerses(parsedRef) {
        if (!parsedRef) return [];
        
        // Create a cache key for this reference
        let cacheKey = `${parsedRef.book}_${parsedRef.chapter}`;
        
        // Add verse ranges to the cache key if available
        if (parsedRef.verse_ranges && parsedRef.verse_ranges.length > 0) {
            const rangesStr = parsedRef.verse_ranges.map(range => `${range.start}-${range.end}`).join('_');
            cacheKey += `_ranges_${rangesStr}`;
        } else if (parsedRef.verse) {
            cacheKey += `_${parsedRef.verse || ''}`;
            if (parsedRef.end_verse) {
                cacheKey += `_${parsedRef.end_verse || ''}`;
            }
        }
        
        // Check if we already have this in the cache
        if (this.verseCache[cacheKey]) {
            console.debug(`Using cached verses for ${cacheKey}`);
            return this.verseCache[cacheKey];
        }
        
        // Build the query parameters
        const params = new URLSearchParams({
            book: parsedRef.book,
            chapter: parsedRef.chapter,
        });
        
        // If we have verse ranges, use those
        if (parsedRef.verse_ranges && parsedRef.verse_ranges.length > 0) {
            // The API expects verse_ranges as an array parameter
            // Instead of JSON.stringify, we need to add each range individually
            parsedRef.verse_ranges.forEach((range, index) => {
                params.append(`verse_ranges[${index}][start]`, range.start);
                params.append(`verse_ranges[${index}][end]`, range.end);
            });
        } 
        // Otherwise use the traditional verse and end_verse parameters
        else if (parsedRef.verse) {
            params.append('verse', parsedRef.verse);
            
            if (parsedRef.end_verse) {
                params.append('end_verse', parsedRef.end_verse);
            }
        }
        
        try {
            console.debug(`Fetching verses for ${cacheKey} from API`);
            const response = await fetch(`/api/bible/verses?${params.toString()}`);
            const data = await response.json();
            
            if (!data.success) {
                console.error('Error fetching Bible verses:', data.message, data.errors);
                console.debug('Request params:', params.toString());
                console.debug('Parsed reference:', parsedRef);
                
                // Try to fetch all verses as a fallback
                console.debug('Attempting to fetch all verses as fallback');
                return this.fetchVersesFromAllVerses(parsedRef);
            }
            
            // Cache the result
            this.verseCache[cacheKey] = data.data.verses;
            console.debug(`Cached ${data.data.verses.length} verses for ${cacheKey}`);
            
            return data.data.verses;
        } catch (error) {
            console.error('Error fetching Bible verses:', error);
            
            // Try to fetch all verses as a fallback
            console.debug('Attempting to fetch all verses as fallback due to error');
            return this.fetchVersesFromAllVerses(parsedRef);
        }
    }
    
    /**
     * Fallback method to fetch verses from the all verses endpoint
     * @param {Object} parsedRef - The parsed reference object
     * @returns {Promise<Array>} - Promise resolving to array of verse objects
     */
    async fetchVersesFromAllVerses(parsedRef) {
        if (!parsedRef) return [];
        
        // If this is a multi-chapter reference, handle each chapter separately
        if (parsedRef.is_multi_chapter && parsedRef.chapter_references && parsedRef.chapter_references.length > 0) {
            const allVerses = [];
            
            for (const chapterRef of parsedRef.chapter_references) {
                const verses = await this.fetchVersesFromAllVersesForChapter(chapterRef);
                if (verses && verses.length > 0) {
                    allVerses.push(...verses);
                }
            }
            
            return allVerses;
        }
        
        // Otherwise handle a single chapter reference
        return this.fetchVersesFromAllVersesForChapter(parsedRef);
    }
    
    /**
     * Fetch verses for a single chapter from the all verses cache
     * @param {Object} chapterRef - The chapter reference object
     * @returns {Promise<Array>} - Promise resolving to array of verse objects
     */
    async fetchVersesFromAllVersesForChapter(chapterRef) {
        try {
            // If we already have all verses cached, use that
            if (this.allVerses && Array.isArray(this.allVerses)) {
                console.debug(`Filtering cached all verses for chapter ${chapterRef.chapter}`);
                
                // Filter the verses based on the parsed reference
                return this.allVerses.filter(verse => {
                    if (verse.book !== chapterRef.book) return false;
                    if (verse.chapter !== chapterRef.chapter) return false;
                    
                    // If we have verse ranges, check if the verse is in any of the ranges
                    if (chapterRef.verse_ranges && chapterRef.verse_ranges.length > 0) {
                        return chapterRef.verse_ranges.some(range => 
                            verse.verse >= range.start && verse.verse <= range.end
                        );
                    } 
                    // Otherwise use the traditional verse and end_verse parameters
                    else if (chapterRef.verse && chapterRef.end_verse) {
                        return verse.verse >= chapterRef.verse && verse.verse <= chapterRef.end_verse;
                    } else if (chapterRef.verse) {
                        return verse.verse === chapterRef.verse;
                    }
                    
                    return true;
                });
            }
            
            // Otherwise fetch all verses from the API
            console.debug('Fetching all verses from API');
            const response = await fetch('/api/bible/all');
            const data = await response.json();
            
            if (!data.success || !data.data || !Array.isArray(data.data)) {
                console.error('Error fetching all Bible verses:', data.message);
                return [];
            }
            
            // Cache all verses for future use
            this.allVerses = data.data;
            
            console.debug(`Filtering ${data.data.length} verses to find matches for chapter ${chapterRef.chapter}`);
            
            // Filter the verses based on the parsed reference
            return data.data.filter(verse => {
                if (verse.book !== chapterRef.book) return false;
                if (verse.chapter !== chapterRef.chapter) return false;
                
                // If we have verse ranges, check if the verse is in any of the ranges
                if (chapterRef.verse_ranges && chapterRef.verse_ranges.length > 0) {
                    return chapterRef.verse_ranges.some(range => 
                        verse.verse >= range.start && verse.verse <= range.end
                    );
                } 
                // Otherwise use the traditional verse and end_verse parameters
                else if (chapterRef.verse && chapterRef.end_verse) {
                    return verse.verse >= chapterRef.verse && verse.verse <= chapterRef.end_verse;
                } else if (chapterRef.verse) {
                    return verse.verse === chapterRef.verse;
                }
                
                return true;
            });
        } catch (error) {
            console.error('Error fetching all Bible verses:', error);
            return [];
        }
    }
    
    /**
     * Show verses for a given reference
     * @param {String} reference - The Bible reference string
     */
    async showVerses(reference) {
        if (this.isLoading) {
            this.showLoadingMessage("正在加载圣经数据，请稍候...");
            return;
        }
        
        // Set loading state
        this.isLoading = true;
        
        // Show the modal first with loading message
        this.show(reference);
        
        // Safely set the title text content
        if (this.title) {
            this.title.textContent = reference;
        } else {
            console.error('BibleVerseModal: Title element not found when showing verses');
        }
        
        this.showLoadingMessage(`正在加载 ${reference} 的经文...`);
        
        try {
            console.debug(`Showing verses for reference: ${reference}`);
            
            // Parse the reference using the API
            const parsedRef = await this.parseReference(reference);
            
            if (!parsedRef) {
                console.error(`Failed to parse reference: ${reference}`);
                this.showErrorMessage(`无法解析经文引用: ${reference}`);
                this.isLoading = false;
                return;
            }
            
            console.debug(`Parsed reference: ${JSON.stringify(parsedRef)}`);
            
            // Check if this is a multi-chapter reference
            if (parsedRef.is_multi_chapter && parsedRef.chapter_references && parsedRef.chapter_references.length > 0) {
                await this.showMultiChapterVerses(parsedRef, reference);
            } else {
                // Fetch the verses for a single chapter reference
                await this.showSingleChapterVerses(parsedRef, reference);
            }
            
        } catch (error) {
            console.error('Error showing verses:', error);
            this.showErrorMessage(`加载经文时出错: ${error.message}`);
        } finally {
            this.isLoading = false;
        }
    }
    
    /**
     * Show verses for a multi-chapter reference
     * @param {Object} parsedRef - The parsed reference object with multiple chapters
     * @param {String} reference - The original reference string
     */
    async showMultiChapterVerses(parsedRef, reference) {
        console.debug(`Showing verses for multi-chapter reference: ${reference}`);
        
        const allVerses = [];
        const chapterReferences = parsedRef.chapter_references;
        
        // Fetch verses for each chapter reference
        for (const chapterRef of chapterReferences) {
            try {
                const verses = await this.fetchVerses(chapterRef);
                if (verses && verses.length > 0) {
                    allVerses.push({
                        chapter: chapterRef.chapter,
                        book_name: chapterRef.book_name,
                        verses: verses
                    });
                }
            } catch (error) {
                console.error(`Error fetching verses for chapter ${chapterRef.chapter}:`, error);
            }
        }
        
        if (allVerses.length === 0) {
            console.error(`No verses found for reference: ${reference}`);
            this.showErrorMessage(`未找到经文: ${reference}`);
            return;
        }
        
        console.debug(`Found verses from ${allVerses.length} chapters for reference: ${reference}`);
        
        // Build the verse content for all chapters
        let content = `<div class="bible-verses">`;
        
        for (const chapterData of allVerses) {
            content += `<h4>${chapterData.book_name} ${chapterData.chapter}</h4>
                <div class="verses">`;
            
            chapterData.verses.forEach(verse => {
                content += `<div class="verse">
                    <span class="verse-number">${verse.verse}</span>
                    <span class="verse-text">${verse.text}</span>
                </div>`;
            });
            
            content += `</div>`;
        }
        
        content += `</div>`;
        
        if (this.verseContent) {
            this.verseContent.innerHTML = content;
            console.debug(`Displayed verses from ${allVerses.length} chapters for reference: ${reference}`);
        } else {
            console.error('BibleVerseModal: Verse content element not found when showing verses');
        }
    }
    
    /**
     * Show verses for a single chapter reference
     * @param {Object} parsedRef - The parsed reference object for a single chapter
     * @param {String} reference - The original reference string
     */
    async showSingleChapterVerses(parsedRef, reference) {
        // Fetch the verses
        let verses = await this.fetchVerses(parsedRef);
        
        // If no verses found and we have allVerses, try to filter from there
        if ((!verses || verses.length === 0) && this.allVerses) {
            console.debug(`No verses found via API, trying to filter from allVerses`);
            
            verses = this.allVerses.filter(verse => {
                if (verse.book !== parsedRef.book) return false;
                if (verse.chapter !== parsedRef.chapter) return false;
                
                // If we have verse ranges, check if the verse is in any of the ranges
                if (parsedRef.verse_ranges && parsedRef.verse_ranges.length > 0) {
                    return parsedRef.verse_ranges.some(range => 
                        verse.verse >= range.start && verse.verse <= range.end
                    );
                } 
                // Otherwise use the traditional verse and end_verse parameters
                else if (parsedRef.verse && parsedRef.end_verse) {
                    return verse.verse >= parsedRef.verse && verse.verse <= parsedRef.end_verse;
                } else if (parsedRef.verse) {
                    return verse.verse === parsedRef.verse;
                }
                
                return true;
            });
            
            console.debug(`Found ${verses.length} verses from allVerses`);
        }
        
        if (!verses || verses.length === 0) {
            console.error(`No verses found for reference: ${reference}`);
            this.showErrorMessage(`未找到经文: ${reference}`);
            return;
        }
        
        console.debug(`Found ${verses.length} verses for reference: ${reference}`);
        
        // Build the verse content
        let content = `<div class="bible-verses">
            <h4>${parsedRef.book_name} ${parsedRef.chapter}</h4>
            <div class="verses">`;
        
        verses.forEach(verse => {
            content += `<div class="verse">
                <span class="verse-number">${verse.verse}</span>
                <span class="verse-text">${verse.text}</span>
            </div>`;
        });
        
        content += `</div></div>`;
        
        if (this.verseContent) {
            this.verseContent.innerHTML = content;
            console.debug(`Displayed ${verses.length} verses for reference: ${reference}`);
        } else {
            console.error('BibleVerseModal: Verse content element not found when showing verses');
        }
    }
    
    /**
     * Show a loading message in the modal
     * @param {String} message - The loading message to display
     */
    showLoadingMessage(message) {
        if (!this.verseContent) {
            console.error('BibleVerseModal: Verse content element not found when showing loading message');
            return;
        }
        
        this.verseContent.innerHTML = `
            <div class="loading-message">
                <div class="loading-container">
                    <div></div><div></div><div></div>
                    <span>${message}</span>
                </div>
            </div>
        `;
    }
    
    /**
     * Show an error message in the modal
     * @param {String} message - The error message to display
     */
    showErrorMessage(message) {
        if (!this.verseContent) {
            console.error('BibleVerseModal: Verse content element not found when showing error message');
            return;
        }
        
        this.verseContent.innerHTML = `
            <div class="error-message">
                <p>出错了！</p>
                <p>${message}</p>
            </div>
        `;
    }
    
    /**
     * Hide the modal
     */
    hide() {
        // Remove active class to trigger CSS transitions
        this.container.classList.remove('active');
        
        // Wait for the animation to complete before hiding completely
        setTimeout(() => {
            this.container.style.display = 'none';
        }, 300); // Match the transition duration in CSS
        
        window.removeEventListener('keyup', this.onkeyup);
    }
    
    /**
     * Show the modal
     */
    show(reference = null) {
        // Make the container visible first
        this.container.style.display = 'flex';
        
        // Force a reflow to ensure the transition works
        void this.container.offsetWidth;
        
        // Add active class to trigger CSS transitions
        this.container.classList.add('active');
        
        this.onkeyup = (event) => {
            if (event.key === 'Escape') this.hide();
        };
        window.addEventListener('keyup', this.onkeyup);
        
        // If no specific reference is provided, show a default verse
        if (!reference && !this.verseContent.innerHTML.trim()) {
            this.showDefaultVerse();
        }
    }
    
    /**
     * Show a default Bible verse when the modal is opened without a specific reference
     */
    async showDefaultVerse() {
        // Use a well-known verse as the default
        const defaultReference = '约 3:16'; // John 3:16
        
        if (this.title) {
            this.title.textContent = '每日经文';  // "Daily Verse" in Chinese
        }
        
        this.showLoadingMessage('加载默认经文...');
        console.debug('Loading default verse: John 3:16');
        
        try {
            // Check if we already have this verse in cache
            const parsedRef = await this.parseReference(defaultReference);
            
            if (!parsedRef) {
                console.error('Failed to parse default reference');
                this.showErrorMessage('无法加载默认经文');
                return;
            }
            
            console.debug(`Parsed default reference: ${JSON.stringify(parsedRef)}`);
            
            // Try to fetch the verses
            let verses = await this.fetchVerses(parsedRef);
            
            // If no verses found and we have allVerses, try to filter from there
            if ((!verses || verses.length === 0) && this.allVerses) {
                console.debug(`No default verses found via API, trying to filter from allVerses`);
                
                verses = this.allVerses.filter(verse => 
                    verse.book === 43 && verse.chapter === 3 && verse.verse === 16
                );
                
                console.debug(`Found ${verses.length} default verses from allVerses`);
            }
            
            // If still no verses, try a hardcoded fallback
            if (!verses || verses.length === 0) {
                console.warn('No default verses found, using hardcoded fallback');
                
                verses = [{
                    book: 43,
                    chapter: 3,
                    verse: 16,
                    text: '神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不致灭亡，反得永生。'
                }];
            }
            
            // Build the verse content
            let content = `<div class="bible-verses">
                <h4>${parsedRef.book_name || '约翰福音'} ${parsedRef.chapter || 3}</h4>
                <div class="verses">`;
            
            verses.forEach(verse => {
                content += `<div class="verse">
                    <span class="verse-number">${verse.verse}</span>
                    <span class="verse-text">${verse.text}</span>
                </div>`;
            });
            
            content += `</div></div>`;
            
            if (this.verseContent) {
                this.verseContent.innerHTML = content;
                console.debug(`Displayed default verse successfully`);
            } else {
                console.error('BibleVerseModal: Verse content element not found when showing default verse');
            }
            
        } catch (error) {
            console.error('Error showing default verse:', error);
            
            // Use hardcoded fallback in case of error
            if (this.verseContent) {
                this.verseContent.innerHTML = `
                    <div class="bible-verses">
                        <h4>约翰福音 3</h4>
                        <div class="verses">
                            <div class="verse">
                                <span class="verse-number">16</span>
                                <span class="verse-text">神爱世人，甚至将他的独生子赐给他们，叫一切信他的，不致灭亡，反得永生。</span>
                            </div>
                        </div>
                    </div>
                `;
                console.debug('Displayed hardcoded fallback verse');
            } else {
                this.showErrorMessage(`加载默认经文时出错: ${error.message}`);
            }
        }
    }
} 