This Firefox extension allows the Discord web client push-to-talk (PTT) mode to operate system-wide.
An Autohotkey script listens for configurable shortcut, then passes this to the extension, which emulates PTT key events in Discord.

### Installation:

1. Update location in `native.reg` to match where you have cloned to
1. Apply the `native.reg` file
1. Edit `native.ahk` if you wish to update the shortcut key (default is `Mouse 5` - if this does not suit then change both mentions of `XButton2` to any other key)
1. Compile `native.ahk` to exe with AutoHotkey
1. Restart Firefox
1. Install extension in Firefox (see https://github.com/lukefor/discord_web_sys_ptt/releases/)
1. Enable PTT in Discord and set the PTT key in Discord web settings to `Ctrl+Alt+Shift+P`.
