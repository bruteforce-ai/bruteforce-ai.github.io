// Theme Management
const storageKey = 'theme-preference';

const getColorPreference = () => {
    if (localStorage.getItem(storageKey)) {
        return localStorage.getItem(storageKey);
    }
    // Default to light theme instead of system preference
    return 'light';
};

const setPreference = (theme) => {
    localStorage.setItem(storageKey, theme);
    reflectPreference();
};

const reflectPreference = () => {
    const theme = getColorPreference();
    document.firstElementChild.setAttribute('data-theme', theme);

    const toggle = document.querySelector('#theme-toggle');
    if (toggle) {
        toggle.setAttribute('aria-label', theme);
        const icon = toggle.querySelector('i');
        if (icon) {
            icon.className = theme === 'dark' ? 'lucide-sun' : 'lucide-moon';
            // Trigger Lucide icon replacement if available
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }

    // Re-render Mermaid diagrams for the new theme
    if (window.mermaid) {
        const mermaidTheme = theme === 'dark' ? 'dark' : 'default';
        // Because Mermaid doesn't support easy dynamic theme switching on current SVGs,
        // the most reliable way is often a reload or re-running init if elements are available.
        // However, for a better UX, we can just re-initialize.
        mermaid.initialize({
            startOnLoad: false, // We'll handle it
            theme: mermaidTheme
        });
        // Note: Re-rendering existing SVGs is complex in Mermaid without a reload or DOM manipulation.
        // For simplicity, we'll suggest a page refresh or handle it if specific flows exist.
        // location.reload(); // Simplest fix for Mermaid theme sync - uncomment if a full reload is acceptable
        // Alternatively, if you have specific Mermaid elements, you might re-render them:
        // const mermaidElements = document.querySelectorAll('.mermaid');
        // mermaidElements.forEach(el => {
        //     mermaid.render(el.id, el.textContent);
        // });
    }
};

// Initial sync
reflectPreference();

window.onload = () => {
    reflectPreference();

    const toggle = document.querySelector('#theme-toggle');
    if (toggle) {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            const theme = getColorPreference() === 'light' ? 'dark' : 'light';
            setPreference(theme);
        });
    }
};

// Disabling system listener so the default isn't overwritten during a session
/*
window.matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', ({ matches: isDark }) => {
        setPreference(isDark ? 'dark' : 'light');
    });
*/
