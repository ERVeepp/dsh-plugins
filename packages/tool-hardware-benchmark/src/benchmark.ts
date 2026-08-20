/**
 * 硬件打分核心（纯函数，便于 mock 验证——不依赖真实硬件 / DSH 宿主）
 *
 * 双维度评分：
 *   工程开发 = CPU 多核(40) + 内存(30) + 磁盘(30)
 *   游戏性能 = GPU(60) + CPU 单核(25) + 内存(15)
 */

export interface HardwareProfile {
  os: string
  cpuModel: string
  cpuCores: number        // 物理核心
  cpuThreads: number      // 逻辑线程
  cpuSpeedGHz: number     // 单核基准频率
  totalMemGB: number
  memType: string | null  // DDR4 / DDR5 / null
  diskType: 'NVMe' | 'SSD' | 'HDD' | 'unknown'
  diskTotalGB: number
  gpuModel: string | null
  gpuVramGB: number
  networkType: 'ethernet' | 'wireless' | 'unknown'
  networkSpeedMbps: number | null  // 网卡标称速率
  downloadMbps: number | null      // 实测下载（Cloudflare 测速）
  uploadMbps: number | null        // 实测上传
  batteryPercent: number | null    // 笔记本电池健康度
}

export interface ScorePart {
  score: number
  grade: string
  reasons: string[]
}

export interface UpgradeItem {
  priority: 'high' | 'medium' | 'low'
  area: 'dev' | 'game'
  part: string
  current: string
  suggestion: string
  /** 推荐规格（具体到型号/代数，如 DDR5 32GB 6000MHz） */
  recommendation: string
  /** 给 DSH 模型的搜索词：调 web_search 实时查参考价填入 */
  searchHint: string
  /** 成本档：low=便宜见效快 / medium / high=贵（换大件） */
  costBand: 'low' | 'medium' | 'high'
}

export interface BenchmarkResult {
  dev: ScorePart
  game: ScorePart
  network: ScorePart
  overall: string
  upgrades: UpgradeItem[]
}

const grade = (s: number) => (s >= 85 ? 'S' : s >= 70 ? 'A' : s >= 55 ? 'B' : s >= 40 ? 'C' : 'D')

/* ── 开发分 ────────────────────────────────────────────── */

function cpuDevScore(p: HardwareProfile): { score: number; reason: string } {
  const t = p.cpuThreads
  const s = t >= 16 ? 40 : t >= 12 ? 35 : t >= 8 ? 28 : t >= 6 ? 22 : t >= 4 ? 14 : 6
  return { score: s, reason: `${p.cpuModel}（${p.cpuCores}核${p.cpuThreads}线程）：${t >= 8 ? '编译并行度充足' : t >= 4 ? '轻量开发够用，重度构建吃力' : '线程数偏低，大型项目编译会慢'}` }
}

function memDevScore(p: HardwareProfile): { score: number; reason: string } {
  const g = p.totalMemGB
  const s = g >= 64 ? 30 : g >= 32 ? 26 : g >= 16 ? 20 : g >= 8 ? 10 : 4
  return { score: s, reason: `内存 ${g}GB：${g >= 32 ? '多容器/多 IDE/大模型本地跑都够' : g >= 16 ? '常规开发够用，重度场景紧张' : '建议扩容到 16GB 以上'}` }
}

function diskDevScore(p: HardwareProfile): { score: number; reason: string } {
  const map = { NVMe: 30, SSD: 24, HDD: 8, unknown: 18 } as const
  const s = map[p.diskType]
  const tip = { NVMe: 'NVMe 固态：冷启动与构建 IO 拉满', SSD: 'SATA SSD：够用，NVMe 更佳', HDD: '机械盘：强烈建议换 SSD，构建/索引会明显拖慢', unknown: '磁盘类型未知（默认给分）' }[p.diskType]
  return { score: s, reason: `${p.diskType} 磁盘（${Math.round(p.diskTotalGB / 1024)}TB）：${tip}` }
}

/* ── 游戏分 ────────────────────────────────────────────── */

/** 独显档位：关键词 → 分数档（0-60） */
const GPU_GRADE: Array<[RegExp, number, string]> = [
  [/RTX 5090|RTX 5080/, 60, '旗舰级独显'],
  [/RTX 4090|RTX 4080|RX 7900|RTX 4070/, 52, '高端独显'],
  [/RTX 4060|RTX 3070|RTX 3060|RX 7800|RX 6800/, 44, '中高端独显'],
  [/RTX 2060|RTX 2070|GTX 16|RX 6600|RX 580/, 36, '中端独显'],
  [/GTX 10|GTX 9|UHD|HD Graphics|Iris|Radeon Graphics|Vega/, 18, '集成显卡/老独显'],
]

function gpuGameScore(p: HardwareProfile): { score: number; reason: string } {
  const model = p.gpuModel
  if (!model) {
    return { score: 6, reason: '未检测到 GPU（可能是无头环境/虚拟机）' }
  }
  const hit = GPU_GRADE.find(([re]) => re.test(model))
  if (hit) {
    const [, base, label] = hit
    const vramBonus = p.gpuVramGB >= 16 ? 6 : p.gpuVramGB >= 8 ? 3 : 0
    return { score: Math.min(60, base + vramBonus), reason: `${model}（显存 ${p.gpuVramGB}GB）：${label}${p.gpuVramGB >= 16 ? '，显存宽裕可开高画质' : ''}` }
  }
  return { score: 30, reason: `${model}（未收录型号，按中档预估）` }
}

function cpuGameScore(p: HardwareProfile): { score: number; reason: string } {
  const s = p.cpuSpeedGHz >= 4.5 ? 25 : p.cpuSpeedGHz >= 3.5 ? 20 : p.cpuSpeedGHz >= 2.5 ? 15 : 8
  return { score: s, reason: `CPU 单核 ${p.cpuSpeedGHz}GHz：${p.cpuSpeedGHz >= 4.5 ? '高频，适合电竞帧率' : p.cpuSpeedGHz >= 3.5 ? '主流水平' : '单核偏弱，可能成为瓶颈'}` }
}

function memGameScore(p: HardwareProfile): { score: number; reason: string } {
  const s = p.totalMemGB >= 32 ? 15 : p.totalMemGB >= 16 ? 12 : p.totalMemGB >= 8 ? 8 : 3
  return { score: s, reason: `内存 ${p.totalMemGB}GB：${p.totalMemGB >= 16 ? '满足主流 3A 需求' : '偏小，3A 大作战场会吃紧'}` }
}

/* ── 网络分（附加维度：远程开发 / 拉依赖 / 在线协作） ──────── */

function networkScore(p: HardwareProfile): { score: number; grade: string; reasons: string[] } {
  const dl = p.downloadMbps
  if (dl !== null) {
    const score = dl >= 100 ? 92 : dl >= 50 ? 80 : dl >= 20 ? 62 : dl >= 5 ? 42 : 28
    const tip = dl >= 100 ? '高速，远程开发 / 大依赖拉取都轻松' : dl >= 50 ? '主流水平' : dl >= 20 ? '够用，大文件传输偏慢' : '偏低，远程协作会明显卡顿'
    return { score, grade: grade(score), reasons: [`实测下载 ${dl}Mbps：${tip}`] }
  }
  const wired = p.networkType === 'ethernet'
  const speed = p.networkSpeedMbps ?? 0
  const score = wired && speed >= 1000 ? 78 : wired ? 66 : p.networkType === 'wireless' ? 55 : 40
  const reason = `未实测（按网卡估算）：${p.networkType === 'ethernet' ? '有线' : p.networkType === 'wireless' ? '无线' : '未知'} ${speed || '?'}Mbps`
  return { score, grade: grade(score), reasons: [reason] }
}

/* ── 汇总 ──────────────────────────────────────────────── */

export function benchmark(p: HardwareProfile): BenchmarkResult {
  const cpuD = cpuDevScore(p)
  const memD = memDevScore(p)
  const diskD = diskDevScore(p)
  const devScore = cpuD.score + memD.score + diskD.score

  const gpuG = gpuGameScore(p)
  const cpuG = cpuGameScore(p)
  const memG = memGameScore(p)
  const gameScore = gpuG.score + cpuG.score + memG.score

  const devGrade = grade(devScore)
  const gameGrade = grade(gameScore)
  const net = networkScore(p)
  const overall =
    devScore >= 85 && gameScore >= 85 ? '全能工作站（开发 + 游戏通吃）'
    : devScore >= 70 ? '开发主力机'
    : gameScore >= 70 ? '游戏机（开发中等）'
    : devScore >= 55 ? '均衡家用机'
    : '入门机（建议按短板升级）'

  return {
    dev: { score: devScore, grade: devGrade, reasons: [cpuD.reason, memD.reason, diskD.reason] },
    game: { score: gameScore, grade: gameGrade, reasons: [gpuG.reason, cpuG.reason, memG.reason] },
    network: net,
    overall,
    upgrades: buildUpgrades(p),
  }
}

/* ── 升级推荐（按短板，收益大的排前面） ──────────────────── */

/** 是否独立显卡（排除集成/核显型号） */
function hasDiscreteGpu(p: HardwareProfile): boolean {
  return p.gpuModel !== null && !/UHD|HD Graphics|Iris|Radeon Graphics|Vega/i.test(p.gpuModel)
}

export function buildUpgrades(p: HardwareProfile): UpgradeItem[] {
  const list: UpgradeItem[] = []
  const memSpec = (target: string): string =>
    p.memType === 'DDR4' ? `${target} DDR5（DDR4 主板升不了 DDR5，需整机换代）` : `${target} DDR5`

  // 开发向
  if (p.cpuThreads < 8) {
    list.push({
      priority: 'high', area: 'dev', part: 'CPU', costBand: 'high',
      current: `${p.cpuModel}（${p.cpuThreads} 线程）`,
      suggestion: '换 CPU 要连主板看平台（AM5 / LGA1700），别只看型号；预算够就 8 核起，编译直接快一截',
      recommendation: '≥8 核：AMD Ryzen 7 7700 / Intel Core i5-14600K',
      searchHint: 'Ryzen 7 7700 CPU 价格',
    })
  }
  if (p.totalMemGB < 16) {
    list.push({
      priority: 'high', area: 'dev', part: '内存', costBand: 'low',
      current: `${p.totalMemGB}GB${p.memType ? ` ${p.memType}` : ''}`,
      suggestion: `内存是"最便宜见效最快"的升级：${p.memType === 'DDR4' ? 'DDR4 平台直接加条最划算（DDR4 升不了 DDR5）' : '直接上 DDR5 6000'}；本地跑 AI / 多容器建议 32GB`,
      recommendation: memSpec('32GB (2×16GB) 6000MHz'),
      searchHint: 'DDR5 32GB 2x16GB 6000MHz 价格',
    })
  } else if (p.totalMemGB < 32) {
    list.push({
      priority: 'medium', area: 'dev', part: '内存', costBand: 'low',
      current: `${p.totalMemGB}GB${p.memType ? ` ${p.memType}` : ''}`,
      suggestion: p.memType === 'DDR4'
        ? 'DDR4 平台加容量优先（DDR4/DDR5 互不兼容）；整机换代时再上 DDR5 平台'
        : '重度开发（多 IDE / 容器 / 本地模型）上 32GB 双通道，甜点性价比',
      recommendation: memSpec('32GB (2×16GB) 6000MHz'),
      searchHint: 'DDR5 32GB 2x16GB 6000MHz 价格',
    })
  }
  if (p.diskType === 'HDD') {
    list.push({
      priority: 'high', area: 'dev', part: '磁盘', costBand: 'low',
      current: 'HDD',
      suggestion: '换 NVMe SSD 是"花钱最少、体感提升最猛"的一项：开机、编译、索引立刻起飞',
      recommendation: 'NVMe SSD 1TB（如 WD SN770 / 三星 990 EVO）',
      searchHint: 'NVMe SSD 1TB 价格',
    })
  } else if (p.diskType === 'SSD') {
    list.push({
      priority: 'low', area: 'dev', part: '磁盘', costBand: 'low',
      current: 'SATA SSD',
      suggestion: 'SATA SSD → NVMe 属于"锦上添花"，顺序读写翻几倍，日常感知看预算',
      recommendation: 'NVMe SSD 1TB（如 WD SN770 / 三星 990 EVO）',
      searchHint: 'NVMe SSD 1TB 价格',
    })
  }

  // 游戏向
  const dgpu = hasDiscreteGpu(p)
  if (!dgpu) {
    list.push({
      priority: 'high', area: 'game', part: '显卡', costBand: 'high',
      current: p.gpuModel ?? '无独立显卡',
      suggestion: '加独显前先看两件事：电源瓦数（4060 级要 450W+）和机箱长度；笔记本直接忽略（只能外接显卡坞，性价比低）',
      recommendation: 'NVIDIA RTX 4060 8GB（或同级 AMD RX 7600）',
      searchHint: 'RTX 4060 8GB 显卡 价格',
    })
  } else if (p.gpuVramGB < 8) {
    list.push({
      priority: 'medium', area: 'game', part: '显卡', costBand: 'high',
      current: `${p.gpuModel}（${p.gpuVramGB}GB）`,
      suggestion: '显存 8GB 以下玩 3A 高画质容易爆显存；换卡先确认电源余量，4060 / 7600 级性价比最高',
      recommendation: '≥8GB 显存：RTX 4060 / RX 7600 级',
      searchHint: 'RTX 4060 8GB 显卡 价格',
    })
  }
  if (p.cpuSpeedGHz < 3.5 && dgpu) {
    list.push({
      priority: 'medium', area: 'game', part: 'CPU', costBand: 'high',
      current: `${p.cpuSpeedGHz}GHz`,
      suggestion: '单核低频是电竞瓶颈；换高频 U 要同步确认主板平台与散热',
      recommendation: '高频 CPU：Intel Core i5-14600K / AMD Ryzen 7 7700',
      searchHint: 'Core i5-14600K CPU 价格',
    })
  }
  if (p.totalMemGB < 16) {
    list.push({
      priority: 'medium', area: 'game', part: '内存', costBand: 'low',
      current: `${p.totalMemGB}GB${p.memType ? ` ${p.memType}` : ''}`,
      suggestion: '游戏上 16GB 是底线、32GB 才舒服，加内存是游戏侧最便宜的提升',
      recommendation: memSpec('16GB (2×8GB) 或直接 32GB'),
      searchHint: 'DDR5 32GB 2x16GB 6000MHz 价格',
    })
  }

  // 网络（远程开发 / 拉依赖 / 在线协作）
  const dl = p.downloadMbps
  if (dl !== null && dl < 50) {
    list.push({
      priority: 'medium', area: 'dev', part: '网络', costBand: 'medium',
      current: `实测下载 ${dl}Mbps`,
      suggestion: dl < 20
        ? '这网速远程开发 / 拉大依赖会卡到怀疑人生；先查是不是路由老旧或没走有线，再谈升宽带'
        : '中速，重度远程 / 频繁拉大依赖可升；优先换 Wi-Fi 6 路由或走有线，别急着升宽带套餐',
      recommendation: '有线千兆 / Wi-Fi 6 路由器',
      searchHint: 'Wi-Fi 6 路由器 价格',
    })
  } else if (p.networkType === 'wireless' && (p.networkSpeedMbps ?? 0) < 500) {
    list.push({
      priority: 'low', area: 'dev', part: '网络', costBand: 'medium',
      current: `无线网卡 ${p.networkSpeedMbps ?? '?'}Mbps`,
      suggestion: '无线速率一般，走有线或换 Wi-Fi 6 路由收益最直接',
      recommendation: '有线千兆 / Wi-Fi 6 路由器',
      searchHint: 'Wi-Fi 6 路由器 价格',
    })
  } else if (p.networkType === 'ethernet' && (p.networkSpeedMbps ?? 0) < 1000) {
    list.push({
      priority: 'low', area: 'dev', part: '网络', costBand: 'low',
      current: `网卡 ${p.networkSpeedMbps ?? '?'}Mbps`,
      suggestion: '网卡还不是千兆，几十块换张千兆卡/走主板集成口，内网传输立刻翻倍',
      recommendation: '千兆 PCIe 网卡',
      searchHint: '千兆 PCIe 网卡 价格',
    })
  }

  // 电池（笔记本）
  if (p.batteryPercent !== null && p.batteryPercent < 70) {
    list.push({
      priority: 'medium', area: 'dev', part: '电池', costBand: 'low',
      current: `健康度 ${p.batteryPercent}%`,
      suggestion: '电池健康度偏低，插电用问题不大；外出频繁就换原厂电池（副厂便宜但寿命看脸）',
      recommendation: '原厂电池（按机型）',
      searchHint: '笔记本电池 更换 价格',
    })
  }

  // 完全够用兜底
  if (list.length === 0) {
    list.push({
      priority: 'low', area: 'dev', part: '综合', costBand: 'low',
      current: '配置均衡',
      suggestion: '暂无必需升级；想折腾可加 2TB NVMe 或上 64GB，属于"不差钱锦上添花"',
      recommendation: 'NVMe SSD 2TB 或 DDR5 64GB',
      searchHint: 'NVMe SSD 2TB 价格',
    })
  }

  // 排序：优先级优先，同优先级里便宜的排前面（性价比导向）
  const order = { high: 0, medium: 1, low: 2 } as const
  const cost = { low: 0, medium: 1, high: 2 } as const
  return list.sort((a, b) => order[a.priority] - order[b.priority] || cost[a.costBand] - cost[b.costBand])
}
