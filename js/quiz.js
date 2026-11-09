/** Logique quiz : mauvaise réponse → réessai direct, sans verrouiller. */

export const RETRY_MSG = 'Réessaie — ce n’est pas tout à fait ça.';

/**
 * Applique un choix de quiz.
 * @param {{ choice: { id: string, ok: boolean }, explain: string }} args
 * @returns {{
 *   quizAnswered: string|null,
 *   quizWrong: string|null,
 *   message: string,
 *   choicesLocked: boolean,
 *   canAdvance: boolean,
 * }}
 */
export function applyQuizChoice({ choice, explain }) {
  if (choice.ok) {
    return {
      quizAnswered: choice.id,
      quizWrong: null,
      message: explain,
      choicesLocked: true,
      canAdvance: true,
    };
  }
  return {
    quizAnswered: null,
    quizWrong: choice.id,
    message: RETRY_MSG,
    choicesLocked: false,
    canAdvance: false,
  };
}

export function quizCanAdvance(quizAnswered, choices) {
  const correct = choices.find((c) => c.ok);
  return !!correct && quizAnswered === correct.id;
}
