'use strict';
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');

function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const stripped = raw.replace(/^\/\*[\s\S]*?\*\/\s*/, '');
  return JSON.parse(stripped);
}

function listFiles(dir, exts) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, exts));
    else if (exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

function extractSchemaLiquidSafe(file) {
  const content = fs.readFileSync(file, 'utf8');
  const m = content.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
  if (!m) return null;
  return JSON.parse(m[1]);
}

function extractTKeys(content) {
  const keys = new Set();
  const re = /['"]([^'"]+)['"]\s*\|\s*t\b/g;
  let m;
  while ((m = re.exec(content))) keys.add(m[1]);
  return [...keys];
}

function flattenKeys(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? prefix + '.' + k : k;
    if (v && typeof v === 'object' && !Array.isArray(v)) flattenKeys(v, key, out);
    else out[key] = v;
  }
  return out;
}

function stripSchemaBlock(content) {
  return content.replace(/\{%\s*schema\s*%\}[\s\S]*?\{%\s*endschema\s*%\}/g, '');
}

module.exports = { ROOT, readJson, listFiles, extractSchemaLiquidSafe, extractTKeys, flattenKeys, stripSchemaBlock };
