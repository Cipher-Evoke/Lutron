' Hidden launcher for LMS_start.ps1 -Silent (no console on logon).
' Browser launch stays in LMS_start.ps1 — this file only hides the host window.
Option Explicit
Dim fso, sh, dir, ps1, cmd
Set fso = CreateObject("Scripting.FileSystemObject")
Set sh = CreateObject("Wscript.Shell")
dir = fso.GetParentFolderName(WScript.ScriptFullName)
ps1 = dir & "\LMS_start.ps1"
cmd = "powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File """ & ps1 & """ -Silent"
sh.Run cmd, 0, True
