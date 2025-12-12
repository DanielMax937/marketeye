import React, { useEffect, useState } from 'react';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
}

const CameraView: React.FC<Props> = ({ videoRef, canvasRef }) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment', // Rear camera preferred
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setHasPermission(true);
        }
      } catch (err) {
        console.error("Camera access denied:", err);
        setHasPermission(false);
      }
    };

    startCamera();

    return () => {
      // Cleanup tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoRef]);

  return (
    <div className="absolute inset-0 z-0 bg-gray-900 overflow-hidden" aria-hidden="true">
      {!hasPermission && (
        <div className="flex items-center justify-center h-full text-white text-xl p-4 text-center font-bold">
          Camera permission required for MarketEye.
        </div>
      )}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;