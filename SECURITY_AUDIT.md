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
  - [`addon/button.js:229`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/button.js:229)
  - [`addon/button.js:251`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/button.js:251)
  - [`addon/button.js:317`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/button.js:317)
  - [`addon/popup.js:1`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/popup.js:1)
  - [`addon/popup.js:82`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/popup.js:82)

2. Endurecimiento de `runtime.onMessage` en background (implementado)
- Antes: sin allowlist estricta y validación limitada de remitente/host.
- Ahora: allowlist de mensajes + validación `sender.id` + validación de host Salesforce permitido.
- Evidencia:
  - [`addon/background.js:3`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/background.js:3)
  - [`addon/background.js:28`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/background.js:28)
  - [`addon/background.js:47`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/background.js:47)

3. Eliminación de `recordId` en URL del flujo popup -> inspect (implementado)
- Antes: `recordId` visible en querystring de `inspect.html`.
- Ahora: contexto temporal en `chrome.storage.session` con `contextKey`; el contexto se elimina tras lectura.
- Evidencia:
  - [`addon/popup.js:39`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/popup.js:39)
  - [`addon/popup.js:101`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/popup.js:101)
  - [`addon/inspect.js:2800`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/inspect.js:2800)
  - [`addon/inspect.js:2805`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/inspect.js:2805)

## Hallazgos actuales (post-cambios)

### Críticos

1. Secretos Trustpilot en cliente (`client_id`/`client_secret`)
- Estado: **abierto**.
- Riesgo de fuga: **alto**.
- Evidencia: [`addon/trustpilot-config.js`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/trustpilot-config.js)

### Altos

2. Token de acceso Trustpilot almacenado en `localStorage`
- Estado: **abierto**.
- Riesgo de fuga: **alto**.
- Evidencia:
  - [`addon/inspect.js:367`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/inspect.js:367)
  - [`addon/inspect.js:385`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/inspect.js:385)

3. Superficie amplia de `host_permissions` y `all_frames`
- Estado: **abierto**.
- Riesgo de fuga: **alto**.
- Evidencia:
  - [`addon/manifest.json:16`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/manifest.json:16)
  - [`addon/manifest.json:58`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/manifest.json:58)

### Medios

4. `postMessage` laxo
- Estado: **mitigado**.
- Riesgo residual: **bajo-medio**.

5. Contrato de mensajería en background para operaciones con `sid`
- Estado: **mitigado parcialmente** (mucho mejor control de entrada).
- Riesgo residual: **medio-bajo**.

6. Exposición de `recordId` en URL interna
- Estado: **mitigado** en flujo popup -> inspect.
- Riesgo residual: **bajo** (queda fallback en rutas internas legacy con `recordId` por querystring).

## Decisión de riesgo recomendada

- Producción masiva: **NO** (bloqueada por hallazgos críticos/altos abiertos).
- Piloto controlado: **SÍ, condicionado** a credenciales no productivas, usuarios limitados y monitorización activa.

## Próximas acciones priorizadas

1. Reducir `host_permissions`/`matches` del `manifest` al mínimo organizacional necesario.
2. Definir y aplicar política de lifecycle de token (TTL corto y limpieza más agresiva en cliente).
3. Planificar arquitectura sin secretos en cliente (cuando exista API interna o servicio intermedio).

## Evidencias revisadas

- [`addon/manifest.json`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/manifest.json)
- [`addon/background.js`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/background.js)
- [`addon/button.js`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/button.js)
- [`addon/popup.js`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/popup.js)
- [`addon/inspect.js`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/inspect.js)
- [`addon/trustpilot-config.js`](/home/albertolmariscal/Documentos/salesforce_plugin/addon/trustpilot-config.js)
- [`README.md`](/home/albertolmariscal/Documentos/salesforce_plugin/README.md)
- [`TRUSTPILOT_README.md`](/home/albertolmariscal/Documentos/salesforce_plugin/TRUSTPILOT_README.md)

---

Firmado: **Codex**
