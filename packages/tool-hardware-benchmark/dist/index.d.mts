import { Context } from '@deepseek-ai/cordis';

/**
 * hardware-benchmark —— DSH 插件入口
 *
 * 读取本机硬件 → 工程开发/游戏性能双维评分 + 网络附加分 + DIY 升级建议。
 * 价格不硬编码：按 upgrades[].searchHint 由模型调 web_search 实时查询。
 */

declare const name = "hardware-benchmark";
declare const inject: string[];
declare function apply(ctx: Context): void;

export { apply, inject, name };
