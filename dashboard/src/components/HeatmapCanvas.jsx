import { useEffect, useRef } from 'react';

const GRADIENT_STOPS = [
  { stop: 0.0, color: [0, 0, 0, 0] },
  { stop: 0.2, color: [37, 99, 235, 140] }, // blue
  { stop: 0.4, color: [16, 185, 129, 170] }, // teal/green
  { stop: 0.6, color: [234, 179, 8, 190] }, // yellow
  { stop: 0.8, color: [249, 115, 22, 210] }, // orange
  { stop: 1.0, color: [239, 68, 68, 235] }, // red
];

function buildColorLookup() {
  const lookup = new Uint8ClampedArray(256 * 4);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;

    let lower = GRADIENT_STOPS[0];
    let upper = GRADIENT_STOPS[GRADIENT_STOPS.length - 1];
    for (let s = 0; s < GRADIENT_STOPS.length - 1; s++) {
      if (t >= GRADIENT_STOPS[s].stop && t <= GRADIENT_STOPS[s + 1].stop) {
        lower = GRADIENT_STOPS[s];
        upper = GRADIENT_STOPS[s + 1];
        break;
      }
    }
    const range = upper.stop - lower.stop || 1;
    const localT = (t - lower.stop) / range;

    for (let c = 0; c < 4; c++) {
      lookup[i * 4 + c] = lower.color[c] + (upper.color[c] - lower.color[c]) * localT;
    }
  }
  return lookup;
}

const COLOR_LOOKUP = buildColorLookup();

export default function HeatmapCanvas({ points, width, height, radius = 32, intensity = 0.55 }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    if (!points || points.length === 0) return;

    // Pass 1: build the grayscale heat buffer offscreen.
    const heatCanvas = document.createElement('canvas');
    heatCanvas.width = width;
    heatCanvas.height = height;
    const heatCtx = heatCanvas.getContext('2d');

    for (const p of points) {
      const grad = heatCtx.createRadialGradient(p.cx, p.cy, 0, p.cx, p.cy, radius);
      grad.addColorStop(0, `rgba(0,0,0,${intensity})`);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      heatCtx.fillStyle = grad;
      heatCtx.fillRect(p.cx - radius, p.cy - radius, radius * 2, radius * 2);
    }

    // Pass 2: recolor the alpha channel through the gradient lookup table.
    const imageData = heatCtx.getImageData(0, 0, width, height);
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const alpha = data[i + 3];
      if (alpha === 0) continue;
      const lookupIdx = alpha * 4;
      data[i] = COLOR_LOOKUP[lookupIdx];
      data[i + 1] = COLOR_LOOKUP[lookupIdx + 1];
      data[i + 2] = COLOR_LOOKUP[lookupIdx + 2];
      data[i + 3] = COLOR_LOOKUP[lookupIdx + 3];
    }
    heatCtx.putImageData(imageData, 0, 0);

    // Draw the recolored buffer onto the visible (DPR-scaled) canvas.
    ctx.drawImage(heatCanvas, 0, 0, width, height);
  }, [points, width, height, radius, intensity]);

  return <canvas ref={canvasRef} className="heatmap-density-canvas" />;
}
