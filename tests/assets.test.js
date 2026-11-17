import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync, readdirSync } from 'node:fs';
import { artEntries, ART } from '../js/ui/assets.js';
import { MUSIC_URL } from '../js/audio.js';

const sw = readFileSync(new URL('../sw.js', import.meta.url), 'utf8');
const root = new URL('../', import.meta.url);

describe('illustrations et sons', () => {
  it('9 emplacements d’art : portrait, 5 chapitres, 3 règles', () => {
    assert.equal(artEntries().length, 9);
    assert.equal(Object.keys(ART.chapters).length, 5);
    assert.equal(Object.keys(ART.rules).length, 3);
  });

  it('une image « ready » existe dans assets/art et est dans le cache du service worker', () => {
    for (const e of artEntries()) {
      if (!e.ready) continue;
      assert.ok(existsSync(new URL(`assets/art/${e.file}`, root)), e.file);
      assert.ok(sw.includes(`./assets/art/${e.file}`), `sw.js : ${e.file}`);
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
