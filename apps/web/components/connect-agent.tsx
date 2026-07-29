"use client";

import { useState } from "react";
import { ClaudeMark, CursorMark, WindsurfMark, ZedMark } from "./client-marks";

/**
 * Connect-your-agent grid. Every command here targets the self-hosted stdio
 * path, which works today on the user's own ManyChat key. Hosted URLs are
 * added once the gateway is live — shipping an untested endpoint would send
 * people to a command that fails.
 */
type Client = {
  id: string;
  name: string;
  role: string;
  Mark?: ({ className }: { className?: string }) => React.JSX.Element;
  wordmark?: string;
  brand: string;
  command: string;
  note?: string;
};

const CLIENTS: Client[] = [
  {
    id: "claude-code",
    name: "Claude Code",
    role: "terminal agent",
    Mark: ClaudeMark,
    brand: "#d97757",
    command: 'claude mcp add manychat -e MANYCHAT_API_KEY=your_key -- npx -y manychat-mcp',
  },
  {
    id: "cursor",
    name: "Cursor",
    role: "editor agent",
    Mark: CursorMark,
    brand: "#e8ecea",
    command: '// ~/.cursor/mcp.json\n{"mcpServers":{"manychat":{"command":"npx","args":["-y","manychat-mcp"],"env":{"MANYCHAT_API_KEY":"your_key"}}}}',
  },
  {
    id: "claude-desktop",
    name: "Claude Desktop",
    role: "desktop app",
    Mark: ClaudeMark,
    brand: "#d97757",
    command: '// claude_desktop_config.json\n{"mcpServers":{"manychat":{"command":"npx","args":["-y","manychat-mcp"],"env":{"MANYCHAT_API_KEY":"your_key"}}}}',
  },
  {
    id: "codex",
    name: "Codex",
    role: "cli agent",
    wordmark: "codex",
    brand: "#2de2c0",
    command: '# ~/.codex/config.toml\n[mcp_servers.manychat]\ncommand = "npx"\nargs = ["-y", "manychat-mcp"]\nenv = { MANYCHAT_API_KEY = "your_key" }',
  },
  {
    id: "windsurf",
    name: "Windsurf",
    role: "editor agent",
    Mark: WindsurfMark,
    brand: "#58a6a0",
    command: '// ~/.codeium/windsurf/mcp_config.json\n{"mcpServers":{"manychat":{"command":"npx","args":["-y","manychat-mcp"],"env":{"MANYCHAT_API_KEY":"your_key"}}}}',
    note: "Same schema as Cursor.",
  },
  {
    id: "zed",
    name: "Zed",
    role: "editor agent",
    Mark: ZedMark,
    brand: "#e8ecea",
    command: '// settings.json → context_servers\n{"manychat":{"command":{"path":"npx","args":["-y","manychat-mcp"],"env":{"MANYCHAT_API_KEY":"your_key"}}}}',
    note: "Same schema as Cursor.",
  },
];

export function ConnectAgent() {
  const [active, setActive] = useState(CLIENTS[0]);
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(active.command);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="space-y-5">
      <div
        role="tablist"
        aria-label="MCP clients"
        className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6"
      >
        {CLIENTS.map((client) => {
          const selected = client.id === active.id;
          return (
            <button
              key={client.id}
              role="tab"
              type="button"
              aria-selected={selected}
              aria-controls="connect-panel"
              onClick={() => {
                setActive(client);
                setCopied(false);
              }}
              className={`group flex flex-col items-center gap-2 rounded-xl border px-3 py-4 text-center transition-colors duration-200 ${
                selected
                  ? "border-[#2de2c0]/45 bg-[#2de2c0]/[0.07]"
                  : "border-white/8 bg-white/[0.02] hover:border-white/16"
              }`}
            >
              <span
                className="flex h-7 items-center justify-center transition-opacity duration-200 group-hover:opacity-100"
                style={{ color: client.brand, opacity: selected ? 1 : 0.62 }}
              >
                {client.Mark ? (
                  <client.Mark className="h-6 w-6" />
                ) : (
                  <span className="font-mono text-[13px] font-semibold tracking-tight">
                    {client.wordmark}
                  </span>
                )}
              </span>
              <span className="text-[13px] font-medium leading-tight">{client.name}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-white/32">
                {client.role}
              </span>
            </button>
          );
        })}
      </div>

      <div id="connect-panel" role="tabpanel" aria-label={active.name} className="terminal-window">
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-4 py-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-white/38">
            {active.name}
          </span>
          <button
            type="button"
            onClick={copy}
            className="rounded-md border border-white/12 px-2.5 py-1 font-mono text-[11px] text-white/58 transition-colors duration-200 hover:border-[#2de2c0]/45 hover:text-[#2de2c0]"
          >
            {copied ? "copied" : "copy"}
          </button>
        </div>
        <pre className="overflow-x-auto p-5 font-mono text-xs leading-6 text-emerald-100/86">
          <code>{active.command}</code>
        </pre>
        {active.note ? (
          <p className="border-t border-white/8 px-5 py-3 text-xs muted">{active.note}</p>
        ) : null}
      </div>

      <p className="text-xs leading-6 muted">
        Every command runs the server locally on your own ManyChat key — nothing routes through
        us. Get the key at ManyChat → Settings → API. Hosted connection strings land here when the
        gateway opens.
      </p>
    </div>
  );
}
