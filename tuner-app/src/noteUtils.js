// src/noteUtils.js

const A4_FREQ = 440;
const C0_FREQ = A4_FREQ * Math.pow(2, -4.75); // Frequência do C0 (aproximadamente 16.35 Hz)

const NOTES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function getNoteFromFrequency(frequency) {
  if (frequency <= 0) {
    return "-";
  }

  const n = 12 * Math.log2(frequency / C0_FREQ);
  const roundedN = Math.round(n);
  const noteIndex = roundedN % 12;
  const normalizedNoteIndex = noteIndex < 0 ? noteIndex + 12 : noteIndex;
  // const octave = Math.floor(roundedN / 12); // Esta linha deve estar comentada ou removida

  return `${NOTES[normalizedNoteIndex]}`;
}

/**
 * Calcula o desvio em cents da frequência atual em relação à nota mais próxima.
 * @param {number} frequency - A frequência detetada.
 * @returns {number} O desvio em cents (-50 a +50, aproximadamente). Retorna 0 se frequency <= 0.
 */
export function getCentOffset(frequency) {
  if (frequency <= 0) {
    return 0; // Se não houver frequência, consideramos 0 cents de desvio
  }

  // Encontra a frequência exata da nota mais próxima
  const n = 12 * Math.log2(frequency / C0_FREQ);
  const exactNoteFreq = C0_FREQ * Math.pow(2, Math.round(n) / 12);

  // Calcula o desvio em cents
  // Fórmula: 1200 * log2(frequência_atual / frequência_alvo)
  const cents = 1200 * Math.log2(frequency / exactNoteFreq);

  // Limita os cents entre -50 e 50 para uma visualização clara na barra
  return Math.max(-50, Math.min(50, cents));
}