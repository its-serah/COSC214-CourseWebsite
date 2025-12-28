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
    initExercisesGallery();
    initExerciseDetailPage();
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

const exercisesCatalog = [
    {
        id: "printing-console-pal",
        title: "Console Welcome Mat",
        summary: "Practice friendly cout greetings and recap lines.",
        tags: ["printing"],
        content: `
                <p>Prompt for a first name, favorite study beverage, and two integers. Display:</p>
                <ul>
                    <li>A greeting that combines the name and beverage.</li>
                    <li>The sum and difference of the numbers with clear labels.</li>
                    <li>A closing line that repeats all inputs using <code>std::endl</code> and tab spacing.</li>
                </ul>
                <pre class="exercise-sample">First name: Sara
Favorite beverage: latte
Enter two integers: 8 3
Hey Sara, grab that latte and let's code!
Sum: 11
Difference: 5
Inputs recap -> Name: Sara | Beverage: latte | Numbers: 8 & 3</pre>
            `,
        hints: [
            "Store the inputs in variables so you can reuse them in multiple cout statements.",
            "Use newline characters (\\n) or std::endl plus tab spacing to format the recap line."
        ]
    },
    {
        id: "printing-pattern-lab",
        title: "Pattern Printer Studio",
        summary: "Print banners, columns, and tables with escape codes.",
        tags: ["printing"],
        content: `
                <p>Read a word and an integer width. Output three things:</p>
                <ul>
                    <li>A centered banner using <code>std::setw</code>.</li>
                    <li>A left-aligned column of the word repeated width times.</li>
                    <li>A mini table with headers separated by <code>\\t</code>.</li>
                </ul>
                <pre class="exercise-sample">Word: VIBES
Width: 4
---- VIBES ----
VIBES
VIBES
VIBES
VIBES
Name\tTempo
VIBES\tLo-fi</pre>
            `,
        hints: [
            "Include <iomanip> so you can call std::setw for the banner line.",
            "Loop width times to print the column rather than duplicating cout statements."
        ]
    },
    {
        id: "arithmetic-kit",
        title: "Arithmetic Control Room",
        summary: "Compute sum/product/averages with formatted output.",
        tags: ["arithmetic"],
        content: `
                <p>Ask for three integers and one floating-point weight. Report:</p>
                <ul>
                    <li>Sum, product, and integer average of the ints.</li>
                    <li>Weighted average using the float (use <code>std::fixed</code> and <code>setprecision(2)</code>).</li>
                    <li>The remainder when the largest value is divided by the smallest.</li>
                </ul>
                <pre class="exercise-sample">Enter 3 ints: 9 4 2
Weight (0-1): 0.35
Sum = 15 | Product = 72 | Avg = 5
Weighted blend = 5.25
Remainder (largest % smallest) = 1</pre>
            `,
        hints: [
            "Use std::max/std::min (or manual comparisons) to capture the largest and smallest values before computing the remainder.",
            "Call std::fixed << std::setprecision(2) once and the formatting will persist for later floating-point outputs."
        ]
    },
    {
        id: "conditionals-suite",
        title: "Condition Ladder Builder",
        summary: "Mix if/else-if chains, nested checks, and switch cases.",
        tags: ["conditionals"],
        content: `
                <p>Collect a course average (0-100) and a letter command.</p>
                <ul>
                    <li>Use <code>if</code>/<code>else if</code>/<code>else</code> to tag the average as Excellent, Pass, Watchlist, or Retry.</li>
                    <li>Use a <code>switch</code> on the command to trigger reminders: <code>P</code> for print plan, <code>R</code> for request regrade, <code>S</code> for schedule office hours.</li>
                    <li>Include one nested <code>if</code> that fires when averages >= 95 and the command is <code>S</code>.</li>
                </ul>
                <pre class="exercise-sample">Average: 91
Command (P/R/S): S
Status -> Pass ✅
Switch note -> Schedule office hours
Nested flag -> Honor student meetup scheduled</pre>
            `,
        hints: [
            "Normalize the command to uppercase once so your switch handles lowercase input.",
            "Check the highest score bands first so later conditions can assume the value is lower." 
        ]
    },
    {
        id: "loop-journal",
        title: "Loop Journal Tracker",
        summary: "Log sessions with for, while, and do-while loops.",
        tags: ["loops"],
        content: `
                <p>Ask how many study sessions ran this week (max 7). Required:</p>
                <ul>
                    <li>A <code>for</code> loop to collect minutes per session and accumulate totals.</li>
                    <li>A <code>while</code> loop to count how many entries hit >= 25 minutes.</li>
                    <li>A <code>do-while</code> that asks whether to log another week (Y/N) and repeats accordingly.</li>
                </ul>
                <pre class="exercise-sample">How many sessions (max 7)? 4
Session 1 minutes: 30
Session 2 minutes: 20
Session 3 minutes: 42
Session 4 minutes: 25
Total minutes: 117
Pomodoro blocks: 3
Log another week? n</pre>
            `,
        hints: [
            "Use an array or vector for the minutes so you can reuse the values when counting qualifying sessions.",
            "A do-while loop for the retry prompt guarantees the user sees it at least once."
        ]
    },
    {
        id: "loop-gauntlet",
        title: "Loop Gauntlet Sprint",
        summary: "Solve the same tally using for, while, and do-while.",
        tags: ["loops"],
        content: `
                <p>Read a positive integer <em>n</em>. Implement three functions:</p>
                <ul>
                    <li><code>forSum(n)</code> – sum 1..n with a <code>for</code> loop.</li>
                    <li><code>whileEvenCount(n)</code> – count even numbers using a <code>while</code>.</li>
                    <li><code>doWhileDisplay(n)</code> – print numbers in reverse with a <code>do-while</code>.</li>
                </ul>
                <pre class="exercise-sample">Enter n: 6
forSum -> 21
whileEvenCount -> 3
doWhileDisplay -> 6 5 4 3 2 1</pre>
            `,
        hints: [
            "Each helper can accept the same integer and use a different loop structure internally.",
            "Guard against n <= 0 so the do-while version does not print negative ranges." 
        ]
    },
    {
        id: "function-lab",
        title: "Function Utility Belt",
        summary: "Write helper functions that return clean results.",
        tags: ["functions"],
        content: `
                <p>Create and call:</p>
                <ul>
                    <li><code>double toKelvin(double celsius)</code></li>
                    <li><code>int clampScore(int score, int min, int max)</code></li>
                    <li><code>std::string initials(const std::string &name)</code></li>
                </ul>
                <p>Prompt for inputs, call each helper, and print the returned results without extra console logic inside the helper bodies.</p>
            `,
        hints: [
            "Keep the helper functions free of cout statements so they are reusable in other programs.",
            "Split the name on spaces (or walk character by character) to find each initial." 
        ]
    },
    {
        id: "salaries",
        title: "Array of Salaries",
        summary: "Input salaries, report stats, reverse, and shift data.",
        tags: ["arrays"],
        content: `
                <p>Work with <code>int salaries[100]</code>. Reject sizes greater than 100, then:</p>
                <ul>
                    <li>Print salaries with " - " separators.</li>
                    <li>Compute the average and count salaries >= average.</li>
                    <li>Reverse and shift-right the array.</li>
                </ul>
                <pre class="exercise-sample">Enter n: 110
Invalid Size! Try again
Enter n: 5
Enter 5 salaries: 4000 3200 5000 2600 1500
Array of salaries is [4000 - 3200 - 5000 - 2600 - 1500]
Average of Salaries is 3260
Count of Employees having a salary greater than or equal to 3260 is 2
The new array after calling Reverse is [1500 - 2600 - 5000 - 3200 - 4000]
The new array after calling Shift Right is [4000 - 1500 - 2600 - 5000 - 3200]</pre>
            `,
        hints: [
            "Store the number of employees so you can validate it before reading salaries.",
            "When shifting right, save the last element before the loop overwrites it."
        ]
    },
    {
        id: "array-inventory",
        title: "Inventory Array Workshop",
        summary: "Track stock levels and restock low inventory entries.",
        tags: ["arrays"],
        content: `
                <p>Store up to 20 item quantities in an array:</p>
                <ul>
                    <li>List items with indices and flag anything below the reorder threshold.</li>
                    <li>Implement a function that restocks every flagged element by +5.</li>
                    <li>Report the new average quantity and the item with the highest count.</li>
                </ul>
            `,
        hints: [
            "Track the index of the max quantity during the same loop where you compute the average.",
            "Let a helper like restockLow(arr, n, threshold, amount) modify values in place."
        ]
    },
    {
        id: "random-arrays",
        title: "Random Arrays of Positive/Negative Values",
        summary: "Generate numbers then split into positive/negative lists.",
        tags: ["arrays"],
        content: `
                <p>Seed <code>srand(time(NULL))</code>, then build arrays APOS and ANEG with strictly positive/negative values.</p>
                <pre class="exercise-sample">Enter n: 10
Enter min and max: -10 10
Array of random values between -10 and 10 is -9 3 5 10 1 4 -4 0 3 4
Array of strictly positive values is 3 5 10 1 4 3 4
Array of strictly negative values is -9 -4</pre>
            `,
        hints: [
            "Keep separate counters for how many values land in APOS and ANEG so you know the valid size of each.",
            "Remember to ignore zeros because they are neither positive nor negative in this prompt."
        ]
    },
    {
        id: "string-normalizer",
        title: "String Normalizer",
        summary: "Clean a name, fix casing, and extract initials.",
        tags: ["strings"],
        content: `
                <p>Use <code>getline</code> to capture a student's full name, then:</p>
                <ul>
                    <li>Strip double spaces and trailing whitespace.</li>
                    <li>Capitalize first letters and lowercase the rest.</li>
                    <li>Extract initials (e.g., "S.R.") and report length without spaces.</li>
                </ul>
            `,
        hints: [
            "Walk the string once to rebuild it without repeated spaces or trailing blanks.",
            "Track whether the previous character was a space so you know when to uppercase a new letter."
        ]
    },
    {
        id: "recursion-basics",
        title: "Recursion Warmup",
        summary: "Write recursive helpers for digits, counts, palindromes.",
        tags: ["strings", "functions"],
        content: `
                <p>Write three recursive functions:</p>
                <ul>
                    <li><code>sumDigits(int n)</code></li>
                    <li><code>countOccurrences(string s, char ch)</code></li>
                    <li><code>isPalindrome(string s, int left, int right)</code></li>
                </ul>
            `,
        hints: [
            "Always define a base case (n == 0, left >= right, index == s.length()).",
            "Use modulo 10 when peeling digits off an integer for sumDigits." 
        ]
    },
    {
        id: "stack-simulator",
        title: "Stack Simulator",
        summary: "Simulate stack pushes/pops with guard rails.",
        tags: ["arrays"],
        content: `
                <p>Use a fixed-size array to simulate stack pushes/pops from a command list, printing errors when operations are invalid and reporting the top element after each command.</p>
            `,
        hints: [
            "Track the top index starting at -1 so you can identify underflow easily.",
            "Check capacity before pushing and print an error when the stack is full."
        ]
    },
    {
        id: "mixed-dashboard",
        title: "Mixed Session Dashboard",
        summary: "Blend IO, arrays, loops, arithmetic, and branching.",
        tags: ["mixed"],
        content: `
                <p>Build a mini dashboard:</p>
                <ul>
                    <li>Read session names into an array until "done".</li>
                    <li>Track minutes per session and compute totals/averages (arithmetic + loops).</li>
                    <li>Use <code>if</code>/<code>else if</code> to grade the average focus time.</li>
                    <li>Print a formatted overview table using <code>std::cout</code>.</li>
                </ul>
            `,
        hints: [
            "Break out of the input loop when the user types 'done', but do not append it to the array.",
            "Create a helper that categorizes the average (e.g., Needs Boost, Steady, Locked In) to keep main tidy."
        ]
    }
];

function initExercisesGallery() {
    const grid = document.querySelector("[data-exercise-grid]");
    const filterButtons = document.querySelectorAll("[data-ex-filter]");
    if (!grid || !filterButtons.length) return;

    let activeFilter = "all";

    function renderCards() {
        const fragment = document.createDocumentFragment();
        exercisesCatalog
            .filter((exercise) => activeFilter === "all" || exercise.tags.includes(activeFilter))
            .forEach((exercise) => {
                const card = document.createElement("a");
                card.className = "exercise-card-preview";
                card.href = `exercise.html?id=${exercise.id}`;
                card.innerHTML = `
                    <span class="exercise-tag">${exercise.tags.join(" · ")}</span>
                    <h4>${exercise.title}</h4>
                    <p>${exercise.summary}</p>
                `;
                fragment.appendChild(card);
            });
        grid.innerHTML = "";
        grid.appendChild(fragment);
    }

    filterButtons.forEach((button) => {
        button.addEventListener("click", () => {
            activeFilter = button.dataset.exFilter || "all";
            filterButtons.forEach((btn) => btn.classList.toggle("is-active", btn === button));
            renderCards();
        });
    });

    renderCards();
}

function initExerciseDetailPage() {
    const detail = document.querySelector("[data-exercise-view]");
    if (!detail) return;

    const params = new URLSearchParams(window.location.search);
    const exerciseId = params.get("id");
    const exercise = exercisesCatalog.find((item) => item.id === exerciseId);

    if (!exercise) {
        detail.innerHTML = `
            <div class="exercise-detail">
                <a class="exercise-back-link" href="exercises.html">← Back to exercises</a>
                <p>Could not find that exercise. Choose another from the list.</p>
            </div>
        `;
        return;
    }

    const hintMarkup =
        exercise.hints && exercise.hints.length
            ? `
                <div class="exercise-hints">
                    <button type="button" class="hint-toggle" data-hint-toggle aria-expanded="false">Show hints</button>
                    <ol class="hint-list" data-hint-list hidden>
                        ${exercise.hints
                            .map((hint, index) => `<li><strong>Hint ${index + 1}:</strong> ${hint}</li>`)
                            .join("")}
                    </ol>
                </div>
            `
            : "";

    detail.innerHTML = `
        <article class="exercise-detail">
            <a class="exercise-back-link" href="exercises.html">← Back to exercises</a>
            <p class="exercise-eyebrow">${exercise.tags.join(" / ")}</p>
            <h1>${exercise.title}</h1>
            <p class="exercise-summary">${exercise.summary}</p>
            ${exercise.content}
            ${hintMarkup}
        </article>
    `;

    const hintToggle = detail.querySelector("[data-hint-toggle]");
    const hintList = detail.querySelector("[data-hint-list]");
    if (hintToggle && hintList) {
        hintToggle.addEventListener("click", () => {
            const expanded = hintToggle.getAttribute("aria-expanded") === "true";
            hintToggle.setAttribute("aria-expanded", String(!expanded));
            hintToggle.textContent = expanded ? "Show hints" : "Hide hints";
            hintList.hidden = expanded;
        });
    }
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
    const playLink = document.querySelector("[data-vibe-play]");
    const fullscreenButton = stage.querySelector("[data-vibe-fullscreen]");

    const backgrounds = [
        {
            title: "Background 01 · Chill nebula",
            description: "A moody wallpaper from your pack—use it for night sprints.",
            image: "images/Background2.jpg",
            overlay: "rgba(3, 6, 14, 0.45)",
            link: "https://www.youtube.com/watch?v=3jWRrafhO7M",
            linkLabel: "Rain room"
        },
        {
            title: "Background 02 · Midnight desk",
            description: "Clean workstation energy—drop the timer in the center for full effect.",
            image: "images/Background3.jpg",
            overlay: "rgba(1, 4, 8, 0.45)",
            link: "https://www.youtube.com/watch?v=DWcJFNfaw9c",
            linkLabel: "Cafe ambience"
        },
        {
            title: "Background 03 · Gradient focus",
            description: "Bold gradient wallpaper made for quick resets between blocks.",
            image: "images/Background4.jpg",
            overlay: "rgba(6, 4, 12, 0.35)",
            link: "https://www.youtube.com/watch?v=lTRiuFIWV54",
            linkLabel: "Ambient lofi mix"
        },
        {
            title: "Background 04 · City glow",
            description: "City lights plus slow clouds—keep the timer docked in the corner.",
            image: "images/Background5.jpg",
            overlay: "rgba(5, 7, 16, 0.4)",
            link: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
            linkLabel: "Play lofi beats"
        },
        {
            title: "Background 05 · Emerald night",
            description: "Deep teal scenery from your upload—ideal for rainy break blocks.",
            image: "images/Background6.jpg",
            overlay: "rgba(2, 8, 8, 0.45)",
            link: "https://www.youtube.com/watch?v=3jWRrafhO7M",
            linkLabel: "Rain room"
        },
        {
            title: "Background 06 · Cozy corner",
            description: "Warm studio lights with soft blur—great for centering the timer.",
            image: "images/Background7.jpg",
            overlay: "rgba(8, 6, 10, 0.4)",
            link: "https://www.youtube.com/watch?v=DWcJFNfaw9c",
            linkLabel: "Cafe ambience"
        },
        {
            title: "Background 07 · Retro grid",
            description: "The neon-grid wallpaper you added—lean into the synthy vibe.",
            image: "images/Background8.jpg",
            overlay: "rgba(6, 5, 14, 0.4)",
            link: "https://www.youtube.com/watch?v=5yx6BWlEVcY",
            linkLabel: "Jazzhop mix"
        },
        {
            title: "Background 08 · Lunar calm",
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
        if (playLink) {
            if (item.link) {
                playLink.href = item.link;
                playLink.textContent = item.linkLabel || "Play this vibe";
                playLink.hidden = false;
            } else {
                playLink.hidden = true;
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
    const collapseButton = document.querySelector("[data-timer-collapse]");
    const breakModal = document.querySelector("[data-break-modal]");
    const breakModalOverlay = document.querySelector("[data-break-modal-overlay]");
    const breakModalClose = document.querySelector("[data-break-modal-close]");
    const breakTipTrigger = document.querySelector("[data-break-tip-trigger]");
    const breakTipIcon = document.querySelector("[data-break-tip-icon]");
    const breakTipLabel = document.querySelector("[data-break-tip-label]");
    const breakTipTitle = document.querySelector("[data-break-tip-title]");
    const breakTipBody = document.querySelector("[data-break-tip-body]");
    const breakTipLink = document.querySelector("[data-break-tip-link]");
    if (!display || !startButton || !resetButton) return;

    const durations = {
        focus: 25 * 60,
        break: 5 * 60
    };
    const breakTips = [
        {
            icon: "📝",
            label: "Quick ritual",
            title: "Set an intention",
            body: "Jot one intention before you tap start."
        },
        {
            icon: "💧",
            label: "Quick ritual",
            title: "Reset your body",
            body: "Stretch, sip water, or breathe on breaks."
        },
        {
            icon: "✨",
            label: "Quick ritual",
            title: "Celebrate a win",
            body: "Capture one tiny win every block to keep momentum."
        },
        {
            icon: "🎧",
            label: "Lofi shortcut",
            title: "24/7 chill beats",
            body: "Drop into the always-on stream for cozy focus.",
            link: "https://www.youtube.com/watch?v=jfKfPfyJRdk",
            linkLabel: "Open 24/7 chill beats"
        },
        {
            icon: "🌧",
            label: "Lofi shortcut",
            title: "Rain room",
            body: "Switch to the rain ambience when you need softer vibes.",
            link: "https://www.youtube.com/watch?v=3jWRrafhO7M",
            linkLabel: "Open rain room"
        },
        {
            icon: "☕",
            label: "Lofi shortcut",
            title: "Cafe lofi stream",
            body: "Let a mellow coffee shop stream run quietly in the background.",
            link: "https://www.youtube.com/watch?v=5yx6BWlEVcY",
            linkLabel: "Play cafe stream"
        }
    ];

    let mode = "focus";
    let remaining = durations[mode];
    let timerId = null;
    let running = false;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    let audioContext = null;
    const body = document.body;
    let nextBreakTipIndex = 0;
    let queuedBreakTip = null;

    function queueBreakTip() {
        if (!breakTips.length || !breakTipTrigger) return;
        queuedBreakTip = breakTips[nextBreakTipIndex];
        nextBreakTipIndex = (nextBreakTipIndex + 1) % breakTips.length;
        breakTipTrigger.hidden = false;
        breakTipTrigger.setAttribute(
            "aria-label",
            `Open break tip: ${queuedBreakTip.title}`
        );
        if (breakTipIcon) {
            breakTipIcon.textContent = queuedBreakTip.icon || "★";
        }
    }

    function clearBreakTip() {
        queuedBreakTip = null;
        if (breakTipTrigger) {
            breakTipTrigger.hidden = true;
        }
    }

    function openBreakModal({ autoplay = false } = {}) {
        if (!breakModal || !queuedBreakTip) return;
        if (breakTipLabel) {
            breakTipLabel.textContent = queuedBreakTip.label || "Break tip";
        }
        if (breakTipTitle) {
            breakTipTitle.textContent = queuedBreakTip.title || "Break reminder";
        }
        if (breakTipBody) {
            breakTipBody.textContent = queuedBreakTip.body || "";
        }
        if (breakTipLink) {
            if (queuedBreakTip.link) {
                breakTipLink.href = queuedBreakTip.link;
                breakTipLink.textContent =
                    queuedBreakTip.linkLabel || "Open link";
                breakTipLink.hidden = false;
            } else {
                breakTipLink.hidden = true;
            }
        }
        breakModal.classList.add("is-visible");
        breakModal.setAttribute("aria-hidden", "false");
        body.classList.add("break-modal-open");
        const focusTarget = !breakTipLink?.hidden
            ? breakTipLink
            : breakModalClose || breakModal.querySelector("button");
        focusTarget?.focus();
        playTipSound();
    }

    function closeBreakModal() {
        if (!breakModal) return;
        breakModal.classList.remove("is-visible");
        breakModal.setAttribute("aria-hidden", "true");
        body.classList.remove("break-modal-open");
    }

    breakModalOverlay?.addEventListener("click", closeBreakModal);
    breakModalClose?.addEventListener("click", closeBreakModal);
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && breakModal?.classList.contains("is-visible")) {
            closeBreakModal();
        }
    });
    breakTipTrigger?.addEventListener("click", () => openBreakModal({ autoplay: false }));

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

    function playTipSound() {
        const ctx = ensureAudioContext();
        if (!ctx) return;
        const oscillator = ctx.createOscillator();
        const gain = ctx.createGain();
        oscillator.type = "triangle";
        oscillator.frequency.value = 720;
        const now = ctx.currentTime;
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.35, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(now);
        oscillator.stop(now + 0.45);
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
        if (mode === "focus") {
            if (!queuedBreakTip) {
                queueBreakTip();
            }
            openBreakModal({ autoplay: true });
        }
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
            queueBreakTip();
            openBreakModal({ autoplay: true });
        } else {
            clearBreakTip();
            closeBreakModal();
        }
    }

    startButton.addEventListener("click", startTimer);
    resetButton.addEventListener("click", () => {
        remaining = durations[mode];
        stopTimer();
        updateDisplay();
        display.classList.remove("pomodoro-finished");
        if (mode !== "break") {
            clearBreakTip();
            closeBreakModal();
        } else {
            closeBreakModal();
            if (!queuedBreakTip) {
                queueBreakTip();
            }
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
    collapseButton?.addEventListener("click", () => {
        if (!timerPanel) return;
        const nextState = !timerPanel.classList.contains("is-collapsed");
        timerPanel.classList.toggle("is-collapsed", nextState);
        collapseButton.textContent = nextState ? "Expand" : "Minimize";
        collapseButton.setAttribute("aria-pressed", String(nextState));
    });

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
