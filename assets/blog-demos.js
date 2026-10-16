// Live editor demos for blog posts. A Markdown line `::demo <id>` becomes
// <figure class="blog-demo" data-demo="<id>">; this script draws a LatexDo
// window inside it and plays a scripted session with a real pointer: it moves,
// clicks, selects and types, exactly like a person using the app. Labels,
// menus and buttons match the desktop app. No video, canvas or images.
const WIDE = 760;
const NARROW = 420;
class Cancelled extends Error {
}
const escapeHtml = (value) => value.replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char] ?? char);
/** Colours LaTeX source like the editor: commands, math and comments. */
function tex(source) {
    return escapeHtml(source).replace(/(%.*$)|(\$[^$]*\$)|(\\[a-zA-Z]+|\\\\|\\%)/g, (_, comment, math, command) => comment ? `<span class="t-cmt">${comment}</span>` : math ? `<span class="t-math">${math}</span>` : `<span class="t-kw">${command}</span>`);
}
/** Editor lines. A line may hold raw HTML (for demo targets) when it starts with "<". */
function lines(first, source) {
    return source
        .map((line, index) => `<div class="ldx-line" data-line="${first + index}"><span class="ldx-gutter">${first + index}</span><span class="ldx-src">${line.startsWith("<") ? line : tex(line)}</span></div>`)
        .join("");
}
const icon = {
    plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    mic: '<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>',
    send: '<svg viewBox="0 0 24 24"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 4.5 2.9 8.4 7 10 4.1-1.6 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-5"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="m5 12 5 5L20 7"/></svg>',
    x: '<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    shapes: '<svg viewBox="0 0 24 24"><path d="M8.3 10a.7.7 0 0 1-.6-1L11.4 3a.7.7 0 0 1 1.2 0L16.3 9a.7.7 0 0 1-.6 1z"/><rect x="3" y="14" width="7" height="7" rx="1"/><circle cx="17.5" cy="17.5" r="3.5"/></svg>',
    pointer: '<svg viewBox="0 0 20 24" aria-hidden="true"><path d="M2 1.5v17.2l4.6-4.1 3 6.9 3.2-1.4-3-6.8h6.3z"/></svg>',
};
function windowMarkup(demo) {
    const chat = demo.chat
        ? `<aside class="ldx-chat">
        <div class="ldx-chat-head"><span class="ldx-ai-badge">AI</span><span>Chat</span><span class="ldx-model">LatexDo AI Plus</span></div>
        <div class="ldx-thread" data-thread><div class="ldx-greeting" data-greeting>What are we writing today?</div></div>
        <div class="ldx-popup" data-popup hidden></div>
        <div class="ldx-composer" data-composer>
          <button class="ldx-round" type="button" tabindex="-1">${icon.plus}</button>
          <div class="ldx-input" data-input><span data-typed></span><span class="ldx-placeholder" data-placeholder>Ask, or type \\ for commands</span></div>
          <button class="ldx-round" type="button" tabindex="-1">${icon.mic}</button>
          <button class="ldx-round ldx-send" type="button" tabindex="-1" data-send>${icon.send}</button>
        </div>
      </aside>`
        : "";
    return `<div class="ldx-titlebar"><i></i><i></i><i></i><span>paper — LatexDo</span></div>
    <div class="ldx-body">
      <section class="ldx-editor">
        <div class="ldx-tabs"><span class="is-active">main.tex</span><span>refs.bib</span></div>
        <div class="ldx-code" data-code>${demo.editor}</div>
        <div class="ldx-status" data-status><span class="ldx-dot"></span><span data-status-text>Compiled · 6 pages</span></div>
      </section>
      ${chat}
    </div>
    <div class="ldx-key" data-key hidden></div>
    <div class="ldx-pointer" data-pointer>${icon.pointer}</div>`;
}
/** Runs one demo: the clock, the pointer and the helpers its script uses. */
class Ctx {
    constructor(stage, caption) {
        this.instant = false;
        this.paused = false;
        this.visible = false;
        this.run = 0;
        this.pointer = { x: 0, y: 0 };
        this.stage = stage;
        this.caption = caption;
    }
    $(selector) {
        const element = this.stage.querySelector(selector);
        if (!element)
            throw new Error(`Demo element missing: ${selector}`);
        return element;
    }
    /** Waits `ms` of visible, unpaused time. Throws when the run was replaced. */
    wait(ms) {
        const run = this.run;
        if (this.instant)
            return Promise.resolve();
        return new Promise((resolve, reject) => {
            let last = performance.now();
            let left = ms;
            const tick = (now) => {
                if (run !== this.run)
                    return reject(new Cancelled());
                if (!this.paused && this.visible && !this.instant)
                    left -= now - last;
                last = now;
                if (left <= 0 || this.instant)
                    resolve();
                else
                    requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        });
    }
    say(text) {
        this.caption.textContent = text;
    }
    scale() {
        return this.stage.getBoundingClientRect().width / this.stage.offsetWidth || 1;
    }
    /** A point on an element, in stage coordinates. */
    point(target, anchor = "center") {
        const element = typeof target === "string" ? this.$(target) : target;
        const rects = element.getClientRects();
        const rect = anchor === "end" ? rects[rects.length - 1] : rects[0] ?? element.getBoundingClientRect();
        const box = this.stage.getBoundingClientRect();
        const scale = this.scale();
        const x = anchor === "start" ? rect.left : anchor === "end" ? rect.right : rect.left + rect.width / 2;
        return { x: (x - box.left) / scale, y: (rect.top + rect.height / 2 - box.top) / scale };
    }
    place(point) {
        this.pointer = point;
        this.$("[data-pointer]").style.transform = `translate(${point.x}px, ${point.y}px)`;
    }
    /** Glides the pointer to a target, easing in and out like a hand. */
    async move(target, anchor = "center", onStep) {
        const from = this.pointer;
        const to = this.point(target, anchor);
        const distance = Math.hypot(to.x - from.x, to.y - from.y);
        const duration = Math.min(1100, 380 + distance * 1.1);
        if (this.instant) {
            this.place(to);
            onStep?.(1);
            return;
        }
        const run = this.run;
        let elapsed = 0;
        let last = performance.now();
        // A slight arc reads as a human movement rather than a straight robot line.
        const lift = Math.min(40, distance * 0.12);
        await new Promise((resolve, reject) => {
            const frame = (now) => {
                if (run !== this.run)
                    return reject(new Cancelled());
                if (!this.paused && this.visible && !this.instant)
                    elapsed += now - last;
                last = now;
                const t = this.instant ? 1 : Math.min(1, elapsed / duration);
                const e = t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
                this.place({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e - Math.sin(Math.PI * e) * lift });
                onStep?.(e);
                if (t < 1)
                    requestAnimationFrame(frame);
                else
                    resolve();
            };
            requestAnimationFrame(frame);
        });
    }
    async click(options = {}) {
        const pointer = this.$("[data-pointer]");
        const ripple = document.createElement("span");
        ripple.className = `ldx-ripple${options.right ? " is-right" : ""}`;
        ripple.style.left = `${this.pointer.x}px`;
        ripple.style.top = `${this.pointer.y}px`;
        if (!this.instant)
            this.stage.append(ripple);
        pointer.classList.add("is-down");
        await this.wait(140);
        pointer.classList.remove("is-down");
        await this.wait(200);
        ripple.remove();
    }
    /** Presses the mouse at the pointer and drags to a target. */
    async drag(target, anchor, onStep) {
        const pointer = this.$("[data-pointer]");
        pointer.classList.add("is-down");
        await this.wait(160);
        await this.move(target, anchor, onStep);
        await this.wait(120);
        pointer.classList.remove("is-down");
    }
    /** Types text into an element at a human, slightly uneven pace. */
    async type(target, text, perChar = 55) {
        const element = typeof target === "string" ? this.$(target) : target;
        for (const [index, char] of [...text].entries()) {
            element.textContent += char;
            this.stage.dispatchEvent(new CustomEvent("demo:typed"));
            await this.wait(perChar * (char === " " ? 1.6 : 0.75 + ((index * 7) % 5) / 8));
        }
    }
    /** Shows a keycap for a key press, such as Tab or Enter. */
    async key(label) {
        const key = this.$("[data-key]");
        key.textContent = label;
        key.hidden = false;
        key.classList.remove("is-down");
        await this.wait(380);
        key.classList.add("is-down");
        await this.wait(260);
        key.classList.remove("is-down");
        await this.wait(420);
        key.hidden = true;
    }
    status(kind, text) {
        this.$("[data-status]").dataset.kind = kind;
        this.$("[data-status-text]").textContent = text;
    }
    /** Adds an element to the chat thread and returns it. */
    message(className, html) {
        const thread = this.$("[data-thread]");
        this.$("[data-greeting]").hidden = true;
        const element = document.createElement("div");
        element.className = className;
        element.innerHTML = html;
        thread.append(element);
        thread.scrollTop = thread.scrollHeight;
        return element;
    }
    /** Shows a working line in the chat for a while, then removes it. */
    async working(text, ms) {
        const line = this.message("ldx-working", `<span class="ldx-spinner"></span>${escapeHtml(text)}`);
        await this.wait(ms);
        line.remove();
    }
    focusComposer(on) {
        this.$("[data-composer]").classList.toggle("is-focused", on);
    }
    setInput(html) {
        this.$("[data-typed]").innerHTML = html;
        this.$("[data-placeholder]").hidden = html.length > 0;
    }
    /** Sends what the composer holds as the user's message. */
    async send() {
        await this.move("[data-send]");
        await this.click();
        const html = this.$("[data-typed]").innerHTML;
        this.setInput("");
        this.focusComposer(false);
        this.message("ldx-msg is-user", html);
        await this.wait(350);
    }
    /** The approval card every AI edit waits on. Resolves once Approve is clicked. */
    async approve(title, oldText, newText) {
        const card = this.message("ldx-approval", `<div class="ldx-approval-head">${icon.shield}<span>${escapeHtml(title)}</span></div>
      ${oldText === null ? "" : `<pre class="ldx-diff is-old">${escapeHtml(oldText)}</pre>`}
      <pre class="ldx-diff is-new">${escapeHtml(newText)}</pre>
      <div class="ldx-approval-actions"><button type="button" tabindex="-1">${icon.x} Decline</button><button class="is-approve" type="button" tabindex="-1" data-approve>${icon.check} Approve</button></div>`);
        await this.wait(1500);
        await this.move(card.querySelector("[data-approve]"));
        await this.click();
        card.classList.add("is-done");
        await this.wait(220);
        card.remove();
    }
    /** Shows the command or file popup above the composer. */
    popup(title, items) {
        const popup = this.$("[data-popup]");
        popup.innerHTML = `<div class="ldx-popup-title">${escapeHtml(title)}</div>${items
            .map(([value, hint], index) => `<div class="ldx-popup-item${index === 0 ? " is-active" : ""}" data-value="${escapeHtml(value)}"><b>${escapeHtml(value)}</b>${hint ? `<span>${escapeHtml(hint)}</span>` : ""}</div>`)
            .join("")}`;
        popup.hidden = false;
        return popup;
    }
    /** Keeps only popup rows that start with `prefix` after their trigger character. */
    filterPopup(prefix) {
        const rows = Array.from(this.$("[data-popup]").querySelectorAll(".ldx-popup-item"));
        let first = true;
        for (const row of rows) {
            const value = (row.dataset.value ?? "").slice(1);
            const show = value.startsWith(prefix) || value.split("/").pop().startsWith(prefix);
            row.hidden = !show;
            row.classList.toggle("is-active", show && first);
            if (show)
                first = false;
        }
    }
    line(number) {
        return this.$(`.ldx-line[data-line="${number}"]`);
    }
    setCaret(line) {
        this.stage.querySelector(".ldx-line.is-current")?.classList.remove("is-current");
        this.stage.querySelector(".ldx-caret")?.remove();
        if (line === null)
            return;
        const target = this.line(line);
        target.classList.add("is-current");
        const caret = document.createElement("span");
        caret.className = "ldx-caret";
        (target.querySelector("[data-caret-after]") ?? target.querySelector(".ldx-src")).after(caret);
    }
}
const pipeline = ["\\subsection{Pipeline}", "Documents are split into chunks of 512 tokens", "before encoding."];
const demos = {
    ghost: {
        label: "Sentence completion: LatexDo offers the end of a sentence as grey text, and Tab accepts it.",
        chat: false,
        height: 300,
        narrowHeight: 360,
        editor: lines(18, [
            "\\section{Results}",
            "\\label{sec:results}",
            "",
            "Our model reaches 87.9\\% accuracy on the held-out set (Table~\\ref{tab:main}).",
            '<span data-anchor>To make the comparison fair, every method</span><span data-typed-line data-caret-after></span><span class="ldx-ghost" data-ghost hidden></span>',
            "",
            "\\begin{table}[t]",
            "  \\centering",
        ]),
        async script(c) {
            c.status("ok", "Compiled · 6 pages");
            c.say("Click where you are writing.");
            await c.move("[data-anchor]", "end");
            await c.click();
            c.setCaret(22);
            c.say("Type, then pause for a moment.");
            await c.wait(300);
            await c.type("[data-typed-line]", " uses the same");
            await c.wait(900);
            const ghost = c.$("[data-ghost]");
            ghost.textContent = " training data, tokenizer and evaluation script.";
            ghost.hidden = false;
            ghost.insertAdjacentHTML("beforeend", '<span class="ldx-hint">Tab Accept</span>');
            c.say("LatexDo offers the rest of the sentence as grey text.");
            await c.wait(1900);
            c.say("Press Tab to keep it. Typing or Escape dismisses it.");
            await c.key("Tab ⇥");
            ghost.querySelector(".ldx-hint")?.remove();
            c.$("[data-typed-line]").textContent += ghost.textContent;
            ghost.hidden = true;
            c.line(22).classList.add("is-flash");
            await c.wait(1200);
            c.say("The sentence is yours, typed in one keystroke.");
        },
    },
    reformulate: {
        label: "Reformulate with AI: select a sentence, right-click, choose Reformulate with AI, then approve the diff.",
        chat: true,
        height: 400,
        narrowHeight: 620,
        editor: lines(41, [
            "\\section{Discussion}",
            "\\label{sec:discussion}",
            "",
            '<span class="ldx-sel" data-target>It is clear that our method is better in most cases.</span>',
            "% TODO: discuss the two failure cases",
            "The gap is largest on long documents, where",
            "the baselines truncate their input.",
        ]),
        async script(c) {
            const target = c.$("[data-target]");
            c.say("Select the sentence you want to improve.");
            await c.move(target, "start");
            await c.drag(target, "end", (t) => target.style.setProperty("--sel", String(t)));
            await c.wait(300);
            c.say("Right-click it and choose Reformulate with AI.");
            await c.click({ right: true });
            const at = c.point(target, "end");
            const menu = document.createElement("div");
            menu.className = "ldx-menu";
            menu.style.left = `${Math.min(at.x - 30, c.stage.offsetWidth - 230)}px`;
            menu.style.top = `${at.y + 10}px`;
            menu.innerHTML = `<div data-item>Reformulate with AI<kbd>⇧⌘R</kbd></div><div>Ask AI about Selection<kbd>⇧⌘A</kbd></div><hr /><div>Cut<kbd>⌘X</kbd></div><div>Copy<kbd>⌘C</kbd></div><div>Paste<kbd>⌘V</kbd></div>`;
            c.stage.append(menu);
            await c.wait(500);
            const item = menu.querySelector("[data-item]");
            await c.move(item, "center");
            item.classList.add("is-hover");
            await c.wait(250);
            await c.click();
            menu.remove();
            await c.working("Reformulating selection…", 1500);
            c.say("The rewrite waits for you: old text in red, new text in green.");
            const replacement = "Our method outperforms the baselines in most cases.";
            await c.approve("Reformulate selection · main.tex", target.textContent ?? "", replacement);
            target.textContent = replacement;
            target.style.setProperty("--sel", "0");
            target.closest(".ldx-line").classList.add("is-flash");
            c.say("Approve, and only the selection changes.");
            await c.wait(1400);
        },
    },
    fix: {
        label: "The \\fix command: the assistant compiles, finds the broken environment, proposes a fix and recompiles.",
        chat: true,
        height: 420,
        narrowHeight: 640,
        editor: lines(10, [
            "\\begin{table}[t]",
            "  \\centering",
            "  \\begin{tabular}{lcc}",
            "    Method & Acc. & F1 \\\\",
            "    Ours   & 87.9 & 84.2 \\\\",
            "  \\end{tabular}",
            "  \\caption{Results on the held-out set.}",
            '<span class="ldx-squiggle" data-broken><span class="t-kw">\\end</span>{tabel}</span>',
        ]),
        async script(c) {
            c.status("error", "1 error · main.tex:17 \\begin{table} ended by \\end{tabel}");
            c.say("The build fails. Ask the assistant to fix it.");
            await c.wait(900);
            await c.move("[data-input]");
            await c.click();
            c.focusComposer(true);
            await c.type("[data-typed]", "\\", 60);
            c.$("[data-placeholder]").hidden = true;
            c.popup("Commands", [
                ["\\fix", "Compile and fix every error"],
                ["\\summarize", "Summarize the open document"],
                ["\\outline", "Outline the whole project"],
                ["\\rewrite", "Rewrite the selection"],
                ["\\proofread", "Proofread the open document"],
            ]);
            c.say("Type \\ to see the quick commands.");
            await c.wait(900);
            await c.type("[data-typed]", "fi", 120);
            c.filterPopup("fi");
            await c.wait(500);
            await c.move(".ldx-popup-item.is-active");
            await c.click();
            c.$("[data-popup]").hidden = true;
            c.setInput('<span class="ldx-cmd">\\fix</span> ');
            c.say("\\fix compiles the project and fixes every error it finds.");
            await c.wait(500);
            await c.send();
            c.status("busy", "Compiling…");
            await c.working("Compiling main.tex…", 1100);
            c.status("error", "1 error · main.tex:17 \\begin{table} ended by \\end{tabel}");
            await c.working("Reading main.tex…", 800);
            const reply = c.message("ldx-msg", "");
            await c.type(reply, "The table opened on line 10 is closed with \\end{tabel}. I will correct the environment name.", 14);
            await c.wait(300);
            c.say("Every edit waits for your approval.");
            await c.approve("Apply change · main.tex", "\\end{tabel}", "\\end{table}");
            const broken = c.$("[data-broken]");
            broken.classList.remove("ldx-squiggle");
            broken.innerHTML = `<span class="t-kw">\\end</span>{table}`;
            broken.closest(".ldx-line").classList.add("is-flash");
            c.status("busy", "Compiling…");
            c.say("It recompiles to check the build is clean.");
            await c.working("Compiling main.tex…", 1100);
            c.status("ok", "Compiled · 0 errors · 6 pages");
            const done = c.message("ldx-msg", "");
            await c.type(done, "Fixed. The project compiles with no errors.", 14);
            await c.wait(1200);
        },
    },
    mention: {
        label: "@ file mentions: the assistant reads the file you name before it answers.",
        chat: true,
        height: 400,
        narrowHeight: 620,
        editor: lines(1, [
            "\\documentclass{article}",
            "\\usepackage{graphicx}",
            "\\title{Long-Document Classification}",
            "\\begin{document}",
            "\\maketitle",
            "\\input{sections/method}",
            "\\input{sections/results}",
            "\\bibliography{refs}",
            "\\end{document}",
        ]),
        async script(c) {
            c.say("Ask about a file you do not have open.");
            await c.move("[data-input]");
            await c.click();
            c.focusComposer(true);
            c.setInput("");
            c.$("[data-placeholder]").hidden = true;
            await c.type("[data-typed]", "Summarize @", 60);
            c.popup("Files", [
                ["@main.tex", ""],
                ["@sections/method.tex", ""],
                ["@sections/results.tex", ""],
                ["@refs.bib", ""],
            ]);
            c.say("Type @ and pick a file from the project.");
            await c.wait(800);
            await c.type("[data-typed]", "res", 130);
            c.filterPopup("res");
            await c.wait(500);
            await c.move(".ldx-popup-item.is-active");
            await c.click();
            c.$("[data-popup]").hidden = true;
            c.setInput('Summarize <span class="ldx-mention">@sections/results.tex</span> ');
            const typed = document.createElement("span");
            c.$("[data-typed]").append(typed);
            await c.type(typed, "in two sentences", 55);
            await c.wait(300);
            await c.send();
            c.say("The assistant reads the file before it answers.");
            await c.working("Reading sections/results.tex…", 1300);
            const reply = c.message("ldx-msg", "");
            await c.type(reply, "The results section reports 87.9% accuracy on the held-out set, ahead of every baseline in Table 2. It traces the remaining errors to long documents, where the baselines truncate their input.", 12);
            await c.wait(1400);
        },
    },
    figure: {
        label: "TikZ figures: describe a figure, then Insert figure places it at the cursor and in the PDF preview.",
        chat: true,
        height: 440,
        narrowHeight: 660,
        editor: lines(30, [...pipeline, '<span data-caret-after></span>', "\\subsection{Training}"]),
        async script(c) {
            c.say("Put the cursor where the figure should go.");
            await c.move(c.line(33).querySelector(".ldx-gutter"), "end");
            await c.click();
            c.setCaret(33);
            await c.wait(300);
            c.say("Describe the figure in plain words.");
            await c.move("[data-input]");
            await c.click();
            c.focusComposer(true);
            c.setInput("");
            c.$("[data-placeholder]").hidden = true;
            await c.type("[data-typed]", "Draw our pipeline: encoder → latent → decoder", 45);
            await c.wait(300);
            await c.send();
            await c.working("Writing TikZ…", 1200);
            const reply = c.message("ldx-msg", "Here is the pipeline as a TikZ figure:<pre class=\"ldx-codeblock\"></pre>");
            const code = [
                "\\begin{tikzpicture}",
                "  \\node[draw] (e) at (0,0) {Encoder};",
                "  \\node[draw] (z) at (2.6,0) {Latent};",
                "  \\node[draw] (d) at (5.2,0) {Decoder};",
                "  \\draw[->] (e) -- (z);",
                "  \\draw[->] (z) -- (d);",
                "\\end{tikzpicture}",
            ];
            await c.type(reply.querySelector("pre"), code.join("\n"), 7);
            const insert = document.createElement("button");
            insert.type = "button";
            insert.tabIndex = -1;
            insert.className = "ldx-insert";
            insert.innerHTML = `${icon.shapes} Insert figure`;
            reply.append(insert);
            c.$("[data-thread]").scrollTop = 9999;
            c.say("Insert figure puts it at your cursor.");
            await c.wait(900);
            await c.move(insert);
            await c.click();
            c.setCaret(null);
            c.$("[data-code]").innerHTML = lines(30, [...pipeline, ...code, "\\subsection{Training}"]);
            for (let number = 33; number <= 39; number += 1)
                c.line(number).classList.add("is-flash");
            c.status("busy", "Compiling…");
            await c.wait(900);
            c.status("ok", "Compiled · 7 pages");
            // The PDF preview opens over the chat, where LatexDo shows its preview pane.
            c.$(".ldx-chat").insertAdjacentHTML("beforeend", `<div class="ldx-pdf"><div class="ldx-pdf-head">PDF preview · page 3</div><div class="ldx-pdf-page">
          <p class="ldx-pdf-h">2.1&nbsp;&nbsp;Pipeline</p>
          <p class="ldx-pdf-p">Documents are split into chunks of 512 tokens before encoding.</p>
          <svg viewBox="0 0 220 44" class="ldx-pdf-fig" aria-hidden="true">
            <rect x="2" y="10" width="54" height="24"/><text x="29" y="26">Encoder</text>
            <rect x="83" y="10" width="54" height="24"/><text x="110" y="26">Latent</text>
            <rect x="164" y="10" width="54" height="24"/><text x="191" y="26">Decoder</text>
            <path d="M56 22h25M137 22h25"/><path d="m77 19 4 3-4 3M158 19l4 3-4 3"/>
          </svg>
          <p class="ldx-pdf-h">2.2&nbsp;&nbsp;Training</p>
        </div></div>`);
            c.say("The PDF preview shows it, and the TikZ stays editable.");
            await c.wait(1800);
        },
    },
};
function mount(figure, demo) {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    figure.innerHTML = `<div class="ldx-frame"><div class="ldx" aria-hidden="true"></div></div>
    <figcaption class="blog-demo-bar">
      <span class="visually-hidden">${escapeHtml(demo.label)}</span>
      <span class="blog-demo-caption" aria-hidden="true"></span>
      <span class="blog-demo-controls">
        <button type="button" data-pause>Pause</button>
        <button type="button" data-replay>Replay</button>
      </span>
    </figcaption>`;
    const frame = figure.querySelector(".ldx-frame");
    const stage = figure.querySelector(".ldx");
    const pauseButton = figure.querySelector("[data-pause]");
    const replayButton = figure.querySelector("[data-replay]");
    const ctx = new Ctx(stage, figure.querySelector(".blog-demo-caption"));
    let narrow = null;
    let started = false;
    let finished = false;
    const layout = () => {
        const width = frame.clientWidth;
        const isNarrow = width < 600;
        const design = isNarrow ? NARROW : WIDE;
        const height = isNarrow ? demo.narrowHeight : demo.height;
        const scale = width / design;
        stage.style.width = `${design}px`;
        stage.style.height = `${height}px`;
        stage.style.transform = `scale(${scale})`;
        frame.style.height = `${height * scale}px`;
        const changed = narrow !== null && narrow !== isNarrow;
        narrow = isNarrow;
        stage.classList.toggle("is-narrow", isNarrow);
        stage.classList.toggle("has-chat", demo.chat);
        return changed;
    };
    const setPaused = (paused) => {
        ctx.paused = paused;
        stage.classList.toggle("is-paused", paused);
        pauseButton.textContent = paused ? "Resume" : "Pause";
    };
    const play = async (instant) => {
        ctx.run += 1;
        const run = ctx.run;
        ctx.instant = instant;
        finished = false;
        setPaused(false);
        pauseButton.disabled = instant;
        replayButton.textContent = "Replay";
        stage.innerHTML = windowMarkup(demo);
        layout();
        ctx.place({ x: stage.offsetWidth * 0.72, y: stage.offsetHeight * 0.88 });
        try {
            await demo.script(ctx);
            if (run !== ctx.run)
                return;
            finished = true;
            pauseButton.disabled = true;
            stage.classList.add("is-finished");
            if (instant)
                replayButton.textContent = "Play";
        }
        catch (error) {
            if (!(error instanceof Cancelled))
                throw error;
        }
    };
    layout();
    stage.innerHTML = windowMarkup(demo);
    ctx.say(reduced ? "Press Play to watch the demo." : "Scroll here to play.");
    pauseButton.addEventListener("click", () => {
        if (started)
            setPaused(!ctx.paused);
    });
    replayButton.addEventListener("click", () => {
        started = true;
        void play(false);
    });
    new ResizeObserver(() => {
        // A switch between the wide and stacked layouts moves every target, so
        // the demo restarts there; other resizes only rescale it.
        if (layout() && started)
            void play(ctx.instant || finished);
    }).observe(frame);
    // The clock only runs while the demo is on screen and the tab is showing.
    let inView = false;
    const updateVisible = () => {
        ctx.visible = inView && !document.hidden;
    };
    new IntersectionObserver((entries) => {
        inView = entries.some((entry) => entry.isIntersecting);
        updateVisible();
        if (ctx.visible && !started) {
            started = true;
            void play(reduced);
        }
    }, { threshold: 0.55 }).observe(frame);
    document.addEventListener("visibilitychange", updateVisible);
}
for (const figure of Array.from(document.querySelectorAll("figure.blog-demo[data-demo]"))) {
    const demo = demos[figure.dataset.demo ?? ""];
    if (demo)
        mount(figure, demo);
}
export {};
