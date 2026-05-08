(function() {
  const state = {
    sfHost: null,
    locationHref: "",
    objectType: "",
    recordId: ""
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
    args.set("recordId", state.recordId);
    return "inspect.html?" + args.toString();
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
    parent.postMessage({
      insextInitRequest: true,
      iFrameLocalStorage: {}
    }, "*");
    parent.postMessage({insextLoaded: true}, "*");
  }

  function onMessage(e) {
    if (e.source !== parent || !e.data) {
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

  function openTrustpilot(e) {
    e.preventDefault();
    if (!state.recordId || !state.sfHost) {
      return;
    }
    const fullUrl = chrome.runtime.getURL(getInspectUrl());
    window.open(fullUrl, "_blank", "noopener");
    parent.postMessage({insextClosePopup: true}, "*");
  }

  function closePopup(e) {
    e.preventDefault();
    parent.postMessage({insextClosePopup: true}, "*");
  }

  els.openBtn.addEventListener("click", openTrustpilot);
  els.closeBtn.addEventListener("click", closePopup);
  addEventListener("message", onMessage);
  postInit();
  render();
})();
