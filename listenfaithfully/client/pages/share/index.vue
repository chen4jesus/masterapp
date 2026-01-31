<template>
  <div :class="theme" class="min-h-screen transition-colors duration-500 font-sans selection:bg-blue-500/30">
    <div class="theme-bg min-h-screen">
      <!-- Animated Background (Dark Mode) -->
      <div v-if="theme === 'dark'" class="fixed inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-blue-600/10 blur-[120px] rounded-full animate-pulse"></div>
        <div class="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-indigo-600/10 blur-[120px] rounded-full animate-pulse" style="animation-delay: 2s"></div>
      </div>
      <!-- Animated Background (Light Mode) -->
      <div v-else class="fixed inset-0 pointer-events-none overflow-hidden">
        <div class="absolute -top-1/4 -right-1/4 w-1/2 h-1/2 bg-blue-400/5 blur-[120px] rounded-full animate-pulse"></div>
        <div class="absolute -bottom-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-400/5 blur-[120px] rounded-full animate-pulse" style="animation-delay: 2s"></div>
      </div>

      <!-- Layout Wrapper -->
      <div class="relative z-10 max-w-5xl mx-auto px-4 py-8 md:py-16">
        <!-- Header -->
        <header class="text-center mb-8 relative">
          <!-- Theme Toggle -->
          <button @click="toggleTheme" class="absolute -top-4 right-0 w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center text-blue-500 hover:scale-110 transition-all active:scale-95 z-50">
            <span class="material-symbols text-2xl">{{ theme === 'dark' ? 'light_mode' : 'dark_mode' }}</span>
          </button>

          <h1 class="text-4xl md:text-6xl font-black mb-4 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">{{ $strings.PageShareTitle }}</h1>
          <p class="theme-text-muted text-lg md:text-xl font-medium max-w-2xl mx-auto">{{ $strings.PageShareSubheader }}</p>
        </header>

        <!-- Advanced Search & Filter Bar -->
        <div class="mb-10 space-y-4">
          <div class="relative group/search">
            <span class="absolute left-5 top-1/2 -translate-y-1/2 material-symbols text-slate-500 group-focus-within/search:text-blue-400 transition-colors">search</span>
            <input v-model="searchQuery" type="text" :placeholder="$strings.PlaceholderSearch" class="w-full theme-input border rounded-2xl py-4 pl-14 pr-6 placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-all" @input="debouncedFetch" />
          </div>

          <!-- Alphabetical Navigation -->
          <div class="flex flex-wrap justify-center gap-1 sm:gap-2 px-2">
            <button v-for="char in alphabet" :key="char" @click="toggleInitial(char)" class="w-8 h-8 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all border" :class="selectedInitial === char ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/30' : 'theme-pill text-slate-400 hover:text-blue-400'">
              {{ char }}
            </button>
            <button @click="clearFilters" class="px-4 h-8 sm:h-10 rounded-xl flex items-center justify-center font-bold text-xs sm:text-sm transition-all border theme-pill text-slate-400 hover:text-blue-400" v-if="searchQuery || selectedInitial">
              {{ $strings.ButtonClearFilter }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="flex flex-col items-center justify-center py-24">
          <div class="relative w-16 h-16">
            <div class="absolute inset-0 border-4 border-blue-500/20 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p class="mt-4 theme-text-muted font-medium animate-pulse">{{ $strings.MessageLoadingSharedLibrary }}</p>
        </div>

        <!-- Empty State -->
        <div v-else-if="groups.length === 0" class="text-center py-32 glass rounded-3xl border border-white/5 mx-auto max-w-xl">
          <span class="material-symbols text-6xl text-slate-700 mb-4 block">folder_off</span>
          <h3 class="text-2xl font-bold text-slate-400 mb-2">{{ searchQuery || selectedInitial ? $strings.MessageBookshelfNoResultsForQuery : $strings.MessageNoActiveShares }}</h3>
          <p class="theme-text-muted">{{ searchQuery || selectedInitial ? '' : $strings.MessageNoPublicSharesAvailable }}</p>
        </div>

        <!-- Tree View List -->
        <div v-else class="space-y-6">
          <div v-for="group in visibleGroups" :key="group.name" class="group/category">
            <div @click="toggleGroup(group.name)" class="flex items-center justify-between p-5 rounded-2xl glass border border-white/5 cursor-pointer hover:bg-blue-500/5 transition-all duration-300">
              <div class="flex items-center space-x-4">
                <div class="w-10 h-10 flex items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 group-hover/category:scale-110 transition-transform">
                  <span v-if="isGroupLoading(group.name)" class="material-symbols text-2xl animate-spin">progress_activity</span>
                  <span v-else class="material-symbols text-2xl transition-transform duration-300" :class="isGroupOpen(group.name) ? 'rotate-90' : ''">chevron_right</span>
                </div>
                <div>
                  <h2 class="text-xl font-bold theme-text-main" v-html="highlightText(group.name)"></h2>
                  <p class="text-sm theme-text-muted uppercase tracking-wider font-semibold">{{ group.count === 1 ? $getString('LabelSharedItemCount', [group.count]) : $getString('LabelSharedItemsCount', [group.count]) }}</p>
                </div>
              </div>
            </div>

            <transition enter-active-class="transition duration-300 ease-out" enter-from-class="transform -translate-y-4 opacity-0" enter-to-class="transform translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="transform translate-y-0 opacity-100" leave-to-class="transform -translate-y-4 opacity-0">
              <div v-show="isGroupOpen(group.name)" class="mt-3 ml-4 md:ml-8 space-y-3">
                <!-- Loading state for group items -->
                <div v-if="isGroupLoading(group.name)" class="flex items-center justify-center p-8">
                  <div class="relative w-8 h-8">
                    <div class="absolute inset-0 border-2 border-blue-500/20 rounded-full"></div>
                    <div class="absolute inset-0 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                  <p class="ml-3 theme-text-muted text-sm">{{ $strings.MessageLoadingItems }}</p>
                </div>

                <!-- Group items -->
                <div v-else v-for="share in getGroupShares(group.name)" :key="share.id" class="flex items-center justify-between p-3 sm:p-4 pl-4 sm:pl-6 rounded-2xl theme-item-bg border border-white/5 hover:border-blue-500/30 transition-all duration-300 group/item">
                  <div class="flex-1 min-w-0 pr-2 sm:pr-4">
                    <h3 class="font-bold theme-text-main text-base sm:text-lg line-clamp-2 leading-tight mb-1" v-html="highlightText(share.title)"></h3>
                    <div class="flex items-center space-x-3">
                      <span class="text-[10px] sm:text-xs px-2 py-0.5 rounded-full theme-badge text-slate-400 font-bold uppercase tracking-tighter">{{ share.mediaItemType === 'book' ? $strings.LabelAudiobook : $strings.LabelPodcast }}</span>
                      <span v-if="share.expiresAt" class="text-[10px] sm:text-xs theme-text-muted">Exp: {{ formatDate(share.expiresAt) }}</span>
                    </div>
                  </div>

                  <div class="flex items-center flex-shrink-0 ml-2">
                    <button @click="playShare(share)" class="group-hover/item:scale-105 transition-all duration-300 h-10 sm:h-12 px-3 sm:px-6 rounded-xl theme-btn-primary theme-btn-primary-hover flex items-center space-x-1 sm:space-x-2 font-bold shadow-lg shadow-blue-600/20 active:scale-95 text-white">
                      <span class="material-symbols text-lg sm:text-xl">play_circle</span>
                      <span class="text-sm sm:text-base">{{ $strings.ButtonListen }}</span>
                    </button>
                  </div>
                </div>

                <!-- Load more items button -->
                <div v-if="hasMoreGroupShares(group.name)" class="flex justify-center pt-2">
                  <button @click="loadMoreGroupShares(group.name)" class="flex items-center space-x-2 theme-text-muted hover:text-blue-400 font-bold transition-colors py-2 px-4 rounded-xl hover:bg-blue-400/5">
                    <span class="material-symbols text-xl">add_circle</span>
                    <span class="text-sm uppercase tracking-wider">{{ $strings.LabelShowMore }}</span>
                  </button>
                </div>
              </div>
            </transition>
          </div>

          <!-- Scroll Trigger for Infinite Scroll -->
          <div v-show="hasMoreGroups" ref="scrollTrigger" class="flex items-center justify-center p-12">
            <div class="w-8 h-8 border-4 border-white/10 border-t-white/30 rounded-full animate-spin"></div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <footer class="max-w-5xl mx-auto px-4 py-12 text-center text-slate-500 text-sm font-medium transition-colors">&copy; {{ new Date().getFullYear() }} Listen Faithfully &bull; {{ $strings.LabelSharedLibraryAccess }}</footer>

      <!-- Back to Top Button -->
      <transition enter-active-class="transition duration-300 ease-out" enter-from-class="translate-y-10 opacity-0" enter-to-class="translate-y-0 opacity-100" leave-active-class="transition duration-200 ease-in" leave-from-class="translate-y-0 opacity-100" leave-to-class="translate-y-10 opacity-0">
        <button v-show="showBackToTop" @click="scrollToTop" class="fixed bottom-8 right-8 z-50 w-12 h-12 rounded-2xl glass border border-white/10 flex items-center justify-center text-blue-400 hover:text-white hover:bg-blue-600 hover:border-blue-500 shadow-2xl shadow-blue-600/20 active:scale-95 transition-all group">
          <span class="material-symbols text-2xl group-hover:-translate-y-1 transition-transform">arrow_upward</span>
        </button>
      </transition>
    </div>
  </div>
</template>

<script>
export default {
  layout: 'blank',
  head() {
    return {
      title: `${this.$strings.PageShareTitle} | Listen Faithfully`,
      meta: [{ hid: 'description', name: 'description', content: this.$strings.PageShareMetaDescription }],
      link: [{ rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200' }]
    }
  },
  data() {
    return {
      groups: [], // Array of { name, count }
      groupShares: {}, // Map of groupName -> shares array (lazy loaded)
      loadingGroups: {}, // Map of groupName -> boolean (loading state)
      openGroups: {}, // Map of groupName -> boolean (open state)
      loading: true,
      searchQuery: '',
      selectedInitial: null,
      alphabet: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''),
      debounceTimeout: null,
      displayedLimit: 50,
      groupItemLimits: {}, // Map of groupName -> current display limit
      scrollObserver: null,
      showBackToTop: false,
      theme: 'light'
    }
  },
  computed: {
    visibleGroups() {
      return this.groups.slice(0, this.displayedLimit)
    },
    hasMoreGroups() {
      return this.displayedLimit < this.groups.length
    }
  },
  methods: {
    async fetchGroups() {
      try {
        this.loading = true
        this.displayedLimit = 50 // Reset limit on fetch

        let url = '/public/shares/groups'
        const params = new URLSearchParams()
        if (this.searchQuery) params.append('search', this.searchQuery)
        if (this.selectedInitial) params.append('initial', this.selectedInitial)

        if (params.toString()) url += `?${params.toString()}`

        // Fetch only the group summaries (lightweight)
        const [data] = await Promise.all([this.$axios.$get(url), new Promise((resolve) => setTimeout(resolve, 400))])
        this.groups = data
        this.setupInfiniteScroll()
      } catch (error) {
        console.error('Failed to fetch share groups', error)
        if (this.$toast) this.$toast.error('Failed to load shared media')
      } finally {
        this.loading = false
      }
    },
    debouncedFetch() {
      clearTimeout(this.debounceTimeout)
      this.debounceTimeout = setTimeout(() => {
        this.fetchGroups()
      }, 500)
    },
    toggleInitial(char) {
      if (this.selectedInitial === char) {
        this.selectedInitial = null
      } else {
        this.selectedInitial = char
      }
      this.fetchGroups()
    },
    clearFilters() {
      this.searchQuery = ''
      this.selectedInitial = null
      this.fetchGroups()
    },
    setupInfiniteScroll() {
      if (this.scrollObserver) this.scrollObserver.disconnect()

      this.scrollObserver = new IntersectionObserver(
        (entries) => {
          if (entries[0].isIntersecting && this.hasMoreGroups) {
            this.loadMore()
          }
        },
        { threshold: 0.1 }
      )

      this.$nextTick(() => {
        if (this.$refs.scrollTrigger) {
          this.scrollObserver.observe(this.$refs.scrollTrigger)
        }
      })
    },
    loadMore() {
      this.displayedLimit += 50
    },
    async fetchGroupShares(groupName) {
      if (this.groupShares[groupName] || this.loadingGroups[groupName]) {
        // Already loaded or currently loading
        return
      }

      try {
        this.$set(this.loadingGroups, groupName, true)
        const encodedName = encodeURIComponent(groupName)
        const data = await this.$axios.$get(`/public/shares/group/${encodedName}`)
        this.$set(this.groupShares, groupName, data)
      } catch (error) {
        console.error(`Failed to fetch shares for group "${groupName}"`, error)
        if (this.$toast) this.$toast.error(`Failed to load items for ${groupName}`)
        // Set empty array on error so we don't keep retrying
        this.$set(this.groupShares, groupName, [])
      } finally {
        this.$set(this.loadingGroups, groupName, false)
      }
    },
    async toggleGroup(groupName) {
      const isCurrentlyOpen = this.openGroups[groupName]

      if (!isCurrentlyOpen) {
        // Opening the group - fetch shares if not loaded
        this.$set(this.openGroups, groupName, true)
        await this.fetchGroupShares(groupName)
      } else {
        // Closing the group
        this.$set(this.openGroups, groupName, false)
      }
    },
    isGroupOpen(groupName) {
      return !!this.openGroups[groupName]
    },
    isGroupLoading(groupName) {
      return !!this.loadingGroups[groupName]
    },
    getGroupShares(groupName) {
      const shares = this.groupShares[groupName] || []
      const limit = this.groupItemLimits[groupName] || 20

      let filteredShares = shares
      if (this.searchQuery) {
        const search = this.searchQuery.toLowerCase()
        const groupMatches = groupName.toLowerCase().includes(search)
        filteredShares = shares.filter((share) => {
          return groupMatches || (share.title && share.title.toLowerCase().includes(search))
        })
      }

      return filteredShares.slice(0, limit)
    },
    hasMoreGroupShares(groupName) {
      const shares = this.groupShares[groupName] || []
      const limit = this.groupItemLimits[groupName] || 20

      let filteredCount = shares.length
      if (this.searchQuery) {
        const search = this.searchQuery.toLowerCase()
        const groupMatches = groupName.toLowerCase().includes(search)
        filteredCount = shares.filter((s) => groupMatches || (s.title && s.title.toLowerCase().includes(search))).length
      }

      return limit < filteredCount
    },
    loadMoreGroupShares(groupName) {
      const currentLimit = this.groupItemLimits[groupName] || 20
      this.$set(this.groupItemLimits, groupName, currentLimit + 20)
    },
    playShare(share) {
      this.$router.push(`/share/${share.slug}`)
    },
    formatDate(date) {
      if (!date) return ''
      return new Date(date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
    },
    highlightText(text) {
      if (!this.searchQuery) return text
      const regex = new RegExp(`(${this.searchQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi')
      return text.replace(regex, '<span class="text-blue-400 bg-blue-400/10 rounded px-0.5 shadow-sm">$1</span>')
    },
    handleScroll() {
      this.showBackToTop = window.scrollY > 300
    },
    scrollToTop() {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    toggleTheme() {
      this.theme = this.theme === 'dark' ? 'light' : 'dark'
      localStorage.setItem('share-theme', this.theme)
    }
  },
  mounted() {
    const savedTheme = localStorage.getItem('share-theme')
    if (savedTheme) this.theme = savedTheme

    this.fetchGroups()
    this.setupInfiniteScroll()
    window.addEventListener('scroll', this.handleScroll)
  },
  beforeDestroy() {
    if (this.scrollObserver) this.scrollObserver.disconnect()
    window.removeEventListener('scroll', this.handleScroll)
  }
}
</script>

<style scoped>
.dark .theme-bg {
  background-color: #0f172a;
} /* slate-900 */
.light .theme-bg {
  background-color: #f8fafc;
} /* slate-50 */

.theme-bg {
  min-height: 100vh;
  transition: background-color 0.5s ease;
}

.glass {
  transition: all 0.3s ease;
}
.dark .glass {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-color: rgba(255, 255, 255, 0.05);
}
.light .glass {
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-color: rgba(0, 0, 0, 0.05);
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.03);
}

.dark .theme-text-main {
  color: #f1f5f9;
} /* slate-100 */
.light .theme-text-main {
  color: #0f172a;
} /* slate-900 */

.dark .theme-text-muted {
  color: #94a3b8;
} /* slate-400 */
.light .theme-text-muted {
  color: #64748b;
} /* slate-500 */

.dark .theme-input {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
  color: white;
}
.light .theme-input {
  background: white;
  border-color: rgba(0, 0, 0, 0.08);
  color: #0f172a;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.02);
}

.dark .theme-pill {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.05);
}
.light .theme-pill {
  background: white;
  border-color: rgba(0, 0, 0, 0.05);
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.dark .theme-item-bg {
  background: rgba(255, 255, 255, 0.05);
}
.light .theme-item-bg {
  background: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
}

.dark .theme-btn-primary {
  background-color: #2563eb;
} /* blue-600 */
.dark .theme-btn-primary-hover:hover {
  background-color: #3b82f6;
} /* blue-500 */

.light .theme-btn-primary {
  background-color: #60a5fa;
} /* blue-400 - lighter */
.light .theme-btn-primary-hover:hover {
  background-color: #3b82f6;
} /* blue-500 */

.dark .theme-badge {
  background: #1e293b;
} /* slate-800 */
.light .theme-badge {
  background: #f1f5f9;
} /* slate-100 */

.material-symbols {
  font-family: 'Material Symbols Outlined';
  font-weight: normal;
  font-style: normal;
  font-size: 24px;
  line-height: 1;
  letter-spacing: normal;
  text-transform: none;
  display: inline-block;
  white-space: nowrap;
  word-wrap: normal;
  direction: ltr;
  -webkit-font-smoothing: antialiased;
}

/* Custom Scrollbar */
::-webkit-scrollbar {
  width: 8px;
}
::-webkit-scrollbar-track {
  background: transparent;
}
.dark ::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
}
.light ::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.1);
}
::-webkit-scrollbar-thumb:hover {
  background: rgba(59, 130, 246, 0.5); /* blue-500 */
}
</style>
