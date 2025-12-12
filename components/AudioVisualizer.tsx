import React, { useEffect, useRef } from 'react';

interface Props {
  isActive: boolean;
  volume: number; // 0 to 1
}

const AudioVisualizer: React.FC<Props> = ({ isActive, volume }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const requestRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      if (!isActive) {
        // Draw a flat line
        ctx.beginPath();
        ctx.moveTo(0, centerY);
        ctx.lineTo(width, centerY);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();
        return;
      }

      // Draw Wave
      ctx.beginPath();
      ctx.moveTo(0, centerY);
      
      const amplitude = Math.max(10, volume * 500); // Scale up volume
      const frequency = 0.1;

      for (let x = 0; x < width; x++) {
        const y = centerY + Math.sin(x * frequency + Date.now() * 0.01) * amplitude * Math.sin(x / width * Math.PI);
        ctx.lineTo(x, y);
      }

      ctx.strokeStyle = '#FFFF00'; // High contrast yellow
      ctx.lineWidth = 4;
      ctx.stroke();

      requestRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, [isActive, volume]);

  return (
    <canvas 
      ref={canvasRef} 
      width={300} 
      height={100} 
      className="w-full h-24 rounded-lg bg-black/50 backdrop-blur-sm"
      aria-label={isActive ? "Audio Active" : "Audio Idle"}
      role="img"
    />
  );
};

export default AudioVisualizer;