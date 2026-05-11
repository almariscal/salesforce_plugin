
let sfHost;
const ALLOWED_MESSAGES = new Set(["getSfHost", "getSession", "createWindow", "reloadPage"]);
const ALLOWED_SF_DOMAINS = [
  ".salesforce.com",
  ".salesforce-setup.com",
  ".visual.force.com",
  ".vf.force.com",
  ".lightning.force.com",
  ".force.com",
  ".cloudforce.com",
  ".visualforce.com",
  ".sfcrmapps.cn",
  ".sfcrmproducts.cn",
  ".salesforce.mil",
  ".visual.force.mil",
  ".vf.force.mil",
  ".lightning.force.mil",
  ".force.mil",
  ".cloudforce.mil",
  ".visualforce.mil",
  ".crmforce.mil",
  ".force.com.mcas.ms",
  ".builder.salesforce-experience.com"
];

function isAllowedSalesforceHost(hostname) {
  if (!hostname) {
    return false;
  }
  return ALLOWED_SF_DOMAINS.some(domain => hostname === domain.slice(1) || hostname.endsWith(domain));
}

function isValidSender(request, sender) {
  if (!request || !ALLOWED_MESSAGES.has(request.message)) {
    return false;
  }
  // In some Chrome contexts sender.id may be undefined for valid extension-origin messages.
  if (sender?.id && sender.id !== chrome.runtime.id) {
    return false;
  }
  if (request.message === "getSfHost") {
    try {
      const url = new URL(request.url);
      return url.protocol === "https:" && isAllowedSalesforceHost(url.hostname);
    } catch (e) {
      return false;
    }
  }
  if (request.message === "getSession") {
    return typeof request.sfHost === "string" && isAllowedSalesforceHost(request.sfHost);
  }
  return true;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (!isValidSender(request, sender)) {
    sendResponse(null);
    return false;
  }
  // Perform cookie operations in the background page, because not all foreground pages have access to the cookie API.
  // Firefox does not support incognito split mode, so we use sender.tab.cookieStoreId to select the right cookie store.
  // Chrome does not support sender.tab.cookieStoreId, which means it is undefined, and we end up using the default cookie store according to incognito split mode.
  if (request.message == "getSfHost") {
    const currentDomain = new URL(request.url).hostname;
    // When on a *.visual.force.com page, the session in the cookie does not have API access,
    // so we read the corresponding session from *.salesforce.com page.
    // The first part of the session cookie is the OrgID,
    // which we use as key to support being logged in to multiple orgs at once.
    // http://salesforce.stackexchange.com/questions/23277/different-session-ids-in-different-contexts
    // There is no straight forward way to unambiguously understand if the user authenticated against salesforce.com or cloudforce.com
    // (and thereby the domain of the relevant cookie) cookie domains are therefore tried in sequence.
    chrome.cookies.get({url: request.url, name: "sid", storeId: sender.tab.cookieStoreId}, cookie => {
      if (!cookie || currentDomain.endsWith(".mcas.ms")) { //Domain used by Microsoft Defender for Cloud Apps, where sid exists but cannot be read
        sendResponse(currentDomain);
        return;
      }
      const [orgId] = cookie.value.split("!");
      const orderedDomains = ["salesforce.com", "cloudforce.com", "salesforce.mil", "cloudforce.mil", "sfcrmproducts.cn", "force.com"];

      let responded = false;
      let pending = orderedDomains.length;
      const respondOnce = value => {
        if (!responded) {
          responded = true;
          sendResponse(value);
        }
      };

      orderedDomains.forEach(domain => {
        chrome.cookies.getAll({name: "sid", domain, secure: true, storeId: sender.tab.cookieStoreId}, cookies => {
          let sessionCookie = cookies.find(c => c.value.startsWith(orgId + "!") && c.domain != "help.salesforce.com");
          if (sessionCookie) {
            respondOnce(sessionCookie.domain);
            return;
          }
          pending -= 1;
          if (pending === 0) {
            // Guaranteed fallback so content script can continue rendering.
            respondOnce(currentDomain);
          }
        });
      });
    });
    return true; // Tell Chrome that we want to call sendResponse asynchronously.
  }
  if (request.message == "getSession") {
    sfHost = request.sfHost;
    chrome.cookies.get({url: "https://" + request.sfHost, name: "sid", storeId: sender.tab.cookieStoreId}, sessionCookie => {
      if (!sessionCookie) {
        sendResponse(null);
        return;
      }
      let session = {key: sessionCookie.value, hostname: sessionCookie.domain};
      sendResponse(session);
    });
    return true; // Tell Chrome that we want to call sendResponse asynchronously.
  } else if (request.message == "createWindow") {
    const brow = typeof browser === "undefined" ? chrome : browser;
    brow.windows.create({
      url: request.url,
      incognito: request.incognito ?? false
    });
  } else if (request.message == "reloadPage") {
    chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
      chrome.tabs.reload(tabs[0].id);
    });
  }
  return false;
});
chrome.action.onClicked.addListener(() => {
  chrome.runtime.sendMessage({
    msg: "shortcut_pressed", sfHost, command: "open-popup"
  });
});
chrome.commands?.onCommand.addListener((command) => {
  if (command.startsWith("link-")){
    let link;
    switch (command){
      case "link-setup":
        link = "/lightning/setup/SetupOneHome/home";
        break;
      case "link-home":
        link = "/";
        break;
      case "link-dev":
        link = "/_ui/common/apex/debug/ApexCSIPage";
        break;
    }
    chrome.tabs.create({
      url: `https:///${sfHost}${link}`
    });

  } else if (command.startsWith("open-")){
    chrome.runtime.sendMessage({
      msg: "shortcut_pressed", command, sfHost
    });
  } else {
    chrome.tabs.create({
      url: `chrome-extension://${chrome.i18n.getMessage("@@extension_id")}/${command}.html?host=${sfHost}`
    });
  }
});

chrome.runtime.onInstalled.addListener(({reason}) => {
  if (reason === "install") {
    chrome.tabs.create({
      url: chrome.runtime.getURL("welcome.html")
    });
  }
});
chrome.runtime.setUninstallURL("");
