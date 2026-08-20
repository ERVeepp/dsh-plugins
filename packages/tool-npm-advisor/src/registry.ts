/**
 * npm registry 客户端：拉取包元数据，进程内带缓存（同包不重复拉）。
 */

const REGISTRY = 'https://registry.npmjs.org'

export interface PackageMeta {
  name: string
  latest: string
  deprecated: string | null
  lastPublish: string | null
  publishedCount: number
  maintainers: string[]
  directDependencies: string[]
  readmeHead: string
}

const cache = new Map<string, any>()

export async function fetchPackage(pkg: string): Promise<PackageMeta> {
  const meta = await fetchRaw(pkg)
  const latest = meta['dist-tags']?.latest as string | undefined
  const latestVersion = latest ? meta.versions?.[latest] : undefined
  const published = Object.keys(meta.time ?? {}).filter(
    (k) => k !== 'created' && k !== 'modified',
  )

  return {
    name: meta.name,
    latest: latest ?? 'unknown',
    deprecated: latestVersion?.deprecated ?? null,
    lastPublish: published.at(-1) ?? null,
    publishedCount: published.length,
    maintainers: (meta.maintainers ?? []).map((m: any) => m.name),
    directDependencies: Object.keys(latestVersion?.dependencies ?? {}),
    readmeHead: (meta.readme ?? '').slice(0, 1500),
  }
}

async function fetchRaw(pkg: string): Promise<any> {
  if (cache.has(pkg)) return cache.get(pkg)
  const res = await fetch(`${REGISTRY}/${encodeURIComponent(pkg)}`)
  if (!res.ok) throw new Error(`npm registry 返回 ${res.status}（${pkg}）`)
  const meta = await res.json()
  cache.set(pkg, meta)
  return meta
}

/** 只拉依赖表（依赖树工具用），不带 readme 大字段 */
export async function fetchDependencies(pkg: string): Promise<string[]> {
  const meta = await fetchRaw(pkg)
  const latest = meta['dist-tags']?.latest as string | undefined
  return Object.keys(latest ? meta.versions?.[latest]?.dependencies ?? {} : {})
}
