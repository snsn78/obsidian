"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/mcp-server-core.ts
var mcp_server_core_exports = {};
__export(mcp_server_core_exports, {
  startMcpServer: () => startMcpServer
});
module.exports = __toCommonJS(mcp_server_core_exports);
var http = __toESM(require("node:http"));
var readline = __toESM(require("node:readline"));
var fs = __toESM(require("node:fs"));

// src/services/mcpProtocol.ts
var TOOL_METAS = [
  {
    name: "health",
    description: "Check if the Render API server is running and healthy",
    inputSchema: {
      type: "object",
      properties: {}
    }
  },
  {
    name: "render_markdown",
    description: "Render arbitrary markdown content through Obsidian's render pipeline",
    inputSchema: {
      type: "object",
      properties: {
        content: { type: "string", description: "Markdown content to render" },
        sourcePath: { type: "string", description: "Optional vault-relative file path for resolving relative links/images in content (e.g. 'Daily/note.md')" },
        format: { type: "string", enum: ["html", "text", "json"], description: "Output format (default: html)" },
        inlineImages: { type: "boolean", description: "Inline images as base64 data URIs (default: false, controlled by plugin settings). Set true to inline as base64." }
      },
      required: ["content"]
    }
  },
  {
    name: "render_file",
    description: "Render a vault file by its path within the Obsidian vault",
    inputSchema: {
      type: "object",
      properties: {
        filePath: { type: "string", description: "Path to the file in the vault (e.g. 'Daily/2026-06-27.md')" },
        format: { type: "string", enum: ["html", "text", "json"], description: "Output format (default: html)" },
        inlineImages: { type: "boolean", description: "Inline images as base64 data URIs (default: false, controlled by plugin settings). Set true to inline as base64." }
      },
      required: ["filePath"]
    }
  },
  {
    name: "dataview_query",
    description: "Execute a Dataview DQL query and return the results",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: `Dataview DQL query (e.g. 'TABLE file.name, file.mtime FROM ""')` },
        format: { type: "string", enum: ["html", "text", "json"], description: "Output format (default: json)" }
      },
      required: ["query"]
    }
  },
  {
    name: "dataviewjs",
    description: "Execute arbitrary dataviewjs code using the dv.* API",
    inputSchema: {
      type: "object",
      properties: {
        code: { type: "string", description: "DataviewJS code" },
        format: { type: "string", enum: ["html", "text", "json"], description: "Output format (default: text)" }
      },
      required: ["code"]
    }
  },
  {
    name: "reload_plugin",
    description: 'Reload an Obsidian plugin. Pass a pluginId to reload a specific plugin, "others" to reload all other plugins, or omit to reload render-api itself.',
    inputSchema: {
      type: "object",
      properties: {
        pluginId: { type: "string", description: "Plugin ID to reload (e.g. 'obsidian-dataview'). Use 'others' to reload all other plugins. Omit to reload render-api itself." }
      }
    }
  }
];
function handleMcpRequest(req, ctx, writer) {
  const { id, method, params } = req;
  switch (method) {
    case "initialize": {
      writer({
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: {
            name: "render-api-mcp",
            version: "0.2.1"
          }
        }
      });
      break;
    }
    case "notifications/initialized":
      break;
    case "tools/list": {
      writer({
        jsonrpc: "2.0",
        id,
        result: {
          tools: ctx.tools.map((t) => ({
            name: t.name,
            description: t.description,
            inputSchema: t.inputSchema
          }))
        }
      });
      break;
    }
    case "tools/call": {
      if (!params || typeof params.name !== "string") {
        writer({
          jsonrpc: "2.0",
          id,
          error: { code: -32602, message: "Invalid params: name is required" }
        });
        return;
      }
      const tool = ctx.tools.find((t) => t.name === params.name);
      if (!tool) {
        writer({
          jsonrpc: "2.0",
          id,
          error: { code: -32601, message: `Tool not found: ${params.name}` }
        });
        return;
      }
      tool.handler(params.arguments ?? {}).then((result) => {
        writer({
          jsonrpc: "2.0",
          id,
          result: {
            content: [
              {
                type: "text",
                text: typeof result === "string" ? result : JSON.stringify(result, null, 2)
              }
            ]
          }
        });
      }).catch((err) => {
        writer({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32603,
            message: `Tool execution failed: ${err.message}`
          }
        });
      });
      break;
    }
    default:
      writer({
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` }
      });
  }
}

// src/mcp-server-core.ts
var args = process.argv.slice(2);
var portIdx = args.indexOf("--port");
var CLI_PORT = parseInt(portIdx >= 0 ? args[portIdx + 1] : "27123", 10);
var hostIdx = args.indexOf("--host");
var HOST = hostIdx >= 0 ? args[hostIdx + 1] : "127.0.0.1";
var API_KEY = process.env.RENDER_API_KEY ?? "";
var activeBaseUrl = `http://${HOST}:${CLI_PORT}`;
var detectedPort = null;
function apiGet(path) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (API_KEY) headers["X-API-Key"] = API_KEY;
    const req = http.request(
      `${activeBaseUrl}${path}`,
      { method: "GET", headers, timeout: 5e3 },
      (res) => {
        let chunks = "";
        res.on("data", (chunk) => chunks += chunk);
        res.on("end", () => {
          try {
            resolve(JSON.parse(chunks));
          } catch {
            resolve(chunks);
          }
        });
      }
    );
    req.on("error", (err) => reject(err));
    req.end();
  });
}
function apiPost(path, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const headers = {
      "Content-Type": "application/json",
      "Content-Length": String(Buffer.byteLength(data))
    };
    if (API_KEY) headers["X-API-Key"] = API_KEY;
    const req = http.request(
      `${activeBaseUrl}${path}`,
      {
        method: "POST",
        headers,
        timeout: 3e4
      },
      (res) => {
        let chunks = "";
        res.on("data", (chunk) => chunks += chunk);
        res.on("end", () => {
          try {
            resolve(JSON.parse(chunks));
          } catch {
            resolve(chunks);
          }
        });
      }
    );
    req.on("error", (err) => reject(err));
    req.write(data);
    req.end();
  });
}
function checkPort(host, port) {
  return new Promise((resolve) => {
    const headers = {};
    if (API_KEY) headers["X-API-Key"] = API_KEY;
    const req = http.get(`http://${host}:${port}/health`, { timeout: 2e3, headers }, (res) => {
      let chunks = "";
      res.on("data", (chunk) => chunks += chunk);
      res.on("end", () => {
        try {
          const data = JSON.parse(chunks);
          resolve(data?.status === "running");
        } catch {
          resolve(false);
        }
      });
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2e3, () => {
      req.destroy();
      resolve(false);
    });
  });
}
async function detectServer(host, preferred) {
  const start = Math.max(preferred - 5, 1024);
  const end = preferred + 5;
  if (await checkPort(host, preferred)) {
    return preferred;
  }
  process.stderr.write(`[render-api-mcp] Port ${preferred} not available, scanning ${start}-${end}...
`);
  for (let port = start; port <= end; port++) {
    if (port === preferred) continue;
    if (await checkPort(host, port)) {
      process.stderr.write(`[render-api-mcp] Found Render API on port ${port}
`);
      return port;
    }
  }
  return null;
}
function resolveWSLHosts() {
  if (!process.env.WSL_DISTRO_NAME) {
    return [];
  }
  try {
    const route = fs.readFileSync("/proc/net/route", "utf-8");
    const lines = route.trim().split("\n");
    for (const line of lines.slice(1)) {
      const parts = line.split("	");
      if (parts[1] === "00000000") {
        const gwHex = parts[2];
        const bytes = gwHex.match(/../g)?.reverse() ?? [];
        if (bytes.length === 4) {
          return [bytes.map((b) => parseInt(b, 16)).join(".")];
        }
      }
    }
  } catch {
  }
  return ["172.17.224.1", "172.17.240.1", "172.17.0.1", "172.17.128.1"];
}
var httpTools = TOOL_METAS.map((meta) => {
  const handlerMap = {
    health: async () => await apiGet("/health"),
    render_markdown: async (args_) => await apiPost("/render", { content: args_.content, sourcePath: args_.sourcePath, format: args_.format ?? "html", inlineImages: args_.inlineImages }),
    render_file: async (args_) => await apiPost("/render", { filePath: args_.filePath, format: args_.format ?? "html", inlineImages: args_.inlineImages }),
    dataview_query: async (args_) => await apiPost("/render/dataview", { query: args_.query, format: args_.format ?? "json" }),
    dataviewjs: async (args_) => await apiPost("/render/dataview", { code: args_.code, format: args_.format ?? "text" }),
    reload_plugin: async (args_) => await apiGet(`/reload?pluginId=${encodeURIComponent(String(args_.pluginId ?? ""))}`)
  };
  return {
    ...meta,
    handler: handlerMap[meta.name] ?? (async () => ({ error: "Unknown tool" }))
  };
});
var pending = /* @__PURE__ */ new Set();
var stdinClosed = false;
var stdioWriter = (response) => {
  process.stdout.write(JSON.stringify(response) + "\n");
  if (response.id !== void 0) {
    pending.delete(response.id);
  }
  if (stdinClosed && pending.size === 0) {
    process.exit(0);
  }
};
async function startMcpServer() {
  const hostsToTry = [{ host: HOST, label: HOST }];
  const wslHosts = resolveWSLHosts();
  for (const wh of wslHosts) {
    if (wh !== HOST) {
      hostsToTry.push({ host: wh, label: `WSL host (${wh})` });
    }
  }
  for (const { host, label } of hostsToTry) {
    process.stderr.write(`[render-api-mcp] Trying ${label}...
`);
    detectedPort = await detectServer(host, CLI_PORT);
    if (detectedPort) {
      activeBaseUrl = `http://${host}:${detectedPort}`;
      try {
        const health = await apiGet("/health");
        process.stderr.write(`[render-api-mcp] Connected to Render API v${health.version ?? "unknown"} at ${host}:${detectedPort}
`);
      } catch {
        process.stderr.write(`[render-api-mcp] Connected to Render API at ${host}:${detectedPort}
`);
      }
      break;
    }
  }
  if (!detectedPort) {
    process.stderr.write(`[render-api-mcp] Warning: Render API not found. Tried: ${hostsToTry.map((h) => h.label).join(", ")} ports ${Math.max(CLI_PORT - 5, 1024)}-${CLI_PORT + 5}. Start the plugin server first.
`);
  }
  process.stderr.write(`[render-api-mcp] MCP server ready (stdio)
`);
  const rl = readline.createInterface({ input: process.stdin });
  rl.on("line", (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    try {
      const req = JSON.parse(trimmed);
      if (req.id !== void 0) {
        pending.add(req.id);
      }
      handleMcpRequest(req, { tools: httpTools }, stdioWriter);
    } catch {
      process.stderr.write(`[render-api-mcp] Failed to parse request: ${trimmed}
`);
    }
  });
  rl.on("close", () => {
    stdinClosed = true;
    if (pending.size === 0) {
      process.exit(0);
    }
  });
}
if (require.main === module) {
  void startMcpServer();
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  startMcpServer
});
