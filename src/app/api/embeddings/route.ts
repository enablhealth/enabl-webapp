import { NextRequest, NextResponse } from 'next/server';
import { BedrockRuntimeClient, InvokeModelCommand } from '@aws-sdk/client-bedrock-runtime';

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || 'us-east-1' });

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { text, texts } = body as { text?: string; texts?: string[] };

    const inputs: string[] = [];
    if (typeof text === 'string' && text.trim()) inputs.push(text);
    if (Array.isArray(texts)) inputs.push(...texts.filter((t) => typeof t === 'string' && t.trim()));

    if (inputs.length === 0) {
      return NextResponse.json({ error: 'text or texts is required' }, { status: 400 });
    }

    // Titan embedding single-call per input (sequential to keep it simple)
    const embeddings: number[][] = [];
    for (const input of inputs) {
      const cmd = new InvokeModelCommand({
        modelId: process.env.EMBEDDING_MODEL_ID || 'amazon.titan-embed-text-v1',
        contentType: 'application/json',
        body: JSON.stringify({ inputText: input.substring(0, 8000) })
      });
      const resp = await bedrock.send(cmd);
      if (!resp.body) throw new Error('No response body from Bedrock');
      const json = JSON.parse(new TextDecoder().decode(resp.body));
      if (!Array.isArray(json.embedding)) throw new Error('No embedding in response');
      embeddings.push(json.embedding);
    }

    return NextResponse.json(
      inputs.length === 1 ? { embedding: embeddings[0] } : { embeddings }
    );
  } catch (error) {
    console.error('Embeddings API error:', error);
    return NextResponse.json({ error: 'Failed to generate embeddings' }, { status: 500 });
  }
}
