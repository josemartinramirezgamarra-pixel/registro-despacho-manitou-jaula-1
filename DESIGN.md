---
name: "workspace"
description: "Crear una aplicación web funcional, en español, para registrar DESPACHOS DE AVES de una empresa avícola peruana. Debe funcionar como una app de campo en el celular (mobile-first, uso con una mano, botones grandes), pero también verse bien en computadora. El objetivo es que el usuario pueda abrir un enlace en su teléfono y registrar despachos sin instalar nada. INTERFAZ 100% EN ESPAÑOL. ESTRUCTURA: una sola página con barra de navegación inferior fija (iconos SVG inline, sin librerías externas) con cuatro pestañas: 1. \"Nuevo despacho\" — el formulario. 2. \"Registros\" — lista de despachos guardados. 3. \"Resumen\" — totales. 4. \"Campos\" — editor del formulario. Encabezado fijo con el título \"Registro de Despacho de Aves\" y subtítulo \"Control de despachos y transporte\". REQUISITO CENTRAL — FORMULARIO DINÁMICO: el formulario NO debe tener campos escritos a mano en el HTML. Se genera a partir de un esquema guardado en localStorage (clave \"despachos_aves_schema_v3\"). El usuario puede agregar, eliminar, renombrar, reordenar y recategorizar los campos desde la pestaña \"Campos\", y el formulario, la validación, el CSV y el resumen deben reflejarlo al instante. ESQUEMA: un array de SECCIONES {id, titulo, orden} y un array de CAMPOS {id único estable, etiqueta, seccion_id, tipo, obligatorio, opciones, ayuda, ancho (\"completo\"|\"medio\"), orden, maxlength, calculo}. TIPOS DE CAMPO SOPORTADOS: texto, numero (entero), decimal, fecha, hora, select (con opciones), textarea, checkbox, ruc (11 dígitos con validación de dígito verificador módulo 11), dni (8 dígitos exactos), placa (formatos peruanos ABC-123, AB-1234, A1B-234, normalizando a mayúsculas y guion), email, telefono, y auto (campo calculado de solo lectura, con fórmula \"suma\", \"division\" o \"promedio\" entre dos campos numéricos elegidos). Los ids de campo son estables: renombrar la etiqueta NO cambia el id, para no romper registros ya guardados. ESQUEMA POR DEFECTO (exactamente este, en este orden): Sección \"Identificación del despacho\": N° de despacho (texto, obligatorio, ayuda \"Se genera automáticamente, puedes editarlo\"), Fecha (fecha, obligatorio, por defecto hoy), Hora (hora, obligatorio, por defecto ahora), Tipo de operación (select obligatorio: Despacho a cliente, Traslado interno, Retorno de aves). Sección \"Origen\": Plantel (select obligatorio: Plantel 209, Plantel 263, Plantel 264, Otro), Plantel — especificar (texto, opcional), Código SENASA del establecimiento (texto), Galpón / Lote (texto, obligatorio), Edad de las aves en semanas (número, obligatorio). Sección \"Destino\": Cliente / Razón social (texto, obligatorio), RUC (ruc, obligatorio), Departamento (texto), Provincia (texto), Distrito (texto), Dirección de destino (texto, ancho completo). Sección \"Aves y carga\": Machos (número), Hembras (número), Total de aves (auto, suma de Machos + Hembras), Peso total en kg (decimal), Peso promedio por ave en kg (auto, división peso total entre total de aves, 2 decimales), N° de jaulas / guacales (número), Aves no aptas / mortandad (número, ayuda \"Aves no aptas o muertas\"). Sección \"Transporte\": Placa del camión o tracto (placa, obligatorio), Placa del remolque / carrocería (placa), Empresa transportista (texto), RUC del transportista (ruc), Conductor (texto), DNI del conductor (dni, obligatorio), Licencia / brevete (texto), N° de Certificado Sanitario de Tránsito Interno — CSTI (texto), Guía de remisión (texto). Sección \"Responsable y cierre\": Nombre del responsable del despacho (texto, obligatorio), DNI del responsable (dni), Observaciones (textarea, máximo 500 caracteres con contador visible), Declaración (checkbox obligatorio, etiqueta \"Declaro que la información registrada es veraz\"). PESTAÑA \"CAMPOS\" (editor): lista de secciones en tarjetas con contador de campos y botones \"Renombrar\", \"Agregar campo aquí\", subir/bajar sección y \"Eliminar sección\". Dentro de cada sección, sus campos en orden, cada fila con etiqueta, tipo en gris pequeño, marca \"Obligatorio\", y botones \"Editar\", \"Duplicar\", \"Eliminar\", flechas para reordenar y un toggle rápido de obligatorio. Botón destacado \"+ Nuevo campo\" que abre un modal con: etiqueta, sección, tipo, obligatorio, ayuda, ancho, máximo de caracteres, opciones en líneas separadas (solo select) y configuración de fórmula (solo auto). Validar en el modal: etiqueta no vacía, no duplicada, select con al menos 2 opciones, auto con fórmula completa; errores en español dentro del modal. Botón \"Restaurar formulario por defecto\" con confirmación. Botones \"Exportar esquema JSON\" e \"Importar esquema JSON\". Un aviso de una línea al inicio: los cambios se aplican al instante y los registros guardados no se borran. FORMULARIO: solo las secciones y campos del esquema actual, en su orden; etiqueta siempre arriba del campo (nunca un placeholder como única etiqueta), texto de ayuda debajo, asterisco en obligatorios. Una columna en móvil, dos columnas en pantalla ancha respetando el ancho medio/completo. Los campos auto se calculan en vivo. Validación al enviar: borde rojo y mensaje debajo de cada campo inválido, enfocar y hacer scroll al primero, no guardar hasta que todo sea válido. Botón fijo y grande \"Guardar despacho\". Al guardar: toast de confirmación, se conserva fecha y plantel, se limpia el resto y se incrementa el correlativo DSP-0001. REGISTROS: tarjetas con fecha y hora, plantel, cliente, placas, total de aves y etiqueta de estado \"pendiente\" o \"sincronizado\". Buscador de texto libre y filtro por plantel, contador de resultados. Acciones: \"Ver detalle\" en modal mostrando todos los campos guardados con sus etiquetas (incluidos campos ya eliminados del esquema), \"Editar\" que carga el registro en el formulario, y \"Eliminar\" con confirmación. RESUMEN: tarjetas de indicadores (total de despachos, total de aves, aves despachadas hoy, pendientes de sincronizar) y tabla agrupada por plantel con número de despachos y total de aves, ordenada de mayor a menor. DATOS: cada registro en localStorage \"despachos_aves_v3\" con id único, creado_en, estado_sync, valores (mapa id→valor) y etiquetas (mapa id→etiqueta al momento del guardado). Exportar CSV con BOM UTF-8 y encabezados en español según el esquema actual, descarga por Blob. Exportar respaldo JSON completo (esquema + registros) e importar JSON con opción fusionar o reemplazar. SINCRONIZACIÓN OPCIONAL: modal de ajustes para URL de Supabase, anon key y nombre de tabla (guardados en localStorage). Botón \"Sincronizar pendientes\" que hace POST a `${url}/rest/v1/${tabla}` con headers apikey, Authorization Bearer y Prefer: return=minimal; si responde OK marca los registros como sincronizados, si falla muestra el error y los deja pendientes. Si no hay configuración, avisar claramente. Indicador de en línea / sin conexión usando navigator.onLine y los eventos online/offline. DISEÑO: app agroindustrial profesional y limpia, tema claro, verde-teal principal #0f766e con acentos neutros, tipografía system-ui, tarjetas con bordes 14-16px y sombras suaves, buen espaciado. Áreas táctiles de mínimo 44px, inputs de 16px para evitar zoom automático en iOS, foco visible, contraste WCAG AA. Modales y toasts propios de la app: nunca usar alert, confirm ni prompt del navegador. Nada de dependencias externas ni CDN."
typography:
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, \"SF Mono\", Menlo, Consolas, \"Liberation Mono\", monospace"
rounded:
  sm: "calc(var(--radius) * 0.6)"
  md: "calc(var(--radius) * 0.8)"
  lg: "0.625rem"
  xl: "calc(var(--radius) * 1.4)"
  2xl: "calc(var(--radius) * 1.8)"
  3xl: "calc(var(--radius) * 2.2)"
  4xl: "calc(var(--radius) * 2.6)"
---

<!-- Generated from .project/DESIGN_SYSTEM.md + app/globals.css by the engine. Tokens above are normative and mirror the CSS; edit the CSS and DESIGN_SYSTEM.md, not this file. -->

## Overview

**No visual direction has been committed for workspace yet.** The project is still on the starter's placeholder palette — shadcn's default neutral, every colour zero-chroma — so it is deliberately NOT listed above as a token set to respect. Treat this project as greenfield: decide the world, then write the palette into `globals.css`, and this file will state it from the next turn onward.

## Colors

| Token | Value |

## Typography

- Headings:
- Body:

- Mono: `ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace`

## Layout

- Radius / shadow / spacing rhythm:
- Shared components:

## Shapes

Radii: `sm` calc(var(--radius) * 0.6), `md` calc(var(--radius) * 0.8), `lg` 0.625rem, `xl` calc(var(--radius) * 1.4), `2xl` calc(var(--radius) * 1.8), `3xl` calc(var(--radius) * 2.2), `4xl` calc(var(--radius) * 2.6)

## Do's and Don'ts

- Do load faces through Fontsource, not `next/font/google`.
- Do write the direction's palette into `globals.css` as the token block; keep the token NAMES, replace the values.
- Don't use gradient text, or a purple/violet gradient as the brand signal.
- Don't use bounce or elastic easing; real objects decelerate smoothly.
