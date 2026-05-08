# ATC Trustpilot Sender

Extension de Chrome/Brave para enviar invitaciones de Trustpilot desde registros `Account` de Salesforce.

## Flujo

1. En Salesforce, abre un `Account`.
2. Pulsa el boton flotante de la extension.
3. En el popup, pulsa **Abrir Envio Trustpilot**.
4. En la pantalla de envio revisa el payload y pulsa el template correspondiente.

## Datos que usa

- Email cliente: `dtt_email__c`
- Nombre cliente: `dtt_clientname__c`
- Reference number: `idcliente_idusuariosalesforce_ATC`

## Configuracion

Edita:

- `addon/trustpilot-config.js`

Campos clave:

- `auth.url`, `auth.token`, `auth.secret`
- `invitation.url`, `invitation.businessUnitId`, `invitation.businessUserId`
- `templates[]` con `templateId`
- `operators[]` para routing por usuario SF (tags, communicationId, trustpilotBusinessUserId)

## Cargar en Brave/Chrome

1. Abre `brave://extensions` (o `chrome://extensions`).
2. Activa modo desarrollador.
3. Pulsa **Cargar descomprimida**.
4. Selecciona la carpeta `addon`.
5. Pulsa **Actualizar** cuando hagas cambios.

## Estructura minima del repo

Solo se mantiene lo necesario para:

- Boton flotante en Salesforce
- Popup minimo
- Pantalla de envio Trustpilot
- Llamadas OAuth + envio de invitacion
