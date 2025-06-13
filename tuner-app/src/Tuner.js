// src/Tuner.js

import React, { useEffect, useState, useRef } from "react";
import { getNoteFromFrequency } from "./noteUtils";
import './Tuner.css';

export default function Tuner() {
  const [note, setNote] = useState("-");
  const [frequency, setFrequency] = useState(0);
  const [error, setError] = useState("");
  const [isTunerStarted, setIsTunerStarted] = useState(false); // Novo estado para controlar se o afinador está ativo

  // Usamos useRef para manter as referências ao AudioContext e stream
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameIdRef = useRef(null);
  const streamRef = useRef(null);

  // A lógica de inicialização de áudio agora está numa função separada
  const startTuner = async () => {
    // Se o afinador já estiver iniciado ou se houver um erro, não faz nada
    if (isTunerStarted || error) return;

    setError(""); // Limpa quaisquer erros anteriores
    console.log("Tentando iniciar o afinador...");
    try {
      // Cria AudioContext apenas se não existir ou estiver fechado
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      }

      // Garante que o contexto está no estado 'running'
      // Este .resume() é crucial e agora é chamado APÓS um user gesture (o clique do botão)
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
        console.log("AudioContext resumido.");
      }

      console.log("AudioContext criado e estado:", audioContextRef.current.state);

      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;

      console.log("Pedindo acesso ao microfone...");
      // Pede permissão para aceder ao microfone apenas uma vez
      if (!streamRef.current) {
        streamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      console.log("Acesso ao microfone concedido!");

      // Cria o nó de fonte de áudio a partir do MediaStream
      const source = audioContextRef.current.createMediaStreamSource(streamRef.current);
      source.connect(analyserRef.current);

      const buffer = new Float32Array(analyserRef.current.fftSize);

      const detectPitch = () => {
        analyserRef.current.getFloatTimeDomainData(buffer);

        //console.log("Buffer content (first 50 values):", buffer.slice(0, 50).map(val => val.toFixed(5)));
        //console.log("Max Buffer Value:", Math.max(...buffer));

        // --- APENAS PARA TESTE: AMPLIFICAR O SINAL ---
        const maxVal = Math.max(...buffer.map(Math.abs)); // Encontra o valor absoluto máximo
        if (maxVal > 0 && maxVal < 0.1) { // Se o sinal for baixo, amplifica
            const amplificationFactor = 0.5 / maxVal; // Tenta amplificar para ter um pico de 0.5
            for (let i = 0; i < buffer.length; i++) {
                buffer[i] *= amplificationFactor;
            }
            console.log("BUFFER AMPLIFICADO! Novo Max Val:", Math.max(...buffer));
        }
        const freq = autoCorrelate(buffer, audioContextRef.current.sampleRate);

        if (freq !== -1) {
          setFrequency(freq.toFixed(2));
          setNote(getNoteFromFrequency(freq));
        } else {
          setNote("...");
          setFrequency(0);
        }
        animationFrameIdRef.current = requestAnimationFrame(detectPitch);
      };

      detectPitch();
      setIsTunerStarted(true); // Define que o afinador está iniciado
    } catch (err) {
      console.error("Erro ao iniciar o afinador:", err);
      // Verifica se o erro é de permissão negada
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError("Permissão do microfone negada. Por favor, permita o acesso e clique em 'Iniciar Afinador' novamente.");
      } else if (err.name === 'NotFoundError') {
        setError("Nenhum dispositivo de microfone encontrado.");
      } else {
        setError(`Erro ao aceder ao microfone: ${err.message}.`);
      }
      setNote("ERRO");
      setFrequency(0);
      setIsTunerStarted(false); // Garante que o estado de iniciado é falso em caso de erro
    }
  };

  // useEffect para a limpeza de recursos quando o componente é desmontado
  useEffect(() => {
    // A lógica de inicialização agora é feita pelo clique do botão,
    // então este useEffect é apenas para a limpeza.
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
  }, []); // O array vazio assegura que o useEffect corre apenas uma vez ao montar/desmontar

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
        </>
      )}
      {!isTunerStarted && error && (
          <p>Clique no botão acima para tentar novamente.</p>
      )}
    </div>
  );
}

// Algoritmo de autocorrelação simples para detecção de pitch
function autoCorrelate(buffer, sampleRate) {
  let SIZE = buffer.length;
  let bestOffset = -1;
  let rms = 0;

  for (let i = 0; i < SIZE; i++) {
    let val = buffer[i];
    rms += val * val;
  }
  rms = Math.sqrt(rms / SIZE);
  // console.log("Valor de RMS:", rms);
  if (rms < 0.01) return -1;

  let lastCorrelation = 1;
  for (let offset = 1; offset < SIZE; offset++) {
    let correlation = 0;
    for (let i = 0; i < SIZE - offset; i++) {
      correlation += buffer[i] * buffer[i + offset];
    }
    correlation = correlation / (SIZE - offset);

    console.log(`Offset: ${offset}, Correlation: ${correlation.toFixed(3)}`);

    if (correlation > 0.1 && correlation > lastCorrelation) {
      bestOffset = offset;
    }
    lastCorrelation = correlation;
  }

  console.log("Resultado final autoCorrelate: bestOffset =", bestOffset, ", sampleRate =", sampleRate);
  if (bestOffset === -1) return -1;
  return sampleRate / bestOffset;
}