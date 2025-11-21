import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const image = form.get('image') as File | null;
    const prompt = String(form.get('prompt') ?? '');
    const strength = Number(form.get('strength') ?? 0.6);
    const seed = Number(form.get('seed') ?? 0);

    if (!image) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    // If no Replicate token present, return a graceful message but keep app working
    const replicateToken = process.env.REPLICATE_API_TOKEN;
    if (!replicateToken) {
      return NextResponse.json({
        error: 'Server model not configured. Set REPLICATE_API_TOKEN to enable image-to-image.',
        imageUrl: undefined
      });
    }

    // Upload the image to Replicate's blob storage first
    const uploadRes = await fetch('https://api.replicate.com/v1/files', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${replicateToken}`
      },
      body: image
    });
    if (!uploadRes.ok) {
      const t = await uploadRes.text();
      return NextResponse.json({ error: `Upload failed: ${t}` }, { status: 500 });
    }
    const uploadJson = await uploadRes.json() as { id: string; url: string };
    const imageUrl = uploadJson.url;

    // Choose a photorealistic image-to-image model on Replicate
    // Using Black Forest Labs FLUX.1-dev with image-to-image input
    const predictRes = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${replicateToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // model reference may change; keep configurable via env if needed
        // https://replicate.com/black-forest-labs/flux
        version: process.env.REPLICATE_FLUX_VERSION ?? 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
        input: {
          image: imageUrl,
          prompt,
          // strength closer to 1 relies more on prompt than image
          strength,
          seed: seed || undefined,
          guidance: 3.5
        }
      })
    });
    if (!predictRes.ok) {
      const t = await predictRes.text();
      return NextResponse.json({ error: `Prediction create failed: ${t}` }, { status: 500 });
    }
    const prediction = await predictRes.json() as any;

    // Poll until done (simple loop with small backoff)
    let status = prediction.status as string;
    let outputUrl: string | undefined;
    let nextUrl = prediction.urls?.get as string;

    const start = Date.now();
    while (status !== 'succeeded' && status !== 'failed' && Date.now() - start < 60000) {
      await new Promise((r) => setTimeout(r, 1800));
      const check = await fetch(nextUrl, {
        headers: { Authorization: `Bearer ${replicateToken}` }
      });
      const pj = await check.json() as any;
      status = pj.status;
      outputUrl = Array.isArray(pj.output) ? pj.output[0] : pj.output;
    }

    if (status !== 'succeeded' || !outputUrl) {
      return NextResponse.json({ error: `Prediction ${status}` }, { status: 500 });
    }

    return NextResponse.json({ imageUrl: outputUrl });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unexpected error' }, { status: 500 });
  }
}
