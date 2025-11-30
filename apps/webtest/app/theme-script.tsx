// Blocking script to prevent FOUC (Flash of Unstyled Content)
// This runs BEFORE React hydration to set theme from localStorage
// Pure SSR-compatible - no React hooks or context

export function ThemeScript() {
  // Script content as a string - will be inlined in <head>
  const script = `
(function() {
  try {
    var mode = localStorage.getItem('theme-mode') || 'system';
    var color = localStorage.getItem('theme-color') || 'default';
    
    // Determine dark/light mode
    var isDark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Apply classes immediately before first paint
    document.documentElement.classList.toggle('dark', isDark);
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    
    // Apply color theme
    if (color && color !== 'default') {
      document.documentElement.setAttribute('data-theme', color);
    }
  } catch (e) {}
})();
`

  return (
    <script
      dangerouslySetInnerHTML={{ __html: script }}
      // Blocking script - must run before paint
      // Note: This is intentionally NOT async/defer
    />
  )
}

