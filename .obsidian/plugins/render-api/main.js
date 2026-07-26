"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
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

// src/services/renderService.ts
var renderService_exports = {};
__export(renderService_exports, {
  RenderService: () => RenderService
});
var import_obsidian, MIME_TYPES, RenderService;
var init_renderService = __esm({
  "src/services/renderService.ts"() {
    "use strict";
    import_obsidian = require("obsidian");
    MIME_TYPES = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      svg: "image/svg+xml",
      bmp: "image/bmp",
      ico: "image/x-icon",
      tiff: "image/tiff",
      tif: "image/tiff",
      avif: "image/avif"
    };
    RenderService = class {
      constructor(app, component, debugLogEnabled = false, debugLogFile = "") {
        this.app = app;
        this.component = component;
        this.debugLogEnabled = debugLogEnabled;
        this.debugLogFile = debugLogFile;
        /** Log buffer for .md file output (accumulates during a render call). */
        this._logBuffer = [];
        this._attachmentFolder = this.readAttachmentFolderConfig();
      }
      /**
       * Read Obsidian's `attachmentFolderPath` vault config.
       * Returns null when unset/empty (meaning "same folder as the note").
       */
      readAttachmentFolderConfig() {
        try {
          const vault = this.app.vault;
          const getConfig = vault.getConfig;
          if (typeof getConfig !== "function") return null;
          const raw = getConfig("attachmentFolderPath");
          if (raw == null) return null;
          const folder = String(raw).trim();
          return folder === "" || folder === "/" ? null : folder;
        } catch {
          return null;
        }
      }
      /**
       * Resolve a bare embed filename (no directory component) to the correct
       * vault path, taking Obsidian's `attachmentFolderPath` config into account.
       *
       * - `null`/"" → same folder as the source note
       * - `"./xxx"` → subfolder relative to the source note's directory
       * - `"../xxx"` → relative path going up from the source note's directory
       * - `"Attachments"` → vault-root-relative folder
       */
      resolveEmbedPath(sourcePath, embedPath) {
        const dir = sourcePath.includes("/") ? sourcePath.replace(/\/[^/]+$/, "") : "";
        if (this._attachmentFolder == null) {
          return dir ? `${dir}/${embedPath}` : embedPath;
        }
        const config = this._attachmentFolder;
        if (config.startsWith("./")) {
          const suffix = config.slice(2);
          const base = dir ? `${dir}/` : "";
          return suffix ? `${base}${suffix}/${embedPath}` : `${base}${embedPath}`;
        }
        if (config.startsWith("../")) {
          let folder = dir;
          let remaining = config;
          while (remaining.startsWith("../")) {
            const lastSlash = folder.lastIndexOf("/");
            folder = lastSlash >= 0 ? folder.slice(0, lastSlash) : "";
            remaining = remaining.slice(3);
          }
          const base = folder ? `${folder}/` : "";
          return remaining ? `${base}${remaining}/${embedPath}` : `${base}${embedPath}`;
        }
        const prefix = config.replace(/^\//, "");
        return `${prefix}/${embedPath}`;
      }
      /** Log only when debugLogEnabled is true. */
      log(...args) {
        if (this.debugLogEnabled) {
          console.log("[Render API]", ...args);
          this._logBuffer.push(`[LOG] ${args.map(String).join(" ")}`);
        }
      }
      logWarn(...args) {
        if (this.debugLogEnabled) {
          console.warn("[Render API]", ...args);
          this._logBuffer.push(`[WARN] ${args.map(String).join(" ")}`);
        }
      }
      logError(...args) {
        if (this.debugLogEnabled) {
          console.error("[Render API]", ...args);
          this._logBuffer.push(`[ERR]  ${args.map(String).join(" ")}`);
        }
      }
      /**
       * Append the accumulated log buffer to the configured .md debug log file.
       * Called after each render() completes.
       */
      async flushDebugLogToFile() {
        if (!this.debugLogFile || this._logBuffer.length === 0) return;
        const lines = this._logBuffer.splice(0);
        try {
          const adapter = this.app.vault.adapter;
          let existing = "";
          try {
            existing = await adapter.read(this.debugLogFile);
          } catch {
          }
          const now = /* @__PURE__ */ new Date();
          const pad = (n) => String(n).padStart(2, "0");
          const timestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
          const heading = existing ? `

---
## ${timestamp}
` : `# Render API Debug Log

## ${timestamp}
`;
          const body = lines.map((l) => `- ${l}`).join("\n");
          await adapter.write(this.debugLogFile, existing + heading + body + "\n");
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.warn("[Render API] Failed to write debug log file:", msg);
        }
      }
      /**
       * Render a request. Tries dataview first if applicable, falls back to
       * generic markdown rendering.
       */
      async render(req) {
        try {
          if (req.query) {
            return await this.renderDataviewQuery(req.query, req.format);
          }
          if (req.code) {
            return await this.renderDataviewJS(req.code, req.format);
          }
          if (req.filePath) {
            this.log("render() filePath branch: filePath=", JSON.stringify(req.filePath), "format=", req.format, "inlineImages=", req.inlineImages);
            const file = this.app.vault.getAbstractFileByPath(req.filePath);
            if (!file || !(file instanceof import_obsidian.TFile)) {
              this.logWarn("render() filePath branch: FILE NOT FOUND:", req.filePath);
              return { success: false, error: `File not found: ${req.filePath}` };
            }
            this.log("render() filePath branch: file FOUND, reading content...");
            const content = await this.app.vault.read(file);
            this.log("render() filePath branch: content read, length=", content.length, "calling renderMarkdown");
            return await this.renderMarkdown(content, req.filePath, req.format, req.inlineImages);
          }
          if (req.content) {
            const sourcePath = req.sourcePath ?? "";
            return await this.renderMarkdown(req.content, sourcePath, req.format, req.inlineImages);
          }
          return { success: false, error: "No content, query, filePath, or code provided" };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { success: false, error: `Render failed: ${msg}` };
        } finally {
          await this.flushDebugLogToFile();
        }
      }
      // ---- Dataview DQL ----
      async renderDataviewQuery(query, format) {
        const dvApi = this.getDataviewAPI();
        if (!dvApi) {
          return { success: false, error: "Dataview plugin not enabled or not installed" };
        }
        try {
          const result = await dvApi.query(query);
          if (!result.successful) {
            return { success: false, error: `Query execution failed: ${String(result.value)}` };
          }
          if (format === "json") {
            return { success: true, data: result.value, mimeType: "application/json" };
          }
          const text = this.dataviewResultToText(result.value);
          const html = `<pre>${this.escapeHtml(text)}</pre>`;
          return {
            success: true,
            text,
            html,
            data: result.value,
            mimeType: format === "text" ? "text/plain" : "text/html"
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { success: false, error: `Query execution failed: ${msg}` };
        }
      }
      // ---- DataviewJS ----
      async renderDataviewJS(code, format) {
        const dvApi = this.getDataviewAPI();
        if (!dvApi) {
          return { success: false, error: "Dataview plugin not enabled or not installed" };
        }
        try {
          const wrapped = "```dataviewjs\n" + code + "\n```";
          return await this.renderMarkdown(wrapped, "", format);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { success: false, error: `JS execution failed: ${msg}` };
        }
      }
      // ---- Generic markdown (with post-processor support) ----
      async renderMarkdown(content, sourcePath, format, inlineImages) {
        const doc = activeDocument;
        const el = doc.createElement("div");
        el.classList.add("render-api-render-container");
        doc.body.appendChild(el);
        try {
          this.log("renderMarkdown step 1: preprocessWikiEmbeds, sourcePath=", JSON.stringify(sourcePath), "content.length=", content.length);
          let preprocessed;
          try {
            preprocessed = this.preprocessWikiEmbeds(content, sourcePath);
          } catch (err1) {
            const msg1 = err1 instanceof Error ? err1.message : String(err1);
            this.logError("renderMarkdown FAILED at step 1 (preprocessWikiEmbeds):", msg1);
            return { success: false, error: `Preprocess failed: ${msg1}` };
          }
          this.log("renderMarkdown step 2: MarkdownRenderer.render, sourcePath=", JSON.stringify(sourcePath), "this.component=", typeof this.component, "this.app=", typeof this.app);
          try {
            await import_obsidian.MarkdownRenderer.render(this.app, preprocessed, el, sourcePath, this.component);
          } catch (err2) {
            const msg2 = err2 instanceof Error ? err2.message : String(err2);
            this.logError("renderMarkdown FAILED at step 2 (MarkdownRenderer.render):", msg2, "sourcePath type:", typeof sourcePath, "sourcePath:", JSON.stringify(sourcePath));
            return { success: false, error: `Markdown render failed: ${msg2}` };
          }
          this.log("renderMarkdown step 3: waitForPostProcessors");
          try {
            await this.waitForPostProcessors();
          } catch (err3) {
            const msg3 = err3 instanceof Error ? err3.message : String(err3);
            this.logError("renderMarkdown FAILED at step 3 (waitForPostProcessors):", msg3);
            return { success: false, error: `Post-processor wait failed: ${msg3}` };
          }
          let html = el.innerHTML;
          const text = el.textContent ?? "";
          this.log("renderMarkdown step 4: image processing, inlineImages=", inlineImages);
          if (inlineImages === true) {
            try {
              html = await this.inlineImages(html);
            } catch (err4) {
              const msg4 = err4 instanceof Error ? err4.message : String(err4);
              this.logError("renderMarkdown step 4a (inlineImages) failed, returning HTML as-is:", msg4);
            }
          } else {
            try {
              const result = this.appUrlsToFilePaths(html);
              if (/app:\/\//.test(result)) {
                this.logWarn("renderMarkdown step 4b: appUrlsToFilePaths left unresolved app:// URLs, falling back to inlineImages");
                try {
                  html = await this.inlineImages(html);
                } catch (errFallback) {
                  const msgFb = errFallback instanceof Error ? errFallback.message : String(errFallback);
                  this.logError("renderMarkdown step 4b: inlineImages fallback also failed:", msgFb);
                  html = result;
                }
              } else {
                html = result;
              }
            } catch (err4b) {
              const msg4b = err4b instanceof Error ? err4b.message : String(err4b);
              const stack4b = err4b instanceof Error ? err4b.stack : "";
              this.logWarn("renderMarkdown step 4b: appUrlsToFilePaths threw, falling back to inlineImages:", msg4b, stack4b);
              try {
                html = await this.inlineImages(html);
              } catch (err4c) {
                const msg4c = err4c instanceof Error ? err4c.message : String(err4c);
                const stack4c = err4c instanceof Error ? err4c.stack : "";
                this.logError("renderMarkdown step 4c: inlineImages fallback also failed:", msg4c, stack4c);
              }
            }
          }
          if (format === "json") {
            return { success: true, data: { html, text }, mimeType: "application/json" };
          }
          if (format === "text") {
            return { success: true, text, mimeType: "text/plain" };
          }
          return { success: true, html, text, mimeType: "text/html" };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { success: false, error: `Markdown render failed: ${msg}` };
        } finally {
          el.remove();
        }
      }
      /**
       * Preprocess Obsidian wiki-style image embeds (![[...]]) to `<img>` tags
       * with app:// URLs (Obsidian internal protocol).
       *
       * The app:// URL is later converted to a base64 data URI by inlineImages(),
       * which runs after MarkdownRenderer completes.  This avoids passing raw
       * base64 data through the markdown render pipeline, which can cause
       * Obsidian's internal path resolver to choke on data: URIs.
       */
      preprocessWikiEmbeds(content, sourcePath) {
        const IMAGE_EXTS = /* @__PURE__ */ new Set([
          "png",
          "jpg",
          "jpeg",
          "gif",
          "webp",
          "svg",
          "bmp",
          "ico",
          "tiff",
          "tif",
          "avif"
        ]);
        const regex = /!\[\[([^\]]+)\]\]/g;
        const vaultBasePath = this.app.vault.adapter.getBasePath?.() ?? "";
        return content.replace(regex, (_match, inner) => {
          const parts = inner.split("|");
          const embedPath = parts[0].trim();
          const altOrSize = parts[1]?.trim() ?? "";
          const ext = embedPath.split(".").pop()?.toLowerCase();
          if (!ext || !IMAGE_EXTS.has(ext)) return _match;
          const isDimension = /^\d+[xX]\d+$/.test(altOrSize) || /^\d+$/.test(altOrSize);
          const alt = altOrSize && !isDimension ? altOrSize : "image";
          let resolvedPath = embedPath;
          if (sourcePath && !embedPath.startsWith("/") && !embedPath.includes("/")) {
            resolvedPath = this.resolveEmbedPath(sourcePath, embedPath);
          }
          const absPath = vaultBasePath ? vaultBasePath.replace(/\\/g, "/").replace(/\/+$/, "") + "/" + resolvedPath : resolvedPath;
          const encodedPath = absPath.split("/").map(encodeURIComponent).join("/");
          const src = "file:///" + encodedPath;
          let img = `<img src="${src}" alt="${alt}">`;
          const dimMatch = altOrSize.match(/^(\d+)(?:[xX](\d+))?$/);
          if (dimMatch) {
            img = `<img src="${src}" alt="${alt}" width="${dimMatch[1]}">`;
            if (dimMatch[2]) {
              img = `<img src="${src}" alt="${alt}" width="${dimMatch[1]}" height="${dimMatch[2]}">`;
            }
          }
          return img;
        });
      }
      /**
       * Scan HTML for <img> tags with app:// URLs (Obsidian internal protocol),
       * read the referenced binary files via the vault API, and replace with
       * base64 data URIs so the HTML is self-contained.
       *
       * Handles both formats:
       *   app://obsidian.md/path/to/file.png       (vault-relative path)
       *   app://obsidian.md/C:/path/to/file.png    (Windows absolute path)
       */
      async inlineImages(html) {
        const imgRegex = /<img[^>]+src="(app:\/\/[^"]+)"[^>]*>/gi;
        const appUrls = [];
        let match;
        while ((match = imgRegex.exec(html)) !== null) {
          appUrls.push(match[1]);
        }
        if (appUrls.length === 0) {
          this.log("inlineImages: no app:// URLs found in HTML, returning unchanged");
          return html;
        }
        this.log("inlineImages: found", appUrls.length, "app:// URLs:", appUrls);
        const uniqueUrls = [...new Set(appUrls)];
        const vaultBasePath = this.app.vault.adapter.getBasePath?.() ?? "";
        this.log("inlineImages: vaultBasePath=", vaultBasePath);
        const urlToDataUri = /* @__PURE__ */ new Map();
        const skippedFiles = [];
        await Promise.all(uniqueUrls.map(async (appUrl) => {
          try {
            const parsed = new URL(appUrl);
            if (!parsed.pathname) {
              this.logWarn("inlineImages: parsed URL pathname is empty/undefined for:", appUrl);
              skippedFiles.push(appUrl);
              return;
            }
            let filePath = decodeURIComponent(parsed.pathname).replace(/^[/\\]/, "");
            this.log("inlineImages: parsed URL:", appUrl, "\u2192 filePath:", filePath);
            if (/^[A-Za-z]:[/\\]/.test(filePath) && vaultBasePath) {
              const normalizedBase = vaultBasePath.replace(/\\/g, "/").replace(/\/+$/, "");
              const normalizedPath = filePath.replace(/\\/g, "/");
              if (normalizedPath.startsWith(normalizedBase + "/")) {
                filePath = normalizedPath.slice(normalizedBase.length + 1);
                this.log("inlineImages: stripped vault base, filePath now:", filePath);
              } else {
                this.logWarn("inlineImages: file outside vault, skipping:", filePath, "vaultBasePath:", vaultBasePath);
                skippedFiles.push(filePath);
                return;
              }
            }
            if (/^[A-Za-z]:[/\\]/.test(filePath) || filePath.startsWith("/")) {
              this.logWarn("inlineImages: unresolved absolute path, skipping:", filePath);
              skippedFiles.push(filePath);
              return;
            }
            const file = this.app.vault.getAbstractFileByPath(filePath);
            if (!file || !(file instanceof import_obsidian.TFile)) {
              this.logWarn("inlineImages: file not found in vault, skipping:", filePath);
              skippedFiles.push(filePath);
              return;
            }
            const arrayBuffer = await this.app.vault.readBinary(file);
            const base64 = this.arrayBufferToBase64(arrayBuffer);
            const mimeType = this.getMimeType(file.extension);
            urlToDataUri.set(appUrl, `data:${mimeType};base64,${base64}`);
            this.log("inlineImages: successfully inlined:", filePath, "(", base64.length, "chars )");
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            this.logWarn("inlineImages: error processing", appUrl, ":", msg);
            skippedFiles.push(appUrl);
          }
        }));
        if (urlToDataUri.size === 0) {
          this.logWarn("inlineImages: FAILED to inline any images \u2014 returning HTML with", appUrls.length, "unresolved app:// URLs. Skipped:", skippedFiles);
          return html;
        }
        this.log("inlineImages: successfully inlined", urlToDataUri.size, "of", uniqueUrls.length, "images");
        let result = html;
        for (const [original, dataUri] of urlToDataUri) {
          result = result.split(original).join(dataUri);
        }
        return result;
      }
      /**
       * Replace app://obsidian.md URLs in HTML with absolute filesystem paths.
       * Used when inlineImages is false, so tools can still load images from disk.
       */
      appUrlsToFilePaths(html) {
        const imgRegex = /<img[^>]+src="(app:\/\/[^"]+)"[^>]*>/gi;
        const matches = [];
        let m;
        while ((m = imgRegex.exec(html)) !== null) {
          matches.push(m[1]);
        }
        if (matches.length === 0) {
          this.log("appUrlsToFilePaths: no app:// URLs found, returning unchanged");
          return html;
        }
        this.log("appUrlsToFilePaths: found", matches.length, "app:// URLs");
        const vaultBasePath = this.app.vault.adapter.getBasePath?.() ?? "";
        if (!vaultBasePath) {
          this.logWarn("appUrlsToFilePaths: vaultBasePath is empty \u2014 cannot convert app:// URLs to filesystem paths. Returning HTML with", matches.length, "unresolved app:// URLs. The browser will fail to load these images.");
          return html;
        }
        this.log("appUrlsToFilePaths: vaultBasePath=", vaultBasePath);
        const urlToPath = /* @__PURE__ */ new Map();
        for (const appUrl of [...new Set(matches)]) {
          try {
            const parsed = new URL(appUrl);
            if (!parsed.pathname) {
              this.logWarn("appUrlsToFilePaths: parsed URL pathname is empty/undefined for:", appUrl);
              continue;
            }
            let filePath = decodeURIComponent(parsed.pathname).replace(/^[/\\]/, "");
            this.log("appUrlsToFilePaths: parsed URL:", appUrl, "\u2192 filePath:", filePath);
            if (/^[A-Za-z]:[/\\]/.test(filePath) && vaultBasePath) {
              const normalizedBase = vaultBasePath.replace(/\\/g, "/").replace(/\/+$/, "");
              const normalizedPath = filePath.replace(/\\/g, "/");
              if (normalizedPath.startsWith(normalizedBase + "/")) {
                filePath = normalizedPath.slice(normalizedBase.length + 1);
                this.log("appUrlsToFilePaths: stripped vault base, filePath now:", filePath);
              } else {
                this.logWarn("appUrlsToFilePaths: file outside vault, skipping:", filePath);
                continue;
              }
            }
            if (/^[A-Za-z]:[/\\]/.test(filePath) || filePath.startsWith("/")) {
              this.logWarn("appUrlsToFilePaths: unresolved absolute path, skipping:", filePath);
              continue;
            }
            const absPath = vaultBasePath.replace(/\\/g, "/").replace(/\/+$/, "") + "/" + filePath;
            urlToPath.set(appUrl, absPath);
            this.log("appUrlsToFilePaths: mapped", appUrl, "\u2192", absPath);
          } catch {
          }
        }
        if (urlToPath.size === 0) {
          this.logWarn("appUrlsToFilePaths: FAILED to resolve any app:// URLs \u2014 returning HTML with", matches.length, "unresolved URLs");
          return html;
        }
        this.log("appUrlsToFilePaths: resolved", urlToPath.size, "of", matches.length, "URLs");
        let result = html;
        for (const [original, absPath] of urlToPath) {
          result = result.split(`"${original}"`).join(`"${absPath}"`);
        }
        return result;
      }
      /** Convert ArrayBuffer to base64 string. */
      arrayBufferToBase64(buffer) {
        const bytes = new Uint8Array(buffer);
        let binary = "";
        for (let i = 0; i < bytes.length; i++) {
          binary += String.fromCharCode(bytes[i]);
        }
        return btoa(binary);
      }
      /** Get MIME type from file extension. */
      getMimeType(ext) {
        return MIME_TYPES[ext.toLowerCase()] ?? "application/octet-stream";
      }
      // ---- Helpers ----
      getDataviewAPI() {
        const plugins = this.app.plugins;
        const pluginRegistry = plugins?.plugins;
        const dvPlugin = pluginRegistry?.["dataview"];
        return dvPlugin?.api ?? null;
      }
      async waitForPostProcessors() {
        await new Promise((r) => window.setTimeout(r, 50));
        await new Promise((r) => window.requestAnimationFrame(r));
        await new Promise((r) => window.setTimeout(r, 50));
        await new Promise((r) => window.requestAnimationFrame(r));
      }
      dataviewResultToText(result) {
        if (!result) return "";
        const r = result;
        if (Array.isArray(r.values)) {
          const headers = r.headers ?? [];
          const rows = r.values;
          const lines = [headers.join("	")];
          for (const row of rows) {
            lines.push(row.map((v) => String(v ?? "")).join("	"));
          }
          return lines.join("\n");
        }
        return JSON.stringify(result, null, 2);
      }
      escapeHtml(str) {
        return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      }
    };
  }
});

// src/main.ts
var main_exports = {};
__export(main_exports, {
  default: () => RenderApiPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian3 = require("obsidian");

// src/services/apiService.ts
var http = __toESM(require("node:http"));

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
          tools: ctx.tools.map((t2) => ({
            name: t2.name,
            description: t2.description,
            inputSchema: t2.inputSchema
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
      const tool = ctx.tools.find((t2) => t2.name === params.name);
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

// src/services/apiService.ts
var ApiServer = class {
  constructor(plugin) {
    this.plugin = plugin;
    this.server = null;
    this.port = 27123;
    // SSE state: active SSE response streams for MCP transport
    this.sseClients = /* @__PURE__ */ new Set();
  }
  get isRunning() {
    return this.server !== null && this.server.listening;
  }
  get address() {
    return `http://localhost:${this.port}`;
  }
  /** Start the HTTP server on the configured port */
  start(port) {
    return new Promise((resolve, reject) => {
      if (this.server?.listening) {
        this.plugin.debugLog("[Render API] ApiServer.start() called but already listening");
        resolve();
        return;
      }
      this.port = port ?? this.plugin.settings.serverPort;
      this.plugin.debugLog("[Render API] ApiServer creating HTTP server on port", this.port);
      this.server = http.createServer((req, res) => {
        this.handleRequest(req, res).catch(() => {
          this.sendJson(res, 500, { success: false, error: "Internal server error" });
        });
      });
      this.server.on("error", (err) => {
        this.plugin.debugLog("[Render API] HTTP server error: " + err.code + " " + err.message);
        if (err.code === "EADDRINUSE") {
          this.server = null;
          reject(new Error(`Port ${this.port} is in use`));
        } else {
          reject(err);
        }
      });
      this.server.listen(this.port, "0.0.0.0", () => {
        const addr = this.server?.address();
        if (addr && typeof addr === "object") {
          this.port = addr.port;
        }
        this.plugin.debugLog("[Render API] HTTP server listening on 0.0.0.0:" + this.port);
        this.plugin.debugLog("[Render API] Server started on port " + this.port);
        resolve();
      });
    });
  }
  /** Stop the HTTP server */
  stop() {
    return new Promise((resolve) => {
      for (const client of this.sseClients) {
        client.end();
      }
      this.sseClients.clear();
      if (!this.server?.listening) {
        resolve();
        return;
      }
      this.server.close(() => {
        this.plugin.debugLog("[Render API] Server stopped");
        this.server = null;
        resolve();
      });
    });
  }
  // ---- Request routing ----
  async handleRequest(req, res) {
    if (req.method !== "GET" || req.url !== "/mcp") {
      if (!this.checkAuth(req)) {
        this.sendJson(res, 401, { success: false, error: "Unauthorized" });
        return;
      }
    }
    this.setCorsHeaders(res);
    if (req.method === "OPTIONS") {
      res.writeHead(204);
      res.end();
      return;
    }
    const rawUrl = req.url ?? "/";
    const host = req.headers.host ?? "localhost";
    const url = new URL(rawUrl, `http://${host}`);
    const path = url.pathname;
    try {
      if (path === "/health" || path === "/") {
        return this.handleHealth(res);
      }
      if (path === "/render" && req.method === "POST") {
        return await this.handleRender(req, res);
      }
      if (path === "/render/dataview" && req.method === "POST") {
        return await this.handleDataview(req, res);
      }
      if (path === "/render/file" && (req.method === "GET" || req.method === "POST")) {
        return await this.handleFileRender(req, res, url);
      }
      if (path === "/settings" && req.method === "POST") {
        if (!this.plugin.settings.enableSettingsEndpoint) {
          this.sendJson(res, 403, { success: false, error: "Settings endpoint is disabled" });
          return;
        }
        return await this.handleUpdateSettings(req, res);
      }
      if (path === "/reload" && (req.method === "POST" || req.method === "GET")) {
        if (!this.plugin.settings.enableMcpReloadPlugin) {
          this.sendJson(res, 403, { success: false, error: "Reload plugin is disabled" });
          return;
        }
        return await this.handleReload(req, res, url);
      }
      if (path === "/mcp" && req.method === "GET") {
        return this.handleMcpSse(res);
      }
      if (path === "/mcp" && req.method === "POST") {
        return await this.handleMcpStreamableHttp(req, res);
      }
      if (path === "/mcp/message" && req.method === "POST") {
        return await this.handleMcpMessage(req, res);
      }
      this.sendJson(res, 404, { success: false, error: "Not found" });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.plugin.debugLog("[Render API] Request error", msg);
      this.sendJson(res, 500, { success: false, error: "Internal server error" });
    }
  }
  // ---- Health ----
  async handleHealth(res) {
    const app = this.plugin.app;
    const plugins = app.plugins;
    const pluginRegistry = plugins?.plugins;
    const dvAvailable = Boolean(pluginRegistry?.["dataview"]);
    this.sendJson(res, 200, {
      status: "running",
      port: this.port,
      dataviewAvailable: dvAvailable,
      version: this.plugin.manifest.version
    });
  }
  // ---- Render endpoints ----
  async handleRender(req, res) {
    const body = await this.readBody(req);
    let renderReq;
    try {
      renderReq = JSON.parse(body);
    } catch {
      this.sendJson(res, 400, { success: false, error: "Invalid JSON body" });
      return;
    }
    const { RenderService: RenderService2 } = await Promise.resolve().then(() => (init_renderService(), renderService_exports));
    const renderService = new RenderService2(
      this.plugin.app,
      this.plugin._component,
      this.plugin.settings.debugLogEnabled,
      this.plugin.settings.debugLogFile
    );
    const result = await renderService.render({
      ...renderReq,
      inlineImages: renderReq.inlineImages ?? this.plugin.settings.inlineImages
    });
    this.sendJson(res, result.success ? 200 : 400, toJsonObject(result));
  }
  async handleDataview(req, res) {
    const body = await this.readBody(req);
    let parsed;
    try {
      parsed = JSON.parse(body);
    } catch {
      this.sendJson(res, 400, { success: false, error: "Invalid JSON body" });
      return;
    }
    const { RenderService: RenderService2 } = await Promise.resolve().then(() => (init_renderService(), renderService_exports));
    const renderService = new RenderService2(
      this.plugin.app,
      this.plugin._component,
      this.plugin.settings.debugLogEnabled,
      this.plugin.settings.debugLogFile
    );
    const result = await renderService.render({
      query: parsed.query,
      code: parsed.code,
      format: parsed.format
    });
    this.sendJson(res, result.success ? 200 : 400, toJsonObject(result));
  }
  async handleFileRender(req, res, url) {
    let filePath;
    let format;
    let inlineImages;
    if (req.method === "GET") {
      filePath = url.searchParams.get("path") ?? "";
      const f = url.searchParams.get("format");
      format = f === "html" || f === "text" || f === "json" ? f : void 0;
      const ii = url.searchParams.get("inlineImages");
      inlineImages = ii !== null ? ii === "true" : void 0;
    } else {
      const body = await this.readBody(req);
      try {
        const parsed = JSON.parse(body);
        filePath = parsed.filePath ?? "";
        const f = parsed.format;
        format = f === "html" || f === "text" || f === "json" ? f : void 0;
        inlineImages = parsed.inlineImages;
      } catch {
        this.sendJson(res, 400, { success: false, error: "Invalid JSON body" });
        return;
      }
    }
    if (!filePath) {
      this.sendJson(res, 400, { success: false, error: "filePath is required" });
      return;
    }
    const { RenderService: RenderService2 } = await Promise.resolve().then(() => (init_renderService(), renderService_exports));
    const renderService = new RenderService2(
      this.plugin.app,
      this.plugin._component,
      this.plugin.settings.debugLogEnabled,
      this.plugin.settings.debugLogFile
    );
    const result = await renderService.render({ filePath, format, inlineImages: inlineImages ?? this.plugin.settings.inlineImages });
    this.sendJson(res, result.success ? 200 : 400, toJsonObject(result));
  }
  /**
   * POST /settings — update plugin settings in real-time (no reload needed).
   * Accepts partial settings, merges with current, persists via saveSettings().
   */
  async handleUpdateSettings(req, res) {
    const body = await this.readBody(req);
    let updates;
    try {
      updates = JSON.parse(body);
    } catch {
      this.sendJson(res, 400, { success: false, error: "Invalid JSON body" });
      return;
    }
    for (const [key, value] of Object.entries(updates)) {
      if (key in this.plugin.settings) {
        this.plugin.settings[key] = value;
      }
    }
    await this.plugin.saveSettings();
    this.plugin.debugLog("[Render API] Settings updated:", JSON.stringify(updates));
    this.sendJson(res, 200, {
      success: true,
      updated: updates,
      settings: this.plugin.settings
    });
  }
  /**
   * GET/POST /reload — reload plugin(s).
   * ?pluginId=others reloads all other plugins.
   * ?pluginId=xxx reloads a specific plugin.
   * Omit to reload render-api itself.
   */
  async handleReload(req, res, url) {
    let pluginId;
    if (req.method === "GET") {
      pluginId = url.searchParams.get("pluginId") ?? "";
    } else {
      const body = await this.readBody(req);
      try {
        const parsed = JSON.parse(body);
        pluginId = parsed.pluginId ?? "";
      } catch {
        pluginId = "";
      }
    }
    const plugins = this.plugin.app.plugins;
    if (pluginId === "others") {
      const ids = Object.keys(plugins.plugins).filter((id) => id !== this.plugin.manifest.id);
      ids.forEach((id) => {
        try {
          plugins.disablePlugin(id);
        } catch {
        }
        try {
          plugins.enablePlugin(id);
        } catch {
        }
      });
      this.sendJson(res, 200, { success: true, message: `Reloaded ${ids.length} plugin(s)` });
    } else {
      const target = pluginId || this.plugin.manifest.id;
      window.setTimeout(() => {
        plugins.disablePlugin(target);
        window.setTimeout(() => plugins.enablePlugin(target), 200);
      }, 100);
      this.sendJson(res, 200, { success: true, message: `Reloading plugin: ${target}...` });
    }
  }
  // ---- MCP SSE Transport ----
  /**
   * GET /mcp — SSE endpoint.
   * Keeps connection open, streams MCP events to the client.
   */
  handleMcpSse(res) {
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
      "X-Accel-Buffering": "no"
    });
    this.sseWrite(res, "endpoint", "/mcp/message");
    this.sseClients.add(res);
    this.plugin.debugLog("[Render API] SSE client connected");
    res.on("close", () => {
      this.sseClients.delete(res);
      this.plugin.debugLog("[Render API] SSE client disconnected");
    });
  }
  /**
   * POST /mcp/message — receives JSON-RPC messages from MCP clients.
   * Processes them and sends responses back via the SSE stream.
   */
  async handleMcpMessage(req, res) {
    const sseClient = this.sseClients.values().next().value;
    if (!sseClient) {
      this.sendJson(res, 503, {
        success: false,
        error: "No SSE connection established. Open GET /mcp first."
      });
      return;
    }
    const body = await this.readBody(req);
    let jsonRpcReq;
    try {
      jsonRpcReq = JSON.parse(body);
    } catch {
      this.sendJson(res, 400, { success: false, error: "Invalid JSON-RPC body" });
      return;
    }
    this.sendJson(res, 202, { accepted: true });
    const sseWriter = (response) => {
      this.sseWrite(sseClient, "message", JSON.stringify(response));
    };
    const renderTools = await this.buildSseToolHandlers();
    handleMcpRequest(jsonRpcReq, { tools: renderTools }, sseWriter);
  }
  /**
   * POST /mcp — Streamable HTTP transport.
   * Processes JSON-RPC requests directly and returns responses inline.
   * Used by Hermes Agent's Streamable HTTP MCP client.
   */
  async handleMcpStreamableHttp(req, res) {
    const body = await this.readBody(req);
    let jsonRpcReq;
    try {
      jsonRpcReq = JSON.parse(body);
    } catch {
      this.sendJson(res, 400, { success: false, error: "Invalid JSON-RPC body" });
      return;
    }
    this.plugin.debugLog("[Render API] handleMcpStreamableHttp request:", JSON.stringify(jsonRpcReq));
    if (jsonRpcReq.id === void 0) {
      res.writeHead(202);
      res.end();
      return;
    }
    const tools = await this.buildSseToolHandlers();
    const response = await new Promise((resolve) => {
      const writer = (response2) => resolve(response2);
      handleMcpRequest(jsonRpcReq, { tools }, writer);
    });
    this.sendJson(res, 200, response);
  }
  /** Write an SSE event to a client response stream. */
  sseWrite(res, event, data) {
    res.write(`event: ${event}
data: ${data}

`);
  }
  /**
   * Build MCP tool handlers for SSE mode.
   * These call RenderService directly instead of going through HTTP.
   */
  async buildSseToolHandlers() {
    const { RenderService: RenderService2 } = await Promise.resolve().then(() => (init_renderService(), renderService_exports));
    const renderService = new RenderService2(
      this.plugin.app,
      this.plugin._component,
      this.plugin.settings.debugLogEnabled,
      this.plugin.settings.debugLogFile
    );
    const defaultInlineImages = this.plugin.settings.inlineImages;
    const handlerMap = {
      health: async () => {
        const app = this.plugin.app;
        const plugins = app.plugins;
        const pluginRegistry = plugins?.plugins;
        const dvAvailable = Boolean(pluginRegistry?.["dataview"]);
        return {
          status: "running",
          port: this.port,
          dataviewAvailable: dvAvailable,
          version: this.plugin.manifest.version
        };
      },
      render_markdown: async (args_) => {
        const result = await renderService.render({
          content: String(args_.content ?? ""),
          sourcePath: args_.sourcePath ? String(args_.sourcePath) : void 0,
          format: args_.format ?? "html",
          inlineImages: args_.inlineImages !== void 0 ? args_.inlineImages === true : defaultInlineImages
        });
        return result;
      },
      render_file: async (args_) => {
        this.plugin.debugLog("[Render API] render_file handler called with args_:", JSON.stringify(args_));
        const renderReq = {
          filePath: String(args_.filePath ?? ""),
          format: args_.format ?? "html",
          inlineImages: args_.inlineImages !== void 0 ? args_.inlineImages === true : defaultInlineImages
        };
        this.plugin.debugLog("[Render API] render_file constructed request:", JSON.stringify(renderReq));
        const result = await renderService.render(renderReq);
        this.plugin.debugLog("[Render API] render_file result:", JSON.stringify(result));
        return result;
      },
      dataview_query: async (args_) => {
        const result = await renderService.render({
          query: String(args_.query ?? ""),
          format: args_.format ?? "json"
        });
        return result;
      },
      dataviewjs: async (args_) => {
        const result = await renderService.render({
          code: String(args_.code ?? ""),
          format: args_.format ?? "text"
        });
        return result;
      },
      reload_plugin: async (args_) => {
        const plugins = this.plugin.app.plugins;
        const raw = args_.pluginId ? String(args_.pluginId) : "";
        if (raw === "others") {
          const ids = Object.keys(plugins.plugins).filter((id) => id !== this.plugin.manifest.id);
          this.plugin.debugLog(`[Render API] reload_plugin all: ${ids.length} plugins`);
          ids.forEach((id) => {
            try {
              plugins.disablePlugin(id);
            } catch {
            }
            try {
              plugins.enablePlugin(id);
            } catch {
            }
          });
          return { success: true, message: `Reloaded ${ids.length} plugin(s)` };
        }
        const pluginId = raw || this.plugin.manifest.id;
        const msg = `Reloading plugin: ${pluginId}...`;
        this.plugin.debugLog(`[Render API] reload_plugin called for: ${pluginId}`);
        window.setTimeout(() => {
          plugins.disablePlugin(pluginId);
          window.setTimeout(() => {
            plugins.enablePlugin(pluginId);
            this.plugin.debugLog(`[Render API] reload_plugin completed for: ${pluginId}`);
          }, 200);
        }, 100);
        return { success: true, message: msg };
      }
    };
    const enabledMetas = TOOL_METAS.filter((meta) => {
      if (meta.name === "reload_plugin" && !this.plugin.settings.enableMcpReloadPlugin) return false;
      return true;
    });
    return enabledMetas.map((meta) => ({
      ...meta,
      handler: handlerMap[meta.name] ?? (async () => ({ error: "Unknown tool" }))
    }));
  }
  // ---- Helpers ----
  checkAuth(req) {
    const apiKey = this.plugin.settings.apiKey;
    if (!apiKey) return true;
    const header = req.headers["x-api-key"];
    return typeof header === "string" && header === apiKey;
  }
  setCorsHeaders(res) {
    const origin = "*";
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, X-API-Key");
  }
  sendJson(res, status, data) {
    const body = JSON.stringify(data, null, 2);
    res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
    res.end(body);
  }
  readBody(req) {
    return new Promise((resolve, reject) => {
      const chunks = [];
      req.on("data", (chunk) => chunks.push(chunk));
      req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
      req.on("error", reject);
    });
  }
};
function toJsonObject(result) {
  return {
    success: result.success,
    data: result.data ?? null,
    html: result.html ?? null,
    text: result.text ?? null,
    error: result.error ?? null,
    mimeType: result.mimeType ?? null
  };
}

// src/main.ts
init_renderService();

// src/views/RenderApiSettingTab.ts
var import_obsidian2 = require("obsidian");

// src/types.ts
var DEFAULT_SETTINGS = {
  serverPort: 27123,
  enableServerOnStart: false,
  apiKey: "",
  language: "zh",
  mcpTransport: "stdio",
  /** Whether to inline app:// images as base64 data URIs globally. false = output filesystem paths (better for MCP tools). Per-request inlineImages overrides this. */
  inlineImages: false,
  debugLogEnabled: false,
  /** Vault-relative path for debug log output as .md file. Empty = disabled. */
  debugLogFile: "",
  /** Whether to show the reload_plugin MCP tool (disabled by default for safety). */
  enableMcpReloadPlugin: false,
  /** Enable remote configuration via POST /settings (disabled by default for safety). */
  enableSettingsEndpoint: false
};

// src/i18n.ts
var strings = {
  "plugin.name": { zh: "Render API", en: "Render API" },
  "setting.serverPort": { zh: "\u670D\u52A1\u5668\u7AEF\u53E3", en: "Server Port" },
  "setting.serverPort.desc": { zh: "REST API \u670D\u52A1\u76D1\u542C\u7AEF\u53E3", en: "REST API server listen port" },
  "setting.enableServerOnStart": { zh: "\u542F\u52A8\u65F6\u5F00\u542F\u670D\u52A1", en: "Start Server on Launch" },
  "setting.enableServerOnStart.desc": { zh: "Obsidian \u542F\u52A8\u65F6\u81EA\u52A8\u542F\u52A8 API \u670D\u52A1", en: "Auto-start the API server when Obsidian launches" },
  "setting.apiKey": { zh: "API \u5BC6\u94A5", en: "API Key" },
  "setting.apiKey.desc": { zh: "\u7559\u7A7A\u5219\u65E0\u9700\u8BA4\u8BC1\u3002\u8BBE\u7F6E\u540E\u8BF7\u6C42\u9700\u5E26 X-API-Key \u5934", en: "Leave empty for no auth. When set, requests need X-API-Key header" },
  "setting.apiKey.generate": { zh: "\u751F\u6210", en: "Generate" },
  "setting.apiKey.generate.desc": { zh: "\u751F\u6210 64 \u4F4D\u968F\u673A\u5341\u516D\u8FDB\u5236\u5BC6\u94A5\u5E76\u81EA\u52A8\u586B\u5165", en: "Generate a random 64-character hex key and fill it in" },
  "setting.apiKey.autoGenerate": { zh: "\u81EA\u52A8\u751F\u6210\u5BC6\u94A5", en: "Auto Generate Key" },
  "setting.language": { zh: "\u754C\u9762\u8BED\u8A00", en: "Language" },
  "setting.language.desc": { zh: "\u63D2\u4EF6\u754C\u9762\u8BED\u8A00\uFF08\u9ED8\u8BA4\u8DDF\u968F Obsidian \u7CFB\u7EDF\u8BED\u8A00\uFF09", en: "Plugin UI language (defaults to Obsidian system language)" },
  "group.server": { zh: "\u670D\u52A1\u5668", en: "Server" },
  "group.rendering": { zh: "\u6E32\u67D3", en: "Rendering" },
  "group.debug": { zh: "\u8C03\u8BD5", en: "Debug" },
  "setting.inlineImages": { zh: "\u56FE\u7247\u5185\u8054", en: "Inline Images" },
  "setting.inlineImages.desc": { zh: "\u5C06\u56FE\u7247\u8F6C\u6362\u4E3A base64 data URI \u5D4C\u5165 HTML\u3002\u5173\u95ED\u53EF\u52A0\u5FEB\u54CD\u5E94\u3001\u51CF\u5C11\u4F53\u79EF", en: "Convert images to base64 data URIs in rendered HTML. Disable for faster responses without image data." },
  "setting.debugLogEnabled": { zh: "\u8C03\u8BD5\u65E5\u5FD7", en: "Debug Logging" },
  "setting.debugLogEnabled.desc": { zh: "\u5728 Obsidian \u5F00\u53D1\u8005\u63A7\u5236\u53F0\uFF08Ctrl+Shift+I\uFF09\u8F93\u51FA\u8BE6\u7EC6\u8C03\u8BD5\u65E5\u5FD7", en: "Enable verbose debug logs in Obsidian Developer Console (Ctrl+Shift+I) to troubleshoot rendering issues." },
  "setting.debugLogFile": { zh: "\u8C03\u8BD5\u65E5\u5FD7\u6587\u4EF6", en: "Debug Log File" },
  "setting.debugLogFile.desc": { zh: "Vault \u76F8\u5BF9\u8DEF\u5F84\uFF0C\u8C03\u8BD5\u65E5\u5FD7\u4F1A\u5199\u5165\u8BE5 .md \u6587\u4EF6\uFF08\u7559\u7A7A\u4EC5\u8F93\u51FA\u5230\u63A7\u5236\u53F0\uFF09", en: "Vault-relative path for debug log .md output (empty = console only)." },
  "setting.enableSettingsEndpoint": { zh: "\u542F\u7528\u8FDC\u7A0B\u914D\u7F6E MCP \u5DE5\u5177", en: "Enable /settings Remote Config" },
  "setting.enableSettingsEndpoint.desc": { zh: "\u5141\u8BB8\u901A\u8FC7 POST /settings \u8FDC\u7A0B\u4FEE\u6539\u63D2\u4EF6\u914D\u7F6E\uFF08\u9ED8\u8BA4\u5173\u95ED\uFF0C\u5EFA\u8BAE\u4EC5\u8C03\u8BD5\u65F6\u5F00\u542F\uFF09", en: "Allow remote configuration via POST /settings (off by default, recommended for debug only)" },
  "setting.enableMcpReloadPlugin": { zh: "\u542F\u7528\u91CD\u8F7D\u63D2\u4EF6 MCP \u5DE5\u5177", en: "Enable reload_plugin MCP Tool" },
  "setting.enableMcpReloadPlugin.desc": { zh: "\u901A\u8FC7 MCP \u66B4\u9732 reload_plugin \u5DE5\u5177\uFF08\u7981\u7528\u5E76\u91CD\u65B0\u542F\u7528\u63D2\u4EF6\u4EE5\u52A0\u8F7D\u4EE3\u7801\u53D8\u66F4\uFF09\u3002\u9ED8\u8BA4\u5173\u95ED\u4EE5\u4FDD\u5B89\u5168\u3002", en: "Expose the reload_plugin tool via MCP (disables & re-enables the plugin, picking up code changes). Disabled by default for safety." },
  "setting.serverStatus": { zh: "\u670D\u52A1\u5668\u72B6\u6001", en: "Server Status" },
  "setting.mcpTransport": { zh: "MCP \u4F20\u8F93\u6A21\u5F0F", en: "MCP Transport" },
  "setting.mcpTransport.desc": { zh: "stdio\uFF1A\u72EC\u7ACB\u5B50\u8FDB\u7A0B\uFF08\u9ED8\u8BA4\uFF0C\u5411\u540E\u517C\u5BB9\uFF09\uFF1BURL\uFF1A\u5185\u5D4C\u5230 HTTP \u670D\u52A1\uFF08\u65E0\u9700\u989D\u5916\u8FDB\u7A0B\uFF0C\u914D\u7F6E\u66F4\u7B80\u5355\uFF09", en: "stdio: standalone subprocess (default, backward compatible). URL: embedded in HTTP server (no extra process, simpler config)" },
  "setting.configuration": { zh: "\u914D\u7F6E", en: "Configuration" },
  "setting.mcpServer": { zh: "MCP \u670D\u52A1\u5668", en: "MCP Server" },
  "setting.availableTools": { zh: "\u53EF\u7528\u5DE5\u5177", en: "Available Tools" },
  "setting.configFor": { zh: "\u914D\u7F6E\u751F\u6210\u76EE\u6807", en: "Configuration for" },
  "setting.configFor.desc": { zh: "\u9009\u62E9 AI \u5DE5\u5177\u4EE5\u663E\u793A\u5BF9\u5E94\u7684 MCP \u914D\u7F6E", en: "Select an AI tool to show its MCP configuration" },
  "setting.runningEnv": { zh: "\u8FD0\u884C\u73AF\u5883", en: "Running Environment" },
  "setting.runningEnv.desc": { zh: "Hermes/Claude \u8FD0\u884C\u5728 Windows \u539F\u751F\u73AF\u5883\u8FD8\u662F WSL", en: "Where Hermes/Claude runs: Windows native or WSL" },
  "setting.wslGatewayIp": { zh: "WSL \u7F51\u5173 IP", en: "WSL Gateway IP" },
  "setting.wslGatewayIp.desc": { zh: "\u5728 WSL \u4E2D\u8FD0\u884C `ip route | grep default` \u83B7\u53D6\u7F51\u5173 IP\uFF0C\u6216\u70B9\u51FB\u68C0\u6D4B", en: "Run `ip route | grep default` in WSL to find your gateway IP, or click Detect" },
  "env.windows": { zh: "Windows", en: "Windows" },
  "env.wsl": { zh: "WSL", en: "WSL" },
  "agent.hermes": { zh: "Hermes Agent", en: "Hermes Agent" },
  "agent.claude": { zh: "Claude Desktop", en: "Claude Desktop" },
  "server.running": { zh: "\u8FD0\u884C\u4E2D", en: "Running" },
  "server.stopped": { zh: "\u5DF2\u505C\u6B62", en: "Stopped" },
  "server.start": { zh: "\u542F\u52A8\u670D\u52A1", en: "Start Server" },
  "server.stop": { zh: "\u505C\u6B62\u670D\u52A1", en: "Stop Server" },
  "server.runningOn": { zh: "\u8FD0\u884C\u5728 {addr}", en: "Running on {addr}" },
  "server.portUnavailable": { zh: "\u7AEF\u53E3 {port} \u88AB\u5360\u7528\uFF0C\u8BF7\u66F4\u6362\u7AEF\u53E3", en: "Port {port} is in use, please change port" },
  "server.startError": { zh: "\u542F\u52A8\u670D\u52A1\u5668\u5931\u8D25\uFF1A{error}", en: "Failed to start server: {error}" },
  "cmd.startServer": { zh: "\u542F\u52A8 Render API \u670D\u52A1", en: "Start Render API Server" },
  "cmd.stopServer": { zh: "\u505C\u6B62 Render API \u670D\u52A1", en: "Stop Render API Server" },
  "cmd.openSettings": { zh: "\u6253\u5F00 Render API \u8BBE\u7F6E", en: "Open Render API Settings" },
  "render.dataviewDisabled": { zh: "Dataview \u63D2\u4EF6\u672A\u542F\u7528\u6216\u672A\u5B89\u88C5", en: "Dataview plugin not enabled or not installed" },
  "render.queryError": { zh: "\u67E5\u8BE2\u6267\u884C\u5931\u8D25\uFF1A{error}", en: "Query execution failed: {error}" },
  "render.fileNotFound": { zh: "\u6587\u4EF6\u672A\u627E\u5230\uFF1A{path}", en: "File not found: {path}" },
  "render.renderError": { zh: "\u6E32\u67D3\u5931\u8D25\uFF1A{error}", en: "Render failed: {error}" },
  "tool.health": { zh: "\u68C0\u67E5\u670D\u52A1\u5668\u8FD0\u884C\u72B6\u6001", en: "Check server status" },
  "tool.render_markdown": { zh: "\u6E32\u67D3 Markdown \u5185\u5BB9", en: "Render markdown content" },
  "tool.render_file": { zh: "\u6309\u8DEF\u5F84\u6E32\u67D3 Vault \u5185\u6587\u4EF6", en: "Render a vault file by path" },
  "tool.dataview_query": { zh: "\u6267\u884C Dataview DQL \u67E5\u8BE2", en: "Execute Dataview DQL queries" },
  "tool.dataviewjs": { zh: "\u6267\u884C DataviewJS \u4EE3\u7801", en: "Execute DataviewJS code" },
  "tool.reload_plugin": { zh: "\u91CD\u8F7D\u63D2\u4EF6", en: "reload_plugin" },
  "tool.settings": { zh: "\u8FDC\u7A0B\u914D\u7F6E\uFF0C\u7AEF\u53E3/\u8BED\u8A00/\u65E5\u5FD7/\u5F00\u5173\u7B49", en: "settings \u2014 port/language/log/toggles" },
  "mcp.configHermes": { zh: "Hermes Agent \u914D\u7F6E", en: "Configuration for Hermes Agent" },
  "mcp.configClaude": { zh: "Claude Desktop \u914D\u7F6E", en: "Configuration for Claude Desktop" },
  "mcp.hermesDesc.wsl": { zh: "Streamable HTTP\uFF08WSL\uFF1A\u9700\u4F7F\u7528 --noproxy * \u7ED5\u8FC7\u4EE3\u7406\uFF09\u2014 \u6DFB\u52A0\u5230 ~/.hermes/config.yaml", en: "Streamable HTTP (WSL: use --noproxy * to bypass proxy) \u2014 Add to ~/.hermes/config.yaml" },
  "mcp.hermesDesc.windows": { zh: "Streamable HTTP \u2014 \u6DFB\u52A0\u5230 ~/.hermes/config.yaml", en: "Streamable HTTP \u2014 Add to ~/.hermes/config.yaml" },
  "mcp.claudeDesc.wsl": { zh: "Streamable HTTP\uFF08WSL\uFF1A\u8BBE\u7F6E no_proxy \u73AF\u5883\u53D8\u91CF\u6216\u4F7F\u7528 --noproxy\uFF09\u2014 \u6DFB\u52A0\u5230 claude_desktop_config.json", en: "Streamable HTTP (WSL: set no_proxy env or use --noproxy) \u2014 Add to claude_desktop_config.json" },
  "mcp.claudeDesc.windows": { zh: "Streamable HTTP \u2014 \u6DFB\u52A0\u5230 claude_desktop_config.json", en: "Streamable HTTP \u2014 Add to claude_desktop_config.json" },
  "mcp.hermesStdioDesc": { zh: "\u6DFB\u52A0\u5230 ~/.hermes/config.yaml", en: "Add to ~/.hermes/config.yaml" },
  "mcp.claudeStdioDesc": { zh: "\u6DFB\u52A0\u5230 claude_desktop_config.json", en: "Add to claude_desktop_config.json" },
  "mcp.detectFailed": { zh: "\u65E0\u6CD5\u81EA\u52A8\u68C0\u6D4B WSL \u7F51\u5173 IP\u3002\u8BF7\u5728 WSL \u4E2D\u8FD0\u884C `ip route | grep default` \u624B\u52A8\u67E5\u627E\u3002", en: "Could not detect WSL gateway IP. Run `ip route | grep default` in WSL." },
  "mcp.detect": { zh: "\u68C0\u6D4B", en: "Detect" },
  "copy": { zh: "\u590D\u5236", en: "Copy" },
  "copied": { zh: "\u5DF2\u590D\u5236", en: "Copied!" }
};
function t(key, lang = "zh") {
  return strings[key]?.[lang] ?? key;
}
function detectLanguage() {
  try {
    const doc = window?.activeDocument;
    if (!doc) return "en";
    const docLang = doc.documentElement.lang?.toLowerCase() ?? "";
    if (docLang.startsWith("zh")) return "zh";
    const momentLang = typeof window !== "undefined" ? window.moment?.locale?.() : void 0;
    if (momentLang?.startsWith("zh")) return "zh";
    return "en";
  } catch {
    return "zh";
  }
}

// src/views/RenderApiSettingTab.ts
var os = __toESM(require("node:os"));
var RenderApiSettingTab = class extends import_obsidian2.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
    this.selectedAgent = "hermes";
    this.selectedEnv = "windows";
    this.wslGatewayIp = "";
  }
  /** Shorthand for t(key, lang). */
  tt(key) {
    return t(key, this.plugin.settings.language);
  }
  /** Append default value hint for a setting key when it differs from default. */
  defHint(key) {
    const lang = this.plugin.settings.language;
    const current = this.plugin.settings[key];
    const def = DEFAULT_SETTINGS[key];
    if (current === def) return "";
    const label = lang === "zh" ? " (\u9ED8\u8BA4: " : " (default: ";
    if (key === "language") {
      const sysHint = lang === "zh" ? "\u8DDF\u968FObsidian" : "Follow Obsidian";
      return label + sysHint + ")";
    }
    const val = typeof def === "string" && !def ? `""` : String(def);
    return label + val + ")";
  }
  addCodeBlock(container, text, cls) {
    const wrapper = container.createEl("div", { cls: "render-api-code-wrapper" });
    const pre = wrapper.createEl("pre", { cls });
    pre.createEl("code", { text });
    const copyBtn = wrapper.createEl("button", {
      cls: "render-api-copy-btn",
      text: this.tt("copy")
    });
    copyBtn.addEventListener("click", () => {
      void (async () => {
        try {
          await navigator.clipboard.writeText(text);
          copyBtn.setText(this.tt("copied"));
          window.setTimeout(() => {
            copyBtn.setText(this.tt("copy"));
          }, 2e3);
        } catch {
          const range = activeDocument.createRange();
          range.selectNodeContents(pre);
          const sel = window.getSelection();
          if (sel) {
            sel.removeAllRanges();
            sel.addRange(range);
          }
          copyBtn.setText(this.tt("copied"));
          window.setTimeout(() => {
            copyBtn.setText(this.tt("copy"));
          }, 2e3);
        }
      })();
    });
  }
  /** Auto-detect the WSL gateway IP from Windows network interfaces. */
  detectWslGatewayIp() {
    try {
      const interfaces = os.networkInterfaces();
      for (const [name, addrs] of Object.entries(interfaces)) {
        if (!addrs) continue;
        if (name.toLowerCase().includes("wsl")) {
          for (const addr of addrs) {
            if (addr.family === "IPv4" && !addr.internal) {
              return addr.address;
            }
          }
        }
      }
      for (const [, addrs] of Object.entries(interfaces)) {
        if (!addrs) continue;
        for (const addr of addrs) {
          if (addr.family === "IPv4" && addr.address.startsWith("172.") && !addr.internal) {
            return addr.address;
          }
        }
      }
    } catch {
    }
    return null;
  }
  /** Return YAML header lines for API key, or empty array if no key set. */
  apiKeyHeaderYaml() {
    const key = this.plugin.settings.apiKey;
    if (!key) return [];
    return ["    headers:", `      X-API-Key: ${key}`];
  }
  /** Return the headers object for Claude JSON config, or undefined if no key set. */
  apiKeyHeaderClaude() {
    const key = this.plugin.settings.apiKey;
    if (!key) return void 0;
    return { "X-API-Key": key };
  }
  /** Build the settings UI into the given container element. */
  renderSettings(containerEl) {
    containerEl.empty();
    new import_obsidian2.Setting(containerEl).setName(this.tt("setting.language")).setDesc(this.tt("setting.language.desc") + this.defHint("language")).addDropdown(
      (dropdown) => dropdown.addOption("zh", "\u4E2D\u6587").addOption("en", "English").setValue(this.plugin.settings.language).onChange(async (value) => {
        this.plugin.settings.language = value;
        await this.plugin.saveSettings();
        this.renderSettings(containerEl);
      })
    );
    new import_obsidian2.Setting(containerEl).setName(this.tt("group.server")).setHeading();
    const isRunning = this.plugin.apiServer?.isRunning ?? false;
    new import_obsidian2.Setting(containerEl).setName("").setDesc(isRunning ? this.tt("server.runningOn").replace("{addr}", this.plugin.apiServer.address) : this.tt("server.stopped")).addButton((btn) => {
      btn.setButtonText(isRunning ? this.tt("server.stop") : this.tt("server.start"));
      btn.setCta();
      btn.onClick(async () => {
        if (isRunning) {
          await this.plugin.stopApiServer();
        } else {
          await this.plugin.startApiServer();
        }
        this.renderSettings(containerEl);
      });
    });
    new import_obsidian2.Setting(containerEl).setName(this.tt("setting.serverPort")).setDesc(this.tt("setting.serverPort.desc") + this.defHint("serverPort")).addText(
      (text) => text.setPlaceholder("27123").setValue(String(this.plugin.settings.serverPort)).onChange(async (value) => {
        this.plugin.settings.serverPort = parseInt(value, 10) || 27123;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(this.tt("setting.enableServerOnStart")).setDesc(this.tt("setting.enableServerOnStart.desc") + this.defHint("enableServerOnStart")).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.enableServerOnStart).onChange(async (value) => {
        this.plugin.settings.enableServerOnStart = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(this.tt("group.rendering")).setHeading();
    new import_obsidian2.Setting(containerEl).setName(this.tt("setting.inlineImages")).setDesc(this.tt("setting.inlineImages.desc") + this.defHint("inlineImages")).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.inlineImages).onChange(async (value) => {
        this.plugin.settings.inlineImages = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(this.tt("setting.mcpServer")).setHeading();
    new import_obsidian2.Setting(containerEl).setName(this.tt("setting.apiKey")).setDesc(this.tt("setting.apiKey.desc")).addText(
      (text) => text.setPlaceholder("").setValue(this.plugin.settings.apiKey).onChange(async (value) => {
        this.plugin.settings.apiKey = value;
        await this.plugin.saveSettings();
      })
    );
    new import_obsidian2.Setting(containerEl).setName(this.tt("setting.apiKey.autoGenerate")).setDesc(this.tt("setting.apiKey.generate.desc")).addButton(
      (btn) => btn.setButtonText(this.tt("setting.apiKey.generate")).setCta().onClick(async () => {
        const bytes = new Uint8Array(32);
        crypto.getRandomValues(bytes);
        const key = Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
        this.plugin.settings.apiKey = key;
        await this.plugin.saveSettings();
        this.renderSettings(containerEl);
      })
    );
    new import_obsidian2.Setting(containerEl).setName(this.tt("setting.mcpTransport")).setDesc(this.tt("setting.mcpTransport.desc") + this.defHint("mcpTransport")).addDropdown(
      (dropdown) => dropdown.addOption("stdio", "Stdio").addOption("streamable-http", "URL").setValue(this.plugin.settings.mcpTransport === "sse" ? "streamable-http" : this.plugin.settings.mcpTransport).onChange(async (value) => {
        this.plugin.settings.mcpTransport = value;
        await this.plugin.saveSettings();
        const scrollContainer = containerEl.closest(".vertical-tab-content") || containerEl.parentElement;
        const savedScroll = scrollContainer?.scrollTop ?? 0;
        this.renderSettings(containerEl);
        window.requestAnimationFrame(() => {
          if (scrollContainer) scrollContainer.scrollTop = savedScroll;
        });
      })
    );
    const transport = this.plugin.settings.mcpTransport === "sse" ? "streamable-http" : this.plugin.settings.mcpTransport;
    const mcpConfigEl = containerEl.createEl("div", { cls: "render-api-mcp-config" });
    new import_obsidian2.Setting(mcpConfigEl).setName(this.tt("setting.configFor")).setDesc(this.tt("setting.configFor.desc")).addDropdown(
      (dropdown) => dropdown.addOption("hermes", this.tt("agent.hermes")).addOption("claude", this.tt("agent.claude")).setValue(this.selectedAgent).onChange((value) => {
        this.selectedAgent = value;
        const scrollContainer = containerEl.closest(".vertical-tab-content") || containerEl.parentElement;
        const savedScroll = scrollContainer?.scrollTop ?? 0;
        this.renderSettings(containerEl);
        window.requestAnimationFrame(() => {
          if (scrollContainer) scrollContainer.scrollTop = savedScroll;
        });
      })
    );
    {
      new import_obsidian2.Setting(mcpConfigEl).setName(this.tt("setting.runningEnv")).setDesc(this.tt("setting.runningEnv.desc")).addDropdown(
        (dropdown) => dropdown.addOption("windows", this.tt("env.windows")).addOption("wsl", this.tt("env.wsl")).setValue(this.selectedEnv).onChange((value) => {
          this.selectedEnv = value;
          const scrollContainer = containerEl.closest(".vertical-tab-content") || containerEl.parentElement;
          const savedScroll = scrollContainer?.scrollTop ?? 0;
          this.renderSettings(containerEl);
          window.requestAnimationFrame(() => {
            if (scrollContainer) scrollContainer.scrollTop = savedScroll;
          });
        })
      );
      if (this.selectedEnv === "wsl" && transport !== "stdio") {
        new import_obsidian2.Setting(mcpConfigEl).setName(this.tt("setting.wslGatewayIp")).setDesc(this.tt("setting.wslGatewayIp.desc")).addText(
          (text) => text.setPlaceholder("172.17.64.1").setValue(this.wslGatewayIp).onChange((value) => {
            this.wslGatewayIp = value || "";
            const scrollContainer = containerEl.closest(".vertical-tab-content") || containerEl.parentElement;
            const savedScroll = scrollContainer?.scrollTop ?? 0;
            this.renderSettings(containerEl);
            window.requestAnimationFrame(() => {
              if (scrollContainer) scrollContainer.scrollTop = savedScroll;
            });
          })
        ).addButton(
          (btn) => btn.setButtonText(this.tt("mcp.detect")).setCta().onClick(() => {
            const ip = this.detectWslGatewayIp();
            if (ip) {
              this.wslGatewayIp = ip;
              const scrollContainer = containerEl.closest(".vertical-tab-content") || containerEl.parentElement;
              const savedScroll = scrollContainer?.scrollTop ?? 0;
              this.renderSettings(containerEl);
              window.requestAnimationFrame(() => {
                if (scrollContainer) scrollContainer.scrollTop = savedScroll;
              });
            } else {
              new import_obsidian2.Notice(this.tt("mcp.detectFailed"));
            }
          })
        );
      }
    }
    if (transport === "streamable-http") {
      const port = this.plugin.settings.serverPort;
      const host = this.selectedEnv === "wsl" ? this.wslGatewayIp || "localhost" : "localhost";
      const url = `http://${host}:${port}/mcp`;
      if (this.selectedAgent === "hermes") {
        const yaml = [
          "mcp_servers:",
          "  render-api:",
          `    url: ${url}`,
          ...this.apiKeyHeaderYaml(),
          "    enabled: true"
        ].join("\n");
        new import_obsidian2.Setting(mcpConfigEl).setName(this.tt("mcp.configHermes")).setHeading();
        mcpConfigEl.createEl("p", {
          cls: "setting-item-description",
          text: this.selectedEnv === "wsl" ? this.tt("mcp.hermesDesc.wsl") : this.tt("mcp.hermesDesc.windows")
        });
        this.addCodeBlock(mcpConfigEl, yaml, "language-yaml");
      } else {
        const claudeObj = { mcpServers: { "render-api": { url } } };
        const h = this.apiKeyHeaderClaude();
        if (h) {
          claudeObj.mcpServers["render-api"] = { url, headers: h };
        }
        const claudeJson = JSON.stringify(claudeObj, null, 2);
        new import_obsidian2.Setting(mcpConfigEl).setName(this.tt("mcp.configClaude")).setHeading();
        mcpConfigEl.createEl("p", {
          cls: "setting-item-description",
          text: this.selectedEnv === "wsl" ? this.tt("mcp.claudeDesc.wsl") : this.tt("mcp.claudeDesc.windows")
        });
        this.addCodeBlock(mcpConfigEl, claudeJson, "language-json");
      }
    } else if (transport === "stdio") {
      const adapter = this.app.vault.adapter;
      const vaultBasePath = adapter.getBasePath?.() ?? "";
      const configDir = this.app.vault.configDir;
      const fullConfigPath = (vaultBasePath ? `${vaultBasePath}/${configDir}` : configDir).replace(/\\/g, "/");
      const port = this.plugin.settings.serverPort;
      let command;
      let serverPath;
      if (this.selectedEnv === "wsl") {
        command = "/mnt/c/Program Files/nodejs/node.exe";
        serverPath = fullConfigPath.replace(/^([A-Za-z]):\//, (_match, driveLetter) => `/mnt/${driveLetter.toLowerCase()}/`);
        serverPath = `${serverPath}/plugins/render-api/mcp-server.js`;
      } else {
        command = "node";
        serverPath = `${fullConfigPath}/plugins/render-api/mcp-server.js`;
      }
      if (this.selectedAgent === "hermes") {
        const key = this.plugin.settings.apiKey;
        const hermesYaml = [
          "mcp_servers:",
          "  render-api:",
          `    command: ${command}`,
          `    args:`,
          `      - ${serverPath}`,
          `      - --port`,
          `      - ${port}`,
          ...key ? [`    env:`, `      RENDER_API_KEY: ${key}`] : [],
          "    enabled: true"
        ].join("\n");
        new import_obsidian2.Setting(mcpConfigEl).setName(this.tt("mcp.configHermes")).setHeading();
        mcpConfigEl.createEl("p", {
          cls: "setting-item-description",
          text: this.tt("mcp.hermesStdioDesc")
        });
        this.addCodeBlock(mcpConfigEl, hermesYaml, "language-yaml");
      } else {
        const claudeJson = JSON.stringify(
          {
            mcpServers: {
              "render-api": {
                command,
                args: [serverPath, "--port", String(port)]
              }
            }
          },
          null,
          2
        );
        new import_obsidian2.Setting(mcpConfigEl).setName(this.tt("mcp.configClaude")).setHeading();
        mcpConfigEl.createEl("p", {
          cls: "setting-item-description",
          text: this.tt("mcp.claudeStdioDesc")
        });
        this.addCodeBlock(mcpConfigEl, claudeJson, "language-json");
      }
    }
    new import_obsidian2.Setting(containerEl).setName(this.tt("group.debug")).setHeading();
    new import_obsidian2.Setting(containerEl).setName(this.tt("setting.debugLogEnabled")).setDesc(this.tt("setting.debugLogEnabled.desc") + this.defHint("debugLogEnabled")).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.debugLogEnabled).onChange(async (value) => {
        this.plugin.settings.debugLogEnabled = value;
        await this.plugin.saveSettings();
      })
    );
    if (this.plugin.settings.debugLogEnabled) {
      new import_obsidian2.Setting(containerEl).setName(this.tt("setting.debugLogFile")).setDesc(this.tt("setting.debugLogFile.desc") + this.defHint("debugLogFile")).addText(
        (text) => text.setPlaceholder(`${this.plugin.app.vault.configDir}/plugins/render-api/debug.md`).setValue(this.plugin.settings.debugLogFile).onChange(async (value) => {
          this.plugin.settings.debugLogFile = value;
          await this.plugin.saveSettings();
        })
      );
    }
    new import_obsidian2.Setting(containerEl).setName(this.tt("setting.enableMcpReloadPlugin")).setDesc(this.tt("setting.enableMcpReloadPlugin.desc") + this.defHint("enableMcpReloadPlugin")).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.enableMcpReloadPlugin).onChange(async (value) => {
        this.plugin.settings.enableMcpReloadPlugin = value;
        await this.plugin.saveSettings();
        const scrollContainer = containerEl.closest(".vertical-tab-content") || containerEl.parentElement;
        const savedScroll = scrollContainer?.scrollTop ?? 0;
        this.renderSettings(containerEl);
        window.requestAnimationFrame(() => {
          if (scrollContainer) scrollContainer.scrollTop = savedScroll;
        });
      })
    );
    new import_obsidian2.Setting(containerEl).setName(this.tt("setting.enableSettingsEndpoint")).setDesc(this.tt("setting.enableSettingsEndpoint.desc") + this.defHint("enableSettingsEndpoint")).addToggle(
      (toggle) => toggle.setValue(this.plugin.settings.enableSettingsEndpoint).onChange(async (value) => {
        this.plugin.settings.enableSettingsEndpoint = value;
        await this.plugin.saveSettings();
        const scrollContainer = containerEl.closest(".vertical-tab-content") || containerEl.parentElement;
        const savedScroll = scrollContainer?.scrollTop ?? 0;
        this.renderSettings(containerEl);
        window.requestAnimationFrame(() => {
          if (scrollContainer) scrollContainer.scrollTop = savedScroll;
        });
      })
    );
    new import_obsidian2.Setting(containerEl).setName(this.tt("setting.availableTools")).setHeading();
    const toolList = containerEl.createEl("ul");
    const tools = [
      { name: "health", descKey: "tool.health" },
      { name: "render_markdown", descKey: "tool.render_markdown" },
      { name: "render_file", descKey: "tool.render_file" },
      { name: "dataview_query", descKey: "tool.dataview_query" },
      { name: "dataviewjs", descKey: "tool.dataviewjs" }
    ];
    if (this.plugin.settings.enableMcpReloadPlugin) {
      tools.push({ name: "reload_plugin", descKey: "tool.reload_plugin" });
    }
    if (this.plugin.settings.enableSettingsEndpoint) {
      tools.push({ name: "settings", descKey: "tool.settings" });
    }
    for (const tDef of tools) {
      const li = toolList.createEl("li");
      li.createEl("strong", { text: tDef.name });
      li.appendText(` \u2014 ${this.tt(tDef.descKey)}`);
    }
  }
  /** Backward compatibility with Obsidian <1.13.0 — called by the framework. */
  display() {
    this.renderSettings(this.containerEl);
  }
  /** @since Obsidian 1.13.0 — preferred over display(). */
  getSettingDefinitions() {
    this.renderSettings(this.containerEl);
    return [];
  }
};

// src/main.ts
var RenderApiPlugin = class extends import_obsidian3.Plugin {
  constructor() {
    super(...arguments);
    this.apiServer = null;
    // Keep a component reference for MarkdownRenderer
    this._component = this;
  }
  async onload() {
    await this.loadSettings();
    this.debugLog("[Render API] Plugin loaded, settings:", this.settings);
    if (this.settings.mcpTransport === "stdio") {
      await this.writeMcpServerFile();
    }
    this.addCommand({
      id: "start-server",
      name: t("cmd.startServer", this.settings.language),
      callback: () => void this.startApiServer()
    });
    this.addCommand({
      id: "stop-server",
      name: t("cmd.stopServer", this.settings.language),
      callback: () => void this.stopApiServer()
    });
    this.addCommand({
      id: "open-settings",
      name: t("cmd.openSettings", this.settings.language),
      callback: () => {
        const setting = this.app.setting;
        setting.open();
        setting.openTabById("render-api");
      }
    });
    this.addSettingTab(new RenderApiSettingTab(this.app, this));
    this.debugLog("[Render API] Setting tab registered");
    if (this.settings.enableServerOnStart) {
      this.debugLog("[Render API] enableServerOnStart=true, waiting for layout ready...");
      this.app.workspace.onLayoutReady(() => {
        this.debugLog("[Render API] Layout ready, starting server...");
        void this.startApiServer();
      });
    } else {
      this.debugLog("[Render API] enableServerOnStart=false, server will not start automatically");
    }
  }
  onunload() {
    void this.stopApiServer();
    this.debugLog("[Render API] Plugin unloaded");
  }
  async loadSettings() {
    const loaded = await this.loadData();
    this.settings = Object.assign({}, DEFAULT_SETTINGS, loaded);
    if (this.settings.language === DEFAULT_SETTINGS.language) {
      this.settings.language = detectLanguage();
    }
  }
  /** Write the embedded MCP server script to the plugin directory on first load. */
  async writeMcpServerFile() {
    try {
      const pluginDir = `${this.app.vault.configDir}/plugins/render-api`;
      const adapter = this.app.vault.adapter;
      if (!await adapter.exists(pluginDir)) {
        await adapter.mkdir(pluginDir);
      }
      const targetPath = `${pluginDir}/mcp-server.js`;
      const existing = await adapter.exists(targetPath);
      if (existing) {
        const current = await adapter.read(targetPath);
        if (current === '"use strict";\nvar __create = Object.create;\nvar __defProp = Object.defineProperty;\nvar __getOwnPropDesc = Object.getOwnPropertyDescriptor;\nvar __getOwnPropNames = Object.getOwnPropertyNames;\nvar __getProtoOf = Object.getPrototypeOf;\nvar __hasOwnProp = Object.prototype.hasOwnProperty;\nvar __export = (target, all) => {\n  for (var name in all)\n    __defProp(target, name, { get: all[name], enumerable: true });\n};\nvar __copyProps = (to, from, except, desc) => {\n  if (from && typeof from === "object" || typeof from === "function") {\n    for (let key of __getOwnPropNames(from))\n      if (!__hasOwnProp.call(to, key) && key !== except)\n        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });\n  }\n  return to;\n};\nvar __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(\n  // If the importer is in node compatibility mode or this is not an ESM\n  // file that has been converted to a CommonJS file using a Babel-\n  // compatible transform (i.e. "__esModule" has not been set), then set\n  // "default" to the CommonJS "module.exports" for node compatibility.\n  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,\n  mod\n));\nvar __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);\n\n// src/mcp-server-core.ts\nvar mcp_server_core_exports = {};\n__export(mcp_server_core_exports, {\n  startMcpServer: () => startMcpServer\n});\nmodule.exports = __toCommonJS(mcp_server_core_exports);\nvar http = __toESM(require("node:http"));\nvar readline = __toESM(require("node:readline"));\nvar fs = __toESM(require("node:fs"));\n\n// src/services/mcpProtocol.ts\nvar TOOL_METAS = [\n  {\n    name: "health",\n    description: "Check if the Render API server is running and healthy",\n    inputSchema: {\n      type: "object",\n      properties: {}\n    }\n  },\n  {\n    name: "render_markdown",\n    description: "Render arbitrary markdown content through Obsidian\'s render pipeline",\n    inputSchema: {\n      type: "object",\n      properties: {\n        content: { type: "string", description: "Markdown content to render" },\n        sourcePath: { type: "string", description: "Optional vault-relative file path for resolving relative links/images in content (e.g. \'Daily/note.md\')" },\n        format: { type: "string", enum: ["html", "text", "json"], description: "Output format (default: html)" },\n        inlineImages: { type: "boolean", description: "Inline images as base64 data URIs (default: false, controlled by plugin settings). Set true to inline as base64." }\n      },\n      required: ["content"]\n    }\n  },\n  {\n    name: "render_file",\n    description: "Render a vault file by its path within the Obsidian vault",\n    inputSchema: {\n      type: "object",\n      properties: {\n        filePath: { type: "string", description: "Path to the file in the vault (e.g. \'Daily/2026-06-27.md\')" },\n        format: { type: "string", enum: ["html", "text", "json"], description: "Output format (default: html)" },\n        inlineImages: { type: "boolean", description: "Inline images as base64 data URIs (default: false, controlled by plugin settings). Set true to inline as base64." }\n      },\n      required: ["filePath"]\n    }\n  },\n  {\n    name: "dataview_query",\n    description: "Execute a Dataview DQL query and return the results",\n    inputSchema: {\n      type: "object",\n      properties: {\n        query: { type: "string", description: `Dataview DQL query (e.g. \'TABLE file.name, file.mtime FROM ""\')` },\n        format: { type: "string", enum: ["html", "text", "json"], description: "Output format (default: json)" }\n      },\n      required: ["query"]\n    }\n  },\n  {\n    name: "dataviewjs",\n    description: "Execute arbitrary dataviewjs code using the dv.* API",\n    inputSchema: {\n      type: "object",\n      properties: {\n        code: { type: "string", description: "DataviewJS code" },\n        format: { type: "string", enum: ["html", "text", "json"], description: "Output format (default: text)" }\n      },\n      required: ["code"]\n    }\n  },\n  {\n    name: "reload_plugin",\n    description: \'Reload an Obsidian plugin. Pass a pluginId to reload a specific plugin, "others" to reload all other plugins, or omit to reload render-api itself.\',\n    inputSchema: {\n      type: "object",\n      properties: {\n        pluginId: { type: "string", description: "Plugin ID to reload (e.g. \'obsidian-dataview\'). Use \'others\' to reload all other plugins. Omit to reload render-api itself." }\n      }\n    }\n  }\n];\nfunction handleMcpRequest(req, ctx, writer) {\n  const { id, method, params } = req;\n  switch (method) {\n    case "initialize": {\n      writer({\n        jsonrpc: "2.0",\n        id,\n        result: {\n          protocolVersion: "2024-11-05",\n          capabilities: { tools: {} },\n          serverInfo: {\n            name: "render-api-mcp",\n            version: "0.2.1"\n          }\n        }\n      });\n      break;\n    }\n    case "notifications/initialized":\n      break;\n    case "tools/list": {\n      writer({\n        jsonrpc: "2.0",\n        id,\n        result: {\n          tools: ctx.tools.map((t) => ({\n            name: t.name,\n            description: t.description,\n            inputSchema: t.inputSchema\n          }))\n        }\n      });\n      break;\n    }\n    case "tools/call": {\n      if (!params || typeof params.name !== "string") {\n        writer({\n          jsonrpc: "2.0",\n          id,\n          error: { code: -32602, message: "Invalid params: name is required" }\n        });\n        return;\n      }\n      const tool = ctx.tools.find((t) => t.name === params.name);\n      if (!tool) {\n        writer({\n          jsonrpc: "2.0",\n          id,\n          error: { code: -32601, message: `Tool not found: ${params.name}` }\n        });\n        return;\n      }\n      tool.handler(params.arguments ?? {}).then((result) => {\n        writer({\n          jsonrpc: "2.0",\n          id,\n          result: {\n            content: [\n              {\n                type: "text",\n                text: typeof result === "string" ? result : JSON.stringify(result, null, 2)\n              }\n            ]\n          }\n        });\n      }).catch((err) => {\n        writer({\n          jsonrpc: "2.0",\n          id,\n          error: {\n            code: -32603,\n            message: `Tool execution failed: ${err.message}`\n          }\n        });\n      });\n      break;\n    }\n    default:\n      writer({\n        jsonrpc: "2.0",\n        id,\n        error: { code: -32601, message: `Method not found: ${method}` }\n      });\n  }\n}\n\n// src/mcp-server-core.ts\nvar args = process.argv.slice(2);\nvar portIdx = args.indexOf("--port");\nvar CLI_PORT = parseInt(portIdx >= 0 ? args[portIdx + 1] : "27123", 10);\nvar hostIdx = args.indexOf("--host");\nvar HOST = hostIdx >= 0 ? args[hostIdx + 1] : "127.0.0.1";\nvar API_KEY = process.env.RENDER_API_KEY ?? "";\nvar activeBaseUrl = `http://${HOST}:${CLI_PORT}`;\nvar detectedPort = null;\nfunction apiGet(path) {\n  return new Promise((resolve, reject) => {\n    const headers = {};\n    if (API_KEY) headers["X-API-Key"] = API_KEY;\n    const req = http.request(\n      `${activeBaseUrl}${path}`,\n      { method: "GET", headers, timeout: 5e3 },\n      (res) => {\n        let chunks = "";\n        res.on("data", (chunk) => chunks += chunk);\n        res.on("end", () => {\n          try {\n            resolve(JSON.parse(chunks));\n          } catch {\n            resolve(chunks);\n          }\n        });\n      }\n    );\n    req.on("error", (err) => reject(err));\n    req.end();\n  });\n}\nfunction apiPost(path, body) {\n  return new Promise((resolve, reject) => {\n    const data = JSON.stringify(body);\n    const headers = {\n      "Content-Type": "application/json",\n      "Content-Length": String(Buffer.byteLength(data))\n    };\n    if (API_KEY) headers["X-API-Key"] = API_KEY;\n    const req = http.request(\n      `${activeBaseUrl}${path}`,\n      {\n        method: "POST",\n        headers,\n        timeout: 3e4\n      },\n      (res) => {\n        let chunks = "";\n        res.on("data", (chunk) => chunks += chunk);\n        res.on("end", () => {\n          try {\n            resolve(JSON.parse(chunks));\n          } catch {\n            resolve(chunks);\n          }\n        });\n      }\n    );\n    req.on("error", (err) => reject(err));\n    req.write(data);\n    req.end();\n  });\n}\nfunction checkPort(host, port) {\n  return new Promise((resolve) => {\n    const headers = {};\n    if (API_KEY) headers["X-API-Key"] = API_KEY;\n    const req = http.get(`http://${host}:${port}/health`, { timeout: 2e3, headers }, (res) => {\n      let chunks = "";\n      res.on("data", (chunk) => chunks += chunk);\n      res.on("end", () => {\n        try {\n          const data = JSON.parse(chunks);\n          resolve(data?.status === "running");\n        } catch {\n          resolve(false);\n        }\n      });\n    });\n    req.on("error", () => resolve(false));\n    req.setTimeout(2e3, () => {\n      req.destroy();\n      resolve(false);\n    });\n  });\n}\nasync function detectServer(host, preferred) {\n  const start = Math.max(preferred - 5, 1024);\n  const end = preferred + 5;\n  if (await checkPort(host, preferred)) {\n    return preferred;\n  }\n  process.stderr.write(`[render-api-mcp] Port ${preferred} not available, scanning ${start}-${end}...\n`);\n  for (let port = start; port <= end; port++) {\n    if (port === preferred) continue;\n    if (await checkPort(host, port)) {\n      process.stderr.write(`[render-api-mcp] Found Render API on port ${port}\n`);\n      return port;\n    }\n  }\n  return null;\n}\nfunction resolveWSLHosts() {\n  if (!process.env.WSL_DISTRO_NAME) {\n    return [];\n  }\n  try {\n    const route = fs.readFileSync("/proc/net/route", "utf-8");\n    const lines = route.trim().split("\\n");\n    for (const line of lines.slice(1)) {\n      const parts = line.split("	");\n      if (parts[1] === "00000000") {\n        const gwHex = parts[2];\n        const bytes = gwHex.match(/../g)?.reverse() ?? [];\n        if (bytes.length === 4) {\n          return [bytes.map((b) => parseInt(b, 16)).join(".")];\n        }\n      }\n    }\n  } catch {\n  }\n  return ["172.17.224.1", "172.17.240.1", "172.17.0.1", "172.17.128.1"];\n}\nvar httpTools = TOOL_METAS.map((meta) => {\n  const handlerMap = {\n    health: async () => await apiGet("/health"),\n    render_markdown: async (args_) => await apiPost("/render", { content: args_.content, sourcePath: args_.sourcePath, format: args_.format ?? "html", inlineImages: args_.inlineImages }),\n    render_file: async (args_) => await apiPost("/render", { filePath: args_.filePath, format: args_.format ?? "html", inlineImages: args_.inlineImages }),\n    dataview_query: async (args_) => await apiPost("/render/dataview", { query: args_.query, format: args_.format ?? "json" }),\n    dataviewjs: async (args_) => await apiPost("/render/dataview", { code: args_.code, format: args_.format ?? "text" }),\n    reload_plugin: async (args_) => await apiGet(`/reload?pluginId=${encodeURIComponent(String(args_.pluginId ?? ""))}`)\n  };\n  return {\n    ...meta,\n    handler: handlerMap[meta.name] ?? (async () => ({ error: "Unknown tool" }))\n  };\n});\nvar pending = /* @__PURE__ */ new Set();\nvar stdinClosed = false;\nvar stdioWriter = (response) => {\n  process.stdout.write(JSON.stringify(response) + "\\n");\n  if (response.id !== void 0) {\n    pending.delete(response.id);\n  }\n  if (stdinClosed && pending.size === 0) {\n    process.exit(0);\n  }\n};\nasync function startMcpServer() {\n  const hostsToTry = [{ host: HOST, label: HOST }];\n  const wslHosts = resolveWSLHosts();\n  for (const wh of wslHosts) {\n    if (wh !== HOST) {\n      hostsToTry.push({ host: wh, label: `WSL host (${wh})` });\n    }\n  }\n  for (const { host, label } of hostsToTry) {\n    process.stderr.write(`[render-api-mcp] Trying ${label}...\n`);\n    detectedPort = await detectServer(host, CLI_PORT);\n    if (detectedPort) {\n      activeBaseUrl = `http://${host}:${detectedPort}`;\n      try {\n        const health = await apiGet("/health");\n        process.stderr.write(`[render-api-mcp] Connected to Render API v${health.version ?? "unknown"} at ${host}:${detectedPort}\n`);\n      } catch {\n        process.stderr.write(`[render-api-mcp] Connected to Render API at ${host}:${detectedPort}\n`);\n      }\n      break;\n    }\n  }\n  if (!detectedPort) {\n    process.stderr.write(`[render-api-mcp] Warning: Render API not found. Tried: ${hostsToTry.map((h) => h.label).join(", ")} ports ${Math.max(CLI_PORT - 5, 1024)}-${CLI_PORT + 5}. Start the plugin server first.\n`);\n  }\n  process.stderr.write(`[render-api-mcp] MCP server ready (stdio)\n`);\n  const rl = readline.createInterface({ input: process.stdin });\n  rl.on("line", (line) => {\n    const trimmed = line.trim();\n    if (!trimmed) return;\n    try {\n      const req = JSON.parse(trimmed);\n      if (req.id !== void 0) {\n        pending.add(req.id);\n      }\n      handleMcpRequest(req, { tools: httpTools }, stdioWriter);\n    } catch {\n      process.stderr.write(`[render-api-mcp] Failed to parse request: ${trimmed}\n`);\n    }\n  });\n  rl.on("close", () => {\n    stdinClosed = true;\n    if (pending.size === 0) {\n      process.exit(0);\n    }\n  });\n}\nif (require.main === module) {\n  void startMcpServer();\n}\n// Annotate the CommonJS export names for ESM import in node:\n0 && (module.exports = {\n  startMcpServer\n});\n') return;
      }
      await adapter.write(targetPath, '"use strict";\nvar __create = Object.create;\nvar __defProp = Object.defineProperty;\nvar __getOwnPropDesc = Object.getOwnPropertyDescriptor;\nvar __getOwnPropNames = Object.getOwnPropertyNames;\nvar __getProtoOf = Object.getPrototypeOf;\nvar __hasOwnProp = Object.prototype.hasOwnProperty;\nvar __export = (target, all) => {\n  for (var name in all)\n    __defProp(target, name, { get: all[name], enumerable: true });\n};\nvar __copyProps = (to, from, except, desc) => {\n  if (from && typeof from === "object" || typeof from === "function") {\n    for (let key of __getOwnPropNames(from))\n      if (!__hasOwnProp.call(to, key) && key !== except)\n        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });\n  }\n  return to;\n};\nvar __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(\n  // If the importer is in node compatibility mode or this is not an ESM\n  // file that has been converted to a CommonJS file using a Babel-\n  // compatible transform (i.e. "__esModule" has not been set), then set\n  // "default" to the CommonJS "module.exports" for node compatibility.\n  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,\n  mod\n));\nvar __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);\n\n// src/mcp-server-core.ts\nvar mcp_server_core_exports = {};\n__export(mcp_server_core_exports, {\n  startMcpServer: () => startMcpServer\n});\nmodule.exports = __toCommonJS(mcp_server_core_exports);\nvar http = __toESM(require("node:http"));\nvar readline = __toESM(require("node:readline"));\nvar fs = __toESM(require("node:fs"));\n\n// src/services/mcpProtocol.ts\nvar TOOL_METAS = [\n  {\n    name: "health",\n    description: "Check if the Render API server is running and healthy",\n    inputSchema: {\n      type: "object",\n      properties: {}\n    }\n  },\n  {\n    name: "render_markdown",\n    description: "Render arbitrary markdown content through Obsidian\'s render pipeline",\n    inputSchema: {\n      type: "object",\n      properties: {\n        content: { type: "string", description: "Markdown content to render" },\n        sourcePath: { type: "string", description: "Optional vault-relative file path for resolving relative links/images in content (e.g. \'Daily/note.md\')" },\n        format: { type: "string", enum: ["html", "text", "json"], description: "Output format (default: html)" },\n        inlineImages: { type: "boolean", description: "Inline images as base64 data URIs (default: false, controlled by plugin settings). Set true to inline as base64." }\n      },\n      required: ["content"]\n    }\n  },\n  {\n    name: "render_file",\n    description: "Render a vault file by its path within the Obsidian vault",\n    inputSchema: {\n      type: "object",\n      properties: {\n        filePath: { type: "string", description: "Path to the file in the vault (e.g. \'Daily/2026-06-27.md\')" },\n        format: { type: "string", enum: ["html", "text", "json"], description: "Output format (default: html)" },\n        inlineImages: { type: "boolean", description: "Inline images as base64 data URIs (default: false, controlled by plugin settings). Set true to inline as base64." }\n      },\n      required: ["filePath"]\n    }\n  },\n  {\n    name: "dataview_query",\n    description: "Execute a Dataview DQL query and return the results",\n    inputSchema: {\n      type: "object",\n      properties: {\n        query: { type: "string", description: `Dataview DQL query (e.g. \'TABLE file.name, file.mtime FROM ""\')` },\n        format: { type: "string", enum: ["html", "text", "json"], description: "Output format (default: json)" }\n      },\n      required: ["query"]\n    }\n  },\n  {\n    name: "dataviewjs",\n    description: "Execute arbitrary dataviewjs code using the dv.* API",\n    inputSchema: {\n      type: "object",\n      properties: {\n        code: { type: "string", description: "DataviewJS code" },\n        format: { type: "string", enum: ["html", "text", "json"], description: "Output format (default: text)" }\n      },\n      required: ["code"]\n    }\n  },\n  {\n    name: "reload_plugin",\n    description: \'Reload an Obsidian plugin. Pass a pluginId to reload a specific plugin, "others" to reload all other plugins, or omit to reload render-api itself.\',\n    inputSchema: {\n      type: "object",\n      properties: {\n        pluginId: { type: "string", description: "Plugin ID to reload (e.g. \'obsidian-dataview\'). Use \'others\' to reload all other plugins. Omit to reload render-api itself." }\n      }\n    }\n  }\n];\nfunction handleMcpRequest(req, ctx, writer) {\n  const { id, method, params } = req;\n  switch (method) {\n    case "initialize": {\n      writer({\n        jsonrpc: "2.0",\n        id,\n        result: {\n          protocolVersion: "2024-11-05",\n          capabilities: { tools: {} },\n          serverInfo: {\n            name: "render-api-mcp",\n            version: "0.2.1"\n          }\n        }\n      });\n      break;\n    }\n    case "notifications/initialized":\n      break;\n    case "tools/list": {\n      writer({\n        jsonrpc: "2.0",\n        id,\n        result: {\n          tools: ctx.tools.map((t) => ({\n            name: t.name,\n            description: t.description,\n            inputSchema: t.inputSchema\n          }))\n        }\n      });\n      break;\n    }\n    case "tools/call": {\n      if (!params || typeof params.name !== "string") {\n        writer({\n          jsonrpc: "2.0",\n          id,\n          error: { code: -32602, message: "Invalid params: name is required" }\n        });\n        return;\n      }\n      const tool = ctx.tools.find((t) => t.name === params.name);\n      if (!tool) {\n        writer({\n          jsonrpc: "2.0",\n          id,\n          error: { code: -32601, message: `Tool not found: ${params.name}` }\n        });\n        return;\n      }\n      tool.handler(params.arguments ?? {}).then((result) => {\n        writer({\n          jsonrpc: "2.0",\n          id,\n          result: {\n            content: [\n              {\n                type: "text",\n                text: typeof result === "string" ? result : JSON.stringify(result, null, 2)\n              }\n            ]\n          }\n        });\n      }).catch((err) => {\n        writer({\n          jsonrpc: "2.0",\n          id,\n          error: {\n            code: -32603,\n            message: `Tool execution failed: ${err.message}`\n          }\n        });\n      });\n      break;\n    }\n    default:\n      writer({\n        jsonrpc: "2.0",\n        id,\n        error: { code: -32601, message: `Method not found: ${method}` }\n      });\n  }\n}\n\n// src/mcp-server-core.ts\nvar args = process.argv.slice(2);\nvar portIdx = args.indexOf("--port");\nvar CLI_PORT = parseInt(portIdx >= 0 ? args[portIdx + 1] : "27123", 10);\nvar hostIdx = args.indexOf("--host");\nvar HOST = hostIdx >= 0 ? args[hostIdx + 1] : "127.0.0.1";\nvar API_KEY = process.env.RENDER_API_KEY ?? "";\nvar activeBaseUrl = `http://${HOST}:${CLI_PORT}`;\nvar detectedPort = null;\nfunction apiGet(path) {\n  return new Promise((resolve, reject) => {\n    const headers = {};\n    if (API_KEY) headers["X-API-Key"] = API_KEY;\n    const req = http.request(\n      `${activeBaseUrl}${path}`,\n      { method: "GET", headers, timeout: 5e3 },\n      (res) => {\n        let chunks = "";\n        res.on("data", (chunk) => chunks += chunk);\n        res.on("end", () => {\n          try {\n            resolve(JSON.parse(chunks));\n          } catch {\n            resolve(chunks);\n          }\n        });\n      }\n    );\n    req.on("error", (err) => reject(err));\n    req.end();\n  });\n}\nfunction apiPost(path, body) {\n  return new Promise((resolve, reject) => {\n    const data = JSON.stringify(body);\n    const headers = {\n      "Content-Type": "application/json",\n      "Content-Length": String(Buffer.byteLength(data))\n    };\n    if (API_KEY) headers["X-API-Key"] = API_KEY;\n    const req = http.request(\n      `${activeBaseUrl}${path}`,\n      {\n        method: "POST",\n        headers,\n        timeout: 3e4\n      },\n      (res) => {\n        let chunks = "";\n        res.on("data", (chunk) => chunks += chunk);\n        res.on("end", () => {\n          try {\n            resolve(JSON.parse(chunks));\n          } catch {\n            resolve(chunks);\n          }\n        });\n      }\n    );\n    req.on("error", (err) => reject(err));\n    req.write(data);\n    req.end();\n  });\n}\nfunction checkPort(host, port) {\n  return new Promise((resolve) => {\n    const headers = {};\n    if (API_KEY) headers["X-API-Key"] = API_KEY;\n    const req = http.get(`http://${host}:${port}/health`, { timeout: 2e3, headers }, (res) => {\n      let chunks = "";\n      res.on("data", (chunk) => chunks += chunk);\n      res.on("end", () => {\n        try {\n          const data = JSON.parse(chunks);\n          resolve(data?.status === "running");\n        } catch {\n          resolve(false);\n        }\n      });\n    });\n    req.on("error", () => resolve(false));\n    req.setTimeout(2e3, () => {\n      req.destroy();\n      resolve(false);\n    });\n  });\n}\nasync function detectServer(host, preferred) {\n  const start = Math.max(preferred - 5, 1024);\n  const end = preferred + 5;\n  if (await checkPort(host, preferred)) {\n    return preferred;\n  }\n  process.stderr.write(`[render-api-mcp] Port ${preferred} not available, scanning ${start}-${end}...\n`);\n  for (let port = start; port <= end; port++) {\n    if (port === preferred) continue;\n    if (await checkPort(host, port)) {\n      process.stderr.write(`[render-api-mcp] Found Render API on port ${port}\n`);\n      return port;\n    }\n  }\n  return null;\n}\nfunction resolveWSLHosts() {\n  if (!process.env.WSL_DISTRO_NAME) {\n    return [];\n  }\n  try {\n    const route = fs.readFileSync("/proc/net/route", "utf-8");\n    const lines = route.trim().split("\\n");\n    for (const line of lines.slice(1)) {\n      const parts = line.split("	");\n      if (parts[1] === "00000000") {\n        const gwHex = parts[2];\n        const bytes = gwHex.match(/../g)?.reverse() ?? [];\n        if (bytes.length === 4) {\n          return [bytes.map((b) => parseInt(b, 16)).join(".")];\n        }\n      }\n    }\n  } catch {\n  }\n  return ["172.17.224.1", "172.17.240.1", "172.17.0.1", "172.17.128.1"];\n}\nvar httpTools = TOOL_METAS.map((meta) => {\n  const handlerMap = {\n    health: async () => await apiGet("/health"),\n    render_markdown: async (args_) => await apiPost("/render", { content: args_.content, sourcePath: args_.sourcePath, format: args_.format ?? "html", inlineImages: args_.inlineImages }),\n    render_file: async (args_) => await apiPost("/render", { filePath: args_.filePath, format: args_.format ?? "html", inlineImages: args_.inlineImages }),\n    dataview_query: async (args_) => await apiPost("/render/dataview", { query: args_.query, format: args_.format ?? "json" }),\n    dataviewjs: async (args_) => await apiPost("/render/dataview", { code: args_.code, format: args_.format ?? "text" }),\n    reload_plugin: async (args_) => await apiGet(`/reload?pluginId=${encodeURIComponent(String(args_.pluginId ?? ""))}`)\n  };\n  return {\n    ...meta,\n    handler: handlerMap[meta.name] ?? (async () => ({ error: "Unknown tool" }))\n  };\n});\nvar pending = /* @__PURE__ */ new Set();\nvar stdinClosed = false;\nvar stdioWriter = (response) => {\n  process.stdout.write(JSON.stringify(response) + "\\n");\n  if (response.id !== void 0) {\n    pending.delete(response.id);\n  }\n  if (stdinClosed && pending.size === 0) {\n    process.exit(0);\n  }\n};\nasync function startMcpServer() {\n  const hostsToTry = [{ host: HOST, label: HOST }];\n  const wslHosts = resolveWSLHosts();\n  for (const wh of wslHosts) {\n    if (wh !== HOST) {\n      hostsToTry.push({ host: wh, label: `WSL host (${wh})` });\n    }\n  }\n  for (const { host, label } of hostsToTry) {\n    process.stderr.write(`[render-api-mcp] Trying ${label}...\n`);\n    detectedPort = await detectServer(host, CLI_PORT);\n    if (detectedPort) {\n      activeBaseUrl = `http://${host}:${detectedPort}`;\n      try {\n        const health = await apiGet("/health");\n        process.stderr.write(`[render-api-mcp] Connected to Render API v${health.version ?? "unknown"} at ${host}:${detectedPort}\n`);\n      } catch {\n        process.stderr.write(`[render-api-mcp] Connected to Render API at ${host}:${detectedPort}\n`);\n      }\n      break;\n    }\n  }\n  if (!detectedPort) {\n    process.stderr.write(`[render-api-mcp] Warning: Render API not found. Tried: ${hostsToTry.map((h) => h.label).join(", ")} ports ${Math.max(CLI_PORT - 5, 1024)}-${CLI_PORT + 5}. Start the plugin server first.\n`);\n  }\n  process.stderr.write(`[render-api-mcp] MCP server ready (stdio)\n`);\n  const rl = readline.createInterface({ input: process.stdin });\n  rl.on("line", (line) => {\n    const trimmed = line.trim();\n    if (!trimmed) return;\n    try {\n      const req = JSON.parse(trimmed);\n      if (req.id !== void 0) {\n        pending.add(req.id);\n      }\n      handleMcpRequest(req, { tools: httpTools }, stdioWriter);\n    } catch {\n      process.stderr.write(`[render-api-mcp] Failed to parse request: ${trimmed}\n`);\n    }\n  });\n  rl.on("close", () => {\n    stdinClosed = true;\n    if (pending.size === 0) {\n      process.exit(0);\n    }\n  });\n}\nif (require.main === module) {\n  void startMcpServer();\n}\n// Annotate the CommonJS export names for ESM import in node:\n0 && (module.exports = {\n  startMcpServer\n});\n');
      this.debugLog("[Render API] mcp-server.js written to", targetPath);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.debugLog("[Render API] Failed to write mcp-server.js:", msg);
    }
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
  async startApiServer() {
    if (this.apiServer?.isRunning) {
      this.debugLog("[Render API] Server already running at", this.apiServer.address);
      new import_obsidian3.Notice(`Render API \u5DF2\u5728 ${this.apiServer.address} \u8FD0\u884C`);
      return;
    }
    this.debugLog("[Render API] Creating ApiServer instance...");
    try {
      this.apiServer = new ApiServer(this);
      this.debugLog("[Render API] Calling apiServer.start() on port", this.settings.serverPort);
      await this.apiServer.start(this.settings.serverPort);
      this.debugLog("[Render API] Server started successfully at", this.apiServer.address);
      new import_obsidian3.Notice(`Render API \u670D\u52A1\u5DF2\u542F\u52A8 \u2192 ${this.apiServer.address}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.debugLog("[Render API] Failed to start server:", err);
      if (msg.includes("in use")) {
        new import_obsidian3.Notice(t("server.portUnavailable", this.settings.language).replace("{port}", String(this.settings.serverPort)));
      } else {
        new import_obsidian3.Notice(t("server.startError", this.settings.language).replace("{error}", msg));
      }
      this.apiServer = null;
    }
  }
  async stopApiServer() {
    if (!this.apiServer?.isRunning) return;
    await this.apiServer.stop();
    new import_obsidian3.Notice("Render API \u670D\u52A1\u5DF2\u505C\u6B62");
    this.apiServer = null;
  }
  getRenderService() {
    return new RenderService(this.app, this._component, this.settings.debugLogEnabled, this.settings.debugLogFile);
  }
  debugLog(message, details) {
    if (!this.settings?.debugLogEnabled) return;
    if (details === void 0) {
      console.debug(message);
    } else {
      console.debug(message, details);
    }
  }
};
