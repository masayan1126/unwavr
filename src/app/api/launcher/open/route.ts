import { NextResponse } from "next/server";
import { exec } from "node:child_process";
import { promisify } from "node:util";

export const runtime = "nodejs";

const execAsync = promisify(exec);

export async function POST(req: Request) {
  try {
    const { path } = (await req.json()) as { path?: string };
    if (!path || typeof path !== "string") {
      return NextResponse.json({ error: "missing path" }, { status: 400 });
    }
    const platform = process.platform;
    if (platform === "darwin") {
      // Open app bundle without arguments
      await execAsync(`open -a ${JSON.stringify(path)}`);
      return NextResponse.json({ ok: true });
    }
    if (platform === "win32") {
      const ps = `Start-Process -FilePath ${JSON.stringify(path)}`;
      await execAsync(`powershell -NoProfile -Command ${JSON.stringify(ps)}`);
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "unsupported platform" }, { status: 501 });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


