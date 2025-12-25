function initThemeToggle() {
    const toggle = document.querySelector("[data-theme-toggle]");
    const toggleText = document.querySelector("[data-theme-toggle-text]");
    if (!toggle || !toggleText) return;

    const storageKey = "cofcs214-theme";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme(theme) {
        document.body.dataset.theme = theme;
        toggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
        toggleText.textContent = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
        localStorage.setItem(storageKey, theme);
    }

    const savedTheme = localStorage.getItem(storageKey);
    const initialTheme = savedTheme || (prefersDark.matches ? "dark" : "light");
    applyTheme(initialTheme);

    toggle.addEventListener("click", () => {
        const nextTheme = document.body.dataset.theme === "dark" ? "light" : "dark";
        applyTheme(nextTheme);
    });
}

function setupMobileNav() {
    const nav = document.getElementById("siteNav");
    const toggle = document.querySelector(".nav-toggle");
    if (!nav || !toggle) return;

    const links = nav.querySelectorAll("a");
    const smallScreen = window.matchMedia("(max-width: 960px)");

    function closeNav() {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
    });

    links.forEach((link) => {
        link.addEventListener("click", () => {
            if (smallScreen.matches) closeNav();
        });
    });

    smallScreen.addEventListener("change", (event) => {
        if (!event.matches) closeNav();
    });
}

document.addEventListener("DOMContentLoaded", () => {
    initThemeToggle();
    setupMobileNav();
});
