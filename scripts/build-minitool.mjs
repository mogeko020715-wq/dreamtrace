#!/usr/bin/env node
/**
 * 小红书小工具离线包构建脚本
 * 用法：node scripts/build-minitool.mjs
 * 步骤：Vite 构建 → index.html 经典脚本化 → CSS Chrome 61 降级 → 清理 → 打包 zip
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const dist = path.join(root, 'dist-minitool');
const releaseDir = path.join(root, 'release');
const zipPath = path.join(releaseDir, 'dreamtrace-minitool-v1.zip');

// ── 1. 构建 ──────────────────────────────────────────────
console.log('▸ vite build (minitool config)…');
execSync('npx vite build --config vite.config.minitool.ts', { cwd: root, stdio: 'inherit' });

// ── 2. index.html：module → 经典脚本 ─────────────────────
const htmlPath = path.join(dist, 'index.html');
let html = fs.readFileSync(htmlPath, 'utf8');
html = html
  // module 脚本默认 deferred；转经典脚本后必须显式 defer，
  // 否则脚本在 <head> 同步执行时 #root 尚未解析，React 挂载失败白屏。
  .replace(/<script type="module" crossorigin src="([^"]+)"><\/script>/g, '<script defer src="$1"></script>')
  .replace(/<link rel="modulepreload"[^>]*>\s*/g, '');
if (/type="module"|modulepreload/.test(html)) {
  throw new Error('index.html 仍残留 module 脚本标记');
}
fs.writeFileSync(htmlPath, html);
console.log('▸ index.html 已转为经典脚本引用');

// ── 3. CSS：Chrome 61 降级（CSS 由 Vite 内嵌进 app.js，直接在 JS 内做文本级替换） ──
const jsPath = path.join(dist, 'assets', 'app.js');
let js = fs.readFileSync(jsPath, 'utf8');

// 3a. CSS Color 4 空格/斜杠语法 → 逗号语法（Chrome 61 可解析）
js = js.replace(/rgb\(\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*\/\s*([\d.]+%?)\s*\)/g, 'rgba($1, $2, $3, $4)');
js = js.replace(/rgb\(\s*(\d{1,3})\s+(\d{1,3})\s+(\d{1,3})\s*\)/g, 'rgb($1, $2, $3)');
// hsl(var(--xxx)) 仅用于 shadcn 基座样式，降级为固定值
js = js.replace(/hsl\(var\(--border\)\)/g, '#2a2440');
js = js.replace(/hsl\(var\(--background\)\)/g, '#07040f');
js = js.replace(/hsl\(var\(--foreground\)\)/g, '#e8e9f5');

// 3b. Flex gap 基线回退：margin 基线（无 supports-flex-gap 时生效），Grid 用 grid-gap 别名
const SCALE = {
  '0': '0px', '0.5': '0.125rem', '1': '0.25rem', '1.5': '0.375rem', '2': '0.5rem',
  '2.5': '0.625rem', '3': '0.75rem', '3.5': '0.875rem', '4': '1rem', '5': '1.25rem',
  '6': '1.5rem', '7': '1.75rem', '8': '2rem', '9': '2.25rem', '10': '2.5rem',
  '12': '3rem', '14': '3.5rem', '16': '4rem', '20': '5rem', '24': '6rem',
};
const collect = (re) => {
  const s = new Set();
  for (const m of js.matchAll(re)) s.add(m[1]);
  return s;
};
const used = collect(/\\?\.gap-([0-9.]+)\s*[,{]/g);
const usedX = collect(/\\?\.gap-x-([0-9.]+)\s*[,{]/g);
const usedY = collect(/\\?\.gap-y-([0-9.]+)\s*[,{]/g);
const esc = (s) => s.replace('.', '\\.');
let fb = '';
for (const k of [...used].sort((a, b) => parseFloat(a) - parseFloat(b))) {
  const v = SCALE[k];
  if (!v) { console.warn(`  ! 未识别的 gap 尺寸 ${k}，请手动补充`); continue; }
  const cls = `gap-${esc(k)}`;
  fb += `html:not(.supports-flex-gap) .flex.${cls} > * + *{margin-left:${v}}`;
  fb += `html:not(.supports-flex-gap) .flex.flex-col.${cls} > * + *{margin-left:0;margin-top:${v}}`;
  fb += `.grid.${cls}{grid-gap:${v}}`;
}
for (const k of [...usedX]) {
  const v = SCALE[k]; if (!v) continue;
  const cls = `gap-x-${esc(k)}`;
  fb += `html:not(.supports-flex-gap) .flex.${cls} > * + *{margin-left:${v}}`;
  fb += `.grid.${cls}{grid-column-gap:${v}}`;
}
for (const k of [...usedY]) {
  const v = SCALE[k]; if (!v) continue;
  const cls = `gap-y-${esc(k)}`;
  fb += `html:not(.supports-flex-gap) .flex.flex-wrap.${cls} > *{margin-bottom:${v}}`;
  fb += `.grid.${cls}{grid-row-gap:${v}}`;
}
if (/["'\\]/.test(fb)) throw new Error('回退 CSS 含引号或反斜杠，需先转义');
js += `\n;(function(){var s=document.createElement("style");s.textContent="${fb}";document.head.appendChild(s);})();`;
fs.writeFileSync(jsPath, js);
console.log(`▸ CSS 降级完成（gap 回退 ${used.size + usedX.size + usedY.size} 组，rgb()/hsl() 语法已转换）`);

// ── 4. 清理 ──────────────────────────────────────────────
for (const junk of ['mock', '.DS_Store', 'assets/.DS_Store']) {
  fs.rmSync(path.join(dist, junk), { recursive: true, force: true });
}

// ── 5. 打包 zip（压缩目录内容，index.html 在 zip 根） ────
fs.mkdirSync(releaseDir, { recursive: true });
fs.rmSync(zipPath, { force: true });
execSync(`cd "${dist}" && zip -q -r "${zipPath}" . -x '*.DS_Store'`, { stdio: 'inherit' });
const mb = (fs.statSync(zipPath).size / 1048576).toFixed(2);
console.log(`▸ 打包完成：${zipPath}（${mb} MiB）`);
