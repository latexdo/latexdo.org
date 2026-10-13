// Self-playing research stories. Only visible scenes consume animation frames.
// No model requests or compilation: these are examples of the desktop workflow.
const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
const mobileLayout = window.matchMedia("(max-width: 680px)");
const items = <T extends Element>(
  selector: string,
  root: ParentNode = document,
): T[] => Array.from(root.querySelectorAll<T>(selector));

interface Film {
  element: HTMLElement;
  stages: HTMLLIElement[];
  durations: number[];
  elapsed: number;
  phase: number;
  visible: boolean;
  paused: boolean;
  toggle: HTMLButtonElement | null;
  caption: HTMLElement | null;
  number: HTMLElement | null;
  graph: ReturnType<typeof prepareGraph> | null;
}

function prepareGraph(element: HTMLElement) {
  const svg = element.querySelector<SVGSVGElement>(".r-graph-svg");
  if (!svg) return null;
  return {
    svg,
    nodes: items<SVGGElement>("[data-graph-node]", element),
    edges: items<SVGPathElement>("[data-edge]", element),
    packets: items<SVGCircleElement>("[data-packet]", element),
  };
}

const films: Film[] = items<HTMLElement>("[data-film]").map((element) => ({
  element,
  stages: items<HTMLLIElement>(".r-film-progress li", element),
  durations:
    element.dataset.film === "graph"
      ? [3600, 4400, 4400, 5000]
      : [3400, 3800, 4400, 4200, 5000],
  elapsed: 0,
  phase: -1,
  visible: false,
  paused: false,
  toggle: element.querySelector<HTMLButtonElement>("[data-motion-toggle]"),
  caption: element.querySelector<HTMLElement>("[data-scene-caption]"),
  number: element.querySelector<HTMLElement>("[data-scene-number]"),
  graph: prepareGraph(element),
}));

function renderGraph(film: Film, seconds: number): void {
  const graph = film.graph;
  if (!graph) return;
  const small = mobileLayout.matches;
  graph.svg.setAttribute("viewBox", small ? "0 0 440 360" : "0 0 800 370");
  const bases = small
    ? [
        [80, 86],
        [257, 72],
        [78, 255],
        [269, 250],
        [369, 168],
      ]
    : [
        [160, 110],
        [420, 80],
        [200, 285],
        [520, 270],
        [690, 160],
      ];
  const points = bases.map(([x, y], index) => [
    x + Math.sin(seconds * 0.32 + index * 1.7) * (small ? 6 : 11),
    y + Math.cos(seconds * 0.27 + index * 1.2) * (small ? 7 : 12),
  ]);
  graph.nodes.forEach((node, index) => {
    const [x, y] = points[index];
    node.setAttribute(
      "transform",
      `translate(${x.toFixed(2)} ${y.toFixed(2)})`,
    );
  });
  graph.edges.forEach((edge, index) => {
    const [from, to] = (edge.dataset.edge ?? "0,1").split(",").map(Number);
    const [x1, y1] = points[from];
    const [x2, y2] = points[to];
    const cx = (x1 + x2) / 2 + 12;
    const cy = (y1 + y2) / 2 - 12;
    edge.setAttribute("d", `M${x1} ${y1}Q${cx} ${cy} ${x2} ${y2}`);
    const packet = graph.packets[index];
    if (!packet) return;
    const t = (seconds * 0.18 + index * 0.31) % 1;
    const x = (1 - t) ** 2 * x1 + 2 * (1 - t) * t * cx + t ** 2 * x2;
    const y = (1 - t) ** 2 * y1 + 2 * (1 - t) * t * cy + t ** 2 * y2;
    packet.setAttribute("cx", x.toFixed(2));
    packet.setAttribute("cy", y.toFixed(2));
    const relation = edge.dataset.relation;
    const active =
      film.phase === 3 ||
      (film.phase === 1 && relation !== "topic") ||
      (film.phase === 2 && relation !== "author");
    packet.style.opacity = active && !motionPreference.matches ? "0.8" : "0";
  });
}

function render(film: Film): void {
  const total = film.durations.reduce((sum, duration) => sum + duration, 0);
  let remaining = film.elapsed % total;
  let phase = 0;
  while (
    phase < film.durations.length - 1 &&
    remaining >= film.durations[phase]
  ) {
    remaining -= film.durations[phase];
    phase++;
  }
  if (motionPreference.matches) phase = film.stages.length - 1;
  if (film.phase !== phase) {
    film.phase = phase;
    film.element.dataset.phase = String(phase);
    const text = film.stages[phase]?.textContent?.trim() ?? "";
    if (film.caption) film.caption.textContent = text;
    if (film.number)
      film.number.textContent = `${String(phase + 1).padStart(2, "0")} / ${String(film.stages.length).padStart(2, "0")}`;
    film.stages.forEach((stage, index) => {
      stage.classList.toggle("is-current", index === phase);
      stage.classList.toggle("is-past", index < phase);
    });
  }
  film.element.style.setProperty(
    "--scene-progress",
    String(motionPreference.matches ? 1 : remaining / film.durations[phase]),
  );
  renderGraph(film, motionPreference.matches ? 0 : film.elapsed / 1000);
}

let frame = 0;
let previousTime = 0;
const decorations = items<HTMLElement>(".r-overview, .h-research-map");
const visibleDecorations = new Set<Element>();
function running(film: Film): boolean {
  return (
    film.visible &&
    !film.paused &&
    !motionPreference.matches &&
    !document.hidden
  );
}
function tick(time: number): void {
  frame = 0;
  // Visibility changes reset the clock. Dropped frames do not skip entire scenes.
  const delta = previousTime ? Math.min(time - previousTime, 100) : 0;
  previousTime = time;
  for (const film of films) {
    if (!running(film)) continue;
    film.elapsed += delta;
    render(film);
  }
  if (films.some(running)) frame = requestAnimationFrame(tick);
  else previousTime = 0;
}
function syncPlayback(): void {
  for (const film of films)
    film.element.classList.toggle("is-running", running(film));
  for (const decoration of decorations) {
    decoration.classList.toggle(
      "is-running",
      visibleDecorations.has(decoration) &&
        !motionPreference.matches &&
        !document.hidden,
    );
  }
  if (films.some(running) && !frame) {
    previousTime = 0;
    frame = requestAnimationFrame(tick);
  } else if (!films.some(running) && frame) {
    cancelAnimationFrame(frame);
    frame = 0;
    previousTime = 0;
  }
}

for (const film of films) {
  render(film);
  if (film.toggle) {
    film.toggle.hidden = motionPreference.matches;
    film.toggle.addEventListener("click", () => {
      film.paused = !film.paused;
      film.element.classList.toggle("r-is-paused", film.paused);
      film.toggle?.setAttribute(
        "aria-label",
        `${film.paused ? "Play" : "Pause"} ${film.element.dataset.film} animation`,
      );
      syncPlayback();
    });
  }
}

if ("IntersectionObserver" in window) {
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        const film = films.find(
          (candidate) => candidate.element === entry.target,
        );
        if (film)
          film.visible =
            entry.isIntersecting && entry.intersectionRatio >= 0.16;
        else if (entry.isIntersecting) visibleDecorations.add(entry.target);
        else visibleDecorations.delete(entry.target);
      }
      syncPlayback();
    },
    { threshold: 0.16 },
  );
  for (const film of films) observer.observe(film.element);
  for (const decoration of decorations) observer.observe(decoration);
} else {
  for (const film of films) film.visible = true;
  for (const decoration of decorations) visibleDecorations.add(decoration);
  syncPlayback();
}
document.addEventListener("visibilitychange", syncPlayback);
motionPreference.addEventListener("change", () => {
  for (const film of films) {
    film.elapsed = 0;
    film.phase = -1;
    if (film.toggle) film.toggle.hidden = motionPreference.matches;
    render(film);
  }
  syncPlayback();
});
mobileLayout.addEventListener("change", () => films.forEach(render));
export {};
