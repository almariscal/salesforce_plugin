<div align="center">

# ATC Trustpilot Sender

**Chrome/Brave extension to send Trustpilot service invitations from Salesforce Account records**

[![Version](https://img.shields.io/badge/version-0.1.0-0ea5e9)](#)
[![Scope](https://img.shields.io/badge/scope-Trustpilot%20MVP-22c55e)](#scope)
[![Platform](https://img.shields.io/badge/platform-Chrome%20%7C%20Brave-f59e0b)](#quick-start)
[![Object](https://img.shields.io/badge/salesforce-object%3A%20Account-6366f1)](#data-mapping-salesforce---trustpilot)

</div>

---

## Overview

`ATC Trustpilot Sender` is a focused extension built for one production workflow:

1. Open an `Account` in Salesforce.
2. Validate customer data visually.
3. Select Trustpilot template.
4. Send invitation via API (OAuth + private invitations endpoint).

This repo intentionally avoids legacy “all-in-one inspector” complexity and keeps only what is required for ATC operations.

---

## Product snapshot

## Security

- [`SECURITY_AUDIT.md`](SECURITY_AUDIT.md) - Auditoria de seguridad (CISO), riesgos de fuga de datos y plan de mitigacion.

### What you get

- Floating launcher button inside Salesforce pages.
- Minimal popup focused on Account context.
- Dedicated full-page Trustpilot send screen.
- Clear payload breakdown before sending.
- Dynamic template buttons (`templateId` driven).
- OAuth token caching with pre-expiry refresh.
- `x-business-user-id` support for `client_credentials` flow.

### What this repo is not

- Not a generic Salesforce admin toolkit.
- Not a metadata/query explorer.
- Not intended for broad multi-feature extension behavior.

---

## Architecture

```text
Salesforce UI
   |
   | (content script)
   v
button.js  ---> popup.js (lightweight context gate)
                  |
                  | open inspect.html?host=...&objectType=Account&recordId=...
                  v
             inspect.js (Trustpilot UI + API flow)
                  |
                  |-- Step 1: auth.url (OAuth token)
                  |-- token cache (localStorage, per Salesforce host)
                  '-- Step 2: invitation.url (service invitation)
```

### Runtime flow

1. Detect current Salesforce record context.
2. Allow Trustpilot flow only on `Account` with valid `recordId`.
3. Build payload preview from Account fields.
4. Acquire/refresh bearer token.
5. Send `serviceReviewInvitation` payload.
6. Show success/error feedback to operator.

---

## Data mapping (Salesforce -> Trustpilot)

| Salesforce source | Trustpilot field | Notes |
|---|---|---|
| `Account.dtt_email__c` | `consumerEmail` | Required for send |
| `Account.dtt_clientname__c` | `consumerName` | Required for send |
| `Account.Id` + `SF User.Id` | `referenceNumber` | Format: `<idcliente>_<idusuariosalesforce>_ATC` |
| Config `communicationId` | `locationId` | Optional |
| Config `templates[].templateId` | `serviceReviewInvitation.templateId` | One button per template |
| Config `tags` | `serviceReviewInvitation.tags` | Optional |

---

## Configuration at a glance

Main file:

- [`addon/trustpilot-config.js`](addon/trustpilot-config.js)

Detailed guide:

- [`TRUSTPILOT_README.md`](TRUSTPILOT_README.md)

### Minimal required keys

| Block | Key | Required |
|---|---|---|
| `auth` | `url`, `token`, `secret`, `grantType` | Yes |
| `invitation` | `url`, `businessUnitId` | Yes |
| `invitation` | `businessUserId` | Yes (with `client_credentials`) |
| `templates[]` | `templateId` | Yes |

---

## Quick start

### 1) Configure

Edit `addon/trustpilot-config.js` with your Trustpilot credentials and templates.

### 2) Load extension

1. Open `brave://extensions` or `chrome://extensions`.
2. Enable Developer Mode.
3. Click **Load unpacked**.
4. Select the `addon` folder.

### 3) Send invitation

1. Open an `Account` record in Salesforce.
2. Click floating extension button.
3. Click **Abrir Envío Trustpilot**.
4. Review payload breakdown.
5. Click the desired template button.

---

## Security and reliability notes

- `senderEmail` and `senderName` are not sent.
- Required fields are validated at send time.
- OAuth token is cached per Salesforce host in `localStorage`.
- Cache is invalidated on `401/403` API responses.
- UI always shows what will be sent before request execution.

---

## Project structure

```text
.
├── README.md
├── TRUSTPILOT_README.md
└── addon/
    ├── manifest.json
    ├── button.js / button.css
    ├── popup.html / popup.js / popup.css
    ├── inspect.html / inspect.js / inspect.css
    ├── inspector.js
    ├── trustpilot-config.js
    └── assets
```

---

## Scope

This repository is intentionally optimized for a single operational use case:
**Trustpilot service invitation sending from Salesforce Account records**.

If future requirements expand, this repo should evolve as a product extension, not as a return to a generic inspector codebase.
