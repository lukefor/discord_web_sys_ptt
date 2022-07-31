/**
 * The default minimum number of ms that any 'PTT active' window can last.
 * @const {number}
 */
const MIN_PTT_LENGTH_DEFAULT = 100;

/**
 * Runs the given callback with the tab ID for the broadcasting Discord tab, if
 * one exists.
 *
 * @param {function(number)} cb - A callback that will be run on the
 *     broadcasting Discord tab ID.
 */
function withBroadcastingTab(cb) {
  browser.storage.local.get('broadcastingTab', function(result) {
    if (result.broadcastingTab != null) {
      cb(result.broadcastingTab);
    }
  });
}

var port;

/**
 * Updates extension badge when a Discord tab starts / stops broadcasting.
 *
 * @param {number} id - The ID of the tab that has started or stopped broadcasting.
 * @param {boolean} broadcasting - true if this is as notice that broadcasting
 *     has started.
 */
function onBroadcastingNotice(id, broadcasting) {
  browser.storage.local.get('broadcastingTab', function(result) {
    if (broadcasting) {
      browser.browserAction.setBadgeText({
        text: 'ON',
      });

      browser.storage.local.set({
        broadcastingTab: id,
      });
    
      port = browser.runtime.connectNative("discord_web_sys_ptt_native");
      port.onMessage.addListener((response) => {
        console.log(response);
        withBroadcastingTab(function(id) {
          browser.tabs.sendMessage(id, {
            id: 'ext_shortcut_pushed',
          });
        });
      });
    } else if (result.broadcastingTab === id) {
      browser.browserAction.setBadgeText({
        text: '',
      });

      browser.storage.local.set({
        broadcastingTab: null,
      });
      
      port.disconnect();
    }
  });
}

// Handle messages from Discord tabs and popups.
browser.runtime.onMessage.addListener(function(msg, sender, cb) {
  if (msg.id === 'discord_loaded' || msg.id === 'popup_loaded') {
    return false;
  } else if (msg.id === 'broadcasting' && sender != null &&
    sender.tab != null && sender.tab.id != null) {
    onBroadcastingNotice(sender.tab.id, msg.value);
    return false;
  }

  return false;
});
