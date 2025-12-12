import React from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import CameraView from './components/CameraView';
import AudioVisualizer from './components/AudioVisualizer';
import { AppState } from './types';

const App: React.FC = () => {
  const { 
    status, 
    error, 
    connect, 
    disconnect, 
    videoElementRef, 
    canvasRef,
    volume 
  } = useGeminiLive();

  const handleToggle = () => {
    if (status === AppState.ACTIVE || status === AppState.CONNECTING) {
      disconnect();
    } else {
      connect();
    }
  };

  const isActive = status === AppState.ACTIVE;
  const isConnecting = status === AppState.CONNECTING;

  // Compute Accessible Label
  let buttonLabel = "Start Market Eye Session";
  if (isConnecting) buttonLabel = "Connecting to Market Eye";
  if (isActive) buttonLabel = "Stop Market Eye Session";

  return (
    <main className="relative w-full h-screen bg-black text-yellow-300 overflow-hidden font-sans">
      {/* Background Camera */}
      <CameraView videoRef={videoElementRef} canvasRef={canvasRef} />

      {/* Accessible Overlay */}
      <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 pointer-events-none">
        
        {/* Header */}
        <header className="flex justify-between items-center bg-black/70 p-4 rounded-xl backdrop-blur-md pointer-events-auto">
          <h1 className="text-3xl font-bold tracking-tight text-white">MarketEye</h1>
          <div className="flex items-center space-x-2">
            <div 
              className={`w-4 h-4 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} 
              aria-label={isActive ? "System Online" : "System Offline"} 
            />
            <span className="text-sm font-semibold text-white uppercase tracking-wider">
              {status}
            </span>
          </div>
        </header>

        {/* Error Message */}
        {error && (
          <div role="alert" className="bg-red-900/90 border-l-4 border-red-500 text-white p-4 rounded mb-4 pointer-events-auto">
            <p className="font-bold">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Controls Container */}
        <div className="flex flex-col gap-6 items-center justify-end pb-8 pointer-events-auto">
          
          {/* Visualizer */}
          <div className="w-full max-w-md">
            <AudioVisualizer isActive={isActive} volume={volume} />
          </div>

          {/* Main Action Button */}
          <button
            onClick={handleToggle}
            disabled={isConnecting}
            aria-label={buttonLabel}
            aria-live="polite"
            className={`
              relative group w-32 h-32 rounded-full flex items-center justify-center 
              transition-all duration-300 shadow-2xl
              focus:outline-none focus:ring-8 focus:ring-white focus:ring-offset-4 focus:ring-offset-black
              ${isActive 
                ? 'bg-red-600 hover:bg-red-700 shadow-red-900/50' 
                : 'bg-yellow-400 hover:bg-yellow-500 shadow-yellow-900/50 text-black'
              }
              ${isConnecting ? 'opacity-80 cursor-wait' : 'cursor-pointer'}
            `}
          >
            {/* Ping animation ring */}
            {isActive && (
              <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
            )}
            
            {/* Icon */}
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className={`w-16 h-16 ${isActive ? 'text-white' : 'text-black'}`}
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              {isActive ? (
                // Stop / Pause Icon
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
              ) : (
                // Eye Icon
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              )}
              {!isActive && (
                 <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              )}
            </svg>
          </button>
          
          <p className="text-xl font-bold bg-black/60 px-4 py-2 rounded-lg backdrop-blur-sm text-center">
            {isActive ? "Listening & Watching..." : "Double Tap to Start"}
          </p>
        </div>
      </div>
    </main>
  );
};

export default App;