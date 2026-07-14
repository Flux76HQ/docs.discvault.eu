import { readFile } from 'node:fs/promises';

const css = await readFile('src/styles/tokens.css', 'utf8');
const darkBlock = css.match(/:root\s*\{([\s\S]*?)\}/)?.[1] ?? '';
const lightBlock = css.match(/:root\[data-theme='light'\]\s*\{([\s\S]*?)\}/)?.[1] ?? '';
const value = (block, token) =>
  block.match(new RegExp(`--${token}:\\s*(#[0-9a-f]{3,6})`, 'i'))?.[1];
const rgb = (hex) => {
  const raw = hex.slice(1);
  const full = raw.length === 3 ? [...raw].map((x) => x + x).join('') : raw;
  return [0, 2, 4].map((offset) => Number.parseInt(full.slice(offset, offset + 2), 16) / 255);
};
const luminance = (hex) =>
  rgb(hex)
    .map((channel) => (channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4))
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
const ratio = (a, b) => {
  const [high, low] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (high + 0.05) / (low + 0.05);
};

const errors = [];
for (const [theme, foregroundBlock, backgroundBlock] of [
  ['dark', darkBlock, darkBlock],
  ['light', lightBlock, lightBlock],
]) {
  const background = value(backgroundBlock, 'dv-surface-3');
  for (const token of ['dv-success', 'dv-warning', 'dv-error', 'dv-info']) {
    const foreground = value(foregroundBlock, token) ?? value(darkBlock, token);
    if (!foreground || !background) {
      errors.push(`${theme} ${token}: missing token`);
      continue;
    }
    const contrast = ratio(foreground, background);
    if (contrast < 4.5) errors.push(`${theme} ${token}: ${contrast.toFixed(2)}:1`);
    else console.log(`${theme} ${token}: ${contrast.toFixed(2)}:1`);
  }
}
if (errors.length) {
  console.error(`Badge contrast below WCAG AA:\n${errors.join('\n')}`);
  process.exit(1);
}
console.log('All semantic badge colors meet WCAG AA (>= 4.5:1).');
