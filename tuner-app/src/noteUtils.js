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
  const octave = Math.floor(roundedN / 12);

  return `${NOTES[normalizedNoteIndex]}${octave}`;
}