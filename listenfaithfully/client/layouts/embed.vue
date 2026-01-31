<template>
  <div class="embed-layout text-white bg-transparent">
    <Nuxt />
  </div>
</template>

<script>
export default {
  head() {
    return {
      meta: [{ hid: 'robots', name: 'robots', content: 'noindex, nofollow' }]
    }
  },
  mounted() {
    // Remove any body classes that might interfere with embedding
    document.body.classList.remove('app-bar', 'app-bar-and-toolbar', 'no-bars')
    document.body.classList.add('embed-mode')
    document.body.style.backgroundColor = 'transparent'
    document.documentElement.style.backgroundColor = 'transparent'
  },
  beforeDestroy() {
    document.body.classList.remove('embed-mode')
  }
}
</script>

<style>
.embed-layout {
  min-height: 100%;
  width: 100%;
  overflow: hidden;
}

html.embed-mode,
body.embed-mode {
  background: transparent !important;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>
