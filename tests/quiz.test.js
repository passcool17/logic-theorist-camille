import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { applyQuizChoice, quizCanAdvance, RETRY_MSG } from '../js/quiz.js';

const page = {
  explain: 'Bravo ! Bonne réponse.',
  choices: [
    { id: 'a', text: 'mauvaise', ok: false },
    { id: 'b', text: 'bonne', ok: true },
    { id: 'c', text: 'autre mauvaise', ok: false },
  ],
};

describe('quiz retry', () => {
  it('après une mauvaise réponse : pas de verrouillage, message Réessaie, Terminer inactif', () => {
    const r = applyQuizChoice({ choice: page.choices[0], explain: page.explain });
    assert.equal(r.choicesLocked, false, 'les choix restent cliquables');
    assert.equal(r.canAdvance, false);
    assert.equal(r.quizAnswered, null, 'ne fige pas la mauvaise réponse comme finale');
    assert.match(r.message, /Réessaie/i);
    assert.equal(r.message, RETRY_MSG);
    assert.equal(quizCanAdvance(r.quizAnswered, page.choices), false);
  });

  it('après la bonne réponse (même après une erreur) : avance possible et choix verrouillés', () => {
    const wrong = applyQuizChoice({ choice: page.choices[0], explain: page.explain });
    assert.equal(wrong.choicesLocked, false);
    const right = applyQuizChoice({ choice: page.choices[1], explain: page.explain });
    assert.equal(right.choicesLocked, true);
    assert.equal(right.canAdvance, true);
    assert.equal(right.quizAnswered, 'b');
    assert.equal(right.message, page.explain);
    assert.equal(quizCanAdvance(right.quizAnswered, page.choices), true);
  });
});
