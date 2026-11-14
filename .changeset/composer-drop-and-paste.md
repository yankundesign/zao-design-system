---
'@zao/react': minor
---

Composer takes dropped and pasted files. When `onFilesSelect` is set, dropping files on the tray or pasting files into the draft calls it, as the Attach control does; the files are held to `accept` and `multiple` as the picker's are, and the host still validates and uploads. While files are held over the tray it is drawn rather than built: a dashed perimeter resting on its base, in the same box. Pasted text and dragged text behave as before, a disabled Composer takes nothing, and a host's own drag, drop and paste handlers run first and can prevent the default.
