---
name: design-lenses
description: Explore a product, interface, or visual concept through award-caliber web craft, a Linear-like product-design lens, and Dieter Rams's design principles. Use when asked “How would you design X if…?” or to compare these approaches.
---

# Design Lenses

Use these three perspectives to make distinct, useful design proposals for the user's subject. They are lenses for reasoning, not impersonations or claims about what a named designer would personally make.

## Start with the subject

- Resolve `__` or another placeholder from context. If the subject is genuinely missing, ask what they want designed.
- Use any supplied product, audience, platform, task, brand, and technical constraints. If important context is absent, state a small assumption and continue; ask only when it would change the direction materially.
- Before ideation, refer to the [Hairline project](https://github.com/lucasmarkes/hairline), especially its [figures](https://hairline.lucasmarkes.com/figures) and [inspiration/process](https://hairline.lucasmarkes.com/inspo) references. Take transferable cues from economical linework, legible silhouettes, coherent assembly, composed resting states, and testing assumptions. Use only what fits the subject; do not copy Hairline's exact geometry, strokes, motion, timings, or code.
- When working in a repository, read its applicable `AGENTS.md` and current project brief before proposing or changing UI. Treat project decisions and user-supplied references as constraints.
- A request for design direction is not permission to edit code. Implement only when the user asks for implementation.

## Develop three independent directions

For each direction, explain the central idea, how it serves the user's task, and one meaningful tradeoff. Ground each in concrete choices that can be reasoned about from the available context. Do not fill gaps with arbitrary styling values or invented interaction rules.

### 1. Award-caliber web craft

Explore expressive art direction and a memorable digital experience: a clear visual thesis, deliberate composition and typography, purposeful contrast, and a small number of crafted interaction moments where the medium helps tell the story. Make the visual signature specific to the subject. Do not equate award-level work with spectacle, novelty, or motion everywhere; protect comprehension, accessibility, and task completion.

### 2. Linear-like product design

Explore a calm, precise product interface: strong information hierarchy, efficient workflows, consistent patterns, restrained visual emphasis, fast feedback, and details that reward frequent use. Keep this as a high-level product-design sensibility; do not claim access to or reproduce a particular Linear designer's private process, exact screens, or proprietary design system.

### 3. Dieter Rams principles

Explore usefulness, understandability, restraint, honesty, durability, and care in details. Remove elements that do not help the task; let materials and construction communicate purpose. Avoid reducing this lens to beige minimalism, retro hardware styling, or a literal copy of Rams-designed products.

## Compare, then converge

After the three directions:

1. Name the main difference in what each direction optimizes for.
2. Recommend a direction or a deliberate combination, tied to the user's goals and constraints.
3. Call out what should be tested or decided by the user instead of presenting a hypothesis as fact.
4. Offer a compact next step, such as a screen outline, component spec, moodboard brief, or implementation plan, when useful.

Keep the response proportional to the request. For a quick prompt, use three short concepts and one recommendation. For a substantial design brief, add structure, content hierarchy, key states, responsive considerations, and accessibility notes as relevant.

## ZAO repo constraints

When this skill is used in the ZAO repository, the repo's `AGENTS.md`, `BRIEF.md`, and current `PLAN.md` scope take precedence. The current design direction guides exploration; it does not by itself approve code, token, dependency, interaction, or published-default changes. Yankun owns visual choices and promotion. Follow only the component interactions he has specifically approved, and leave other interactions open. Present alternatives for review rather than silently choosing values or implementing them.
