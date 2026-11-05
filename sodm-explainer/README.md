# Architecture v2

Open [architecture.html](architecture.html) in a browser for **Decision models & Clef-Flash**, a walkthrough for a mixed engineering audience, intended for a 25-minute presentation and subsequent reference. It follows a support-triage example from input packing to supervised candidate scoring, then examines Clef-Flash. The document uses local stylesheets and inline SVG and works directly from disk without a build step.

Equations use LaTeX delimiters (`\(...\)` inline and `\[...\]` for display math) rendered by locally bundled KaTeX 0.16.22. The renderer, stylesheet, WOFF2 fonts, and MIT license live in `vendor/katex/`; `architecture-math.js` initializes rendering and leaves code untouched. Figure formulas use `data-tex` on SVG text labels (candidate IDs are recognized automatically) and render into measured SVG `foreignObject` elements, preserving baselines, alignment, transforms, and candidate colors. Original SVG text remains as a no-JavaScript fallback. No CDN or network connection is needed. Without JavaScript, article formulas show readable LaTeX source. Rendered equations include MathML for assistive technology.

The layout uses a narrow reading column, wide figures, and quiet section navigation. Token-boundary bookkeeping, candidate capacity, padding, pseudocode, and source-specific notes are expandable, keeping the main argument readable without removing the technical detail. Part I develops the generic candidate-scoring blueprint. Part II follows the concrete Clef-Flash inference implementation, expanding the example to three typed questions and explaining token memory, pooled and lexical option vectors, two evidence-routing layers, four joint field-decoder layers, and the lexical-prior/gated-joint scorer. Four additional diagrams simplify the tensor flow from the existing implementation map. No interactive demos are included.

This general overview covers:

- Packing a state, question, candidate choices, and fixed answer suffix.
- An opening recap of `choice`, boolean `noul`, and ordered `score` as shared candidate-scoring machinery with different readouts; contrasts request-defined choices with fixed-label classification and qualifies the “no hallucination” claim.
- Reading choice and answer vectors from a pretrained transformer.
- Dot-product, bilinear, and attention-refined decision heads.
- Variable candidate counts, masked softmax, and supervised training.
- Candidate-slot capacity, deployment limits, candidate generation, and staged narrowing.
- Choice-order equivariance through candidate-local position IDs, suffix positions starting after the longest choice, block-causal attention, and a symmetric head. Includes position and visibility diagrams, mask pseudocode, and verification guidance.
- Ordered score scales: preserve semantic rank and the value–label mapping; distinguish explicit rating values from Clef-Flash’s zero-based, list-index readout.
- Prefill-only inference and parallel schema scoring, with attributed performance claims rather than unmeasured speed guarantees.
- Cloudflare’s reported post-training: frozen Qwen base weights, rank-256 adapters and routing-head optimization, label-smoothed cross-entropy, Brier loss, synthetic schema variation, and RLCD’s ordinal/whole-record incentives and reference penalty. Training-time robustness is distinguished from architectural equivariance.

The [Cloudflare Clef blog excerpt supplied by the user](../slides/cloudflare-clef-excerpt.txt) is preserved locally for provenance. Its original article URL was not supplied. The guide separates the excerpt’s training and performance claims from the code-backed inference description; it retains the stated Clef backbone name with an explicit verification caveat.

Sources: the [supplied video](https://www.youtube.com/watch?v=sF3CNPbWA8o), its [first transcript on basic architecture](../slides/transcript1.txt), the [second transcript on choice-order invariance](../slides/transcript2.txt), and these screenshots in timestamp order:

- [14.40.38 · Input packing](../slides/screenshots/Screenshot%202026-10-28%20at%2014.40.38.png): dataset record → ordered sequence, with a separate training target.
- [14.41.17 · Architecture overview](../slides/screenshots/Screenshot%202026-10-28%20at%2014.41.17.png): pretrained backbone → selected hidden states → decision head.
- [14.41.25 · Dot-product head](../slides/screenshots/Screenshot%202026-10-28%20at%2014.41.25.png): compare the shared answer vector with each candidate; distinguish similarity scores from softmax probabilities.
- [14.41.36 · Bilinear head](../slides/screenshots/Screenshot%202026-10-28%20at%2014.41.36.png): learn cross-dimension interactions with one matrix shared across candidates.
- [14.41.49 · Attention-refined head](../slides/screenshots/Screenshot%202026-10-28%20at%2014.41.49.png): task and answer-role embeddings → two self-attention layers → enriched vectors → bilinear logits → softmax.
- [14.43.00 · Maximum choices](../slides/screenshots/Screenshot%202026-10-28%20at%2014.43.00.png): choice-slot capacity, the screenshot’s quoted 255-option API limit, candidate generation, and staged narrowing.
- [14.43.23 · Masked softmax](../slides/screenshots/Screenshot%202026-10-28%20at%2014.43.23.png): 32 valid choices and 223 padded slots; mask logits with −∞ before normalization, with a separate complete five-choice numerical example.
- [16.22.39 · Reset positional encodings](../slides/screenshots/Screenshot%202026-10-28%20at%2016.22.39.png): every choice starts at position 7; the suffix starts after the longest choice at positions 14–15. Figure 7a adapts the diagram to Billing (four squares), Technical support (seven), and Account access (five), roughly reflecting label length rather than measured tokenization.
- [16.23.00 · Causal attention and choice order](../slides/screenshots/Screenshot%202026-10-28%20at%2016.23.00.png): a block-level causal mask and schematic vectors show how later choices can incorporate earlier candidates. Figure 7b uses the same support teams to introduce the asymmetry before the isolated-choice mask.
- [16.23.15 · Compare token-level masks](../slides/screenshots/Screenshot%202026-10-28%20at%2016.23.15.png): Figure 7c compares ordinary and candidate-isolated causal masks, preserving within-choice causality and suffix access while removing cross-choice connections.
- [16.23.37 · Ordered score scales](../slides/screenshots/Screenshot%202026-10-28%20at%2016.23.37.png): Figure 7d preserves the review example, the 1–5 terrible-to-great scale, and the crossed-out shuffled row. Explains when order defines numeric meaning and when explicit values can move with candidate identities.

Figures 1–7 are original SVG adaptations of the supplied visual references, with consistent candidate colors. Figures 7a–7d illustrate the second transcript’s positional reset, ordinary causal asymmetry, block-causal solution, and ordered-score exception, incorporating the 16.22.39, 16.23.00, 16.23.15, and 16.23.37 screenshots respectively. Figures 8–11 follow `joint_schema_model.py` and the release configurations, using the existing architecture map as a visual reference. Numerical examples are illustrative; figure captions explain the concepts, while provenance is collected at the end of the article.

The document includes technical clarifications about cosine similarity, bilinear matrix dimensions, RoPE versus additive positions, suffix positioning, and the full-model conditions for choice-order equivariance. The full-attention construction requires separate analysis for hybrid backbones. For the repository’s concrete implementation, see the [original architecture map](../architecture/architecture-diagram.html).
