import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
    try {
        const { path } = await req.json();

        if (!path || typeof path !== "string") {
            return NextResponse.json({ error: "Invalid path" }, { status: 400 });
        }

        // Mac specific: use 'open -a' for apps or 'open' for files
        // If path ends with .app, we can use 'open -a "Path"' or just 'open "Path"'
        // If it's just a name like "Visual Studio Code", 'open -a' works well.
        // We'll try to be smart: if it looks like a path, use it directly. If it looks like an app name, use -a.

        let command = "";
        if (path.startsWith("/") || path.startsWith("~") || path.includes("/")) {
            // Likely a path
            command = `open "${path}"`;
        } else {
            // Likely an app name
            command = `open -a "${path}"`;
        }

        console.log(`Launching: ${command}`);
        await execAsync(command);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Launch error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Failed to launch" },
            { status: 500 }
        );
    }
}
