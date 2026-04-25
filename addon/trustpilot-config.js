export const TRUSTPILOT_MVP_CONFIG = {
  // Restrict Trustpilot panel to these object API names.
  onlyForObjects: ["Case"],

  // Step 1: Token endpoint (token + secret -> bearer token).
  auth: {
    // Example:
    // https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken
    url: "https://api.trustpilot.com/v1/oauth/oauth-business-users-for-applications/accesstoken",
    token: "",
    secret: "",
    grantType: "client_credentials",
    scope: "",
    // Optional: refresh this many seconds before token expiry.
    refreshSkewSeconds: 120,
    // Optional fallback TTL (seconds) if auth response does not include expiry.
    defaultTtlSeconds: 3300
  },

  // Step 2: Invitation endpoint (bearer token -> invitation request).
  invitation: {
    // You can use placeholders like {businessUnitId}.
    // Example:
    // https://invitations-api.trustpilot.com/v1/private/business-units/{businessUnitId}/email-invitations
    url: "https://invitations-api.trustpilot.com/v1/private/business-units/{businessUnitId}/email-invitations",
    businessUnitId: "",
    // Trustpilot business user id used in header x-business-user-id.
    // Required when grantType=client_credentials.
    businessUserId: "",
    replyTo: "",
    locale: "es-ES"
  },

  // Each entry creates one button in the UI.
  templates: [
    {key: "incidencia", label: "Incidencia", templateId: ""},
    {key: "ayuda_contratacion", label: "Ayuda contratacion", templateId: ""}
  ],

  // Defaults applied for any operator without custom routing.
  defaults: {
    tags: ["atc-beta"],
    communicationId: ""
  },

  // Optional routing by Salesforce operator in session.
  // Key priority in code: User.Id -> User.Email -> User.Name
  // Example:
  // "005XXXXXXXXXXXX": {
  //   trustpilotBusinessUserId: "TRUSTPILOT_USER_ID",
  //   communicationId: "ATC-OP-01",
  //   tags: ["atc", "madrid"]
  // }
  operators: {}
};
