/* Local KaTeX assets keep this article usable without a network connection. */
if (typeof renderMathInElement === "function") {
  renderMathInElement(document.querySelector("main"), {
    delimiters: [
      { left: "\\[", right: "\\]", display: true },
      { left: "\\(", right: "\\)", display: false },
    ],
    ignoredTags: ["script", "noscript", "style", "textarea", "pre", "code", "svg"],
    throwOnError: false,
    strict: "warn",
    trust: false,
    output: "htmlAndMathml",
  });
}

/* SVG text cannot contain KaTeX's HTML. Use a measured foreignObject at the
 * original text baseline (or explicit vertical center), preserving alignment,
 * transforms, and color.
 * Keep the original SVG text as a no-JavaScript fallback. */
async function renderFigureMath() {
  if (typeof katex === "undefined") return;
  await document.fonts.ready;

  const svgNS = "http://www.w3.org/2000/svg";
  const htmlNS = "http://www.w3.org/1999/xhtml";
  const labels = [...document.querySelectorAll('.architecture-map:not(.packing-map):not([data-math-render="false"]) text')];
  const probe = document.createElement("span");
  probe.className = "figure-math";
  probe.style.cssText = "position:absolute;visibility:hidden;white-space:nowrap;";
  document.body.append(probe);

  try {
    for (const label of labels) {
      if (label.dataset.mathRendering) continue;
      const source = label.textContent.trim();
      // Candidate IDs are also math, including IDs followed by a plain label.
      const candidate = source.match(/^C([₁₂₃])(.*)$/u);
      const tex = label.dataset.tex || (candidate
        ? `C_${"₁₂₃".indexOf(candidate[1]) + 1}${candidate[2] ? `\\;\\cdot\\;\\text{${candidate[2].replace(/^\s*·\s*/, "")}}` : ""}`
        : source === "task t" ? "\\text{task }t"
        : source === "answer a" ? "\\text{answer }a"
        : null);
      if (!tex) continue;
      label.dataset.mathRendering = "true";

      const style = getComputedStyle(label);
      const fontSize = style.fontSize;
      const markup = katex.renderToString(tex, {
        throwOnError: true,
        trust: false,
        output: "htmlAndMathml",
      });
      probe.style.fontSize = fontSize;
      probe.innerHTML = markup;
      const baseline = document.createElement("span");
      baseline.style.cssText = "display:inline-block;width:0;height:0;";
      probe.append(baseline);
      await document.fonts.ready;
      const bounds = probe.getBoundingClientRect();
      const baselineOffset = baseline.getBoundingClientRect().top - bounds.top;
      const width = Math.ceil(bounds.width) + 2;
      const height = Math.ceil(bounds.height) + 2;
      const anchor = style.textAnchor;

      const group = document.createElementNS(svgNS, "g");
      group.setAttribute("class", "figure-math-label");
      const transform = label.getAttribute("transform") || "";
      const x = Number(label.getAttribute("x") || 0);
      const y = Number(label.getAttribute("y") || 0);
      group.setAttribute("transform", `${transform} translate(${x} ${y})`);

      const box = document.createElementNS(svgNS, "foreignObject");
      box.setAttribute("x", anchor === "middle" ? -width / 2 : anchor === "end" ? -width : 0);
      box.setAttribute("y", label.dataset.mathAlign === "center" ? -height / 2 : -baselineOffset);
      box.setAttribute("width", width);
      box.setAttribute("height", height);
      const content = document.createElementNS(htmlNS, "div");
      content.className = "figure-math";
      content.style.fontSize = fontSize;
      content.style.color = style.fill;
      content.innerHTML = markup;
      box.append(content);
      group.append(box);
      label.before(group);
      label.style.display = "none";
      label.setAttribute("aria-hidden", "true");
    }
  } finally {
    probe.remove();
  }
}

renderFigureMath().catch(error => console.error("Figure math rendering failed:", error));
