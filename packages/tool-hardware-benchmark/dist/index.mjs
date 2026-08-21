// src/index.ts
import { defineTool } from "@deepseek-ai/dsh-tools";

// src/benchmark.ts
var grade = (s) => s >= 85 ? "S" : s >= 70 ? "A" : s >= 55 ? "B" : s >= 40 ? "C" : "D";
function cpuDevScore(p) {
  const t = p.cpuThreads;
  const s = t >= 16 ? 40 : t >= 12 ? 35 : t >= 8 ? 28 : t >= 6 ? 22 : t >= 4 ? 14 : 6;
  return { score: s, reason: `${p.cpuModel}\uFF08${p.cpuCores}\u6838${p.cpuThreads}\u7EBF\u7A0B\uFF09\uFF1A${t >= 8 ? "\u7F16\u8BD1\u5E76\u884C\u5EA6\u5145\u8DB3" : t >= 4 ? "\u8F7B\u91CF\u5F00\u53D1\u591F\u7528\uFF0C\u91CD\u5EA6\u6784\u5EFA\u5403\u529B" : "\u7EBF\u7A0B\u6570\u504F\u4F4E\uFF0C\u5927\u578B\u9879\u76EE\u7F16\u8BD1\u4F1A\u6162"}` };
}
function memDevScore(p) {
  const g = p.totalMemGB;
  const s = g >= 64 ? 30 : g >= 32 ? 26 : g >= 16 ? 20 : g >= 8 ? 10 : 4;
  return { score: s, reason: `\u5185\u5B58 ${g}GB\uFF1A${g >= 32 ? "\u591A\u5BB9\u5668/\u591A IDE/\u5927\u6A21\u578B\u672C\u5730\u8DD1\u90FD\u591F" : g >= 16 ? "\u5E38\u89C4\u5F00\u53D1\u591F\u7528\uFF0C\u91CD\u5EA6\u573A\u666F\u7D27\u5F20" : "\u5EFA\u8BAE\u6269\u5BB9\u5230 16GB \u4EE5\u4E0A"}` };
}
function diskDevScore(p) {
  const map = { NVMe: 30, SSD: 24, HDD: 8, unknown: 18 };
  const s = map[p.diskType];
  const tip = { NVMe: "NVMe \u56FA\u6001\uFF1A\u51B7\u542F\u52A8\u4E0E\u6784\u5EFA IO \u62C9\u6EE1", SSD: "SATA SSD\uFF1A\u591F\u7528\uFF0CNVMe \u66F4\u4F73", HDD: "\u673A\u68B0\u76D8\uFF1A\u5F3A\u70C8\u5EFA\u8BAE\u6362 SSD\uFF0C\u6784\u5EFA/\u7D22\u5F15\u4F1A\u660E\u663E\u62D6\u6162", unknown: "\u78C1\u76D8\u7C7B\u578B\u672A\u77E5\uFF08\u9ED8\u8BA4\u7ED9\u5206\uFF09" }[p.diskType];
  return { score: s, reason: `${p.diskType} \u78C1\u76D8\uFF08${Math.round(p.diskTotalGB / 1024)}TB\uFF09\uFF1A${tip}` };
}
var GPU_GRADE = [
  [/RTX 5090|RTX 5080/, 60, "\u65D7\u8230\u7EA7\u72EC\u663E"],
  [/RTX 5070 ?Ti/, 55, "\u9AD8\u7AEF\u72EC\u663E"],
  [/RTX 5070|RTX 4090|RTX 4080|RTX 4070|RX 7900/, 52, "\u9AD8\u7AEF\u72EC\u663E"],
  [/RTX 4060|RTX 3070|RTX 3060|RX 7800|RX 6800/, 44, "\u4E2D\u9AD8\u7AEF\u72EC\u663E"],
  [/RTX 2060|RTX 2070|GTX 16|RX 6600|RX 580/, 36, "\u4E2D\u7AEF\u72EC\u663E"],
  [/GTX 10|GTX 9|UHD|HD Graphics|Iris|Radeon Graphics|Vega|Radeon R?[0-9]+M/, 18, "\u96C6\u6210\u663E\u5361/\u8001\u72EC\u663E"]
];
function gpuGameScore(p) {
  const model = p.gpuModel;
  if (!model) {
    return { score: 6, reason: "\u672A\u68C0\u6D4B\u5230 GPU\uFF08\u53EF\u80FD\u662F\u65E0\u5934\u73AF\u5883/\u865A\u62DF\u673A\uFF09" };
  }
  const hit = GPU_GRADE.find(([re]) => re.test(model));
  if (hit) {
    const [, base, label] = hit;
    const vramBonus = p.gpuVramGB >= 16 ? 6 : p.gpuVramGB >= 8 ? 3 : 0;
    return { score: Math.min(60, base + vramBonus), reason: `${model}\uFF08\u663E\u5B58 ${p.gpuVramGB}GB\uFF09\uFF1A${label}${p.gpuVramGB >= 16 ? "\uFF0C\u663E\u5B58\u5BBD\u88D5\u53EF\u5F00\u9AD8\u753B\u8D28" : ""}` };
  }
  return { score: 30, reason: `${model}\uFF08\u672A\u6536\u5F55\u578B\u53F7\uFF0C\u6309\u4E2D\u6863\u9884\u4F30\uFF09` };
}
function cpuGameScore(p) {
  const s = p.cpuSpeedGHz >= 4.5 ? 25 : p.cpuSpeedGHz >= 3.5 ? 20 : p.cpuSpeedGHz >= 2.5 ? 15 : 8;
  return { score: s, reason: `CPU \u5355\u6838 ${p.cpuSpeedGHz}GHz\uFF1A${p.cpuSpeedGHz >= 4.5 ? "\u9AD8\u9891\uFF0C\u9002\u5408\u7535\u7ADE\u5E27\u7387" : p.cpuSpeedGHz >= 3.5 ? "\u4E3B\u6D41\u6C34\u5E73" : "\u5355\u6838\u504F\u5F31\uFF0C\u53EF\u80FD\u6210\u4E3A\u74F6\u9888"}` };
}
function memGameScore(p) {
  const s = p.totalMemGB >= 32 ? 15 : p.totalMemGB >= 16 ? 12 : p.totalMemGB >= 8 ? 8 : 3;
  return { score: s, reason: `\u5185\u5B58 ${p.totalMemGB}GB\uFF1A${p.totalMemGB >= 16 ? "\u6EE1\u8DB3\u4E3B\u6D41 3A \u9700\u6C42" : "\u504F\u5C0F\uFF0C3A \u5927\u4F5C\u6218\u573A\u4F1A\u5403\u7D27"}` };
}
function networkScore(p) {
  const dl = p.downloadMbps;
  if (dl !== null) {
    const score2 = dl >= 100 ? 92 : dl >= 50 ? 80 : dl >= 20 ? 62 : dl >= 5 ? 42 : 28;
    const tip = dl >= 100 ? "\u9AD8\u901F\uFF0C\u8FDC\u7A0B\u5F00\u53D1 / \u5927\u4F9D\u8D56\u62C9\u53D6\u90FD\u8F7B\u677E" : dl >= 50 ? "\u4E3B\u6D41\u6C34\u5E73" : dl >= 20 ? "\u591F\u7528\uFF0C\u5927\u6587\u4EF6\u4F20\u8F93\u504F\u6162" : "\u504F\u4F4E\uFF0C\u8FDC\u7A0B\u534F\u4F5C\u4F1A\u660E\u663E\u5361\u987F";
    return { score: score2, grade: grade(score2), reasons: [`\u5B9E\u6D4B\u4E0B\u8F7D ${dl}Mbps\uFF1A${tip}`] };
  }
  const wired = p.networkType === "ethernet";
  const speed = p.networkSpeedMbps ?? 0;
  const score = wired && speed >= 1e3 ? 78 : wired ? 66 : p.networkType === "wireless" ? 55 : 40;
  const reason = `\u672A\u5B9E\u6D4B\uFF08\u6309\u7F51\u5361\u4F30\u7B97\uFF09\uFF1A${p.networkType === "ethernet" ? "\u6709\u7EBF" : p.networkType === "wireless" ? "\u65E0\u7EBF" : "\u672A\u77E5"} ${speed || "?"}Mbps`;
  return { score, grade: grade(score), reasons: [reason] };
}
function benchmark(p) {
  const cpuD = cpuDevScore(p);
  const memD = memDevScore(p);
  const diskD = diskDevScore(p);
  const devScore = cpuD.score + memD.score + diskD.score;
  const gpuG = gpuGameScore(p);
  const cpuG = cpuGameScore(p);
  const memG = memGameScore(p);
  const gameScore = gpuG.score + cpuG.score + memG.score;
  const devGrade = grade(devScore);
  const gameGrade = grade(gameScore);
  const net = networkScore(p);
  const overall = devScore >= 85 && gameScore >= 85 ? "\u5168\u80FD\u5DE5\u4F5C\u7AD9\uFF08\u5F00\u53D1 + \u6E38\u620F\u901A\u5403\uFF09" : devScore >= 70 ? "\u5F00\u53D1\u4E3B\u529B\u673A" : gameScore >= 70 ? "\u6E38\u620F\u673A\uFF08\u5F00\u53D1\u4E2D\u7B49\uFF09" : devScore >= 55 ? "\u5747\u8861\u5BB6\u7528\u673A" : "\u5165\u95E8\u673A\uFF08\u5EFA\u8BAE\u6309\u77ED\u677F\u5347\u7EA7\uFF09";
  return {
    dev: { score: devScore, grade: devGrade, reasons: [cpuD.reason, memD.reason, diskD.reason] },
    game: { score: gameScore, grade: gameGrade, reasons: [gpuG.reason, cpuG.reason, memG.reason] },
    network: net,
    overall,
    upgrades: buildUpgrades(p)
  };
}
function hasDiscreteGpu(p) {
  return p.gpuModel !== null && !/UHD|HD Graphics|Iris|Radeon Graphics|Radeon R?[0-9]+M|Vega/i.test(p.gpuModel);
}
function buildUpgrades(p) {
  const list = [];
  const memSpec = (target) => p.memType === "DDR4" ? `${target} DDR5\uFF08DDR4 \u4E3B\u677F\u5347\u4E0D\u4E86 DDR5\uFF0C\u9700\u6574\u673A\u6362\u4EE3\uFF09` : `${target} DDR5`;
  if (p.cpuThreads < 8) {
    list.push({
      priority: "high",
      area: "dev",
      part: "CPU",
      costBand: "high",
      current: `${p.cpuModel}\uFF08${p.cpuThreads} \u7EBF\u7A0B\uFF09`,
      suggestion: "\u6362 CPU \u8981\u8FDE\u4E3B\u677F\u770B\u5E73\u53F0\uFF08AM5 / LGA1700\uFF09\uFF0C\u522B\u53EA\u770B\u578B\u53F7\uFF1B\u9884\u7B97\u591F\u5C31 8 \u6838\u8D77\uFF0C\u7F16\u8BD1\u76F4\u63A5\u5FEB\u4E00\u622A",
      recommendation: "\u22658 \u6838\uFF1AAMD Ryzen 7 7700 / Intel Core i5-14600K",
      searchHint: "Ryzen 7 7700 CPU \u4EF7\u683C"
    });
  }
  if (p.totalMemGB < 16) {
    list.push({
      priority: "high",
      area: "dev",
      part: "\u5185\u5B58",
      costBand: "low",
      current: `${p.totalMemGB}GB${p.memType ? ` ${p.memType}` : ""}`,
      suggestion: `\u5185\u5B58\u662F"\u6700\u4FBF\u5B9C\u89C1\u6548\u6700\u5FEB"\u7684\u5347\u7EA7\uFF1A${p.memType === "DDR4" ? "DDR4 \u5E73\u53F0\u76F4\u63A5\u52A0\u6761\u6700\u5212\u7B97\uFF08DDR4 \u5347\u4E0D\u4E86 DDR5\uFF09" : "\u76F4\u63A5\u4E0A DDR5 6000"}\uFF1B\u672C\u5730\u8DD1 AI / \u591A\u5BB9\u5668\u5EFA\u8BAE 32GB`,
      recommendation: memSpec("32GB (2\xD716GB) 6000MHz"),
      searchHint: "DDR5 32GB 2x16GB 6000MHz \u4EF7\u683C"
    });
  } else if (p.totalMemGB < 32) {
    list.push({
      priority: "medium",
      area: "dev",
      part: "\u5185\u5B58",
      costBand: "low",
      current: `${p.totalMemGB}GB${p.memType ? ` ${p.memType}` : ""}`,
      suggestion: p.memType === "DDR4" ? "DDR4 \u5E73\u53F0\u52A0\u5BB9\u91CF\u4F18\u5148\uFF08DDR4/DDR5 \u4E92\u4E0D\u517C\u5BB9\uFF09\uFF1B\u6574\u673A\u6362\u4EE3\u65F6\u518D\u4E0A DDR5 \u5E73\u53F0" : "\u91CD\u5EA6\u5F00\u53D1\uFF08\u591A IDE / \u5BB9\u5668 / \u672C\u5730\u6A21\u578B\uFF09\u4E0A 32GB \u53CC\u901A\u9053\uFF0C\u751C\u70B9\u6027\u4EF7\u6BD4",
      recommendation: memSpec("32GB (2\xD716GB) 6000MHz"),
      searchHint: "DDR5 32GB 2x16GB 6000MHz \u4EF7\u683C"
    });
  }
  if (p.diskType === "HDD") {
    list.push({
      priority: "high",
      area: "dev",
      part: "\u78C1\u76D8",
      costBand: "low",
      current: "HDD",
      suggestion: '\u6362 NVMe SSD \u662F"\u82B1\u94B1\u6700\u5C11\u3001\u4F53\u611F\u63D0\u5347\u6700\u731B"\u7684\u4E00\u9879\uFF1A\u5F00\u673A\u3001\u7F16\u8BD1\u3001\u7D22\u5F15\u7ACB\u523B\u8D77\u98DE',
      recommendation: "NVMe SSD 1TB\uFF08\u5982 WD SN770 / \u4E09\u661F 990 EVO\uFF09",
      searchHint: "NVMe SSD 1TB \u4EF7\u683C"
    });
  } else if (p.diskType === "SSD") {
    list.push({
      priority: "low",
      area: "dev",
      part: "\u78C1\u76D8",
      costBand: "low",
      current: "SATA SSD",
      suggestion: 'SATA SSD \u2192 NVMe \u5C5E\u4E8E"\u9526\u4E0A\u6DFB\u82B1"\uFF0C\u987A\u5E8F\u8BFB\u5199\u7FFB\u51E0\u500D\uFF0C\u65E5\u5E38\u611F\u77E5\u770B\u9884\u7B97',
      recommendation: "NVMe SSD 1TB\uFF08\u5982 WD SN770 / \u4E09\u661F 990 EVO\uFF09",
      searchHint: "NVMe SSD 1TB \u4EF7\u683C"
    });
  }
  const dgpu = hasDiscreteGpu(p);
  if (!dgpu) {
    list.push({
      priority: "high",
      area: "game",
      part: "\u663E\u5361",
      costBand: "high",
      current: p.gpuModel ?? "\u65E0\u72EC\u7ACB\u663E\u5361",
      suggestion: "\u52A0\u72EC\u663E\u524D\u5148\u770B\u4E24\u4EF6\u4E8B\uFF1A\u7535\u6E90\u74E6\u6570\uFF084060 \u7EA7\u8981 450W+\uFF09\u548C\u673A\u7BB1\u957F\u5EA6\uFF1B\u7B14\u8BB0\u672C\u76F4\u63A5\u5FFD\u7565\uFF08\u53EA\u80FD\u5916\u63A5\u663E\u5361\u575E\uFF0C\u6027\u4EF7\u6BD4\u4F4E\uFF09",
      recommendation: "NVIDIA RTX 4060 8GB\uFF08\u6216\u540C\u7EA7 AMD RX 7600\uFF09",
      searchHint: "RTX 4060 8GB \u663E\u5361 \u4EF7\u683C"
    });
  } else if (p.gpuVramGB < 8) {
    list.push({
      priority: "medium",
      area: "game",
      part: "\u663E\u5361",
      costBand: "high",
      current: `${p.gpuModel}\uFF08${p.gpuVramGB}GB\uFF09`,
      suggestion: "\u663E\u5B58 8GB \u4EE5\u4E0B\u73A9 3A \u9AD8\u753B\u8D28\u5BB9\u6613\u7206\u663E\u5B58\uFF1B\u6362\u5361\u5148\u786E\u8BA4\u7535\u6E90\u4F59\u91CF\uFF0C4060 / 7600 \u7EA7\u6027\u4EF7\u6BD4\u6700\u9AD8",
      recommendation: "\u22658GB \u663E\u5B58\uFF1ARTX 4060 / RX 7600 \u7EA7",
      searchHint: "RTX 4060 8GB \u663E\u5361 \u4EF7\u683C"
    });
  }
  if (p.cpuSpeedGHz < 3.5 && dgpu) {
    list.push({
      priority: "medium",
      area: "game",
      part: "CPU",
      costBand: "high",
      current: `${p.cpuSpeedGHz}GHz`,
      suggestion: "\u5355\u6838\u4F4E\u9891\u662F\u7535\u7ADE\u74F6\u9888\uFF1B\u6362\u9AD8\u9891 U \u8981\u540C\u6B65\u786E\u8BA4\u4E3B\u677F\u5E73\u53F0\u4E0E\u6563\u70ED",
      recommendation: "\u9AD8\u9891 CPU\uFF1AIntel Core i5-14600K / AMD Ryzen 7 7700",
      searchHint: "Core i5-14600K CPU \u4EF7\u683C"
    });
  }
  if (p.totalMemGB < 16) {
    list.push({
      priority: "medium",
      area: "game",
      part: "\u5185\u5B58",
      costBand: "low",
      current: `${p.totalMemGB}GB${p.memType ? ` ${p.memType}` : ""}`,
      suggestion: "\u6E38\u620F\u4E0A 16GB \u662F\u5E95\u7EBF\u300132GB \u624D\u8212\u670D\uFF0C\u52A0\u5185\u5B58\u662F\u6E38\u620F\u4FA7\u6700\u4FBF\u5B9C\u7684\u63D0\u5347",
      recommendation: memSpec("16GB (2\xD78GB) \u6216\u76F4\u63A5 32GB"),
      searchHint: "DDR5 32GB 2x16GB 6000MHz \u4EF7\u683C"
    });
  }
  const dl = p.downloadMbps;
  if (dl !== null && dl < 50) {
    list.push({
      priority: "medium",
      area: "dev",
      part: "\u7F51\u7EDC",
      costBand: "medium",
      current: `\u5B9E\u6D4B\u4E0B\u8F7D ${dl}Mbps`,
      suggestion: dl < 20 ? "\u8FD9\u7F51\u901F\u8FDC\u7A0B\u5F00\u53D1 / \u62C9\u5927\u4F9D\u8D56\u4F1A\u5361\u5230\u6000\u7591\u4EBA\u751F\uFF1B\u5148\u67E5\u662F\u4E0D\u662F\u8DEF\u7531\u8001\u65E7\u6216\u6CA1\u8D70\u6709\u7EBF\uFF0C\u518D\u8C08\u5347\u5BBD\u5E26" : "\u4E2D\u901F\uFF0C\u91CD\u5EA6\u8FDC\u7A0B / \u9891\u7E41\u62C9\u5927\u4F9D\u8D56\u53EF\u5347\uFF1B\u4F18\u5148\u6362 Wi-Fi 6 \u8DEF\u7531\u6216\u8D70\u6709\u7EBF\uFF0C\u522B\u6025\u7740\u5347\u5BBD\u5E26\u5957\u9910",
      recommendation: "\u6709\u7EBF\u5343\u5146 / Wi-Fi 6 \u8DEF\u7531\u5668",
      searchHint: "Wi-Fi 6 \u8DEF\u7531\u5668 \u4EF7\u683C"
    });
  } else if (p.networkType === "wireless" && (p.networkSpeedMbps ?? 0) < 500) {
    list.push({
      priority: "low",
      area: "dev",
      part: "\u7F51\u7EDC",
      costBand: "medium",
      current: `\u65E0\u7EBF\u7F51\u5361 ${p.networkSpeedMbps ?? "?"}Mbps`,
      suggestion: "\u65E0\u7EBF\u901F\u7387\u4E00\u822C\uFF0C\u8D70\u6709\u7EBF\u6216\u6362 Wi-Fi 6 \u8DEF\u7531\u6536\u76CA\u6700\u76F4\u63A5",
      recommendation: "\u6709\u7EBF\u5343\u5146 / Wi-Fi 6 \u8DEF\u7531\u5668",
      searchHint: "Wi-Fi 6 \u8DEF\u7531\u5668 \u4EF7\u683C"
    });
  } else if (p.networkType === "ethernet" && (p.networkSpeedMbps ?? 0) < 1e3) {
    list.push({
      priority: "low",
      area: "dev",
      part: "\u7F51\u7EDC",
      costBand: "low",
      current: `\u7F51\u5361 ${p.networkSpeedMbps ?? "?"}Mbps`,
      suggestion: "\u7F51\u5361\u8FD8\u4E0D\u662F\u5343\u5146\uFF0C\u51E0\u5341\u5757\u6362\u5F20\u5343\u5146\u5361/\u8D70\u4E3B\u677F\u96C6\u6210\u53E3\uFF0C\u5185\u7F51\u4F20\u8F93\u7ACB\u523B\u7FFB\u500D",
      recommendation: "\u5343\u5146 PCIe \u7F51\u5361",
      searchHint: "\u5343\u5146 PCIe \u7F51\u5361 \u4EF7\u683C"
    });
  }
  if (p.batteryPercent !== null && p.batteryPercent < 70) {
    list.push({
      priority: "medium",
      area: "dev",
      part: "\u7535\u6C60",
      costBand: "low",
      current: `\u5065\u5EB7\u5EA6 ${p.batteryPercent}%`,
      suggestion: "\u7535\u6C60\u5065\u5EB7\u5EA6\u504F\u4F4E\uFF0C\u63D2\u7535\u7528\u95EE\u9898\u4E0D\u5927\uFF1B\u5916\u51FA\u9891\u7E41\u5C31\u6362\u539F\u5382\u7535\u6C60\uFF08\u526F\u5382\u4FBF\u5B9C\u4F46\u5BFF\u547D\u770B\u8138\uFF09",
      recommendation: "\u539F\u5382\u7535\u6C60\uFF08\u6309\u673A\u578B\uFF09",
      searchHint: "\u7B14\u8BB0\u672C\u7535\u6C60 \u66F4\u6362 \u4EF7\u683C"
    });
  }
  if (list.length === 0) {
    list.push({
      priority: "low",
      area: "dev",
      part: "\u7EFC\u5408",
      costBand: "low",
      current: "\u914D\u7F6E\u5747\u8861",
      suggestion: '\u6682\u65E0\u5FC5\u9700\u5347\u7EA7\uFF1B\u60F3\u6298\u817E\u53EF\u52A0 2TB NVMe \u6216\u4E0A 64GB\uFF0C\u5C5E\u4E8E"\u4E0D\u5DEE\u94B1\u9526\u4E0A\u6DFB\u82B1"',
      recommendation: "NVMe SSD 2TB \u6216 DDR5 64GB",
      searchHint: "NVMe SSD 2TB \u4EF7\u683C"
    });
  }
  const order = { high: 0, medium: 1, low: 2 };
  const cost = { low: 0, medium: 1, high: 2 };
  return list.sort((a, b) => order[a.priority] - order[b.priority] || cost[a.costBand] - cost[b.costBand]);
}

// src/system.ts
import si from "systeminformation";
async function collectHardware() {
  const [cpu, mem, disks, graphics, os, memLayout, nets, battery] = await Promise.all([
    safe(() => si.cpu()),
    safe(() => si.mem()),
    safe(() => si.diskLayout()),
    safe(() => si.graphics()),
    safe(() => si.osInfo()),
    safe(() => si.memLayout()),
    safe(() => si.networkInterfaces()),
    safe(() => si.battery())
  ]);
  const gpus = graphics?.controllers ?? [];
  const DISCRETE_RE = /UHD|HD Graphics|Iris|Radeon Graphics|Radeon R?[0-9]+M|Vega/i;
  const discreteGpu = gpus.find((g) => g.model && !DISCRETE_RE.test(g.model));
  const gpu = discreteGpu ?? gpus[0];
  const disk = disks?.[0];
  const net = nets?.find((n) => n.operstate === "up") ?? nets?.[0];
  const [downloadMbps, uploadMbps] = await Promise.all([measureDownload(), measureUpload()]);
  return {
    os: [os?.platform, os?.distro, os?.release].filter(Boolean).join(" ") || "unknown",
    cpuModel: cpu?.brand?.trim() || "unknown",
    cpuCores: cpu?.physicalCores || cpu?.cores || 0,
    cpuThreads: cpu?.cores || 0,
    cpuSpeedGHz: cpu?.speed ? Number(cpu.speed) / 1e3 : 0,
    // systeminformation speed 单位 MHz
    totalMemGB: Math.round((mem?.total ?? 0) / 1024 ** 3),
    memType: memLayout?.[0]?.type ?? null,
    diskType: disk?.type ?? "unknown",
    diskTotalGB: Math.round((disk?.size ?? 0) / 1024 ** 3),
    gpuModel: gpu?.model?.trim() || null,
    gpuVramGB: Math.round((gpu?.vram ?? 0) / 1024),
    gpuList: gpus.map((g) => ({ model: g.model?.trim() || "unknown", vramGB: Math.round((g.vram ?? 0) / 1024) })),
    networkType: net?.type ?? "unknown",
    networkSpeedMbps: typeof net?.speed === "number" ? net.speed : null,
    downloadMbps,
    uploadMbps,
    batteryPercent: typeof battery?.percent === "number" ? Math.round(battery.percent) : null
  };
}
var CF_DOWN = "https://speed.cloudflare.com/__down?bytes=5000000";
var CF_UP = "https://speed.cloudflare.com/__up";
var UP_BYTES = 2e6;
async function measureDownload() {
  try {
    const start = Date.now();
    const res = await fetch(CF_DOWN, { signal: AbortSignal.timeout(15e3) });
    const bytes = (await res.arrayBuffer()).byteLength;
    const secs = (Date.now() - start) / 1e3;
    return secs > 0 ? Math.round(bytes * 8 / 1e6 / secs) : null;
  } catch {
    return null;
  }
}
async function measureUpload() {
  try {
    const start = Date.now();
    await fetch(CF_UP, { method: "POST", body: new Uint8Array(UP_BYTES), signal: AbortSignal.timeout(15e3) });
    const secs = (Date.now() - start) / 1e3;
    return secs > 0 ? Math.round(UP_BYTES * 8 / 1e6 / secs) : null;
  } catch {
    return null;
  }
}
async function safe(fn) {
  try {
    return await fn();
  } catch {
    return void 0;
  }
}

// src/index.ts
var name = "hardware-benchmark";
var inject = ["tools"];
function apply(ctx) {
  ctx.tools.register(defineTool({
    name: "hardware_benchmark",
    description: "\u8BFB\u53D6\u672C\u673A\u786C\u4EF6\u4FE1\u606F\u5E76\u6253\u5206\uFF1A\u5DE5\u7A0B\u5F00\u53D1 / \u6E38\u620F\u6027\u80FD\u4E24\u4E2A\u7EF4\u5EA6 + \u7F51\u7EDC\u9644\u52A0\u5206 + DIY \u5347\u7EA7\u5EFA\u8BAE\u3002\u8FD4\u56DE\u786C\u4EF6\u753B\u50CF\u3001\u53CC\u7EF4\u5206\u6570\u4E0E\u7406\u7531\u3001\u6309\u6027\u4EF7\u6BD4\u6392\u5E8F\u7684\u5347\u7EA7\u6E05\u5355\u3002\u5347\u7EA7\u9879\u7684\u53C2\u8003\u4EF7\u8BF7\u6309 upgrades[].searchHint \u8C03 web_search \u5B9E\u65F6\u67E5\u8BE2\u540E\u586B\u5165\uFF0C\u4E0D\u8981\u7F16\u9020\u4EF7\u683C\u3002",
    parameters: {},
    output: {
      schema: { type: "json" },
      render: (_args, value) => [{ type: "text", text: JSON.stringify(value, null, 2) }]
    },
    async execute() {
      const hardware = await collectHardware();
      const score = benchmark(hardware);
      return JSON.parse(JSON.stringify({ hardware, ...score }));
    }
  }));
}
export {
  apply,
  inject,
  name
};
