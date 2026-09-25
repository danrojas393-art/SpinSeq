(function () {
  'use strict';

  const alphabet = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'Ñ', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];
  function shuffled(values, seed) {
    const result = values.slice();
    let state = seed;
    for (let index = result.length - 1; index > 0; index -= 1) {
      state = (state * 1664525 + 1013904223) >>> 0;
      const swapIndex = state % (index + 1);
      [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
    }
    return result;
  }

  function makeLevel(number, title, tokens, ringCount, speed, nightmare) {
    const sequence = tokens.slice().sort((first, second) => first.value - second.value);
    return { number, title, tokens, sequence, ringCount, speed, nightmare: Boolean(nightmare) };
  }

  function numericTokens(count, seed) {
    return shuffled(Array.from({ length: count }, (_, index) => {
      const value = index + 1;
      return { label: String(value), value };
    }), seed);
  }

  function initLevels() {
    const levels = [];
    for (let number = 1; number <= 2; number += 1) {
      levels.push(makeLevel(number, 'Cadena numérica', numericTokens(25, number * 701), 3, 0.12, false));
    }
    for (let number = 3; number <= 5; number += 1) {
      levels.push(makeLevel(number, 'Alfabeto fragmentado', shuffled(alphabet.slice(0, 16).map((label, index) => ({ label, value: index + 1 })), number * 701), 3, 0.16 + number * 0.01, false));
    }
    for (let number = 6; number <= 9; number += 1) {
      const tokens = shuffled(Array.from({ length: 27 }, (_, index) => {
        const value = index + 1;
        const useLetter = (index + number) % 2 === 0;
        return { label: useLetter ? alphabet[index] : String(value), value };
      }), number * 701);
      levels.push(makeLevel(number, 'Código dual', tokens, 3, 0.19 + (number - 6) * 0.012, false));
    }
    for (let number = 10; number <= 19; number += 1) {
      const count = 50 + (number - 10) * 5;
      levels.push(makeLevel(number, number >= 15 ? 'Modo pesadilla' : 'Escalada numérica', numericTokens(count, number * 701), 3, number >= 15 ? 0.42 + (number - 15) * 0.035 : 0.24 + (number - 10) * 0.02, number >= 15));
    }
    levels.push(makeLevel(20, 'Pesadilla final', numericTokens(100, 20 * 701), 5, 0.9, true));
    return levels;
  }

  window.SPINSEQ_LEVELS = initLevels();
}());