/**
 * 高置信「原生替代」映射表：Node 内置能力已覆盖、不必再引第三方包的场景。
 *
 * 命中即由插件直接给出结论；未命中则把 npm registry 元数据 + README 头部
 * 交给模型做语义裁决（弃坑/换代声明通常写在 README 顶部）。
 */

export const NATIVE_ALTERNATIVES: Record<string, string> = {
  axios: '原生 fetch（Node 18+）',
  'node-fetch': '原生 fetch（Node 18+）',
  request: '原生 fetch / undici',
  got: '原生 fetch（简单场景）',
  ky: '原生 fetch（简单场景）',
  moment: 'dayjs / date-fns / 原生 Temporal（Node 23+ 或 polyfill）',
  dayjs: '轻场景可直接用原生 Date + Intl，重场景保留',
  uuid: 'crypto.randomUUID()',
  dotenv: 'process.loadEnvFile()（Node 20.6+）或 --env-file',
  minimist: 'util.parseArgs()',
  yargs: 'util.parseArgs()（简单场景）',
  commander: 'util.parseArgs()（简单场景）',
  rimraf: 'fs.rm({ recursive: true, force: true })',
  mkdirp: 'fs.mkdir({ recursive: true })',
  'fs-extra': '原生 fs + fs.promises（多数场景）',
  glob: 'fs.glob / fs.promises.glob（Node 22+）',
  debug: 'util.debuglog()',
  'is-odd': '原生取模',
  'is-number': 'typeof x === "number" && Number.isFinite(x)',
  chalk: '原生 ANSI 转义码（简单场景，重场景保留）',
  'cross-env': '脚本内直接设环境变量（跨平台注意）',
}

/** 已知弃坑 / 维护停滞包：命中后提示模型去 README 顶部找官方迁移声明 */
export const DEAD_PACKAGES: Record<string, string> = {
  request: '已弃坑（官方 README 推荐用原生 fetch / undici / got）',
  moment: '进入维护模式（官方 README 推荐 dayjs / date-fns / Luxon）',
  bower: '已废弃的包管理器',
  grunt: '生态停滞，新项目不建议',
  'prop-types': 'React 18+ 无需为 TS 项目引入',
  '@hapi/joi': '已被 joi 官方合并，改用 joi',
  'graphql-tools': '已拆分为 @graphql-tools/* 系列包（同一团队换代）',
}

export function findNativeAlternative(pkg: string): string | null {
  return NATIVE_ALTERNATIVES[pkg] ?? null
}

export function findDeadPackage(pkg: string): string | null {
  return DEAD_PACKAGES[pkg] ?? null
}
