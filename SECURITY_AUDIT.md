# Auditoría de Seguridad - ATC Trustpilot Sender

Versión: 2.0  
Fecha de auditoría: 9 de mayo de 2026  
Auditor: Codex  
Alcance: repositorio completo, con foco en fuga de datos, abuso de permisos y superficie de ataque de la extensión Chrome.

## Resumen ejecutivo

Estado actual: **riesgo MEDIO** para un entorno de atención al cliente con datos personales.

Conclusión:
- Se han implementado controles sobre los 3 riesgos medios priorizados.
- Persisten riesgos estructurales altos/críticos por diseño (secretos en cliente y token Trustpilot en almacenamiento local).
- El proyecto mejora su postura respecto a manipulación de mensajería y exposición de contexto, pero **no está listo para producción masiva**.

## Trazabilidad de cambios implementados (v1 -> v2)

1. Hardening de `postMessage` (implementado)
- Antes: uso de `targetOrigin="*"` y validación parcial de mensajes.
- Ahora: validación de `origin` en recepción + `targetOrigin` explícito en envío.
- Evidencia:
  - [`addon/button.js:229`](addon/button.js:229)
  - [`addon/button.js:251`](addon/button.js:251)
  - [`addon/button.js:317`](addon/button.js:317)
  - [`addon/popup.js:1`](addon/popup.js:1)
  - [`addon/popup.js:82`](addon/popup.js:82)

2. Endurecimiento de `runtime.onMessage` en background (implementado)
- Antes: sin allowlist estricta y validación limitada de remitente/host.
- Ahora: allowlist de mensajes + validación `sender.id` + validación de host Salesforce permitido.
- Evidencia:
  - [`addon/background.js:3`](addon/background.js:3)
  - [`addon/background.js:28`](addon/background.js:28)
  - [`addon/background.js:47`](addon/background.js:47)

3. Eliminación de `recordId` en URL del flujo popup -> inspect (implementado)
- Antes: `recordId` visible en querystring de `inspect.html`.
- Ahora: contexto temporal en `chrome.storage.session` con `contextKey`; el contexto se elimina tras lectura.
- Evidencia:
  - [`addon/popup.js:39`](addon/popup.js:39)
  - [`addon/popup.js:101`](addon/popup.js:101)
  - [`addon/inspect.js:2800`](addon/inspect.js:2800)
  - [`addon/inspect.js:2805`](addon/inspect.js:2805)

## Hallazgos actuales (post-cambios)

### Críticos

1. Secretos Trustpilot en cliente (`client_id`/`client_secret`)
- Estado: **abierto**.
- Riesgo de fuga: **alto**.
- Evidencia: [`addon/trustpilot-config.js`](addon/trustpilot-config.js)

### Altos

2. Token de acceso Trustpilot almacenado en `localStorage`
- Estado: **abierto**.
- Riesgo de fuga: **alto**.
- Evidencia:
  - [`addon/inspect.js:367`](addon/inspect.js:367)
  - [`addon/inspect.js:385`](addon/inspect.js:385)

3. Superficie amplia de `host_permissions` y `all_frames`
- Estado: **abierto**.
- Riesgo de fuga: **alto**.
- Evidencia:
  - [`addon/manifest.json:16`](addon/manifest.json:16)
  - [`addon/manifest.json:58`](addon/manifest.json:58)

### Medios

4. `postMessage` laxo
- Estado: **mitigado**.
- Riesgo residual: **bajo-medio**.
- Explicacion no tecnica:
  La extension ya valida mejor de donde vienen los mensajes internos, pero este tipo de comunicacion entre ventanas siempre requiere vigilancia. El riesgo residual significa que, si en el futuro se añade una pantalla nueva sin las mismas validaciones, podria abrirse una puerta para comportamientos no esperados.
- Que podria pasar en la practica:
  No es el escenario mas probable hoy, pero un fallo futuro podria permitir que una pantalla mande ordenes no previstas a otra parte de la extension.

5. Contrato de mensajería en background para operaciones con `sid`
- Estado: **mitigado parcialmente** (mucho mejor control de entrada).
- Riesgo residual: **medio-bajo**.
- Explicacion no tecnica:
  La extension tiene acceso a la “llave de sesion” de Salesforce (la cookie `sid`). Se ha limitado mucho quien puede pedir acciones al background, pero mientras la extension necesite esa llave, el impacto potencial de cualquier fallo sigue siendo relevante.
- Que podria pasar en la practica:
  Si alguien lograra explotar otro fallo en la extension o en su entorno, podria intentar usar esa sesion para actuar como un usuario valido dentro de Salesforce durante el tiempo que la sesion siga abierta.

6. Exposición de `recordId` en URL interna
- Estado: **mitigado** en flujo popup -> inspect.
- Riesgo residual: **bajo** (queda fallback en rutas internas legacy con `recordId` por querystring).
- Explicacion no tecnica:
  Ya no se envia el identificador del cliente en la URL en el flujo principal. Aun asi, quedan rutas antiguas compatibles que pueden seguir usando ese formato en algunos caminos internos.
- Que podria pasar en la practica:
  Es un riesgo de baja gravedad: ese identificador podria quedar en historicos locales del navegador o en capturas de soporte, pero por si solo no da acceso a cuentas ni a contrasenas.

## Lectura para negocio (sin tecnicismos)

- Lo que ya mejoro:
  Se redujo el riesgo de que la extension acepte mensajes no validos y se redujo la exposicion del identificador de cliente en enlaces internos.
- Lo que sigue siendo sensible:
  La extension todavia maneja secretos y tokens en el lado del navegador. Esto implica que, aunque se ha reforzado bastante, un equipo atacante con acceso al equipo del agente o al perfil del navegador tendria opciones de abuso.
- Impacto real esperado hoy:
  El escenario mas realista no es un “hack remoto masivo”, sino abuso en endpoint comprometido (equipo infectado, cuenta local comprometida o mala higiene operativa).
- Recomendacion operativa mientras no haya API interna:
  Limitar el despliegue a grupos controlados, rotar credenciales con frecuencia, y monitorizar uso anomalo de Trustpilot/Salesforce para detectar comportamiento fuera de patron.

## Decisión de riesgo recomendada

- Producción masiva: **NO** (bloqueada por hallazgos críticos/altos abiertos).
- Piloto controlado: **SÍ, condicionado** a credenciales no productivas, usuarios limitados y monitorización activa.

## Próximas acciones priorizadas

1. Reducir `host_permissions`/`matches` del `manifest` al mínimo organizacional necesario.
2. Definir y aplicar política de lifecycle de token (TTL corto y limpieza más agresiva en cliente).
3. Planificar arquitectura sin secretos en cliente (cuando exista API interna o servicio intermedio).

## Evidencias revisadas

- [`addon/manifest.json`](addon/manifest.json)
- [`addon/background.js`](addon/background.js)
- [`addon/button.js`](addon/button.js)
- [`addon/popup.js`](addon/popup.js)
- [`addon/inspect.js`](addon/inspect.js)
- [`addon/trustpilot-config.js`](addon/trustpilot-config.js)
- [`README.md`](README.md)
- [`TRUSTPILOT_README.md`](TRUSTPILOT_README.md)

---

Firmado: **Codex**
