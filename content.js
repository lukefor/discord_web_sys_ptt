/**
 * The default minimum number of ms to wait from initial shortcut message
 * before ending PTT.
 * @const {number}
 */
const PTT_DELAY_FIRST_DEFAULT = 100;

/**
 * The number of ms to wait from last shortcut message before ending PTT.
 * @const {number}
 */
const PTT_DELAY_LAST = 100;

/**
 * A manually-constructed map from modifiers to their (likely) key codes. From
 * https://github.com/wesbos/keycodes/blob/gh-pages/scripts.js.
 * @const {!Array<!Array>}
 */
const MOD_KEY_CODES = [
  ['shiftKey', 16],
  ['ctrlKey', 17],
  ['altKey', 18],
  ['metaKey', 91],
];

/**
 * The list of URL prefixes that indicate the page is an instance of the Discord
 * web app.
 * @const {!Array<string>}
 */
const DISCORD_APP_URLS = [
  'https://discord.com/app', 'https://discord.com/channels',
];

/**
 * The minimum number of ms to wait from initial shortcut message before ending
 * PTT.
 * @type {number}
 */
let pttDelayFirst = PTT_DELAY_FIRST_DEFAULT;

/**
 * The time (in ms past the Unix epoch) at which the active PTT window should
 * end, or null if there is no PTT window currently active.
 * @type {?number}
 */
let pttEndTime = null;

/**
 * The key code and modifier statuses with which to construct syntheic PTT key
 * up/down events for this tab.
 * @type {?Object<string, (number|boolean)}
 */
let keyEventInits = {bubbles: true, cancelable: true, key: "P", char: "P", shiftKey: true, ctrlKey: true, altKey: true, code: "KeyP", keyCode: 80, which: 80};

/**
 * The timeout ID for the active PTT window (if one exists).
 * @type {?number}
 */
let toId = null;

/**
 * Whether or not this page appears to be broadcasting PTT voice. This may be a
 * false positive if the page is a non-app Discord page (e.g. Discord developer
 * docs).
 * @type {boolean}
 */
let broadcasting = false;

/**
 * Whether or not this page is a Discord web-app page. When this value is true,
 * the broadcasting value should be transmitted to background script to keep the
 * extension badge etc. updated.
 * @type {boolean}
 */
let isDiscordApp = false;

// Listen to changes in the page's broadcasting status.
document.addEventListener('BwpttBroadcasting', function(ev) {
  broadcasting = ev.detail;

  if (isDiscordApp) {
    browser.runtime.sendMessage({
      id: 'broadcasting',
      value: broadcasting,
    });
  }
});

/** Sends a PTT keyup event. */
function pttOff() {
  pttEndTime = null;

  //console.log("PTT released");
  document.dispatchEvent(new KeyboardEvent('keyup', keyEventInits));
}

/**
 * Extends the PTT off timeout, and sends a PTT keydown event if one hasn't
 * been sent yet.
 */
function onExtShortcut() {
  if (toId !== null) clearTimeout(toId);

  const pttDelay = pttEndTime === null ?
    pttDelayFirst :
    Math.max(PTT_DELAY_LAST, pttEndTime - new Date().getTime());
  toId = setTimeout(pttOff, pttDelay);

  if (pttEndTime === null) {
    pttEndTime = new Date().getTime() + pttDelayFirst;
    //console.log("PTT pressed");
    document.dispatchEvent(new KeyboardEvent('keydown', keyEventInits));
  }
}

// Respond to events from the background script.
browser.runtime.onMessage.addListener(function(msg) {
  if (msg.id === 'ext_shortcut_pushed') {
    onExtShortcut();
  }

  return false;
});

// Notify background script that we're a Discord tab.
browser.runtime.sendMessage({
  id: 'discord_loaded',
});

// Never broadcasting once the user navigates away.
window.addEventListener('beforeunload', function() {
  broadcasting = false;
  browser.runtime.sendMessage({
    id: 'broadcasting',
    value: broadcasting,
  });
});

window.addEventListener('DOMContentLoaded', function() {
  // The only comprehensive way I've found to track redirects is to watch
  // mutations to the whole document body.
  let observer = new MutationObserver(function(_, ob) {
    isDiscordApp = DISCORD_APP_URLS.some(prefix =>
      document.location.href.startsWith(prefix)
    );

    if (isDiscordApp) {
      broadcasting = true;
      browser.runtime.sendMessage({
        id: 'broadcasting',
        value: broadcasting,
      });

      // Prevent this callback from being called more than necessary (since
      // body modifications are presumably frequent).
      ob.disconnect();
    }
  });

  observer.observe(document.querySelector('body'), {
    childList: true,
    subtree: true,
  });
});

