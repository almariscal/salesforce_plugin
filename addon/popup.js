(function() {
  const parentOrigin = (() => {
    try {
      return new URL(document.referrer).origin;
    } catch (e) {
      return null;
    }
  })();

  const state = {
    sfHost: null,
    locationHref: "",
    objectType: "",
    recordId: "",
    contextKey: ""
  };

  const els = {
    host: document.getElementById("sf-host"),
    context: document.getElementById("sf-context"),
    status: document.getElementById("sf-status"),
    openBtn: document.getElementById("open-trustpilot"),
    closeBtn: document.getElementById("close-popup")
  };

  function parseContext(locationHref) {
    state.locationHref = locationHref || "";
    const fromPath = locationHref ? (locationHref.match(/\/(001[\w]{12,15})(?:\b|\?|\/)/i) || [])[1] : "";
    const fromQuery = locationHref ? (locationHref.match(/[?&]recordId=(001[\w]{12,15})/i) || [])[1] : "";
    const id = fromQuery || fromPath || "";
    state.recordId = id;
    state.objectType = id ? "Account" : "";
  }

  function getInspectUrl() {
    const args = new URLSearchParams();
    args.set("host", state.sfHost || "");
    args.set("objectType", "Account");
    args.set("recordContext", state.recordId ? "1" : "0");
    if (state.contextKey) {
      args.set("contextKey", state.contextKey);
    }
    return "inspect.html?" + args.toString();
  }

  function postToParent(payload) {
    if (!parentOrigin) {
      return;
    }
    parent.postMessage(payload, parentOrigin);
  }

  function render() {
    els.host.textContent = state.sfHost || "-";
    els.context.textContent = state.locationHref || "-";

    if (!state.sfHost) {
      els.status.textContent = "Esperando inicializacion...";
      els.openBtn.disabled = true;
      return;
    }

    if (!state.recordId) {
      els.status.textContent = "Abre un registro de Account en Salesforce para habilitar Trustpilot.";
      els.openBtn.disabled = true;
      return;
    }

    els.status.textContent = "Account detectado: " + state.recordId;
    els.openBtn.disabled = false;
  }

  function postInit() {
    postToParent({
      insextInitRequest: true,
      iFrameLocalStorage: {}
    });
    postToParent({insextLoaded: true});
  }

  function onMessage(e) {
    if (!parentOrigin || e.source !== parent || e.origin !== parentOrigin || !e.data) {
      return;
    }
    if (e.data.insextInitResponse) {
      state.sfHost = e.data.sfHost || state.sfHost;
      render();
      return;
    }
    if (e.data.insextUpdateRecordId) {
      parseContext(e.data.locationHref || "");
      render();
    }
  }

  async function openTrustpilot(e) {
    e.preventDefault();
    if (!state.recordId || !state.sfHost) {
      return;
    }
    state.contextKey = "trustpilot_ctx_" + Date.now() + "_" + Math.random().toString(36).slice(2);
    await chrome.storage.session.set({
      [state.contextKey]: {
        recordId: state.recordId,
        objectType: "Account",
        createdAt: Date.now()
      }
    });
    const fullUrl = chrome.runtime.getURL(getInspectUrl());
    window.open(fullUrl, "_blank", "noopener");
    postToParent({insextClosePopup: true});
  }

  function closePopup(e) {
    e.preventDefault();
    postToParent({insextClosePopup: true});
  }

  els.openBtn.addEventListener("click", openTrustpilot);
  els.closeBtn.addEventListener("click", closePopup);
  addEventListener("message", onMessage);
  postInit();
  render();
})();
