import React from 'react';

export default function GuidePage() {
  return (
    <article className="panel">
      <h1 style={{ marginTop: 0 }}>Sketch2Render Implementation Guide</h1>
      <p className="muted">
        This guide outlines the architecture, algorithms, and practical steps to implement a production-ready
        image-to-image pipeline that turns sketches into hyperrealistic renderings with natural lighting and shadow.
      </p>

      <h2>Architecture Overview</h2>
      <div className="code">
{`+ Client (Next.js / React)
  - Upload UI: file input, preview, parameters (prompt, strength, seed)
  - Client-side pre/post: tone curve, directional lighting, vignette
  - Calls server route /api/generate (Edge Runtime)

+ Server (Edge/Serverless)
  - Receives multipart form data
  - Uploads source to model provider (Replicate)
  - Triggers image-to-image prediction, polls for completion
  - Returns generated image URL

+ Model Provider (Replicate, Stability AI, Together)
  - SDXL / FLUX family models with i2i support
  - Parameters: strength, guidance, seed, safety filters
`}
      </div>

      <h2>Key Components</h2>
      <ul>
        <li><strong>Input normalization</strong>: scale, center crop/letterbox, preserve aspect ratio.</li>
        <li><strong>Sketch conditioning</strong>: use img2img strength and edge hints when available.</li>
        <li><strong>Lighting realism</strong>: prefer soft key lights, global tone mapping, and micro-contrast.</li>
        <li><strong>Shadow quality</strong>: maintain penumbra, avoid crushed blacks; add vignetting carefully.</li>
        <li><strong>Determinism</strong>: expose seed to reproduce results during design reviews.</li>
        <li><strong>Safety</strong>: enable provider safety settings and timeouts; rate-limit per IP.</li>
      </ul>

      <h2>Algorithmic Tips for Natural Light & Shadows</h2>
      <ul>
        <li><strong>Tone curve</strong>: gentle S-curve (lift shadows slightly, protect highlights).</li>
        <li><strong>Local contrast</strong>: unsharp mask at low radius to enhance micro-textures.</li>
        <li><strong>Directional light</strong>: lambertian-style multiplier with soft falloff (demoed client-side).</li>
        <li><strong>Color temperature</strong>: warm key (5200?6000K) with neutral fill for natural indoor scenes.</li>
        <li><strong>Shadow edges</strong>: use variable blur proportional to distance from occluder.</li>
      </ul>

      <h2>Server Route (TypeScript)</h2>
      <p className="muted">Edge API to call Replicate; swap to other providers by changing the fetch endpoint.</p>
      <div className="code">
{`// app/api/generate/route.ts (excerpt)
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const image = form.get('image') as File | null;
  // ... upload to Replicate and poll prediction ...
  return NextResponse.json({ imageUrl });
}`}
      </div>

      <h2>Python Pipeline Example (Batch Processing)</h2>
      <div className="code">
{`import requests

def img2img_replicate(image_path: str, prompt: str, strength: float = 0.6, token: str = "..."):
    with open(image_path, 'rb') as f:
        up = requests.post(
            "https://api.replicate.com/v1/files",
            headers={"Authorization": f"Bearer {token}"},
            data=f.read()
        ).json()
    version = "REPLACE_WITH_FLUX_VERSION"
    pred = requests.post(
        "https://api.replicate.com/v1/predictions",
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        json={"version": version, "input": {"image": up["url"], "prompt": prompt, "strength": strength}}
    ).json()
    get_url = pred["urls"]["get"]
    while pred["status"] not in ("succeeded", "failed"):
        pred = requests.get(get_url, headers={"Authorization": f"Bearer {token}"}).json()
    if pred["status"] != "succeeded":
        raise RuntimeError(pred)
    out = pred["output"][0] if isinstance(pred["output"], list) else pred["output"]
    return out`}
      </div>

      <h2>Prompting Guidelines</h2>
      <ul>
        <li><strong>Base</strong>: ?Ultra-realistic photo, soft natural light, cinematic shadows, photoreal textures?.</li>
        <li><strong>Materials</strong>: specify micro-details (e.g., ?brushed aluminum with subtle anisotropy?).</li>
        <li><strong>Camera</strong>: focal length, aperture, time of day for consistent look.</li>
        <li><strong>Style bounds</strong>: avoid over-stylization; prioritize realism keywords.</li>
      </ul>

      <h2>Libraries & Tools</h2>
      <ul>
        <li><strong>Next.js</strong>: app router, Edge API routes, static assets.</li>
        <li><strong>Replicate</strong>: managed inference for SDXL/FLUX models.</li>
        <li><strong>TensorFlow.js</strong>: optional client filters, segmentation, edge maps.</li>
        <li><strong>Sharp</strong>: server-side image pre/post (if using Node runtime).</li>
        <li><strong>Vercel</strong>: deployment, environment secrets, edge network.</li>
      </ul>

      <h2>Performance & UX</h2>
      <ul>
        <li><strong>Streaming feedback</strong>: show client-side enhancement immediately while server renders.</li>
        <li><strong>Retry</strong>: exponential backoff for prediction polling.</li>
        <li><strong>Caching</strong>: cache recent outputs keyed by (prompt, seed, hash(image)).</li>
        <li><strong>Accessibility</strong>: keyboard nav, focus states, alt text on outputs.</li>
      </ul>

      <h2>Environment</h2>
      <div className="code">
{`# .env
REPLICATE_API_TOKEN=your_token
# Optional: override model version
# REPLICATE_FLUX_VERSION=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`}
      </div>
    </article>
  );
}
