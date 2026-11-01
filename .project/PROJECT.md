<!-- OWNER: Build (with the user) · READERS: every agent · READ THIS FIRST -->
# Registro Despacho Manitou jaula

**One-liner:** App de campo en español para registrar y consultar despachos de aves en jaula.

## Goal
Permitir que el equipo avícola registre despachos Manitou desde el celular, adapte los campos a su operación y conserve sus datos sin conexión.

## Target users
Personal de despacho, transporte y supervisión de una empresa avícola peruana.

## Status
- Stage: building
- Live URL: —
- Repo: —

## What exists today
<!-- Kept current by the Build agent after each build -->
El formulario parte de una sección con 12 campos de despacho Manitou y sigue siendo editable. Guarda registros en el dispositivo, conserva fecha y plantel al registrar, permite detalle, edición, eliminación, resumen por plantel, búsqueda, filtros y exportación/importación de CSV y respaldos JSON. La interfaz tiene navegación móvil inferior y panel lateral de escritorio, e indica conexión o modo sin conexión. La sincronización externa no está implementada.

## Constraints / must-nots
Interfaz completamente en español. Prioridad móvil y operación sin conexión. Esquema en `despachos_manitou_schema_v1` y registros en `despachos_manitou_v1`; al renombrar o quitar campos, los registros existentes conservan sus etiquetas y valores guardados. No presentar la sincronización externa como disponible hasta implementarla.
