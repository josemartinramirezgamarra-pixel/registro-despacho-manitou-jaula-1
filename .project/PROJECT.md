<!-- OWNER: Build (with the user) · READERS: every agent · READ THIS FIRST -->
# Registro de despacho de aves

**One-liner:** App de campo en español para registrar, consultar y personalizar despachos de aves.

## Goal
Permitir que el equipo avícola registre despachos desde el celular, adapte los campos a su operación y conserve sus datos sin conexión.

## Target users
Personal de despacho, transporte y supervisión de una empresa avícola peruana.

## Status
- Stage: building
- Live URL: —
- Repo: —

## What exists today
<!-- Kept current by the Build agent after each build -->
El formulario se genera desde un esquema editable con secciones y campos personalizados. Guarda registros en el dispositivo, permite validación de datos peruanos, edición, detalle, resumen por plantel, búsqueda, filtros y exportación/importación de CSV y respaldos JSON. La interfaz tiene navegación móvil inferior y panel lateral de escritorio. La sincronización externa aún no está implementada.

## Constraints / must-nots
Interfaz completamente en español. Prioridad móvil y operación sin conexión. Esquema en localStorage; al renombrar o quitar campos, los registros existentes conservan sus etiquetas y valores guardados. No presentar la sincronización externa como disponible hasta implementarla.
