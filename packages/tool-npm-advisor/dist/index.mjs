// src/index.ts
import { defineTool } from "@deepseek-ai/dsh-tools";

// src/registry.ts
var REGISTRY = "https://registry.npmjs.org";
var cache = /* @__PURE__ */ new Map();
async function fetchPackage(pkg) {
  const meta = await fetchRaw(pkg);
  const latest = meta["dist-tags"]?.latest;
  const latestVersion = latest ? meta.versions?.[latest] : void 0;
  const published = Object.keys(meta.time ?? {}).filter(
    (k) => k !== "created" && k !== "modified"
  );
  return {
    name: meta.name,
    latest: latest ?? "unknown",
    deprecated: latestVersion?.deprecated ?? null,
    lastPublish: published.at(-1) ?? null,
    publishedCount: published.length,
    maintainers: (meta.maintainers ?? []).map((m) => m.name),
    directDependencies: Object.keys(latestVersion?.dependencies ?? {}),
    readmeHead: (meta.readme ?? "").slice(0, 1500)
  };
}
async function fetchRaw(pkg) {
  if (cache.has(pkg)) return cache.get(pkg);
  const res = await fetch(`${REGISTRY}/${encodeURIComponent(pkg)}`);
  if (!res.ok) throw new Error(`npm registry \u8FD4\u56DE ${res.status}\uFF08${pkg}\uFF09`);
  const meta = await res.json();
  cache.set(pkg, meta);
  return meta;
}
async function fetchDependencies(pkg) {
  const meta = await fetchRaw(pkg);
  const latest = meta["dist-tags"]?.latest;
  return Object.keys(latest ? meta.versions?.[latest]?.dependencies ?? {} : {});
}

// src/dependency-tree.ts
var edge = (from, to) => `  ${from.replace(/\W/g, "_")} --> ${to.replace(/\W/g, "_")}`;
async function renderDependencyTree(pkg, depth = 2) {
  const seen = /* @__PURE__ */ new Set();
  const lines = ["graph TD"];
  const walk = async (name2, d, from) => {
    if (seen.has(name2) || d < 0) return;
    seen.add(name2);
    if (from) lines.push(edge(from, name2));
    try {
      const deps = await fetchDependencies(name2);
      for (const dep of deps) await walk(dep, d - 1, name2);
    } catch {
      lines.push(edge(name2, "unknown"));
    }
  };
  await walk(pkg, depth);
  return "```mermaid\n" + lines.join("\n") + "\n```";
}

// src/native.ts
var NATIVE_ALTERNATIVES = {
  axios: "\u539F\u751F fetch\uFF08Node 18+\uFF09",
  "node-fetch": "\u539F\u751F fetch\uFF08Node 18+\uFF09",
  request: "\u539F\u751F fetch / undici",
  got: "\u539F\u751F fetch\uFF08\u7B80\u5355\u573A\u666F\uFF09",
  ky: "\u539F\u751F fetch\uFF08\u7B80\u5355\u573A\u666F\uFF09",
  moment: "dayjs / date-fns / \u539F\u751F Temporal\uFF08Node 23+ \u6216 polyfill\uFF09",
  dayjs: "\u8F7B\u573A\u666F\u53EF\u76F4\u63A5\u7528\u539F\u751F Date + Intl\uFF0C\u91CD\u573A\u666F\u4FDD\u7559",
  uuid: "crypto.randomUUID()",
  dotenv: "process.loadEnvFile()\uFF08Node 20.6+\uFF09\u6216 --env-file",
  minimist: "util.parseArgs()",
  yargs: "util.parseArgs()\uFF08\u7B80\u5355\u573A\u666F\uFF09",
  commander: "util.parseArgs()\uFF08\u7B80\u5355\u573A\u666F\uFF09",
  rimraf: "fs.rm({ recursive: true, force: true })",
  mkdirp: "fs.mkdir({ recursive: true })",
  "fs-extra": "\u539F\u751F fs + fs.promises\uFF08\u591A\u6570\u573A\u666F\uFF09",
  glob: "fs.glob / fs.promises.glob\uFF08Node 22+\uFF09",
  debug: "util.debuglog()",
  "is-odd": "\u539F\u751F\u53D6\u6A21",
  "is-number": 'typeof x === "number" && Number.isFinite(x)',
  chalk: "\u539F\u751F ANSI \u8F6C\u4E49\u7801\uFF08\u7B80\u5355\u573A\u666F\uFF0C\u91CD\u573A\u666F\u4FDD\u7559\uFF09",
  "cross-env": "\u811A\u672C\u5185\u76F4\u63A5\u8BBE\u73AF\u5883\u53D8\u91CF\uFF08\u8DE8\u5E73\u53F0\u6CE8\u610F\uFF09"
};
var DEAD_PACKAGES = {
  request: "\u5DF2\u5F03\u5751\uFF08\u5B98\u65B9 README \u63A8\u8350\u7528\u539F\u751F fetch / undici / got\uFF09",
  moment: "\u8FDB\u5165\u7EF4\u62A4\u6A21\u5F0F\uFF08\u5B98\u65B9 README \u63A8\u8350 dayjs / date-fns / Luxon\uFF09",
  bower: "\u5DF2\u5E9F\u5F03\u7684\u5305\u7BA1\u7406\u5668",
  grunt: "\u751F\u6001\u505C\u6EDE\uFF0C\u65B0\u9879\u76EE\u4E0D\u5EFA\u8BAE",
  "prop-types": "React 18+ \u65E0\u9700\u4E3A TS \u9879\u76EE\u5F15\u5165",
  "@hapi/joi": "\u5DF2\u88AB joi \u5B98\u65B9\u5408\u5E76\uFF0C\u6539\u7528 joi",
  "graphql-tools": "\u5DF2\u62C6\u5206\u4E3A @graphql-tools/* \u7CFB\u5217\u5305\uFF08\u540C\u4E00\u56E2\u961F\u6362\u4EE3\uFF09"
};
function findNativeAlternative(pkg) {
  return NATIVE_ALTERNATIVES[pkg] ?? null;
}
function findDeadPackage(pkg) {
  return DEAD_PACKAGES[pkg] ?? null;
}

// src/index.ts
var name = "npm-advisor";
var inject = ["tools"];
function apply(ctx) {
  ctx.tools.register(defineTool({
    name: "npm_package_audit",
    description: "\u5BA1\u67E5\u5019\u9009 npm \u5305\u662F\u5426\u662F\u6700\u4F18\u89E3\uFF1A\u539F\u751F\u66FF\u4EE3\u3001\u7EF4\u62A4\u5065\u5EB7\u5EA6\u3001README \u8FC1\u79FB\u7EBF\u7D22\u3001\u76F4\u63A5\u4F9D\u8D56\u89C4\u6A21\u3002\u5728\u5F15\u5165\u65B0\u4F9D\u8D56\u524D\u8C03\u7528\uFF1B\u8FD4\u56DE JSON \u4F9B\u4F60\u7ED3\u5408\u5305 README \u7684\u8FC1\u79FB\u58F0\u660E\u505A\u6700\u7EC8\u88C1\u51B3\u3002",
    parameters: {
      packageName: { type: "string", required: true, description: "\u5F85\u5F15\u5165\u7684 npm \u5305\u540D\uFF08\u53EF\u542B @scope/\uFF09" }
    },
    output: {
      schema: { type: "json" },
      render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }]
    },
    async execute(args) {
      const meta = await fetchPackage(args.packageName);
      return {
        ...meta,
        nativeAlternative: findNativeAlternative(meta.name),
        deadPackage: findDeadPackage(meta.name)
      };
    }
  }));
  ctx.tools.register(defineTool({
    name: "npm_dependency_tree",
    description: "\u9012\u5F52\u62C9\u53D6\u4F9D\u8D56\u5E76\u8F93\u51FA mermaid \u4F9D\u8D56\u56FE\uFF0C\u7528\u4E8E\u8BC4\u4F30\u5F15\u5165\u540E\u7684\u4F9D\u8D56\u81A8\u80C0\u3002",
    parameters: {
      packageName: { type: "string", required: true },
      depth: { type: "number", description: "\u9012\u5F52\u6DF1\u5EA6\uFF0C\u9ED8\u8BA4 2" }
    },
    output: {
      schema: { type: "string" },
      render: (_args, value) => [{ type: "text", text: value }]
    },
    async execute(args) {
      return renderDependencyTree(args.packageName, args.depth ?? 2);
    }
  }));
}
export {
  apply,
  inject,
  name
};
