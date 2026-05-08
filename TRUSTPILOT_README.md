# Trustpilot MVP - Configuracion Rapida

Este documento explica donde configurar todo lo necesario para el flujo de invitaciones Trustpilot desde ATC Trustpilot Sender.

## Archivo principal de configuracion

Todo se configura en:

`addon/trustpilot-config.js`

## Donde poner tokens y secretos

En `addon/trustpilot-config.js`, bloque `auth`:

```js
auth: {
  url: "https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken",
  token: "TU_CLIENT_ID",       // token/client_id
  secret: "TU_CLIENT_SECRET",  // secret/client_secret
  grantType: "client_credentials",
  scope: "",
  refreshSkewSeconds: 120,     // opcional: refrescar antes de expirar
  defaultTtlSeconds: 3300      // opcional: TTL fallback si API no devuelve expires_in
}
```

## Donde poner los Template IDs

En `addon/trustpilot-config.js`, bloque `templates`.
Cada elemento crea un boton en el panel:

```js
templates: [
  {key: "incidencia", label: "Incidencia", templateId: "TEMPLATE_ID_1"},
  {key: "ayuda_contratacion", label: "Ayuda contratacion", templateId: "TEMPLATE_ID_2"}
]
```

Si anades nuevas plantillas, apareceran nuevos botones automaticamente.

## Donde poner User ID y Business ID

### User ID de Trustpilot (x-business-user-id)

Es el usuario de Trustpilot que se envia en cabecera:
`x-business-user-id`.

Se puede configurar de dos maneras:

1. Global, en `invitation.businessUserId`.
2. Por operador de Salesforce, en `operators.<salesforceUserId>.trustpilotBusinessUserId`.

Ejemplo:

```js
invitation: {
  businessUserId: "TRUSTPILOT_USER_ID_GLOBAL"
},
operators: {
  "005XXXXXXXXXXXX": {
    trustpilotBusinessUserId: "TRUSTPILOT_USER_ID_POR_OPERADOR"
  }
}
```

Nota: si `grantType` es `client_credentials`, este valor es obligatorio.

### User ID (operador Salesforce)

En `addon/trustpilot-config.js`, bloque `operators`.
La clave es el User Id de Salesforce (por ejemplo `005...`) y sirve para personalizar `communicationId` y `tags` por operador.

```js
operators: {
  "005XXXXXXXXXXXX": {
    trustpilotBusinessUserId: "TRUSTPILOT_USER_ID",
    communicationId: "ATC-OP-01",
    tags: ["atc", "madrid"]
  }
}
```

### Business ID (Trustpilot)

En `addon/trustpilot-config.js`, dentro de `invitation.businessUnitId`:

```js
invitation: {
  url: "https://invitations-api.trustpilot.com/v1/private/business-units/{businessUnitId}/email-invitations",
  businessUnitId: "TU_BUSINESS_UNIT_ID",
  businessUserId: "TRUSTPILOT_USER_ID_GLOBAL",
  replyTo: "",
  locale: "es-ES"
}
```

## Donde estan los endpoints

Tambien en `addon/trustpilot-config.js`:

- Endpoint de auth: `auth.url`
- Endpoint de invitacion: `invitation.url`

Valores recomendados:

- `auth.url`: `https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken`
- `invitation.url`: `https://invitations-api.trustpilot.com/v1/private/business-units/{businessUnitId}/email-invitations`

## Notas de envio actuales

- `senderEmail` y `senderName` no se envian en el payload a Trustpilot.
- El `referenceId` se construye como:
  `<idcliente>_<idusuario>_ATC`
- El payload de invitacion se envia en formato Trustpilot `Create invitation(s)`:
  `referenceNumber`, `consumerName`, `consumerEmail`, `type`, `serviceReviewInvitation.templateId/tags`.
- La validacion de faltantes se muestra solo cuando el operador pulsa "Enviar resena...".
- El token bearer se cachea en `localStorage` y se reutiliza hasta poco antes de caducar.
