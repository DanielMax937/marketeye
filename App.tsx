import React, { useState, useCallback } from 'react';
import { useGeminiLive } from './hooks/useGeminiLive';
import CameraView from './components/CameraView';
import AudioVisualizer from './components/AudioVisualizer';
import { AppState } from './types';

const App: React.FC = () => {
  const { 
    status, 
    error: sessionError, 
    connect, 
    disconnect, 
    videoElementRef, 
    canvasRef,
    volume 
  } = useGeminiLive();

  const [cameraPermission, setCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string>("");
  const [cameraTrigger, setCameraTrigger] = useState<number>(0);

  const handleToggle = () => {
    if (status === AppState.ACTIVE || status === AppState.CONNECTING) {
      disconnect();
    } else {
      connect();
    }
  };

  const handleRetryCamera = () => {
    setCameraTrigger(prev => prev + 1);
  };

  const onPermissionUpdate = useCallback((allowed: boolean, errorMsg?: string) => {
    setCameraPermission(allowed);
    if (errorMsg) setCameraError(errorMsg);
  }, []);

  const isActive = status === AppState.ACTIVE;
  const isConnecting = status === AppState.CONNECTING;

  // Compute Accessible Label
  let buttonLabel = "Start Market Eye Session";
  if (isConnecting) buttonLabel = "Connecting to Market Eye";
  if (isActive) buttonLabel = "Stop Market Eye Session";

  return (
    <main className="relative w-full h-screen bg-black text-yellow-300 overflow-hidden font-sans">
      {/* Background Camera */}
      <CameraView 
        videoRef={videoElementRef} 
        canvasRef={canvasRef} 
        onPermissionUpdate={onPermissionUpdate}
        trigger={cameraTrigger}
      />

      {/* Camera Permission Error Overlay - Z-Index 50 to be on top */}
      {cameraPermission === false && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-6 text-center space-y-6">
          <div className="p-4 bg-red-900/30 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Camera Access Required</h2>
            <p className="text-gray-300 max-w-xs mx-auto">
              MarketEye needs camera access to help identify products and read labels.
            </p>
            {cameraError && (
              <p className="mt-2 text-sm text-red-400 font-mono bg-red-900/20 p-2 rounded inline-block">
                {cameraError}
              </p>
            )}
          </div>
          <button 
            onClick={handleRetryCamera}
            className="px-8 py-4 bg-yellow-500 text-black font-bold text-lg rounded-full hover:bg-yellow-400 transition-all transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-yellow-200 shadow-lg shadow-yellow-500/20"
          >
            Enable Camera
          </button>
        </div>
      )}

      {/* Main App Overlay - Only visible if camera is working */}
      {cameraPermission === true && (
        <div className="absolute inset-0 z-10 flex flex-col justify-between p-6 pointer-events-none">
          
          {/* Header */}
          <header className="flex justify-between items-center bg-black/60 p-4 rounded-xl backdrop-blur-md pointer-events-auto border border-white/10">
            <h1 className="text-3xl font-bold tracking-tight text-white">MarketEye</h1>
            <div className="flex items-center space-x-2">
              <div 
                className={`w-3 h-3 rounded-full ${isActive ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} 
                aria-label={isActive ? "System Online" : "System Offline"} 
              />
              <span className="text-xs font-bold text-white uppercase tracking-wider opacity-80">
                {status}
              </span>
            </div>
          </header>

          {/* Session Error Message */}
          {sessionError && (
            <div role="alert" className="bg-red-900/90 border-l-4 border-red-500 text-white p-4 rounded mb-4 pointer-events-auto shadow-lg animate-fade-in">
              <p className="font-bold">Connection Error</p>
              <p>{sessionError}</p>
            </div>
          )}

          {/* Controls Container */}
          <div className="flex flex-col gap-8 items-center justify-end pb-8 pointer-events-auto">
            
            {/* Visualizer */}
            <div className="w-full max-w-md">
              <AudioVisualizer isActive={isActive} volume={volume} />
            </div>

            {/* Main Action Button */}
            <div className="relative group">
              {/* Ripple Effect */}
              {isActive && (
                <div className="absolute top-0 left-0 w-full h-full rounded-full bg-red-500 animate-ping opacity-20"></div>
              )}
              
              <button
                onClick={handleToggle}
                disabled={isConnecting}
                aria-label={buttonLabel}
                className={`
                  relative w-32 h-32 rounded-full flex items-center justify-center 
                  transition-all duration-300 shadow-2xl border-4
                  ${isActive 
                    ? 'bg-red-600 border-red-400 shadow-red-900/50 hover:bg-red-700' 
                    : 'bg-yellow-400 border-yellow-200 shadow-yellow-900/50 hover:bg-yellow-300 hover:scale-105'
                  }
                  ${isConnecting ? 'opacity-80 cursor-wait' : 'cursor-pointer'}
                `}
              >
                <svg 
                  xmlns="http://www.w3.org/2000/svg" 
                  className={`w-14 h-14 ${isActive ? 'text-white' : 'text-black'}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor" 
                  strokeWidth={2.5}
                >
                  {isActive ? (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  )}
                  {!isActive && (
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
              </button>
            </div>
            
            <p className="text-lg font-bold bg-black/70 px-6 py-3 rounded-full backdrop-blur-md text-white border border-white/10 shadow-xl">
              {isActive ? "Listening & Watching..." : "Tap to Start"}
            </p>
          </div>
        </div>
      )}
    </main>
  );
};

export default App;