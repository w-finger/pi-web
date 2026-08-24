import { NextResponse } from "next/server";
import { existsSync, promises as fs } from "fs";
import path from "path";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

export const dynamic = "force-dynamic";

// GET  /api/subagent-config -> { installed, defaultModel, agentModels }
// PUT  /api/subagent-config  body: { defaultModel?: "provider/modelId" | null, agentModels?: Record<string,string> | null }
//   Partial update: omitted keys are kept, null deletes a key.
// The subagent extension re-reads this file on every tool invocation, so
// changes apply to the next delegated task without any restart/reload.

const MODEL_REF_RE = /^[\w][\w./:-]*$/;

interface SubagentConfig {
  defaultModel?: string;
  agentModels?: Record<string, string>;
  [key: string]: unknown;
}

function configPath(): string {
  return path.join(getAgentDir(), "subagent.config.json");
}

function extensionInstalled(): boolean {
  return existsSync(path.join(getAgentDir(), "extensions", "subagent", "index.ts"));
}

async function readConfig(): Promise<SubagentConfig> {
  try {
    const parsed: unknown = JSON.parse(await fs.readFile(configPath(), "utf-8"));
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) return parsed as SubagentConfig;
  } catch {
    /* missing or invalid config: treated as empty */
  }
  return {};
}

export async function GET() {
  const config = await readConfig();
  return NextResponse.json({
    installed: extensionInstalled(),
    defaultModel: typeof config.defaultModel === "string" ? config.defaultModel : null,
    agentModels: config.agentModels ?? {},
  });
}

export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as { defaultModel?: unknown; agentModels?: unknown };
    const existing = await readConfig();

    if ("defaultModel" in body) {
      if (body.defaultModel === null) {
        delete existing.defaultModel;
      } else if (
        typeof body.defaultModel === "string" &&
        body.defaultModel.includes("/") &&
        MODEL_REF_RE.test(body.defaultModel)
      ) {
        existing.defaultModel = body.defaultModel;
      } else {
        return NextResponse.json(
          { error: 'defaultModel must be "provider/modelId" or null' },
          { status: 400 }
        );
      }
    }

    if ("agentModels" in body) {
      if (body.agentModels === null) {
        delete existing.agentModels;
      } else if (body.agentModels && typeof body.agentModels === "object" && !Array.isArray(body.agentModels)) {
        for (const [agentName, ref] of Object.entries(body.agentModels as Record<string, unknown>)) {
          if (typeof ref !== "string" || !MODEL_REF_RE.test(ref)) {
            return NextResponse.json(
              { error: `Invalid model ref for agent "${agentName}"` },
              { status: 400 }
            );
          }
        }
        existing.agentModels = body.agentModels as Record<string, string>;
      } else {
        return NextResponse.json({ error: "agentModels must be an object or null" }, { status: 400 });
      }
    }

    await fs.mkdir(path.dirname(configPath()), { recursive: true });
    await fs.writeFile(configPath(), `${JSON.stringify(existing, null, 2)}\n`, "utf-8");
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
