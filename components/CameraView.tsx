import React, { useEffect, useCallback } from 'react';

interface Props {
  videoRef: React.RefObject<HTMLVideoElement>;
  canvasRef: React.RefObject<HTMLCanvasElement>;
  onPermissionUpdate: (hasPermission: boolean, errorMsg?: string) => void;
  trigger: number;
}

const CameraView: React.FC<Props> = ({ videoRef, canvasRef, onPermissionUpdate, trigger }) => {
  const startCamera = useCallback(async () => {
    try {
      // Try environment camera first
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
      } catch (envErr) {
        console.warn("Environment camera failed, falling back to default:", envErr);
        // Fallback to any available video source
        stream = await navigator.mediaDevices.getUserMedia({
          video: true
        });
      }

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().catch(e => console.error("Play error:", e));
        };
        onPermissionUpdate(true);
      }
    } catch (err: any) {
      console.error("Camera access denied:", err);
      onPermissionUpdate(false, err.message || "Permission denied");
    }
  }, [videoRef, onPermissionUpdate]);

  // Attempt to start camera when trigger changes or on mount
  useEffect(() => {
    startCamera();

    return () => {
      // Cleanup tracks
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [trigger, startCamera, videoRef]);

  return (
    <div className="absolute inset-0 z-0 bg-gray-900 overflow-hidden" aria-hidden="true">
      <video
        ref={videoRef}
        playsInline
        muted
        className="w-full h-full object-cover opacity-80"
      />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;