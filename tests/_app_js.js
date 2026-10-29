/* Extract the app script from index.html.
 *
 * index.html carries two inline <script> blocks: a small first-paint landing guard in
 * <head>, and the app itself just before </body>. The harnesses used to match
 * /<script>([\s\S]*?)<\/script>\s*<\/body>/, which starts at the head block and ends at the
 * app block, so the "app source" was both blocks glued together and `new Function` threw
 * "Unexpected token '<'". Pick the block that defines the track table instead of the first
 * one, and fail loudly if the marker ever moves.
 */
const fs = require('fs');
const path = require('path');

const APP_MARKER = /const TRACKS\s*=\s*\{/;

function appSource() {
  const file = path.join(__dirname, '..', 'index.html');
  const src = fs.readFileSync(file, 'utf8');
  const blocks = [...src.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  const app = blocks.filter(b => APP_MARKER.test(b)).sort((a, b) => b.length - a.length)[0];
  if (!app) throw new Error('app inline script (const TRACKS = {) not found in ' + file);
  return { src, js: app, blocks: blocks.length };
}

module.exports = appSource;
