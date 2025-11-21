import Link from 'next/link';
import Upload from '@/components/Upload';

export default function Home() {
  return (
    <div className="hero">
      <section className="panel">
        <h1 style={{ marginTop: 0, marginBottom: 8 }}>Sketch2Render</h1>
        <p className="muted" style={{ marginTop: 0, marginBottom: 16 }}>
          Upload a sketch and turn it into a hyperrealistic render. This demo includes client-side lighting/shadow
          enhancement and an optional server model integration for image-to-image generation.
        </p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          <span className="tag">Next.js</span>
          <span className="tag">TypeScript</span>
          <span className="tag">Image-to-Image</span>
          <span className="tag">Lighting & Shadows</span>
          <span className="tag">Replicate API</span>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <Link className="btn" href="/guide">Read the Guide</Link>
          <a className="btn" href="#try">Try the Demo</a>
        </div>
      </section>
      <section id="try" className="panel">
        <Upload />
      </section>
    </div>
  );
}
