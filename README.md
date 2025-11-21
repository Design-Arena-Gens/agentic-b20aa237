# Sketch2Render

Transform sketches into hyperrealistic renderings with natural light and shadow.

## Features

- Next.js (App Router, TypeScript)
- Upload UI with immediate client-side lighting/shadow enhancement
- Edge API route integrating with Replicate for image-to-image generation
- In-app implementation guide with algorithms, prompts, and code samples

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run locally:
```bash
npm run dev
```
Open http://localhost:3000

3. Optional: enable server generation
```bash
cp .env.example .env
# set REPLICATE_API_TOKEN
```

4. Build:
```bash
npm run build
```

## Environment

Create `.env`:
```bash
REPLICATE_API_TOKEN=your_token
# Optional: override model version
# REPLICATE_FLUX_VERSION=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## Deployment

Deploy on Vercel. The production URL used by the app header is:
`https://agentic-b20aa237.vercel.app`

## Guide

Open `/guide` in the running app for architecture, algorithms, libraries, and examples.