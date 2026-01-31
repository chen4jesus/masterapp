(function() {
  let selectedTags = new Set();
  let selectedCategories = new Set();
  let blogIndex = [];
  let currentPage = 1;
  const ITEMS_PER_PAGE = 10;
  const container = document.getElementById('blog-posts-container');
  const pagination = document.getElementById('blog-pagination-container');
  const originalContent = container ? container.innerHTML : '';
  const originalPagination = pagination ? pagination.innerHTML : '';

  // Initialize from URL
  const init = () => {
    const params = new URLSearchParams(window.location.search);
    const tags = params.get('tags');
    const cats = params.get('cats');
    const page = params.get('page');

    if (tags) tags.split(',').forEach(t => selectedTags.add(decodeURIComponent(t)));
    if (cats) cats.split(',').forEach(c => selectedCategories.add(decodeURIComponent(c)));
    if (page) currentPage = parseInt(page) || 1;

    updateButtonStates();
    if (selectedTags.size > 0 || selectedCategories.size > 0) {
      applyFilters();
    }
  };

  const updateButtonStates = () => {
    document.querySelectorAll('.filter-tag-btn').forEach(btn => {
      const tag = btn.dataset.tag;
      btn.classList.toggle('bg-primary', selectedTags.has(tag));
      btn.classList.toggle('text-white', selectedTags.has(tag));
      btn.classList.toggle('border-primary', selectedTags.has(tag));
    });
    document.querySelectorAll('.filter-category-btn').forEach(btn => {
      const cat = btn.dataset.category;
      btn.classList.toggle('bg-primary', selectedCategories.has(cat));
      btn.classList.toggle('text-white', selectedCategories.has(cat));
      btn.classList.toggle('border-primary', selectedCategories.has(cat));
    });
  };

  const loadIndex = async (forceRefresh = false) => {
    if (blogIndex.length > 0 && !forceRefresh) return blogIndex;
    try {
      // Add cache-busting timestamp to ensure fresh index data
      const indexUrl = window.indexURL || '/searchindex.json';
      const cacheBuster = '?v=' + Date.now();
      const res = await fetch(indexUrl + cacheBuster);
      const data = await res.json();
      blogIndex = data.filter(item => item.section === 'blog' || item.section === 'Blog' || item.section === '全部文章' || item.section === '文章');
      return blogIndex;
    } catch (e) {
      console.error('Filter load failed', e);
      return [];
    }
  };

  // Listen for Hugo's livereload to refresh the index when content changes
  if (typeof window !== 'undefined') {
    // Detect page reload from livereload (new content available)
    let lastRefreshTime = Date.now();
    const checkForUpdates = () => {
      // Hugo livereload triggers a page reload, but we can also periodically refresh the index
      // This is mainly for single-page-app-like behavior
    };

    // Hook into Hugo's livereload if available
    window.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'reload') {
        // Hugo is reloading, refresh the index
        blogIndex = [];
      }
    });
  }

  const applyFilters = async () => {
    if (selectedTags.size === 0 && selectedCategories.size === 0) {
      container.innerHTML = originalContent;
      if (pagination) pagination.innerHTML = originalPagination;
      currentPage = 1;
      updateURL();
      return;
    }

    container.innerHTML = '<div class="col-12 text-center py-20"><i class="fa-solid fa-circle-notch fa-spin text-4xl text-primary"></i></div>';
    if (pagination) pagination.innerHTML = '';

    const index = await loadIndex();
    const filtered = index.filter(item => {
      const itemTags = item.tags ? item.tags.split(',').map(t => t.trim().toLowerCase()) : [];
      const itemCats = item.categories ? item.categories.split(',').map(c => c.trim().toLowerCase()) : [];

      // Tag selection: Union (must have ANY of selected tags) - OR logic
      const hasAnyTag = selectedTags.size === 0 || Array.from(selectedTags).some(t => itemTags.includes(t.toLowerCase()));

      // Category selection: Union (must have ANY of selected categories) - OR logic
      const hasAnyCat = selectedCategories.size === 0 || Array.from(selectedCategories).some(c => itemCats.includes(c.toLowerCase()));

      return hasAnyTag && hasAnyCat;
    });

    renderResults(filtered);
    updateURL();
  };

  const updateURL = () => {
    const params = new URLSearchParams();
    if (selectedTags.size > 0) params.set('tags', Array.from(selectedTags).join(','));
    if (selectedCategories.size > 0) params.set('cats', Array.from(selectedCategories).join(','));
    if (currentPage > 1) params.set('page', currentPage);

    const newRelativePathQuery = window.location.pathname + (params.toString() ? '?' + params.toString() : '');
    history.pushState(null, '', newRelativePathQuery);
  };

  const renderResults = (results) => {
    if (results.length === 0) {
      container.innerHTML = '<div class="col-12 text-center py-20"><p class="text-xl opacity-50">没有找到匹配的文章 • No articles found</p></div>';
      if (pagination) pagination.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(results.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageResults = results.slice(startIndex, endIndex);

    const html = pageResults.map(item => {
      const cat = item.categories ? item.categories.split(',')[0].trim() : '';
      let icon = '<i class="fa-solid fa-feather-pointed text-primary dark:text-white text-xl"></i>';
      if (cat.toLowerCase().includes('book')) icon = '<i class="fa-solid fa-book-open text-primary dark:text-white text-xl"></i>';
      else if (cat.toLowerCase().includes('reformed')) icon = '<i class="fa-solid fa-scroll text-primary dark:text-white text-xl"></i>';
      else if (cat) icon = '<i class="fa-solid fa-newspaper text-primary dark:text-white text-xl"></i>';

      const imgHtml = item.image ? `
        <div class="relative w-full h-64 overflow-hidden">
          <img src="${item.image}" alt="${item.title}" class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
          <div class="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
        </div>
      ` : '';

      return `
        <div class="md:col-4 mb-14">
          <div class="group relative bg-body dark:bg-darkmode-light border border-border/60 dark:border-darkmode-border/50 rounded-3xl shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 overflow-hidden h-full flex flex-col dark:hover:bg-[#2d2d2d]">
            ${imgHtml}
            <div class="p-8 flex flex-col flex-grow relative text-center md:text-left">
              <div class="flex flex-col md:flex-row items-center md:items-start gap-4 mb-4">
                <div class="flex-shrink-0 w-12 h-12 rounded-xl bg-primary/5 dark:bg-primary/10 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 dark:group-hover:bg-white/20">
                  ${icon}
                </div>
                <div class="flex-grow w-full">
                  <h4 class="text-xl font-bold leading-tight transition-colors duration-300 group-hover:text-primary dark:text-white dark:group-hover:text-white">
                    <a href="${item.slug}" class="block after:absolute after:inset-0">${item.title}</a>
                  </h4>
                </div>
              </div>
              <p class="mb-8 flex-grow text-text-light dark:text-white/70 line-clamp-3 text-base leading-relaxed">
                ${item.description || item.content.substring(0, 100) + '...'}
              </p>
              <div class="mt-auto flex items-center justify-center md:justify-between">
                <div class="inline-flex items-center text-primary dark:text-white font-bold text-base transition-all duration-300 group-hover:text-primary dark:group-hover:text-white group-hover:gap-2">
                  查看内容
                  <svg class="w-5 h-5 ml-1 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M13 7l5 5m0 0l-5 5m5-5H6"></path>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = html;

    // Render pagination
    if (pagination && totalPages > 1) {
      renderPagination(totalPages, results);
    } else if (pagination) {
      pagination.innerHTML = '';
    }
  };

  const renderPagination = (totalPages, allResults) => {
    let paginationHtml = '<nav class="flex justify-center items-center gap-2 mt-8 flex-wrap">';

    // Previous button
    if (currentPage > 1) {
      paginationHtml += `<button class="filter-page-btn flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all duration-200" data-page="${currentPage - 1}"><i class="fa-solid fa-chevron-left text-sm"></i></button>`;
    }

    // Page numbers
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
      paginationHtml += `<button class="filter-page-btn flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all duration-200 font-medium" data-page="1">1</button>`;
      if (startPage > 2) paginationHtml += '<span class="flex items-center justify-center w-10 h-10 text-gray-400">...</span>';
    }

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage;
      const activeClass = 'bg-black dark:bg-white text-white dark:text-black font-medium';
      const inactiveClass = 'bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 font-medium';

      paginationHtml += `<button class="filter-page-btn flex items-center justify-center w-10 h-10 rounded-lg transition-all duration-200 ${isActive ? activeClass : inactiveClass}" data-page="${i}">${i}</button>`;
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) paginationHtml += '<span class="flex items-center justify-center w-10 h-10 text-gray-400">...</span>';
      paginationHtml += `<button class="filter-page-btn flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all duration-200 font-medium" data-page="${totalPages}">${totalPages}</button>`;
    }

    // Next button
    if (currentPage < totalPages) {
      paginationHtml += `<button class="filter-page-btn flex items-center justify-center w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/20 transition-all duration-200" data-page="${currentPage + 1}"><i class="fa-solid fa-chevron-right text-sm"></i></button>`;
    }

    paginationHtml += '</nav>';
    paginationHtml += `<p class="text-center mt-4 text-sm text-gray-400 dark:text-gray-500">共 ${allResults.length} 篇文章 • 第 ${currentPage} / ${totalPages} 页</p>`;

    pagination.innerHTML = paginationHtml;

    // Add click handlers for pagination buttons
    pagination.querySelectorAll('.filter-page-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.dataset.page);
        renderResults(allResults);
        updateURL();
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    });
  };

  // Event Listeners
  document.addEventListener('click', (e) => {
    const tagBtn = e.target.closest('.filter-tag-btn');
    if (tagBtn) {
      const tag = tagBtn.dataset.tag;
      if (selectedTags.has(tag)) selectedTags.delete(tag);
      else selectedTags.add(tag);
      currentPage = 1; // Reset to page 1 when filters change
      updateButtonStates();
      applyFilters();
      updateToggleCount();
    }

    const catBtn = e.target.closest('.filter-category-btn');
    if (catBtn) {
      const cat = catBtn.dataset.category;
      if (selectedCategories.has(cat)) selectedCategories.delete(cat);
      else selectedCategories.add(cat);
      currentPage = 1; // Reset to page 1 when filters change
      updateButtonStates();
      applyFilters();
      updateToggleCount();
    }
  });

  const updateToggleCount = () => {
    const total = selectedTags.size + selectedCategories.size;
    const toggleBtn = document.getElementById('filter-toggle-btn');
    const clearBtn = document.getElementById('clear-all-filters-btn');
    const filtersDisplay = document.getElementById('selected-filters-display');

    if (!toggleBtn) return;

    // Update count badge
    let countBadge = toggleBtn.querySelector('.filter-count-badge');
    if (total > 0) {
      if (!countBadge) {
        countBadge = document.createElement('span');
        countBadge.className = 'filter-count-badge ml-2 px-2 py-0.5 bg-white text-primary rounded-full text-xs font-bold animate-fade-in text-center flex items-center justify-center';
        toggleBtn.querySelector('span').after(countBadge);
      }
      countBadge.innerText = total;
    } else if (countBadge) {
      countBadge.remove();
    }

    // Show/hide clear all button
    if (clearBtn) {
      if (total > 0) {
        clearBtn.classList.remove('hidden');
        clearBtn.classList.add('flex');
      } else {
        clearBtn.classList.add('hidden');
        clearBtn.classList.remove('flex');
      }
    }

    // Update selected filters display
    if (filtersDisplay) {
      if (total > 0) {
        filtersDisplay.classList.remove('hidden');
        filtersDisplay.classList.add('flex');

        // Build the chips - compact design
        let html = '';

        // Category chips (blue)
        selectedCategories.forEach(cat => {
          html += `<span class="filter-chip inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/15 dark:bg-blue-500/25 text-blue-700 dark:text-blue-100 rounded text-xs font-medium border border-blue-500/20 dark:border-blue-400/30">
            <i class="fa-solid fa-folder text-[10px] opacity-70"></i>
            ${cat}
            <button class="remove-filter-chip w-3.5 h-3.5 rounded-full hover:bg-blue-500 hover:text-white flex items-center justify-center transition-all opacity-60 hover:opacity-100" data-type="cat" data-value="${cat}">
              <i class="fa-solid fa-xmark text-[9px]"></i>
            </button>
          </span>`;
        });

        // Tag chips (primary)
        selectedTags.forEach(tag => {
          html += `<span class="filter-chip inline-flex items-center gap-1 px-2 py-0.5 bg-primary/15 dark:bg-primary/25 text-primary-600 dark:text-white rounded text-xs font-medium border border-primary/20 dark:border-white/20">
            <i class="fa-solid fa-tag text-[10px] opacity-70"></i>
            ${tag}
            <button class="remove-filter-chip w-3.5 h-3.5 rounded-full hover:bg-primary hover:text-white flex items-center justify-center transition-all opacity-60 hover:opacity-100" data-type="tag" data-value="${tag}">
              <i class="fa-solid fa-xmark text-[9px]"></i>
            </button>
          </span>`;
        });

        filtersDisplay.innerHTML = html;

        // Add click handlers for individual chip removal
        filtersDisplay.querySelectorAll('.remove-filter-chip').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const type = btn.dataset.type;
            const value = btn.dataset.value;
            if (type === 'tag') {
              selectedTags.delete(value);
            } else if (type === 'cat') {
              selectedCategories.delete(value);
            }
            currentPage = 1;
            updateButtonStates();
            applyFilters();
            updateToggleCount();
          });
        });
      } else {
        filtersDisplay.classList.add('hidden');
        filtersDisplay.classList.remove('flex');
        filtersDisplay.innerHTML = '';
      }
    }
  };

  // Clear all filters button
  const clearAllBtn = document.getElementById('clear-all-filters-btn');
  if (clearAllBtn) {
    clearAllBtn.addEventListener('click', () => {
      selectedTags.clear();
      selectedCategories.clear();
      currentPage = 1;
      updateButtonStates();
      applyFilters();
      updateToggleCount();
    });
  }

  // Handle browser back/forward
  window.addEventListener('popstate', () => {
    selectedTags.clear();
    selectedCategories.clear();
    currentPage = 1;
    init();
    updateToggleCount();
  });

  if (container) {
    init();
    updateToggleCount();
  }
})();

