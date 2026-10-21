# Evidencia de la arquitectura ejecutiva

La arquitectura se generó con el skill instalado de Archify, sin modificar su renderizador ni traducir sus controles internos. Los textos del proyecto están en español, la animación de trazado está configurada y hay tres vistas guiadas. El resultado es una demostración de diseño, no una topología de producción.

## Archivos y huellas

| Elemento | Ubicación | Tamaño |
| --- | --- | --- |
| Especificación | [`architecture.json`](architecture.json) | 3019 bytes |
| HTML interactivo | [`../public/architecture.html`](../public/architecture.html) | 709517 bytes |
| Evidencia automática | [`../public/architecture.visual-check.json`](../public/architecture.visual-check.json) | Recibo generado por Archify |
| Galería de capturas | [`../public/architecture.visual-check.html`](../public/architecture.visual-check.html) | Temas claro y oscuro |

SHA-256 de la especificación:

```text
f146682eb60ea2175b55a6e2898b6083454e572aa1ea255061a10f64ebd1c174
```

SHA-256 del HTML:

```text
46f8833a81a912111d22a875e0082e0d8770402e706daf1868fc7dad7c2aa846
```

## 1. Validación determinista

`validate architecture --quality showcase` y `deliver architecture --quality showcase` finalizaron correctamente para esta especificación. Se aprobaron los **9 de 9 controles** del artefacto, con **0 errores y 0 advertencias** de composición. No hubo rondas de corrección de geometría para esta versión en español.

El HTML se generó desde la especificación validada y no se modificó después de la entrega. Las actualizaciones posteriores del README y este registro no alteran sus bytes.

## 2. Evidencia automática de navegador

`visual-check` finalizó con `status: "pass"`, utilizando Chrome y el mismo SHA-256 del HTML. Esta comprobación inspecciona el estado estático de lectura; no certifica toda interacción, animación o exportación posible del visor.

| Resolución | Tema medido | Desbordamiento horizontal | Desbordamiento vertical | Legibilidad y controles |
| --- | --- | --- | --- | --- |
| 1440 × 900 | Claro | No | No | Correctos |
| 1600 × 1000 | Claro | No | No | Correctos |
| 1920 × 1080 | Claro | No | No | Correctos |
| 2048 × 1320 | Claro | No | No | Correctos |

El comando también generó capturas en claro y oscuro en las resoluciones extremas:

- [1440 × 900, claro](../public/architecture.visual-check.1440x900.light.png).
- [1440 × 900, oscuro](../public/architecture.visual-check.1440x900.dark.png).
- [2048 × 1320, claro](../public/architecture.visual-check.2048x1320.light.png).
- [2048 × 1320, oscuro](../public/architecture.visual-check.2048x1320.dark.png).

La versión anterior había agotado el tiempo de espera de carga de Chrome. Esa incidencia no se reprodujo en la comprobación de este nuevo HTML; no se reutilizó el recibo fallido como evidencia de éxito.

## 3. Inspección visual de las capturas

Se revisaron las cuatro capturas anteriores con un lector de imágenes. Se comprobó la jerarquía de título y capítulos, el flujo principal, la separación de las ramas, la ausencia de recortes o solapamientos visibles y el equilibrio vertical a 2048 × 1320, en ambos temas.

Resultado de esta inspección de composición: **satisfactorio**. A 1440 × 900 el mapa completo presenta texto pequeño; el visor permite acercar y enfocar componentes. No se redujo la tipografía ni se ocultó contenido para forzar las mediciones.

Esta revisión de imágenes **no equivale a una prueba de interacción completa**. No se afirma haber probado manualmente todos los botones, la reproducción animada ni cada exportación. El recibo automático conserva correctamente `visualReview: "pending"`: la inspección visual complementaria se registra aquí por separado, sin reescribir ese recibo.

## 4. Verificación funcional del proyecto traducido

| Comando | Resultado observado |
| --- | --- |
| `npm test` | 10 pruebas satisfactorias; 0 fallos, incluidas 2 de configuración pública |
| `npm run typecheck` | Sin errores de TypeScript |
| `npm run build` | Build de producción satisfactorio con Webpack |
| `npm run test:smoke` | 6 comprobaciones HTTP satisfactorias: página, diagrama, 3 canales y rechazo de solicitud inválida |
| `npm run test:browser` | Incluye las 6 comprobaciones HTTP; verifica detalle, lectura individual, teclado y tres mecanismos de cierre en Chrome |

Antes de traducir los mensajes se observaron fallos esperados en las pruebas: el código devolvía mensajes y nombres de simuladores en inglés. Después de la traducción, las ocho pruebas pasaron. Los identificadores de canal y las claves JSON se conservaron; los códigos HTTP también.

En una ampliación posterior se observaron fallos por la ausencia del módulo de configuración y del botón para abrir notificaciones antes de implementarlos. Después pasaron las diez pruebas y el build. La primera ejecución de la nueva interacción por teclado falló; se corrigió el arnés para esperar el cierre completo de React y enviar el evento Enter con su texto correspondiente. La ejecución completa posterior pasó, sin modificar el comportamiento del producto para forzar el resultado.

La creación de `.env.example` fue denegada por los permisos del entorno; permanece pendiente. La plantilla y las instrucciones están en el README. No se escribió ningún archivo de entorno ni se cambiaron reglas de permisos. La configuración opcional sí se implementó, con un valor predeterminado utilizable sin archivos locales.

No se ejecutó una revisión RDD porque el modo global estaba desactivado. No se realizaron commits, publicaciones ni cambios de configuración global.

## 5. Idioma y movimiento

- La aplicación declara `lang="es"`; los textos, validaciones, proveedores simulados y documentación se presentan en español.
- Las clases, rutas, comandos, claves JSON y tokens como `email` o `simulated` se conservan como identificadores técnicos.
- El visor de la versión instalada no ofrece localización española de sus controles fijos ni del atributo de idioma del HTML. Se omitió `meta.locale`, siguiendo el skill, por lo que esos elementos usan inglés.
- `meta.animation: "trace"` habilita el trazado animado oficial. El visor proporciona los controles de movimiento y presentación; no se añadieron animaciones decorativas a sus componentes internos.
- La interfaz incorpora transiciones y entradas breves, desactivables mediante `prefers-reduced-motion`.

## Resumen técnico

```text
diagram_type: architecture
validation: 9/9 showcase, 0 errores, 0 advertencias
browser_evidence: passed
visual_review: passed (inspección de cuatro capturas; no prueba interactiva completa)
correction_rounds: 0
```
