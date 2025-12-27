function initThemeToggle() {
    const toggle = document.querySelector("[data-theme-toggle]");
    if (!toggle) return;

    const storageKey = "cofcs214-theme";
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");

    function applyTheme(theme) {
        document.body.dataset.theme = theme;
        toggle.setAttribute("aria-pressed", theme === "light" ? "true" : "false");
        const label = theme === "dark" ? "Switch to light mode" : "Switch to dark mode";
        toggle.setAttribute("aria-label", label);
        toggle.setAttribute("title", label);
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
    initCompilerPlayground();
    initRoadmapForm();
    initBackToTop();
});

function initCompilerPlayground() {
    const codeEditor = document.querySelector("[data-compiler-code]");
    const stdinEditor = document.querySelector("[data-compiler-stdin]");
    const templateSelect = document.querySelector("[data-compiler-template]");
    const runButton = document.querySelector("[data-compiler-run]");
    const statusField = document.querySelector("[data-compiler-status]");
    const outputField = document.querySelector("[data-compiler-output]");
    if (!codeEditor || !templateSelect || !runButton || !statusField || !outputField) return;

    const templates = {
        hello: `#include <iostream>
int main() {
    std::cout << "Hello COSC214!" << std::endl;
    return 0;
}`,
        sum: `#include <iostream>
int main() {
    int a = 0;
    int b = 0;
    std::cin >> a >> b;
    std::cout << "Sum: " << a + b << std::endl;
    return 0;
}`,
        loop: `#include <iostream>
#include <vector>

int main() {
    std::vector<int> scores {90, 82, 77, 88, 95};
    for (const auto &score : scores) {
        if (score >= 90) {
            std::cout << "Honors: " << score << std::endl;
        } else if (score >= 80) {
            std::cout << "Solid: " << score << std::endl;
        } else {
            std::cout << "Review chapter 3: " << score << std::endl;
        }
    }
    return 0;
}`
    };

    const endpoint = "https://wandbox.org/api/compile.json";

    function setStatus(message, state) {
        statusField.textContent = message;
        if (state) {
            statusField.dataset.state = state;
        } else {
            delete statusField.dataset.state;
        }
    }

    function loadTemplate(key) {
        if (key === "custom") {
            codeEditor.value = "";
        } else if (templates[key]) {
            codeEditor.value = templates[key];
        } else {
            return;
        }

        stdinEditor.value = "";
        setStatus("Template loaded. Ready to compile.");
        outputField.textContent = "Your stdout and compiler logs will appear here.";
    }

    loadTemplate(templateSelect.value || "hello");

    templateSelect.addEventListener("change", (event) => {
        loadTemplate(event.target.value);
    });

    runButton.addEventListener("click", async () => {
        const source = codeEditor.value.trim();
        if (!source) {
            setStatus("Add C++ source code first.", "error");
            outputField.textContent = "No source provided.";
            return;
        }

        runButton.disabled = true;
        setStatus("Submitting to compiler...", "running");
        outputField.textContent = "";

        try {
            const response = await fetch(endpoint, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    code: source,
                    stdin: stdinEditor.value,
                    compiler: "gcc-head",
                    options: "warning,gnu++17",
                    save: false
                })
            });

            if (!response.ok) {
                throw new Error(`Compiler unreachable (${response.status})`);
            }

            const result = await response.json();
            const logs = [
                result.program_output,
                result.program_error,
                result.compiler_output,
                result.compiler_error
            ]
                .filter(Boolean)
                .join("\n");

            if (result.status === "0") {
                setStatus("Compiled successfully.", "success");
            } else {
                setStatus("Compilation finished with messages.", "error");
            }

            outputField.textContent = logs || "No output returned.";
        } catch (error) {
            setStatus("Unable to reach the compiler service.", "error");
            outputField.textContent = `Request failed: ${error.message}`;
        } finally {
            runButton.disabled = false;
        }
    });
}

function initRoadmapForm() {
    const form = document.querySelector("[data-roadmap-form]");
    const resultPanel = document.querySelector("[data-roadmap-result]");
    if (!form || !resultPanel) return;

    function renderPlan(plan) {
        resultPanel.innerHTML = `
            <h3>Next sprint: ${plan.summary}</h3>
            <div>
                <strong>Chapters to review</strong>
                <ul>${plan.chapters.map((item) => `<li>${item}</li>`).join("")}</ul>
            </div>
            <div>
                <strong>Exercises to run</strong>
                <ul>${plan.exercises.map((item) => `<li>${item}</li>`).join("")}</ul>
            </div>
            <div>
                <strong>Problem sets to attempt</strong>
                <ul>${plan.problems.map((item) => `<li>${item}</li>`).join("")}</ul>
            </div>
        `;
    }

    function buildPlan(data) {
        const { confidence, debugging, time, goal, topic } = data;
        const chapters = [];
        const exercises = [];
        const problems = [];

        if (confidence === "low") {
            chapters.push("Chapter 01 · Rewatch foundations lecture deck");
            chapters.push("Chapter 02 · Focus on conditionals & loops walkthrough");
        } else if (confidence === "medium") {
            chapters.push("Chapter 03 · Arrays & strings walkthrough");
        } else {
            chapters.push("Chapter 04 · Object-oriented recap");
        }

        if (debugging === "stuck") {
            exercises.push("Re-run compiler playground: input validation drills");
            exercises.push("Repeat guided hints for nested loops lab");
        } else if (debugging === "uncertain") {
            exercises.push("Complete the Chapter 03 string parsing lab");
        } else {
            exercises.push("Tackle the memory management sandbox");
        }

        if (goal === "interview") {
            problems.push("Problem Set C · Object-oriented design scenario");
            problems.push("Problem Set B · Iterative data processing challenge");
        } else if (goal === "push") {
            problems.push("Problem Set B · Data aggregation drills");
        } else {
            problems.push("Problem Set A · Branching confidence boosters");
        }

        const minutes = Number(time) || 60;
        const focusText = topic ? `Focus on ${topic.trim()}. ` : "";

        return {
            summary: `${minutes} minute focus block. ${focusText}`.trim(),
            chapters,
            exercises,
            problems
        };
    }

    form.addEventListener("submit", (event) => {
        event.preventDefault();
        const formData = new FormData(form);
        const plan = buildPlan({
            confidence: formData.get("confidence"),
            debugging: formData.get("debugging"),
            time: formData.get("time"),
            goal: formData.get("goal"),
            topic: formData.get("topic")
        });
        renderPlan(plan);
    });
}

function initBackToTop() {
    const button = document.querySelector("[data-back-to-top]");
    if (!button) return;

    const threshold = 320;

    function toggleVisibility() {
        if (window.scrollY > threshold) {
            button.classList.add("is-visible");
        } else {
            button.classList.remove("is-visible");
        }
    }

    button.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    });

    window.addEventListener("scroll", toggleVisibility);
    toggleVisibility();
}
