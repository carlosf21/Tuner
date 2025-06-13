// src/Tuner.js

import React, { useEffect, useState, useRef } from "react";
import { getNoteFromFrequency, getCentOffset } from "./noteUtils";
import './Tuner.css';

export default function Tuner() {
  const [note, setNote] = useState("-");
  const [frequency, setFrequency] = useState(0);
  const [centOffset, setCentOffset] = useState(0);
  const [error, setError] = useState("");
  const [isTunerStarted, setIsTunerStarted] = useState(false);

  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const streamRef = useRef(null);

  const startTuner = async () => {
    if (isTunerStarted || error) return;

    setError("");
    console.log("Tentando iniciar o afinador...");
    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log("AudioContext resumido.");
      }

      console.log("AudioContext criado e estado:", audioContextRef.current.state);

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      console.log("Pedindo acesso ao microfone...");
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      console.log("Acesso ao microfone concedido!");

      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      source.connect(analyserRef.current);

      const buffer = new Float32Array(analyserRef.current.frequencyBinCount);

      const detectPitch = () => {
        analyserRef.current.getFloatFrequencyData(buffer);

        // Lógica de amplificação temporária
        const maxVal = Math.max(...buffer.map(Math.abs));
        if (maxVal > 0 && maxVal < 0.1) {
            const amplificationFactor = 0.5 / maxVal;
            for (let i = 0; i < buffer.length; i++) {
                buffer[i] *= amplificationFactor;
            }
            console.log("BUFFER AMPLIFICADO! Novo Max Val:", Math.max(...buffer));
        }

        const freq = calculateFrequencyFFT(buffer, audioContextRef.current.sampleRate, analyserRef.current.fftSize);

        if (freq !== -1) {
          setFrequency(freq.toFixed(2));
          setNote(getNoteFromFrequency(freq));
          setCentOffset(getCentOffset(freq));
        } else {
          setNote("...");
          setFrequency(0);
          setCentOffset(0);
        }
        animationFrameIdRef.current = requestAnimationFrame(detectPitch);
      };

      detectPitch();
      setIsTunerStarted(true);
    } catch (err) {
      console.error("Erro ao iniciar o afinador:", err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Permissão do microfone negada. Por favor, permita o acesso e clique em 'Iniciar Afinador' novamente.");
      } else if (err.name === 'NotFoundError') {
        setError("Nenhum dispositivo de microfone encontrado.");
      } else {
        setError(`Erro ao aceder ao microfone: ${err.message}.`);
      }
      setNote("ERRO");
      setFrequency(0);
      setCentOffset(0); 
      setIsTunerStarted(false);
    }
  };

  useEffect(() => {
    return () => {
      console.log("Limpando recursos de áudio...");
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close().then(() => {
          console.log("AudioContext fechado.");
        }).catch(e => console.error("Erro ao fechar AudioContext:", e));
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        console.log("Stream do microfone parado.");
      }
    };
  }, []);

  return (
    <div className="tuner-container">
      <h1>Afinador</h1>
      {error && <p className="error-message">{error}</p>}

      {!isTunerStarted && !error && (
        <button onClick={startTuner} className="start-button">
          Iniciar Afinador
        </button>
      )}

      {isTunerStarted && (
        <>
          <h2 className="note-display">Nota: {note}</h2>
          <h3 className="frequency-display">Frequência: {frequency} Hz</h3>

          <div className="tuner-bar-container">
            {/* Linha central mais proeminente */}
            <div className="center-line"></div>
            <div
              className="tuner-pointer"
              style={{
                transform: `translateX(calc(-50% + ${centOffset * 0.9}%))`,
                backgroundColor: Math.abs(centOffset) < 5 ? '#4CAF50' : '#f44336'
              }}
            ></div>
          </div>
        </>
      )}
      {!isTunerStarted && error && (
          <p>Clique no botão acima para tentar novamente.</p>
      )}
    </div>
  );
}

// ALGORITMO DE CÁLCULO DE FREQUÊNCIA BASEADO EM FFT
function calculateFrequencyFFT(frequencyBuffer, sampleRate, fftSize) {
  const bufferLength = frequencyBuffer.length;
  const binWidth = sampleRate / fftSize;

  let maxAmplitude = -Infinity;
  let maxAmplitudeIndex = -1;

  const MIN_FREQ = 40;
  const MAX_FREQ = 1500;

  const startIndex = Math.floor(MIN_FREQ / binWidth);
  const endIndex = Math.ceil(MAX_FREQ / binWidth);

  const NOISE_THRESHOLD_DB = -70;

  for (let i = startIndex; i < endIndex && i < bufferLength; i++) {
    const amplitude = frequencyBuffer[i];
    if (amplitude > maxAmplitude) {
      maxAmplitude = amplitude;
      maxAmplitudeIndex = i;
    }
  }

  if (maxAmplitudeIndex === -1 || maxAmplitude < NOISE_THRESHOLD_DB) {
    return -1;
  }

  let detectedFrequency = maxAmplitudeIndex * binWidth;

  if (maxAmplitudeIndex > 0 && maxAmplitudeIndex < bufferLength - 1) {
    const y0 = frequencyBuffer[maxAmplitudeIndex - 1];
    const y1 = frequencyBuffer[maxAmplitudeIndex];
    const y2 = frequencyBuffer[maxAmplitudeIndex + 1];

    const p = 0.5 * (y0 - y2) / (y0 - 2 * y1 + y2);
    detectedFrequency = (maxAmplitudeIndex + p) * binWidth;
  }

  if (detectedFrequency < MIN_FREQ || detectedFrequency > MAX_FREQ) {
      return -1;
  }

  return detectedFrequency;
}