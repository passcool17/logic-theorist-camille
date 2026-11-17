import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { artEntries, ART } from '../js/ui/assets.js';
import { MUSIC_URL } from '../js/audio.js';

/** Taille d’un WebP (VP8X étendu ou VP8 avec perte). */
function webpSize(buf) {
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
  if (kind === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
  throw new Error(`WebP inattendu : ${kind}`);
}

const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const root = new URL('../', import.meta.url);

describe('illustrations et sons', () => {
  it('11 images peintes : héros, tête, 4 humeurs, 5 chapitres', () => {
    assert.equal(artEntries().length, 11);
    assert.equal(Object.keys(ART.chapters).length, 5);
    assert.deepEqual(Object.keys(ART.moods), ['idle', 'thinking', 'happy', 'oops']);
  });

  it('chaque image existe, a sa vraie taille déclarée, et est dans le précache', () => {
    let total = 0;
    for (const e of artEntries()) {
      const url = new URL(`assets/art/${e.file}`, root);
      assert.ok(existsSync(url), e.file);
      const buf = readFileSync(url);
      const [w, h] = webpSize(buf);
      assert.deepEqual([w, h], [e.w, e.h], e.file);
      assert.ok(sw.includes(`'./assets/art/${e.file}'`), `sw.js : ${e.file}`);
      total += buf.length;
    }
    assert.ok(total < 420_000, `${total} octets d’images`);
  });

  it('les icônes de règles sont en ligne et suivent currentColor', async () => {
    const { RULE_ICONS } = await import('../js/ui/art.js');
    for (const k of ['substitution', 'detachment', 'chain']) {
      assert.match(RULE_ICONS[k], /currentColor/);
      assert.match(RULE_ICONS[k], /aria-hidden="true"/);
    }
  });

  it('la musique existe, reste légère et est en cache', () => {
    const path = new URL(MUSIC_URL, root);
    assert.ok(existsSync(path));
    assert.ok(statSync(path).size < 260_000, `${statSync(path).size} octets`);
    assert.ok(sw.includes(MUSIC_URL));
  });

  it('versions alignées : sw CACHE, index.html ?v= et APP_VERSION', () => {
    const cache = sw.match(/const CACHE = '([^']+)'/)[1];
    const html = readFileSync(new URL('index.html', root), 'utf8');
    const main = readFileSync(new URL('js/main.js', root), 'utf8');
    assert.equal(cache, 'lt-camille-v9');
    assert.ok(main.includes(`const APP_VERSION = '${cache}'`));
    for (const m of html.matchAll(/\?v=([\w-]+)/g)) assert.equal(m[1], cache);
    for (const m of sw.matchAll(/\?v=([\w-]+)/g)) assert.equal(m[1], cache);
  });

  it('chaque module JS est versionné (import map) et dans le précache', () => {
    const html = readFileSync(new URL('index.html', root), 'utf8');
    const map = JSON.parse(html.match(/<script type="importmap">([\s\S]*?)<\/script>/)[1]).imports;
    const files = readdirSync(new URL('js/', root), { recursive: true })
      .filter((f) => f.endsWith('.js'))
      .map((f) => `./js/${f.split('\\').join('/')}`);
    assert.ok(files.length >= 14);
    for (const f of files) {
      const versioned = `${f}?v=lt-camille-v9`;
      assert.ok(sw.includes(`'${versioned}'`), `sw.js : ${versioned}`);
      if (!f.endsWith('/main.js')) assert.equal(map[f], versioned, `import map : ${f}`);
    }
  });
});
