\"use client\";
import React, { useEffect, useMemo, useRef, useState } from 'react';

type Result = {
  imageUrl?: string;
  error?: string;
};

export default function Upload() {
  const [file, setFile] = useState<File | null>(null);
  const [prompt, setPrompt] = useState<string>('Ultra-realistic photo, soft natural light, cinematic shadows, photoreal textures');
  const [strength, setStrength] = useState<number>(0.6);
  const [seed, setSeed] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<Result>({});
  const [clientLight, setClientLight] = useState<number>(0.25);
  const [clientContrast, setClientContrast] = useState<number>(1.1);
  const [clientVignette, setClientVignette] = useState<number>(0.2);
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasInRef = useRef<HTMLCanvasElement>(null);
  const canvasOutRef = useRef<HTMLCanvasElement>(null);

  const imageUrl = useMemo(() => (file ? URL.createObjectURL(file) : undefined), [file]);

  useEffect(() => {
    return () => {
      if (imageUrl) URL.revokeObjectURL(imageUrl);
    };
  }, [imageUrl]);

  useEffect(() => {
    if (!imageUrl) return;
    const img = new Image();
    img.onload = () => {
      const inCv = canvasInRef.current!;
      const outCv = canvasOutRef.current!;
      const maxW = 800;
      const scale = Math.min(1, maxW / img.width);
      inCv.width = outCv.width = Math.round(img.width * scale);
      inCv.height = outCv.height = Math.round(img.height * scale);
      const ctx = inCv.getContext('2d')!;
      ctx.drawImage(img, 0, 0, inCv.width, inCv.height);
      applyClientEffects();
    };
    img.src = imageUrl;
  }, [imageUrl]);

  useEffect(() => {
    if (file) applyClientEffects();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientLight, clientContrast, clientVignette]);

  function applyClientEffects() {
    const inCv = canvasInRef.current;
    const outCv = canvasOutRef.current;
    if (!inCv || !outCv) return;
    const inCtx = inCv.getContext('2d')!;
    const outCtx = outCv.getContext('2d')!;

    const { width, height } = inCv;
    const image = inCtx.getImageData(0, 0, width, height);
    const data = image.data;

    // Basic contrast/levels
    const contrast = clientContrast; // >1 increases contrast
    const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
    for (let i = 0; i < data.length; i += 4) {
      data[i] = clamp(factor * (data[i] - 128) + 128);
      data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128);
      data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128);
    }

    // Directional light overlay
    const lightIntensity = clientLight; // 0..1
    const lx = -0.6; // light direction x
    const ly = -0.8; // light direction y
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const nx = (x / width) * 2 - 1;
        const ny = (y / height) * 2 - 1;
        const lambert = Math.max(0, (1 - Math.abs(nx - lx)) * (1 - Math.abs(ny - ly)));
        const light = 1 + lambert * lightIntensity * 0.8;
        data[idx] = clamp(data[idx] * light);
        data[idx + 1] = clamp(data[idx + 1] * light);
        data[idx + 2] = clamp(data[idx + 2] * light);
      }
    }

    // Vignette
    const cx = 0.5, cy = 0.5;
    const maxR = Math.sqrt(0.5 * 0.5 + 0.5 * 0.5);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const dx = x / width - cx;
        const dy = y / height - cy;
        const r = Math.sqrt(dx * dx + dy * dy) / maxR;
        const v = 1 - clientVignette * Math.pow(r, 1.5);
        data[idx] = clamp(data[idx] * v);
        data[idx + 1] = clamp(data[idx + 1] * v);
        data[idx + 2] = clamp(data[idx + 2] * v);
      }
    }

    outCtx.putImageData(image, 0, 0);
  }

  function clamp(v: number) {
    return Math.max(0, Math.min(255, v));
  }

  async function onGenerate() {
    if (!file) return;
    setLoading(true);
    setResult({});
    try {
      const fd = new FormData();
      fd.append('image', file);
      fd.append('prompt', prompt);
      fd.append('strength', String(strength));
      fd.append('seed', String(seed));
      const res = await fetch('/api/generate', { method: 'POST', body: fd });
      const json = await res.json();
      setResult(json);
    } catch (e: any) {
      setResult({ error: e?.message ?? 'Unknown error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <div style={{ display: 'grid', gap: 10 }}>
        <label className="label">Input sketch</label>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="input"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <label className="label">Prompt</label>
        <input className="input" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
        <div className="rangeRow">
          <label className="label">Strength ({strength.toFixed(2)})</label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={strength}
            onChange={(e) => setStrength(parseFloat(e.target.value))}
          />
        </div>
        <div className="rangeRow">
          <label className="label">Seed ({seed})</label>
          <input
            type="range"
            min={0}
            max={9999}
            step={1}
            value={seed}
            onChange={(e) => setSeed(parseInt(e.target.value, 10))}
          />
        </div>
      </div>

      <div style={{ height: 12 }} />

      <div className="previewRow">
        <div className="previewBox">
          <div>
            <div className="muted" style={{ marginBottom: 6, textAlign: 'center' }}>Original</div>
            <canvas ref={canvasInRef} />
          </div>
        </div>
        <div className="previewBox">
          <div>
            <div className="muted" style={{ marginBottom: 6, textAlign: 'center' }}>Client Lighting/Shadow</div>
            <canvas ref={canvasOutRef} />
          </div>
        </div>
      </div>

      <div style={{ height: 12 }} />
      <div className="panel" style={{ display: 'grid', gap: 12 }}>
        <div className="rangeRow">
          <label className="label">Light intensity ({clientLight.toFixed(2)})</label>
          <input type="range" min={0} max={1} step={0.01} value={clientLight} onChange={(e) => setClientLight(parseFloat(e.target.value))}/>
        </div>
        <div className="rangeRow">
          <label className="label">Contrast ({clientContrast.toFixed(2)})</label>
          <input type="range" min={0.8} max={1.6} step={0.01} value={clientContrast} onChange={(e) => setClientContrast(parseFloat(e.target.value))}/>
        </div>
        <div className="rangeRow">
          <label className="label">Vignette ({clientVignette.toFixed(2)})</label>
          <input type="range" min={0} max={0.8} step={0.01} value={clientVignette} onChange={(e) => setClientVignette(parseFloat(e.target.value))}/>
        </div>
      </div>

      <div style={{ height: 12 }} />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button className="btn" disabled={!file || loading} onClick={onGenerate}>
          {loading ? 'Rendering?' : 'Generate (Server)'}
        </button>
        <button className="btn" onClick={() => { setResult({}); inputRef.current?.click(); }}>
          Choose another image
        </button>
      </div>

      {result.error && (
        <div className="panel" style={{ marginTop: 12, borderColor: '#3a2024', background: '#160d0f' }}>
          <strong style={{ color: '#ff99aa' }}>Error:</strong> <span className="muted">{result.error}</span>
        </div>
      )}

      {result.imageUrl && (
        <div className="panel" style={{ marginTop: 12 }}>
          <div className="muted" style={{ marginBottom: 6 }}>Server Result</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.imageUrl} alt="Result" style={{ maxWidth: '100%', borderRadius: 12 }} />
        </div>
      )}
    </div>
  );
}
