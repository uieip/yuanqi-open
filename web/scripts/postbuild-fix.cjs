/**
 * Post-build fix script
 * Replace raw Unicode characters «»""'' in the built UMD file with
 * escape sequences (\xAB\xBB\u201C\u201D\u2018\u2019) to prevent
 * encoding issues when loaded via <script> tags in HTML pages.
 */
const fs = require('fs');
const path = require('path');

const umdPath = path.resolve(__dirname, 'yqwin/yqwin-plus.umd.js');

let content = fs.readFileSync(umdPath, 'utf8');

// Only the specific characters used in CodeMirror GFM urlRE regex
const replacements = [
  { char: '\u00AB', esc: '\\xAB' },   // «
  { char: '\u00BB', esc: '\\xBB' },   // »
  { char: '\u201C', esc: '\\u201C' }, // "
  { char: '\u201D', esc: '\\u201D' }, // "
  { char: '\u2018', esc: '\\u2018' }, // '
  { char: '\u2019', esc: '\\u2019' }, // '
];

let replacedCount = 0;
for (const { char, esc } of replacements) {
  const regex = new RegExp(char.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  const newContent = content.replace(regex, esc);
  const count = ((content.match(regex) || []).length);
  if (count > 0) {
    console.log(`  Replaced ${count} occurrences of U+${char.charCodeAt(0).toString(16).toUpperCase()} with ${esc}`);
    replacedCount += count;
  }
  content = newContent;
}

fs.writeFileSync(umdPath, content);
console.log(`\nDone. Replaced ${replacedCount} character(s) in ${path.relative(path.resolve(__dirname, '..'), umdPath)}`);
