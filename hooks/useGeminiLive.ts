import { useState, useEffect, useRef, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { 
  GEMINI_API_KEY, 
  MODEL_NAME, 
  SYSTEM_INSTRUCTION, 
  INPUT_SAMPLE_RATE, 
  OUTPUT_SAMPLE_RATE,
  VIDEO_FRAME_RATE,
  JPEG_QUALITY 
} from '../constants';
import { AppState } from '../types';
import { pcmToBase64, decodeAudioData, base64ToUint8Array, blobToBase64 } from '../utils/audio';

// Define LiveSession as any since it is not exported by the SDK
type LiveSession = any;

export const useGeminiLive = () => {
  const [status, setStatus] = useState<AppState>(AppState.IDLE);
  const [error, setError] = useState<string | null>(null);
  const [volume, setVolume] = useState<number>(0); // For visualizer

  // Refs for managing session state without re-renders
  const sessionRef = useRef<LiveSession | null>(null);
  const sessionPromiseRef = useRef<Promise<LiveSession> | null>(null);
  
  // Audio Contexts
  const inputContextRef = useRef<AudioContext | null>(null);
  const outputContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodeRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const processorNodeRef = useRef<ScriptProcessorNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  // Video Stream Refs
  const videoIntervalRef = useRef<number | null>(null);
  const videoElementRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const cleanupAudio = useCallback(() => {
    if (processorNodeRef.current) {
      processorNodeRef.current.disconnect();
      processorNodeRef.current = null;
    }
    if (sourceNodeRef.current) {
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current = null;
    }
    if (inputContextRef.current) {
      inputContextRef.current.close();
      inputContextRef.current = null;
    }
    if (outputContextRef.current) {
      outputContextRef.current.close();
      outputContextRef.current = null;
    }
  }, []);

  const cleanupVideo = useCallback(() => {
    if (videoIntervalRef.current) {
      window.clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
  }, []);

  const disconnect = useCallback(async () => {
    console.log("Disconnecting session...");
    setStatus(AppState.IDLE);
    
    // Stop video loop
    cleanupVideo();

    // Close session
    if (sessionRef.current) {
      try {
        // Use session.close() as per guidelines
        sessionRef.current.close();
      } catch (e) {
        console.warn("Error closing session", e);
      }
      sessionRef.current = null;
      sessionPromiseRef.current = null;
    }

    // Stop audio
    cleanupAudio();
    
    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  }, [cleanupAudio, cleanupVideo]);

  const connect = useCallback(async () => {
    if (!GEMINI_API_KEY) {
      setError("API Key not found");
      return;
    }

    setStatus(AppState.CONNECTING);
    setError(null);

    // Haptic feedback
    if (navigator.vibrate) navigator.vibrate(200);

    try {
      // 1. Setup Audio Input
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: { 
          sampleRate: INPUT_SAMPLE_RATE,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: INPUT_SAMPLE_RATE,
      });
      inputContextRef.current = audioContext;

      // Audio Analysis for Visualizer
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      sourceNodeRef.current = source;
      
      const processor = audioContext.createScriptProcessor(4096, 1, 1);
      processorNodeRef.current = processor;

      source.connect(analyser);
      analyser.connect(processor);
      processor.connect(audioContext.destination);

      // 2. Setup Audio Output
      const outContext = new (window.AudioContext || (window as any).webkitAudioContext)({
        sampleRate: OUTPUT_SAMPLE_RATE,
      });
      outputContextRef.current = outContext;
      nextStartTimeRef.current = outContext.currentTime;

      // 3. Initialize Gemini Live Client
      const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: SYSTEM_INSTRUCTION,
          tools: [{ googleSearch: {} }], // Enable Search Grounding
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } }
          }
        },
        callbacks: {
          onopen: () => {
            console.log("Gemini Live Session Opened");
            setStatus(AppState.ACTIVE);
            if (navigator.vibrate) navigator.vibrate(50);
            
            // Start Video Streaming Loop
            if (videoElementRef.current && canvasRef.current) {
              const videoEl = videoElementRef.current;
              const canvasEl = canvasRef.current;
              const ctx = canvasEl.getContext('2d');

              videoIntervalRef.current = window.setInterval(() => {
                if (videoEl.readyState >= 2 && ctx) { // HAVE_CURRENT_DATA
                  canvasEl.width = videoEl.videoWidth / 2; // Downscale for bandwidth
                  canvasEl.height = videoEl.videoHeight / 2;
                  ctx.drawImage(videoEl, 0, 0, canvasEl.width, canvasEl.height);
                  
                  canvasEl.toBlob(async (blob) => {
                    if (blob && sessionPromiseRef.current) {
                      const base64Data = await blobToBase64(blob);
                      const session = await sessionPromiseRef.current;
                      session.sendRealtimeInput({
                        media: { 
                          mimeType: 'image/jpeg', 
                          data: base64Data 
                        }
                      });
                    }
                  }, 'image/jpeg', JPEG_QUALITY);
                }
              }, 1000 / VIDEO_FRAME_RATE);
            }
          },
          onmessage: async (message: LiveServerMessage) => {
            // Handle Audio Output
            const audioData = message.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            if (audioData && outputContextRef.current) {
              const ctx = outputContextRef.current;
              const audioBytes = base64ToUint8Array(audioData);
              const audioBuffer = await decodeAudioData(audioBytes, ctx, OUTPUT_SAMPLE_RATE);
              
              // Simple scheduler to play audio chunks in sequence
              const now = ctx.currentTime;
              // If next start time is in the past, reset it to now (handling buffering delays)
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, now);
              
              const source = ctx.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(ctx.destination);
              source.start(nextStartTimeRef.current);
              
              nextStartTimeRef.current += audioBuffer.duration;
            }

            // Handle Turn Completion / Interruption logic if needed
            // The prompt asks for barge-in, which is largely handled by echoCancellation 
            // and the fact that we keep sending input.
            // If the model sends an interruption signal, we should clear the audio queue.
            if (message.serverContent?.interrupted) {
               // In a real app, we would stop currently playing nodes. 
               // For this simpler implementation, we reset the time cursor.
               if(outputContextRef.current) {
                 nextStartTimeRef.current = outputContextRef.current.currentTime;
               }
            }
          },
          onclose: () => {
            console.log("Session closed by server");
            disconnect();
          },
          onerror: (err) => {
            console.error("Session error:", err);
            setError("Connection error. Please try again.");
            disconnect();
          }
        }
      });

      sessionPromiseRef.current = sessionPromise;
      
      // Wait for session to be ready before setting ref (though we use the promiseRef mainly)
      sessionPromise.then(sess => {
        sessionRef.current = sess;
      });

      // 4. Start Audio Streaming in the processor loop
      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        // Only send if connected
        if (sessionPromiseRef.current) {
           const b64 = pcmToBase64(inputData);
           sessionPromiseRef.current.then(session => {
             session.sendRealtimeInput({
               media: {
                 mimeType: `audio/pcm;rate=${INPUT_SAMPLE_RATE}`,
                 data: b64
               }
             });
           });
           
           // Calculate volume for visualizer
           let sum = 0;
           for(let i=0; i<inputData.length; i++) {
             sum += inputData[i] * inputData[i];
           }
           const rms = Math.sqrt(sum / inputData.length);
           setVolume(rms);
        }
      };

    } catch (err: any) {
      console.error("Failed to connect:", err);
      setError(err.message || "Failed to initialize MarketEye");
      setStatus(AppState.ERROR);
      cleanupAudio();
    }
  }, [cleanupAudio, cleanupVideo, disconnect]);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    status,
    error,
    connect,
    disconnect,
    videoElementRef,
    canvasRef,
    volume,
    analyser: analyserRef.current
  };
};