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
    initVibeStage();
    initBackToTop();
    initPomodoroTimer();
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

        if (stdinEditor) {
            stdinEditor.value = "";
        }
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
                    stdin: stdinEditor ? stdinEditor.value : "",
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

function initVibeStage() {
    const stage = document.querySelector("[data-vibe-stage]");
    if (!stage) return;

    const vibeRoot = stage.closest("[data-vibe-root]");
    const title = document.querySelector("[data-vibe-label]");
    const description = document.querySelector("[data-vibe-description]");
    const link = document.querySelector("[data-vibe-link]");
    const counter = document.querySelector("[data-vibe-counter]");
    const prevButton = document.querySelector("[data-vibe-prev]");
    const nextButton = document.querySelector("[data-vibe-next]");
    const fullscreenButton = stage.querySelector("[data-vibe-fullscreen]");

    const backgrounds = [
        {
            title: "Background 01 · Dawn loft",
            description: "Amber sunrise glow with soft synth reflections you just dropped into /images.",
            image: "images/Background1.jpg",
            overlay: "rgba(2, 5, 12, 0.35)",
            link: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
            linkLabel: "Play lofi beats"
        },
        {
            title: "Background 02 · Chill nebula",
            description: "A moody wallpaper from your pack—use it for night sprints.",
            image: "images/Background2.jpg",
            overlay: "rgba(3, 6, 14, 0.45)",
            link: "https://www.youtube.com/watch?v=3jWRrafhO7M",
            linkLabel: "Rain room"
        },
        {
            title: "Background 03 · Midnight desk",
            description: "Clean workstation energy—drop the timer in the center for full effect.",
            image: "images/Background3.jpg",
            overlay: "rgba(1, 4, 8, 0.45)",
            link: "https://www.youtube.com/watch?v=DWcJFNfaw9c",
            linkLabel: "Cafe ambience"
        },
        {
            title: "Background 04 · Gradient focus",
            description: "Bold gradient wallpaper made for quick resets between blocks.",
            image: "images/Background4.jpg",
            overlay: "rgba(6, 4, 12, 0.35)",
            link: "https://imissmycafe.com/",
            linkLabel: "Mix a cafe"
        },
        {
            title: "Background 05 · City glow",
            description: "City lights plus slow clouds—keep the timer docked in the corner.",
            image: "images/Background5.jpg",
            overlay: "rgba(5, 7, 16, 0.4)",
            link: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
            linkLabel: "Play lofi beats"
        },
        {
            title: "Background 06 · Emerald night",
            description: "Deep teal scenery from your upload—ideal for rainy break blocks.",
            image: "images/Background6.jpg",
            overlay: "rgba(2, 8, 8, 0.45)",
            link: "https://www.youtube.com/watch?v=3jWRrafhO7M",
            linkLabel: "Rain room"
        },
        {
            title: "Background 07 · Cozy corner",
            description: "Warm studio lights with soft blur—great for centering the timer.",
            image: "images/Background7.jpg",
            overlay: "rgba(8, 6, 10, 0.4)",
            link: "https://www.youtube.com/watch?v=DWcJFNfaw9c",
            linkLabel: "Cafe ambience"
        },
        {
            title: "Background 08 · Retro grid",
            description: "The neon-grid wallpaper you added—lean into the synthy vibe.",
            image: "images/Background8.jpg",
            overlay: "rgba(6, 5, 14, 0.4)",
            link: "https://imissmycafe.com/",
            linkLabel: "Mix a cafe"
        },
        {
            title: "Background 09 · Lunar calm",
            description: "Dreamy blues with soft fog—finish the session with mellow tones.",
            image: "images/Background9.jpg",
            overlay: "rgba(3, 5, 12, 0.4)",
            link: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
            linkLabel: "Play lofi beats"
        }
    ];

    let index = 0;

    function applyBackground(item) {
        const backdrop = item.image ? `url('${item.image}')` : item.gradient;
        stage.style.backgroundImage = backdrop;
        stage.style.setProperty("--stage-overlay", item.overlay || "rgba(5, 7, 16, 0.55)");

        if (title) {
            title.textContent = item.title;
        }
        if (description) {
            description.textContent = item.description;
        }
        if (link) {
            if (item.link) {
                link.href = item.link;
                link.textContent = item.linkLabel || "Open vibe";
                link.hidden = false;
            } else {
                link.hidden = true;
            }
        }
        if (counter) {
            counter.textContent = `${index + 1} / ${backgrounds.length}`;
        }
    }

    function step(delta) {
        index = (index + delta + backgrounds.length) % backgrounds.length;
        applyBackground(backgrounds[index]);
    }

    function isStageFullscreen() {
        return document.fullscreenElement === stage || document.webkitFullscreenElement === stage;
    }

    function syncFullscreenState() {
        const isFullscreen = isStageFullscreen();
        stage.classList.toggle("is-fullscreen", isFullscreen);
        vibeRoot?.classList.toggle("is-fullscreen", isFullscreen);
        if (fullscreenButton) {
            fullscreenButton.textContent = isFullscreen ? "Exit full screen" : "Full screen";
            fullscreenButton.setAttribute("aria-pressed", String(isFullscreen));
        }
    }

    function requestStageFullscreen() {
        const request =
            stage.requestFullscreen ||
            stage.webkitRequestFullscreen ||
            stage.msRequestFullscreen;
        if (!request) return;
        if (isStageFullscreen()) {
            (document.exitFullscreen || document.webkitExitFullscreen || document.msExitFullscreen)?.call(document);
            return;
        }
        request.call(stage).catch(() => {});
    }

    if (prevButton) {
        prevButton.addEventListener("click", () => step(-1));
    }
    if (nextButton) {
        nextButton.addEventListener("click", () => step(1));
    }
    fullscreenButton?.addEventListener("click", requestStageFullscreen);
    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);

    stage.addEventListener("keydown", (event) => {
        if (event.key === "ArrowLeft") {
            step(-1);
            event.preventDefault();
        } else if (event.key === "ArrowRight") {
            step(1);
            event.preventDefault();
        }
    });

    applyBackground(backgrounds[index]);
    syncFullscreenState();
}

function initPomodoroTimer() {
    const display = document.querySelector("[data-pomodoro-display]");
    const startButton = document.querySelector("[data-pomodoro-start]");
    const resetButton = document.querySelector("[data-pomodoro-reset]");
    const modeButtons = document.querySelectorAll("[data-pomodoro-mode]");
    const timerPanel = document.querySelector("[data-pomodoro-panel]");
    const placementButtons = document.querySelectorAll("[data-timer-placement]");
    const breakModal = document.querySelector("[data-break-modal]");
    const breakModalOverlay = document.querySelector("[data-break-modal-overlay]");
    const breakModalClose = document.querySelector("[data-break-modal-close]");
    if (!display || !startButton || !resetButton) return;

    const durations = {
        focus: 25 * 60,
        break: 5 * 60
    };

    let mode = "focus";
    let remaining = durations[mode];
    let timerId = null;
    let running = false;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let audioContext = null;
    const body = document.body;

    function showBreakModal() {
        if (!breakModal) return;
        breakModal.classList.add("is-visible");
        breakModal.setAttribute("aria-hidden", "false");
        body.classList.add("break-modal-open");
        const focusTarget = breakModal.querySelector("a, button");
        focusTarget?.focus();
    }

    function hideBreakModal() {
        if (!breakModal) return;
        breakModal.classList.remove("is-visible");
        breakModal.setAttribute("aria-hidden", "true");
        body.classList.remove("break-modal-open");
    }

    breakModalOverlay?.addEventListener("click", hideBreakModal);
    breakModalClose?.addEventListener("click", hideBreakModal);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && breakModal?.classList.contains("is-visible")) {
            hideBreakModal();
        }
    });

    function format(time) {
        const minutes = Math.floor(time / 60)
            .toString()
            .padStart(2, "0");
        const seconds = Math.floor(time % 60)
            .toString()
            .padStart(2, "0");
        return `${minutes}:${seconds}`;
    }

    function updateDisplay() {
        display.textContent = format(remaining);
    }

    function ensureAudioContext() {
        if (!AudioContextClass) return null;
        if (!audioContext) {
            audioContext = new AudioContextClass();
        }
        if (audioContext.state === "suspended") {
            audioContext.resume();
        }
        return audioContext;
    }

    function playChime(type) {
        const ctx = ensureAudioContext();
        if (!ctx) return;
        const tones = type === "focus" ? [420, 560] : [660, 520];
        tones.forEach((frequency, index) => {
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = "sine";
            oscillator.frequency.value = frequency;
            const startAt = ctx.currentTime + index * 0.12;
            gain.gain.setValueAtTime(0.001, startAt);
            gain.gain.linearRampToValueAtTime(0.35, startAt + 0.05);
            gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.45);
            oscillator.connect(gain).connect(ctx.destination);
            oscillator.start(startAt);
            oscillator.stop(startAt + 0.5);
        });
    }

    function stopTimer() {
        if (timerId) {
            clearInterval(timerId);
            timerId = null;
        }
        running = false;
        startButton.textContent = "Start session";
    }

    function startTimer() {
        if (running) {
            stopTimer();
            return;
        }

        ensureAudioContext();
        running = true;
        startButton.textContent = "Pause";
        timerId = setInterval(() => {
            remaining -= 1;
            if (remaining <= 0) {
                remaining = 0;
                updateDisplay();
                stopTimer();
                display.classList.add("pomodoro-finished");
                setTimeout(() => display.classList.remove("pomodoro-finished"), 2500);
                playChime(mode);
                return;
            }
            updateDisplay();
        }, 1000);
    }

    function setMode(nextMode) {
        mode = nextMode;
        remaining = durations[mode];
        stopTimer();
        updateDisplay();
        display.classList.remove("pomodoro-finished");
        if (mode === "break") {
            showBreakModal();
        } else {
            hideBreakModal();
        }
    }

    startButton.addEventListener("click", startTimer);
    resetButton.addEventListener("click", () => {
        remaining = durations[mode];
        stopTimer();
        updateDisplay();
        display.classList.remove("pomodoro-finished");
        if (mode !== "break") {
            hideBreakModal();
        }
    });

    modeButtons.forEach((button) => {
        button.addEventListener("click", () => {
            const nextMode = button.dataset.pomodoroMode;
            if (!nextMode || !durations[nextMode]) return;
            setMode(nextMode);
        });
    });

    if (timerPanel && placementButtons.length) {
        if (!timerPanel.dataset.placement) {
            timerPanel.dataset.placement = "corner";
        }
        placementButtons.forEach((button) => {
            button.addEventListener("click", () => {
                const placement = button.dataset.timerPlacement;
                if (!placement) return;
                timerPanel.dataset.placement = placement;
                placementButtons.forEach((control) => {
                    control.classList.toggle("is-active", control === button);
                });
            });
        });
    }

    updateDisplay();
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
