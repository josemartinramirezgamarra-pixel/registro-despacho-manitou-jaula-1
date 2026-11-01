---
name: "Registro Despacho Manitou jaula"
description: "App de campo en español para registrar y consultar despachos de aves en jaula."
colors:
  background: "hsl(156 24% 97%)"
  foreground: "hsl(174 31% 13%)"
  card: "hsl(0 0% 100%)"
  card-foreground: "hsl(174 31% 13%)"
  popover: "hsl(0 0% 100%)"
  popover-foreground: "hsl(174 31% 13%)"
  primary: "hsl(174 77% 26%)"
  primary-foreground: "hsl(0 0% 100%)"
  secondary: "hsl(156 30% 92%)"
  secondary-foreground: "hsl(174 50% 20%)"
  muted: "hsl(156 18% 94%)"
  muted-foreground: "hsl(174 10% 39%)"
  accent: "hsl(156 30% 92%)"
  accent-foreground: "hsl(174 50% 20%)"
  destructive: "hsl(0 70% 46%)"
  border: "hsl(167 18% 86%)"
  input: "hsl(167 18% 82%)"
  ring: "hsl(174 77% 26%)"
  sidebar-ring: "hsl(174 77% 26%)"
  sidebar-border: "hsl(167 18% 86%)"
  sidebar-accent-foreground: "hsl(174 50% 20%)"
  sidebar-accent: "hsl(156 30% 92%)"
  sidebar-primary-foreground: "hsl(0 0% 100%)"
  sidebar-primary: "hsl(174 77% 26%)"
typography:
  display:
    fontFamily: "system-ui, semibold to bold"
  body:
    fontFamily: "system-ui"
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Consolas, \"Liberation Mono\", monospace"
rounded:
  sm: "calc(var(--radius) * 0.6)"
  md: "calc(var(--radius) * 0.8)"
  lg: "0.9rem"
  xl: "calc(var(--radius) * 1.4)"
  2xl: "calc(var(--radius) * 1.8)"
  3xl: "calc(var(--radius) * 2.2)"
  4xl: "calc(var(--radius) * 2.6)"
---

<!-- Generated from .project/DESIGN_SYSTEM.md + app/globals.css by the engine. Tokens above are normative and mirror the CSS; edit the CSS and DESIGN_SYSTEM.md, not this file. -->

## Overview

Manifiesto de báscula de campo: una superficie clara y ordenada, verde-teal de confianza, grupos de datos bien separados y controles amplios para registrar desde el celular.

## Colors

| Token | Value |
| background | #f4f8f6 |
| surface | #ffffff |
| text / muted | #173b38 / #5d716e |
| border | #c8ded8 |
| primary | #0f766e |
| accent | #d2e8e2 |
| success / warning / danger | #0f766e / #a46d12 / #c23a38 |

Declared in `globals.css` as `--color-*` and mirrored in the frontmatter. Use the token, never a raw hex.

## Typography

- Headings: system-ui, semibold to bold
- Body: system-ui

- Display: `system-ui, semibold to bold`
- Body: `system-ui`
- Mono: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`

## Layout

- Radius / shadow / spacing rhythm: 14–16px cards, low-contrast shadows, generous touch spacing, 44px minimum controls
- Shared components: buttons, inputs, selects, checkboxes, accessible dialogs, status badges, form sections

## Shapes

Radii: `sm` calc(var(--radius) * 0.6), `md` calc(var(--radius) * 0.8), `lg` 0.9rem, `xl` calc(var(--radius) * 1.4), `2xl` calc(var(--radius) * 1.8), `3xl` calc(var(--radius) * 2.2), `4xl` calc(var(--radius) * 2.6)

## Do's and Don'ts

- Voice: Español directo y operativo: instrucciones breves, validación útil y sin datos inventados.

- Do load faces through Fontsource, not `next/font/google`.
- Don't introduce a colour or radius that isn't a token above.
- Don't use gradient text, or a purple/violet gradient as the brand signal.
- Don't use bounce or elastic easing; real objects decelerate smoothly.
