import { NextResponse } from "next/server";
import { execFile, exec } from "node:child_process";
import { promisify } from "node:util";

export const runtime = "nodejs";

const execAsync = promisify(exec);

export async function GET() {
  try {
    const platform = process.platform;
    if (platform === "darwin") {
      // AppleScript: choose file (application bundle) -> POSIX path (選択のみ・起動しない)
      const script =
        "osascript -e 'POSIX path of (choose file with prompt \"アプリを選択\" of type {" +
        '"app"' +
        "})'";
      const { stdout } = await execAsync(script);
      const path = stdout.trim();
      if (!path) return NextResponse.json({ error: "cancelled" }, { status: 400 });
      return NextResponse.json({ path });
    }
    if (platform === "win32") {
      const ps = `
Add-Type -AssemblyName System.Windows.Forms | Out-Null;
$ofd = New-Object System.Windows.Forms.OpenFileDialog;
$ofd.Filter = 'Executable (*.exe)|*.exe|All files (*.*)|*.*';
$ofd.Title = 'アプリを選択';
if ($ofd.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $ofd.FileName }`;
      const { stdout } = await execAsync(`powershell -NoProfile -Command "${ps.replace(/\n/g, " ")}"`);
      const path = stdout.trim();
      if (!path) return NextResponse.json({ error: "cancelled" }, { status: 400 });
      return NextResponse.json({ path });
    }
    return NextResponse.json({ error: "unsupported platform" }, { status: 501 });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message ?? e) }, { status: 500 });
  }
}


