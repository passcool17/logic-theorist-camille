import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { followCamOffset, MAX_PITCH, WALK_PITCH, proofFocusY } from '../js/3d/camera.js';

describe('camera trois-quarts', () => {
  it('borne le pitch même si on demande une plongée verticale', () => {
    const o = followCamOffset({ dist: 20, pitch: 1.4, yaw: 0, targetY: 1 });
    assert.equal(o.pitch, MAX_PITCH);
    assert.ok(o.y < 14, `hauteur trop haute: ${o.y}`);
    assert.ok(o.y > 8, `hauteur trop basse: ${o.y}`);
  });

  it('WALK_PITCH produit un angle stable (~18°)', () => {
    const o = followCamOffset({ dist: 20, pitch: WALK_PITCH, yaw: 0.55, targetY: 1 });
    assert.equal(o.pitch, WALK_PITCH);
    const angle = Math.atan((o.y - 1) / 20);
    assert.ok(Math.abs(angle - WALK_PITCH) < 1e-9);
    assert.ok(o.y < 9, `encore trop haut pour un trois-quarts: ${o.y}`);
  });

  it('proofFocusY monte avec le nombre de lignes sans dépasser 4.2', () => {
    assert.ok(proofFocusY(2) < proofFocusY(6));
    assert.equal(proofFocusY(99), 4.2);
  });
});
