import { Context } from '@deepseek-ai/cordis';

/**
 * npm-advisor —— DSH 插件入口
 *
 * 引入新 npm 包前调用：判断候选包是否是最优解。
 * 事实由插件给（registry 元数据 + 原生替代映射表），裁决交给模型
 * （模型结合 readme 头部的迁移声明 + 自身知识做最终选型）。
 */

declare const name = "npm-advisor";
declare const inject: string[];
declare function apply(ctx: Context): void;

export { apply, inject, name };
