<!-- Generated from .project/PROJECT.md by the engine — do not run `impeccable init`, which would interview a user who isn't here. Edit .project/PROJECT.md; this file is regenerated from it. -->
# Registro de despacho de aves

**Platform:** Responsive web — Next.js, React, Tailwind. shadcn/ui and lucide are installed and available; the direction decides whether they fit or whether this surface needs its own vocabulary.
**Task mode:** Operate (pass as `--mode operate` to any script)

## What this is

App de campo en español para registrar, consultar y personalizar despachos de aves.

## What it enables

Permitir que el equipo avícola registre despachos desde el celular, adapte los campos a su operación y conserve sus datos sin conexión.

## Primary user

Personal de despacho, transporte y supervisión de una empresa avícola peruana.

## What exists today

El formulario se genera desde un esquema editable con secciones y campos personalizados. Guarda registros en el dispositivo, permite validación de datos peruanos, edición, detalle, resumen por plantel, búsqueda, filtros y exportación/importación de CSV y respaldos JSON. La interfaz tiene navegación móvil inferior y panel lateral de escritorio. La sincronización externa aún no está implementada.

## Brand commitments & durable constraints

Interfaz completamente en español. Prioridad móvil y operación sin conexión. Esquema en localStorage; al renombrar o quitar campos, los registros existentes conservan sus etiquetas y valores guardados. No presentar la sincronización externa como disponible hasta implementarla.

- **This project already HAS a committed visual world — do NOT offer a design picker.** `.project/DESIGN_SYSTEM.md` records a direction someone decided on, and the code, tokens and components are built around it. Read it, inherit it, and make the requested change inside it. Dealing six alternative worlds here offers to throw away a working design system nobody asked you to replace.
- **Tailoring is not redesigning.** "Make it about my business", new copy, a different logo, swapped imagery, a brand colour — all of that lands INSIDE the committed world. Change what was asked for and leave the direction alone.
- **The one exception is an explicit, whole-app redesign** — the user asking for a different look outright, not merely a change that happens to be large. Then the direction is open again and the picker applies. When they name the new direction themselves, that is the decision: pin it and build, still without a picker.
- Never run `impeccable serve-question`, with any flag (`--schema` included). It is disabled in this sandbox and always fails. Ask only through the design-picker command, and only when the instructions above say the user is choosing.
- Design tooling is one launcher, `scripts/impeccable <verb>` in the skill folder (`build-phase status`, `concept-seed`, and so on). The `node …/scripts/*.mjs` files from older versions do not exist here; never run one.
- The user's own words always outrank the roll. A direction, palette, face or reference they named is pinned; the roll only decides what they left open.
- Two review rounds is the budget, then ship and report open items honestly under the reviewer's own verdict — never announce a table with open findings as a pass.
- Web fonts load through Fontsource, never `next/font/google` — this sandbox has no Google egress, so the fetch hangs at compile and the preview renders blank.
- No AI-builder badge, watermark, or attribution anywhere in the product.
- Decisions recorded in `.project/` (ledger, DESIGN_SYSTEM.md) are commitments; contradict one only when the user asks.

## Positioning

App de campo en español para registrar, consultar y personalizar despachos de aves.

## Operating Context

Responsive web, built unattended in one pass. Task mode: Operate.

## Evidence on Hand

El formulario se genera desde un esquema editable con secciones y campos personalizados. Guarda registros en el dispositivo, permite validación de datos peruanos, edición, detalle, resumen por plantel, búsqueda, filtros y exportación/importación de CSV y respaldos JSON. La interfaz tiene navegación móvil inferior y panel lateral de escritorio. La sincronización externa aún no está implementada.

## Product Principles

- Clarity of the task beats decoration; the interface earns attention only where the product does.
- Say what is true: no invented prices, customers, benchmarks or capabilities the product does not have.
