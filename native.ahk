;@Ahk2Exe-ConsoleApp
#NoEnv
#NoTrayIcon
#SingleInstance force

global stdout := FileOpen("*", "w")
stdin.Encoding := stdout.Encoding := "CP0"

XButton2::
while (GetKeyState("XButton2", "P"))
{
    output := "{""shortcut"": true}`n"
    stdout.WriteUInt(StrLen(output))
    stdout.Write(output)
    stdout.Read(0) ; flush
    Sleep 50
}
return
