/**
 * hardware-benchmark —— DSH 插件入口
 *
 * 读取本机硬件 → 工程开发/游戏性能双维评分 + 网络附加分 + DIY 升级建议。
 * 价格不硬编码：按 upgrades[].searchHint 由模型调 web_search 实时查询。
 */
import type { Context } from '@deepseek-ai/cordis'
import { defineTool } from '@deepseek-ai/dsh-tools'
import { benchmark } from './benchmark'
import { collectHardware } from './system'

export const name = 'hardware-benchmark'
export const inject = ['tools']

export function apply(ctx: Context) {
  ctx.tools.register(defineTool({
    name: 'hardware_benchmark',
    description:
      '读取本机硬件信息并打分：工程开发 / 游戏性能两个维度 + 网络附加分 + DIY 升级建议。'
      + '返回硬件画像、双维分数与理由、按性价比排序的升级清单。'
      + '升级项的参考价请按 upgrades[].searchHint 调 web_search 实时查询后填入，不要编造价格。',
    parameters: {},
    output: {
      schema: { type: 'json' },
      render: (_args, value) => [{ type: 'text', text: JSON.stringify(value, null, 2) }],
    },
    async execute() {
      const hardware = await collectHardware()
      const score = benchmark(hardware)
      // 转成纯 JSON 值（满足 dsh-tools 的 JsonValue 返回契约）
      return JSON.parse(JSON.stringify({ hardware, ...score }))
    },
  }))
}
