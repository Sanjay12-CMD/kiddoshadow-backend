import { request } from 'undici';

const TTS_BASE_URL = process.env.TTS_SERVICE_URL;

if (!TTS_BASE_URL) {
  throw new Error('TTS_SERVICE_URL is not defined');
}

const TTS_ENDPOINT = `${TTS_BASE_URL}/tts`;

export function chunkText(text) {
  return text
    .split(/(?<=[.?!])\s+/)
    .filter(Boolean);
}

export async function textToSpeech(text) {
  const { statusCode, body } = await request(TTS_ENDPOINT, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (statusCode !== 200) {
    throw new Error(`TTS failed with status ${statusCode}`);
  }

  return Buffer.from(await body.arrayBuffer());
}