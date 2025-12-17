function normalize(value) {
    return (value || "").toLowerCase().trim();
}

function setupArticleFiltering() {
    const grid = document.getElementById("articleGrid");
    const search = document.getElementById("articleSearch");
    const emptyState = document.getElementById("emptyState");
    const filterButtons = Array.from(document.querySelectorAll("[data-filter]"));

    if (!grid || !search || !emptyState || filterButtons.length === 0) return;

    const cards = Array.from(grid.querySelectorAll(".card"));
    let activeCategory = "all";

    function applyFilters() {
        const query = normalize(search.value);
        let visibleCount = 0;

        for (const card of cards) {
            const cardCategory = card.dataset.category || "";
            const matchesCategory = activeCategory === "all" || cardCategory === activeCategory;
            const haystack = normalize(
                `${card.dataset.title || ""} ${card.dataset.author || ""} ${card.textContent || ""}`
            );
            const matchesQuery = query.length === 0 || haystack.includes(query);

            const shouldShow = matchesCategory && matchesQuery;
            card.hidden = !shouldShow;
            if (shouldShow) visibleCount += 1;
        }

        emptyState.hidden = visibleCount !== 0;
    }

    function setActiveCategory(nextCategory) {
        activeCategory = nextCategory;

        for (const button of filterButtons) {
            const isActive = button.dataset.filter === activeCategory;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        }

        applyFilters();
    }

    for (const button of filterButtons) {
        button.addEventListener("click", () => setActiveCategory(button.dataset.filter || "all"));
    }

    search.addEventListener("input", applyFilters);
    applyFilters();
}

setupArticleFiltering();

function setupMobileNav() {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.getElementById("siteNav");
    if (!toggle || !nav) return;

    function isSmallScreen() {
        return window.matchMedia("(max-width: 840px)").matches;
    }

    function closeNav() {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
    }

    toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        toggle.setAttribute("aria-expanded", String(isOpen));
    });

    for (const link of nav.querySelectorAll("a")) {
        link.addEventListener("click", () => {
            if (isSmallScreen()) closeNav();
        });
    }

    window.addEventListener("resize", () => {
        if (!isSmallScreen()) closeNav();
    });
}

setupMobileNav();
