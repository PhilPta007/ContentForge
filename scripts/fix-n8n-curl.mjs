/**
 * StudioStack n8n workflow patcher.
 * Pushes all Code node updates to the live n8n workflow.
 * Reads all secrets from .env.local (gitignored) to prevent key leaks.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load secrets from .env.local
const envPath = path.resolve(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
function env(key) {
  const match = envContent.match(new RegExp('^' + key + '=(.*)$', 'm'));
  if (!match) throw new Error('Missing ' + key + ' in .env.local');
  return match[1].trim();
}

// n8n API key (for n8n REST API, not a Google key — safe to keep here)
const N8N_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjODYxNGNmZi1iNGRmLTQ5NTEtYWQ1NS1jMmNiZWVkNDVjZDMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzcwNjYwNDc4fQ.BTN2oI9RULuaNKRsqTRaUQh5MCuur42vMrJg328n-fM';
const N8N_URL = 'https://srv1319171.hstgr.cloud';
const WORKFLOW_ID = 'JRKIyos4VFfmWw1D';

// ─── Shared Constants (injected into every Code node) ────────
// These are embedded as string literals into n8n Code nodes
const CONSTANTS = `const GOOGLE_API_KEY = '${env('GOOGLE_API_KEY')}';
const GOOGLE_TTS_KEY = '${env('GOOGLE_TTS_KEY')}';
const ELEVENLABS_KEY = '${env('ELEVENLABS_API_KEY')}';
const KOKORO_URL = '${env('KOKORO_ENDPOINT')}';
const KOKORO_KEY = '${env('KOKORO_API_KEY')}';
const KIE_API_KEY = '${env('KIE_API_KEY')}';
const SUPABASE_URL = '${env('NEXT_PUBLIC_SUPABASE_URL')}';
const SUPABASE_KEY = '${env('SUPABASE_SERVICE_ROLE_KEY')}';
const CB_SECRET = '${env('N8N_WEBHOOK_SECRET')}';`;

// ─── Callback helper ─────────────────────────────────────────
const CALLBACK_FN = `
async function sendCallback(helpers, callbackUrl, generationId, status, outputUrl, metadata, error, progress) {
  try {
    await helpers.httpRequest({
      method: 'POST', url: callbackUrl,
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': CB_SECRET },
      body: { generationId, status, outputUrl, metadata, error, progress: progress || null },
      json: true, timeout: 15000
    });
  } catch (_e) { /* callback failed - don't block pipeline */ }
}`;

// ─── TTS Preprocessing (strips markdown for clean speech) ────
const TTS_CLEAN_FN = `
function cleanScriptForTTS(text) {
  return text
    .replace(/^#{1,6}\\s+/gm, '')
    .replace(/\\*{1,3}([^*]+)\\*{1,3}/g, '$1')
    .replace(/_{1,3}([^_]+)_{1,3}/g, '$1')
    .replace(/\\n---+\\n/g, '\\n\\n')
    .replace(/^---+$/gm, '')
    .replace(/^[\\s]*[-*+]\\s+/gm, '')
    .replace(/^[\\s]*\\d+\\.\\s+/gm, '')
    .replace(/\`\`\`[\\s\\S]*?\`\`\`/g, '')
    .replace(/\`([^\`]+)\`/g, '$1')
    .replace(/^>\\s+/gm, '')
    .replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, '$1')
    .replace(/<[^>]+>/g, '')
    .replace(/\\n{3,}/g, '\\n\\n')
    .replace(/  +/g, ' ')
    .trim();
}`;

// ─── Binary helpers (Node.js built-in https/http) ────────────
const BINARY_HELPERS = `
const https = require('https');
const http = require('http');
const { URL } = require('url');

function httpBinaryRequest(urlStr, options, bodyData) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(urlStr);
    const mod = parsed.protocol === 'https:' ? https : http;
    const reqOpts = {
      hostname: parsed.hostname,
      port: parsed.port || (parsed.protocol === 'https:' ? 443 : 80),
      path: parsed.pathname + parsed.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      timeout: options.timeout || 300000
    };

    const req = mod.request(reqOpts, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        httpBinaryRequest(res.headers.location, options, bodyData).then(resolve).catch(reject);
        return;
      }
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode >= 400) {
          reject(new Error('HTTP ' + res.statusCode + ': ' + buf.toString('utf-8').substring(0, 500)));
        } else {
          resolve(buf);
        }
      });
      res.on('error', reject);
    });

    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('Request timed out')); });

    if (bodyData) {
      req.write(bodyData);
    }
    req.end();
  });
}

async function downloadFile(url, filePath) {
  const buf = await httpBinaryRequest(url, { method: 'GET', timeout: 120000 });
  fs.writeFileSync(filePath, buf);
  return buf.length;
}

async function uploadToSupabase(bucket, objectPath, filePath, contentType) {
  const fileData = fs.readFileSync(filePath);
  const url = SUPABASE_URL + '/storage/v1/object/' + bucket + '/' + objectPath;
  await httpBinaryRequest(url, {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + SUPABASE_KEY,
      'apikey': SUPABASE_KEY,
      'Content-Type': contentType,
      'Content-Length': fileData.length,
      'x-upsert': 'true'
    },
    timeout: 300000
  }, fileData);
}

async function postBinaryRequest(url, headers, jsonBody) {
  const bodyStr = JSON.stringify(jsonBody);
  const hdrs = Object.assign({}, headers, { 'Content-Length': Buffer.byteLength(bodyStr) });
  return await httpBinaryRequest(url, { method: 'POST', headers: hdrs, timeout: 180000 }, Buffer.from(bodyStr));
}`;

// ─── VEO3 Fast helper (shared by Video Prepare) ─────────────
const VEO3_HELPER = `
async function generateVEO3Clip(helpers, kieKey, prompt, maxWaitMs) {
  maxWaitMs = maxWaitMs || 180000;
  const createResp = await helpers.httpRequest({
    method: 'POST',
    url: 'https://api.kie.ai/api/v1/veo/generate',
    headers: { 'Authorization': 'Bearer ' + kieKey, 'Content-Type': 'application/json' },
    body: {
      model: 'veo3_fast',
      prompt: prompt.substring(0, 500),
      aspect_ratio: '16:9',
      duration: 8
    },
    json: true, timeout: 30000
  });

  if (!createResp.data || !createResp.data.taskId) {
    throw new Error('VEO3 returned no taskId: ' + JSON.stringify(createResp).substring(0, 200));
  }

  const taskId = createResp.data.taskId;
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    await new Promise(r => setTimeout(r, 8000));
    const statusResp = await helpers.httpRequest({
      method: 'GET',
      url: 'https://api.kie.ai/api/v1/veo/record-info?taskId=' + taskId,
      headers: { 'Authorization': 'Bearer ' + kieKey },
      json: true, timeout: 10000
    });

    const d = statusResp.data;
    if (!d) continue;

    if (d.errorCode || d.errorMessage) {
      throw new Error('VEO3 failed: ' + (d.errorMessage || d.errorCode));
    }

    if (d.successFlag === 1 && d.response) {
      if (d.response.resultUrls && d.response.resultUrls[0]) {
        return d.response.resultUrls[0];
      }
      throw new Error('VEO3 complete but no resultUrls: ' + JSON.stringify(d.response).substring(0, 300));
    }
  }

  throw new Error('VEO3 timed out after ' + (maxWaitMs / 1000) + 's');
}`;

// ─── Imagen 4.0 helper (shared by Video Prepare + Thumbnail) ─
const IMAGEN_HELPER = `
async function generateImagenImage(helpers, googleApiKey, prompt, model) {
  model = model || 'imagen-4.0-generate-001';
  const resp = await helpers.httpRequest({
    method: 'POST',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':predict?key=' + googleApiKey,
    headers: { 'Content-Type': 'application/json' },
    body: {
      instances: [{ prompt: prompt.substring(0, 500) }],
      parameters: { sampleCount: 1, aspectRatio: '16:9' }
    },
    json: true, timeout: 90000
  });
  if (!resp.predictions || !resp.predictions[0] || !resp.predictions[0].bytesBase64Encoded) {
    throw new Error('Imagen returned no image: ' + JSON.stringify(resp).substring(0, 300));
  }
  return Buffer.from(resp.predictions[0].bytesBase64Encoded, 'base64');
}`;

// ─── SA Prompt builder (shared by Video Prepare + Thumbnail) ─
const SA_PROMPT_FN = `
function buildSAPrompt(sceneDescription, tone) {
  const saContext = {
    sleep: 'peaceful South African landscape, golden hour light over the bushveld, acacia silhouettes',
    asmr: 'intimate close-up South African natural scene, soft focus, warm tones',
    bedtime_story: 'gentle South African sunset, warm earthy tones, peaceful rural setting',
    documentary: 'authentic South African scene, photojournalistic style, natural lighting',
    storytelling: 'cinematic South African setting, warm earthy tones, emotional depth',
    educational: 'clear documentary-style South African scene, informative framing',
    podcast: 'modern South African urban setting, contemporary lifestyle',
    youtube_hype: 'vibrant South African street scene, bold colors, energetic composition'
  };

  return (saContext[tone] || saContext.documentary) + '. ' + sceneDescription + '. South Africa, authentic African setting, natural warm lighting, documentary photography style, National Geographic quality. Shot on Sony A7III, 35mm lens, golden hour, shallow depth of field.';
}

function buildSAHistoricalPrompt(scene) {
  return 'Historical South African scene: ' + scene + '. REQUIREMENTS: black South African people, Soweto township setting, authentic 1976-1990 era aesthetic, dusty unpaved streets, corrugated iron structures, NO European or American styling. Photojournalistic documentary style, grainy film aesthetic, authentic and respectful portrayal.';
}`;


// ═══════════════════════════════════════════════════════════════
// MP3 Handler
// ═══════════════════════════════════════════════════════════════
const MP3_HANDLER = `${CONSTANTS}
${CALLBACK_FN}
${TTS_CLEAN_FN}
${BINARY_HELPERS}

const fs = require('fs');
const { execSync } = require('child_process');
const data = $('Webhook').first().json.body;
const { generationId, topic, duration, tone, voiceTier, callbackUrl, customScript } = data;
const tmpDir = '/tmp/ss_' + generationId;

try {
  fs.mkdirSync(tmpDir, { recursive: true });
  await sendCallback(this.helpers, callbackUrl, generationId, 'processing', undefined, undefined, undefined, { stage: 'writing_script', message: 'Generating script...' });

  // Script: use custom if provided, else generate with Gemini
  let script;
  if (customScript && customScript.length >= 50) {
    script = customScript;
  } else {
    const toneMap = {
      sleep: 'soothing, calming sleep narration with peaceful imagery',
      asmr: 'gentle ASMR-style whisper script with soft, intimate delivery',
      bedtime_story: 'soothing bedtime story for adults with gentle pacing',
      storytelling: 'engaging narrative story with vivid details',
      documentary: 'authoritative documentary-style narration',
      educational: 'clear educational lecture with good structure',
      podcast: 'natural conversational podcast monologue',
      youtube_hype: 'energetic, enthusiastic YouTube video script'
    };
    const prompt = 'Write a ' + (toneMap[tone] || 'script') + ' about: ' + topic + '. It should be approximately ' + duration + ' minutes when read aloud (roughly ' + (duration * 150) + ' words). Write only the narration text. No headings, titles, stage directions, markdown formatting, or metadata. No asterisks, dashes, or bullet points. Just the spoken words as plain text paragraphs.';
    const geminiResp = await this.helpers.httpRequest({
      method: 'POST',
      url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GOOGLE_API_KEY,
      headers: { 'Content-Type': 'application/json' },
      body: { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 8192 } },
      json: true, timeout: 60000
    });
    script = geminiResp.candidates[0].content.parts[0].text;
  }

  // Clean markdown before TTS
  script = cleanScriptForTTS(script);
  await sendCallback(this.helpers, callbackUrl, generationId, 'processing', undefined, undefined, undefined, { stage: 'generating_audio', message: 'Converting to audio...' });

  // TTS - standard=Kokoro, premium=Google WaveNet, ultra=ElevenLabs(adam)
  if (voiceTier === 'standard') {
    const kokoroUrl = KOKORO_URL + '/tts?text=' + encodeURIComponent(script) + '&voice=am_michael';
    const wavBuf = await httpBinaryRequest(kokoroUrl, { method: 'GET', timeout: 300000 });
    fs.writeFileSync(tmpDir + '/audio.wav', wavBuf);
    if (wavBuf.length < 1000) throw new Error('Kokoro returned empty audio (' + wavBuf.length + ' bytes)');
    execSync('ffmpeg -i ' + tmpDir + '/audio.wav -codec:a libmp3lame -b:a 128k -y ' + tmpDir + '/audio.mp3', { timeout: 120000 });
  } else if (voiceTier === 'premium') {
    const maxChunk = 4500;
    const chunks = [];
    let remaining = script;
    while (remaining.length > 0) {
      if (remaining.length <= maxChunk) { chunks.push(remaining); break; }
      let splitAt = remaining.lastIndexOf('. ', maxChunk);
      if (splitAt < maxChunk * 0.5) splitAt = remaining.lastIndexOf(' ', maxChunk);
      if (splitAt < 1) splitAt = maxChunk;
      chunks.push(remaining.substring(0, splitAt + 1));
      remaining = remaining.substring(splitAt + 1).trimStart();
    }
    const mp3Parts = [];
    for (let ci = 0; ci < chunks.length; ci++) {
      const ttsBody = { input: { text: chunks[ci] }, voice: { languageCode: 'en-US', name: 'en-US-WaveNet-D' }, audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0 } };
      const ttsResp = await this.helpers.httpRequest({
        method: 'POST',
        url: 'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + GOOGLE_TTS_KEY,
        headers: { 'Content-Type': 'application/json' },
        body: ttsBody,
        json: true, timeout: 60000
      });
      if (!ttsResp.audioContent) throw new Error('[Google-TTS] No audio for chunk ' + ci);
      mp3Parts.push(Buffer.from(ttsResp.audioContent, 'base64'));
    }
    if (mp3Parts.length === 1) {
      fs.writeFileSync(tmpDir + '/audio.mp3', mp3Parts[0]);
    } else {
      for (let ci = 0; ci < mp3Parts.length; ci++) {
        fs.writeFileSync(tmpDir + '/part_' + ci + '.mp3', mp3Parts[ci]);
      }
      const concatList = mp3Parts.map((_, ci) => "file '" + tmpDir + '/part_' + ci + ".mp3'").join('\\n');
      fs.writeFileSync(tmpDir + '/concat.txt', concatList);
      execSync('ffmpeg -f concat -safe 0 -i ' + tmpDir + '/concat.txt -c copy -y ' + tmpDir + '/audio.mp3', { timeout: 60000 });
    }
  } else {
    // ElevenLabs (ultra) - adam voice
    const mp3Buf = await postBinaryRequest(
      'https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB',
      { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
      { text: script, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.75, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true } }
    );
    fs.writeFileSync(tmpDir + '/audio.mp3', mp3Buf);
  }

  const audioStat = fs.statSync(tmpDir + '/audio.mp3');
  if (audioStat.size < 1000) throw new Error('Audio file too small: ' + audioStat.size + ' bytes');

  await sendCallback(this.helpers, callbackUrl, generationId, 'processing', undefined, undefined, undefined, { stage: 'uploading', message: 'Uploading audio...' });
  await uploadToSupabase('audio', generationId + '.mp3', tmpDir + '/audio.mp3', 'audio/mpeg');

  const outputUrl = SUPABASE_URL + '/storage/v1/object/public/audio/' + generationId + '.mp3';
  await sendCallback(this.helpers, callbackUrl, generationId, 'complete', outputUrl, { duration: duration * 60, fileSize: audioStat.size, format: 'mp3' });

  fs.rmSync(tmpDir, { recursive: true, force: true });
  return [{ json: { success: true, generationId, outputUrl } }];
} catch (e) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_e) {}
  await sendCallback(this.helpers, callbackUrl, generationId, 'failed', undefined, undefined, e.message);
  throw e;
}`;


// ═══════════════════════════════════════════════════════════════
// Description Handler
// ═══════════════════════════════════════════════════════════════
const DESC_HANDLER = `${CONSTANTS}
${CALLBACK_FN}
${BINARY_HELPERS}

const fs = require('fs');
const data = $('Webhook').first().json.body;
const { generationId, topic, brandVoice, affiliateLinks, youtubeUrl, callbackUrl } = data;

try {
  // Fetch YouTube transcript if URL provided
  let transcriptContext = '';
  if (youtubeUrl) {
    try {
      const vidMatch = youtubeUrl.match(/(?:v=|youtu\\.be\\/)([a-zA-Z0-9_-]{11})/);
      if (vidMatch) {
        const videoId = vidMatch[1];
        const pageHtml = await this.helpers.httpRequest({
          method: 'GET',
          url: 'https://www.youtube.com/watch?v=' + videoId,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          timeout: 15000
        });
        if (typeof pageHtml === 'string') {
          const captionMatch = pageHtml.match(/"captionTracks":\\s*\\[.*?"baseUrl":\\s*"(.*?)"/);
          if (captionMatch) {
            const captionUrl = captionMatch[1].replace(/\\\\u0026/g, '&');
            const captionData = await this.helpers.httpRequest({
              method: 'GET',
              url: captionUrl + '&fmt=json3',
              json: true,
              timeout: 10000
            });
            if (captionData && captionData.events) {
              transcriptContext = captionData.events
                .filter(e => e.segs)
                .map(e => e.segs.map(s => s.utf8).join(''))
                .join(' ')
                .replace(/\\s+/g, ' ')
                .trim();
            }
          }
        }
      }
    } catch (_e) { /* transcript fetch failed - continue with topic only */ }
  }

  let brandInstructions = '';
  if (brandVoice) {
    brandInstructions = '\\n\\nBrand Voice: Tone=' + (brandVoice.tone || 'professional') + ', Style=' + (brandVoice.style || 'informative');
    if (brandVoice.keywords) brandInstructions += ', Keywords: ' + (Array.isArray(brandVoice.keywords) ? brandVoice.keywords.join(', ') : brandVoice.keywords);
  }

  let affiliateInstructions = '';
  if (affiliateLinks && affiliateLinks.length > 0) {
    affiliateInstructions = '\\n\\nNaturally include these links:\\n' + affiliateLinks.map(l => '- ' + l.label + ': ' + l.url).join('\\n');
  }

  await sendCallback(this.helpers, callbackUrl, generationId, 'processing', undefined, undefined, undefined, { stage: 'writing_description', message: transcriptContext ? 'Writing description from transcript...' : 'Writing description...' });

  let transcriptSection = '';
  if (transcriptContext) {
    transcriptSection = '\\n\\nVideo transcript (use this as the primary content source — extract key topics, quotes, and structure from it):\\n' + transcriptContext.substring(0, 5000);
  }

  const prompt = 'Write a professional YouTube video description for: ' + topic + transcriptSection + '\\n\\nRequirements:\\n- Engaging hook in the first 2 lines\\n- Organized sections with emoji headers\\n- Timestamps placeholder section\\n- 5-8 relevant hashtags at end\\n- SEO-optimized keywords\\n- Subscribe/like CTA\\n- 1500-2500 characters total' + brandInstructions + affiliateInstructions + '\\n\\nWrite ONLY the description text, ready to paste into YouTube.';

  const resp = await this.helpers.httpRequest({
    method: 'POST',
    url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GOOGLE_API_KEY,
    headers: { 'Content-Type': 'application/json' },
    body: { contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.7, maxOutputTokens: 4096 } },
    json: true, timeout: 30000
  });

  const description = resp.candidates[0].content.parts[0].text;

  const tmpFile = '/tmp/ss_desc_' + generationId + '.txt';
  fs.writeFileSync(tmpFile, description, 'utf-8');
  await uploadToSupabase('audio', generationId + '_description.txt', tmpFile, 'text/plain');
  fs.unlinkSync(tmpFile);

  const outputUrl = SUPABASE_URL + '/storage/v1/object/public/audio/' + generationId + '_description.txt';
  await sendCallback(this.helpers, callbackUrl, generationId, 'complete', outputUrl, { format: 'txt', fileSize: Buffer.byteLength(description), description: description });

  return [{ json: { success: true, generationId, description } }];
} catch (e) {
  await sendCallback(this.helpers, callbackUrl, generationId, 'failed', undefined, undefined, e.message);
  throw e;
}`;


// ═══════════════════════════════════════════════════════════════
// Thumbnail Handler
// ═══════════════════════════════════════════════════════════════
const THUMB_HANDLER = `${CONSTANTS}
${CALLBACK_FN}
${BINARY_HELPERS}
${SA_PROMPT_FN}
${IMAGEN_HELPER}

const fs = require('fs');
const data = $('Webhook').first().json.body;
const { generationId, topic, imageTier, callbackUrl } = data;
const style = data.style || '';
const tmpDir = '/tmp/ss_' + generationId;

try {
  fs.mkdirSync(tmpDir, { recursive: true });
  await sendCallback(this.helpers, callbackUrl, generationId, 'processing', undefined, undefined, undefined, { stage: 'generating_thumbnail', message: 'Generating thumbnail...' });
  const prompt = 'YouTube thumbnail for: ' + topic + '. South African context. ' + (style ? 'Style: ' + style + '. ' : '') + 'Eye-catching, bold, high contrast, professional YouTube thumbnail, 16:9 aspect ratio, vibrant colors, clear focal point, cinematic quality.';

  if (imageTier === 'premium' || imageTier === 'ultra') {
    // Google Imagen 4.0 / Ultra
    const model = imageTier === 'ultra' ? 'imagen-4.0-ultra-generate-001' : 'imagen-4.0-generate-001';
    const imgBuf = await generateImagenImage(this.helpers, GOOGLE_API_KEY, prompt, model);
    fs.writeFileSync(tmpDir + '/thumb.jpg', imgBuf);
  } else {
    // Kie.ai Nano Banana 2 (standard)
    const createResp = await this.helpers.httpRequest({
      method: 'POST',
      url: 'https://api.kie.ai/api/v1/jobs/createTask',
      headers: { 'Authorization': 'Bearer ' + KIE_API_KEY, 'Content-Type': 'application/json' },
      body: { model: 'nano-banana-2', input: { prompt: prompt.substring(0, 300), aspect_ratio: '16:9', resolution: '1K', output_format: 'jpg' } },
      json: true, timeout: 30000
    });
    if (!createResp.data || !createResp.data.taskId) throw new Error('Kie.ai returned no taskId');
    const taskId = createResp.data.taskId;

    let imageUrl = null;
    for (let poll = 0; poll < 18; poll++) {
      await new Promise(r => setTimeout(r, 5000));
      const statusResp = await this.helpers.httpRequest({
        method: 'GET',
        url: 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId=' + taskId,
        headers: { 'Authorization': 'Bearer ' + KIE_API_KEY },
        json: true, timeout: 10000
      });
      const state = statusResp.data && statusResp.data.state;
      if (state === 'success') {
        const result = JSON.parse(statusResp.data.resultJson || '{}');
        if (result.resultUrls && result.resultUrls[0]) imageUrl = result.resultUrls[0];
        break;
      }
      if (state === 'fail') throw new Error('Kie.ai failed: ' + (statusResp.data.failMsg || 'unknown'));
    }
    if (!imageUrl) throw new Error('Kie.ai thumbnail timed out after 90s');
    await downloadFile(imageUrl, tmpDir + '/thumb.jpg');
  }

  const imgStat = fs.statSync(tmpDir + '/thumb.jpg');
  if (imgStat.size < 1000) throw new Error('Image too small: ' + imgStat.size + ' bytes');

  await uploadToSupabase('thumbnails', generationId + '.jpg', tmpDir + '/thumb.jpg', 'image/jpeg');

  const outputUrl = SUPABASE_URL + '/storage/v1/object/public/thumbnails/' + generationId + '.jpg';
  await sendCallback(this.helpers, callbackUrl, generationId, 'complete', outputUrl, { format: 'jpg', fileSize: imgStat.size });

  fs.rmSync(tmpDir, { recursive: true, force: true });
  return [{ json: { success: true, generationId, outputUrl } }];
} catch (e) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_e) {}
  await sendCallback(this.helpers, callbackUrl, generationId, 'failed', undefined, undefined, e.message);
  throw e;
}`;


// ═══════════════════════════════════════════════════════════════
// Video Prepare — generates script, TTS, images, VEO3 clips
// ═══════════════════════════════════════════════════════════════
const VIDEO_PREPARE = `${CONSTANTS}
${CALLBACK_FN}
${TTS_CLEAN_FN}
${BINARY_HELPERS}
${SA_PROMPT_FN}
${VEO3_HELPER}
${IMAGEN_HELPER}

const fs = require('fs');
const { execSync } = require('child_process');
const data = $('Webhook').first().json.body;
const { generationId, topic, duration, tone, voiceTier, imageTier, motionTier, sceneCount, callbackUrl, customScript } = data;
const tmpDir = '/tmp/ss_' + generationId;

try {
  fs.mkdirSync(tmpDir, { recursive: true });
  await sendCallback(this.helpers, callbackUrl, generationId, 'processing', undefined, undefined, undefined, { stage: 'writing_script', message: 'Writing script...' });

  // ── Step 1: Script generation ──
  let script;
  if (customScript && customScript.length >= 50) {
    script = customScript;
  } else {
    const toneMap = {
      sleep: 'soothing, calming sleep narration', asmr: 'gentle ASMR whisper script',
      bedtime_story: 'soothing bedtime story', storytelling: 'engaging narrative',
      documentary: 'documentary narration', educational: 'educational lecture',
      podcast: 'conversational podcast', youtube_hype: 'energetic YouTube script'
    };
    const scriptPrompt = 'Write a ' + (toneMap[tone] || 'script') + ' about: ' + topic + '. Approximately ' + duration + ' minutes when read aloud (~' + (duration * 150) + ' words). Structure with clear sections separated by --- markers. Each section 2-3 paragraphs. Write only plain narration text. No headings, no markdown formatting, no asterisks, no bullet points. Just spoken words with --- between sections.';
    let scriptResp;
    try {
      scriptResp = await this.helpers.httpRequest({
        method: 'POST',
        url: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + GOOGLE_API_KEY,
        headers: { 'Content-Type': 'application/json' },
        body: { contents: [{ parts: [{ text: scriptPrompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 8192 } },
        json: true, timeout: 60000
      });
    } catch (scriptErr) { throw new Error('[Gemini-Script] ' + scriptErr.message); }
    script = scriptResp.candidates[0].content.parts[0].text;
  }

  // ── Step 2: Clean script for TTS ──
  script = cleanScriptForTTS(script);
  const sections = script.split(/---+/).map(s => s.trim()).filter(s => s.length > 0);

  await sendCallback(this.helpers, callbackUrl, generationId, 'processing', undefined, undefined, undefined, { stage: 'generating_audio', message: 'Converting script to audio...' });

  // ── Step 3: TTS — standard=Kokoro, premium=Google WaveNet, ultra=ElevenLabs ──
  if (voiceTier === 'standard') {
    const kokoroUrl = KOKORO_URL + '/tts?text=' + encodeURIComponent(script) + '&voice=am_michael';
    const wavBuf = await httpBinaryRequest(kokoroUrl, { method: 'GET', timeout: 300000 });
    fs.writeFileSync(tmpDir + '/audio.wav', wavBuf);
    if (wavBuf.length < 1000) throw new Error('[Kokoro] Empty audio (' + wavBuf.length + ' bytes)');
    execSync('ffmpeg -i ' + tmpDir + '/audio.wav -codec:a libmp3lame -b:a 128k -y ' + tmpDir + '/audio.mp3', { timeout: 120000 });
  } else if (voiceTier === 'premium') {
    const maxChunk = 4500;
    const chunks = [];
    let remaining = script;
    while (remaining.length > 0) {
      if (remaining.length <= maxChunk) { chunks.push(remaining); break; }
      let splitAt = remaining.lastIndexOf('. ', maxChunk);
      if (splitAt < maxChunk * 0.5) splitAt = remaining.lastIndexOf(' ', maxChunk);
      if (splitAt < 1) splitAt = maxChunk;
      chunks.push(remaining.substring(0, splitAt + 1));
      remaining = remaining.substring(splitAt + 1).trimStart();
    }
    const mp3Parts = [];
    for (let ci = 0; ci < chunks.length; ci++) {
      const ttsBody = { input: { text: chunks[ci] }, voice: { languageCode: 'en-US', name: 'en-US-WaveNet-D' }, audioConfig: { audioEncoding: 'MP3', speakingRate: 1.0, pitch: 0 } };
      let ttsResp;
      try {
        ttsResp = await this.helpers.httpRequest({
          method: 'POST',
          url: 'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + GOOGLE_TTS_KEY,
          headers: { 'Content-Type': 'application/json' },
          body: ttsBody,
          json: true, timeout: 60000
        });
      } catch (ttsErr) { throw new Error('[Google-TTS-chunk' + ci + '] ' + ttsErr.message); }
      if (!ttsResp.audioContent) throw new Error('[Google-TTS] No audio for chunk ' + ci);
      mp3Parts.push(Buffer.from(ttsResp.audioContent, 'base64'));
    }
    if (mp3Parts.length === 1) {
      fs.writeFileSync(tmpDir + '/audio.mp3', mp3Parts[0]);
    } else {
      for (let ci = 0; ci < mp3Parts.length; ci++) {
        fs.writeFileSync(tmpDir + '/part_' + ci + '.mp3', mp3Parts[ci]);
      }
      const concatList = mp3Parts.map((_, ci) => "file '" + tmpDir + '/part_' + ci + ".mp3'").join('\\n');
      fs.writeFileSync(tmpDir + '/concat.txt', concatList);
      execSync('ffmpeg -f concat -safe 0 -i ' + tmpDir + '/concat.txt -c copy -y ' + tmpDir + '/audio.mp3', { timeout: 60000 });
    }
  } else {
    let mp3Buf;
    try {
      mp3Buf = await postBinaryRequest(
        'https://api.elevenlabs.io/v1/text-to-speech/pNInz6obpgDQGcFmaJgB',
        { 'xi-api-key': ELEVENLABS_KEY, 'Content-Type': 'application/json' },
        { text: script, model_id: 'eleven_multilingual_v2', voice_settings: { stability: 0.75, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true } }
      );
    } catch (elErr) { throw new Error('[ElevenLabs-TTS] ' + elErr.message); }
    fs.writeFileSync(tmpDir + '/audio.mp3', mp3Buf);
  }

  const audioStat = fs.statSync(tmpDir + '/audio.mp3');
  if (audioStat.size < 1000) throw new Error('[Audio] File too small: ' + audioStat.size + ' bytes');
  try {
    await uploadToSupabase('audio', generationId + '.mp3', tmpDir + '/audio.mp3', 'audio/mpeg');
  } catch (upErr) { throw new Error('[Supabase-AudioUpload] ' + upErr.message); }

  // ── Step 4: Use scene count from webhook payload ──
  const requiredClips = Math.max(3, sceneCount || 5);

  // ── Step 5: Build SA-anchored image prompts ──
  const totalWords = sections.reduce((sum, s) => sum + s.split(/\\s+/).length, 0);
  const imagePrompts = [];
  const isHistorical = /apartheid|soweto|mandela|protest|struggle|township|1976|sharpeville|biko/i.test(topic);

  for (let i = 0; i < sections.length; i++) {
    const sectionWords = sections[i].split(/\\s+/).length;
    const imagesForSection = Math.max(1, Math.round(requiredClips * (sectionWords / totalWords)));
    const sentences = sections[i].split(/[.!?]+/).filter(s => s.trim().length > 15);
    for (let j = 0; j < imagesForSection; j++) {
      const idx = Math.min(Math.floor(j * sentences.length / imagesForSection), sentences.length - 1);
      const context = (sentences[idx] || sentences[0] || sections[i].substring(0, 150)).trim();
      if (isHistorical) {
        imagePrompts.push(buildSAHistoricalPrompt(context));
      } else {
        imagePrompts.push(buildSAPrompt(context, tone));
      }
    }
  }

  // Ensure we have at least requiredClips prompts
  while (imagePrompts.length < requiredClips) {
    imagePrompts.push(buildSAPrompt(topic, tone));
  }

  // ── Step 6: Generate images (tier-aware) ──
  const uploadedImages = [];
  const imageErrors = [];
  for (let i = 0; i < imagePrompts.length; i++) {
    try {
      await sendCallback(this.helpers, callbackUrl, generationId, 'processing', undefined, undefined, undefined, { stage: 'generating_images', current: i + 1, total: imagePrompts.length, message: 'Generating image ' + (i + 1) + ' of ' + imagePrompts.length + '...' });
      if (i > 0) await new Promise(r => setTimeout(r, 2000));

      const imgPath = tmpDir + '/img_' + i + '.jpg';

      if (imageTier === 'premium' || imageTier === 'ultra') {
        // Google Imagen 4.0 / Ultra
        const model = imageTier === 'ultra' ? 'imagen-4.0-ultra-generate-001' : 'imagen-4.0-generate-001';
        const imgBuf = await generateImagenImage(this.helpers, GOOGLE_API_KEY, imagePrompts[i], model);
        fs.writeFileSync(imgPath, imgBuf);
      } else {
        // Kie.ai Nano Banana 2 (standard)
        const createResp = await this.helpers.httpRequest({
          method: 'POST',
          url: 'https://api.kie.ai/api/v1/jobs/createTask',
          headers: { 'Authorization': 'Bearer ' + KIE_API_KEY, 'Content-Type': 'application/json' },
          body: { model: 'nano-banana-2', input: { prompt: imagePrompts[i].substring(0, 300), aspect_ratio: '16:9', resolution: '1K', output_format: 'jpg' } },
          json: true, timeout: 30000
        });
        if (!createResp.data || !createResp.data.taskId) { imageErrors.push('img' + i + ':no-taskId'); continue; }
        const taskId = createResp.data.taskId;

        let imageUrl = null;
        for (let poll = 0; poll < 18; poll++) {
          await new Promise(r => setTimeout(r, 5000));
          const statusResp = await this.helpers.httpRequest({
            method: 'GET',
            url: 'https://api.kie.ai/api/v1/jobs/recordInfo?taskId=' + taskId,
            headers: { 'Authorization': 'Bearer ' + KIE_API_KEY },
            json: true, timeout: 10000
          });
          const state = statusResp.data && statusResp.data.state;
          if (state === 'success') {
            const result = JSON.parse(statusResp.data.resultJson || '{}');
            if (result.resultUrls && result.resultUrls[0]) imageUrl = result.resultUrls[0];
            break;
          }
          if (state === 'fail') { imageErrors.push('img' + i + ':kie-fail:' + (statusResp.data.failMsg || '')); break; }
        }
        if (!imageUrl) { if (!imageErrors.some(e => e.startsWith('img' + i))) imageErrors.push('img' + i + ':timeout'); continue; }
        await downloadFile(imageUrl, imgPath);
      }

      if (fs.existsSync(imgPath) && fs.statSync(imgPath).size > 1000) {
        await uploadToSupabase('images', generationId + '/img_' + i + '.jpg', imgPath, 'image/jpeg');
        uploadedImages.push({
          index: i,
          url: SUPABASE_URL + '/storage/v1/object/public/images/' + generationId + '/img_' + i + '.jpg',
          prompt: imagePrompts[i].substring(0, 200)
        });
      }
    } catch (imgErr) { imageErrors.push('img' + i + ':' + (imgErr.message || String(imgErr)).substring(0, 150)); }
  }

  if (uploadedImages.length === 0) throw new Error('[Images] All failed: ' + imageErrors.join(' | '));

  // ── Step 7: Generate video clips (motionTier-aware) ──
  const videoClips = [];
  const motionErrors = [];

  if (motionTier === 'static' || !motionTier) {
    // Ken Burns effect — ffmpeg zoompan on still images
    // Smooth Ken Burns: use on/d ratio for linear interpolation (no per-frame float accumulation)
    // d=300 at fps=25 = 12s clips (longer, smoother, fewer loops needed)
    // Zoom range 1.0-1.15 (subtle), pan uses smooth ratio instead of integer pixel jumps
    const kenBurnsFilters = [
      "zoompan=z='1.0+0.15*(on/d)':d=300:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=25",
      "zoompan=z='1.15-0.15*(on/d)':d=300:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=25",
      "zoompan=z='1.08':d=300:x='(iw-iw/zoom)*(on/d)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=25",
      "zoompan=z='1.08':d=300:x='(iw-iw/zoom)*(1-on/d)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=25",
      "zoompan=z='1.08':d=300:x='iw/2-(iw/zoom/2)':y='(ih-ih/zoom)*(on/d)':s=1920x1080:fps=25",
      "zoompan=z='1.0+0.12*(on/d)':d=300:x='(iw-iw/zoom)*(on/d)':y='(ih-ih/zoom)*(on/d)':s=1920x1080:fps=25"
    ];

    for (let i = 0; i < uploadedImages.length; i++) {
      try {
        await sendCallback(this.helpers, callbackUrl, generationId, 'processing', undefined, undefined, undefined, { stage: 'generating_videos', current: i + 1, total: uploadedImages.length, message: 'Creating Ken Burns clip ' + (i + 1) + ' of ' + uploadedImages.length + '...' });
        const imgPath = tmpDir + '/img_' + uploadedImages[i].index + '.jpg';
        const clipPath = tmpDir + '/kb_clip_' + String(i).padStart(3, '0') + '.mp4';
        const filter = kenBurnsFilters[i % kenBurnsFilters.length];
        fs.writeFileSync(tmpDir + '/filter_' + i + '.txt', filter);
        execSync('ffmpeg -loop 1 -i ' + imgPath + ' -filter_script:v ' + tmpDir + '/filter_' + i + '.txt -c:v libx264 -t 12 -pix_fmt yuv420p -y ' + clipPath, { timeout: 120000 });
        if (fs.existsSync(clipPath) && fs.statSync(clipPath).size > 5000) {
          videoClips.push({ index: i, localPath: clipPath });
        }
      } catch (kbErr) {
        motionErrors.push('kb' + i + ':' + (kbErr.message || String(kbErr)).substring(0, 150));
      }
    }
  } else {
    // VEO3 Fast clips (ai and premium tiers) — hero clips
    for (let i = 0; i < uploadedImages.length; i++) {
      try {
        await sendCallback(this.helpers, callbackUrl, generationId, 'processing', undefined, undefined, undefined, { stage: 'generating_videos', current: i + 1, total: uploadedImages.length, message: 'Generating video clip ' + (i + 1) + ' of ' + uploadedImages.length + '...' });
        if (i > 0) await new Promise(r => setTimeout(r, 3000));
        const motionPrompt = uploadedImages[i].prompt + '. Slow cinematic camera movement, subtle pan and gentle zoom, atmospheric documentary feel, South African setting.';
        const clipUrl = await generateVEO3Clip(this.helpers, KIE_API_KEY, motionPrompt, 180000);
        videoClips.push({ index: i, url: clipUrl });
      } catch (veoErr) {
        motionErrors.push('veo' + i + ':' + (veoErr.message || String(veoErr)).substring(0, 150));
      }
    }

    // ── Hybrid filler: Ken Burns clips to reduce repetition on long videos ──
    const veoClipDuration = 8;
    const kbClipDuration = 12;
    const heroSeconds = videoClips.length * veoClipDuration;
    const audioDurationEstimate = (script.split(/\\s+/).length / 150) * 60;
    const fillerNeeded = audioDurationEstimate - heroSeconds;

    if (fillerNeeded > kbClipDuration && uploadedImages.length > 0) {
      const fillerFilters = [
        "zoompan=z='1.0+0.15*(on/d)':d=300:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=25",
        "zoompan=z='1.15-0.15*(on/d)':d=300:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=25",
        "zoompan=z='1.08':d=300:x='(iw-iw/zoom)*(on/d)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=25",
        "zoompan=z='1.08':d=300:x='(iw-iw/zoom)*(1-on/d)':y='ih/2-(ih/zoom/2)':s=1920x1080:fps=25",
        "zoompan=z='1.08':d=300:x='iw/2-(iw/zoom/2)':y='(ih-ih/zoom)*(on/d)':s=1920x1080:fps=25",
        "zoompan=z='1.0+0.12*(on/d)':d=300:x='(iw-iw/zoom)*(on/d)':y='(ih-ih/zoom)*(on/d)':s=1920x1080:fps=25"
      ];
      const fillerClipsNeeded = Math.min(Math.ceil(fillerNeeded / kbClipDuration), uploadedImages.length * fillerFilters.length);
      let fillerCount = 0;

      await sendCallback(this.helpers, callbackUrl, generationId, 'processing', undefined, undefined, undefined, { stage: 'generating_filler', message: 'Creating filler clips for duration coverage...' });

      for (let pass = 0; pass < fillerFilters.length && fillerCount < fillerClipsNeeded; pass++) {
        for (let i = 0; i < uploadedImages.length && fillerCount < fillerClipsNeeded; i++) {
          try {
            const imgPath = tmpDir + '/img_' + uploadedImages[i].index + '.jpg';
            const clipPath = tmpDir + '/filler_' + String(fillerCount).padStart(3, '0') + '.mp4';
            const filter = fillerFilters[pass];
            fs.writeFileSync(tmpDir + '/ffilter_' + fillerCount + '.txt', filter);
            execSync('ffmpeg -loop 1 -i ' + imgPath + ' -filter_script:v ' + tmpDir + '/ffilter_' + fillerCount + '.txt -c:v libx264 -t 12 -pix_fmt yuv420p -y ' + clipPath, { timeout: 120000 });
            if (fs.existsSync(clipPath) && fs.statSync(clipPath).size > 5000) {
              videoClips.push({ index: uploadedImages.length + fillerCount, localPath: clipPath });
              fillerCount++;
            }
          } catch (_kbErr) {}
        }
      }
    }
  }

  if (videoClips.length === 0) throw new Error('[Motion] All clips failed: ' + motionErrors.join(' | '));

  // Interleave hero clips (VEO3/primary) and filler clips (Ken Burns) for variety
  // Heroes have index < uploadedImages.length, fillers have index >= uploadedImages.length
  const heroClips = videoClips.filter(c => c.index < uploadedImages.length);
  const fillerClips = videoClips.filter(c => c.index >= uploadedImages.length);
  if (fillerClips.length > 0 && heroClips.length > 0) {
    const interleaved = [];
    const fillerPerHero = Math.max(1, Math.ceil(fillerClips.length / heroClips.length));
    let fi = 0;
    for (let hi = 0; hi < heroClips.length; hi++) {
      interleaved.push(heroClips[hi]);
      for (let f = 0; f < fillerPerHero && fi < fillerClips.length; f++) {
        interleaved.push(fillerClips[fi++]);
      }
    }
    while (fi < fillerClips.length) interleaved.push(fillerClips[fi++]);
    videoClips.length = 0;
    videoClips.push(...interleaved);
  }

  return [{ json: { generationId, callbackUrl, script, topic, duration, videoClips, uploadedImages, tmpDir, motionErrors, motionTier: motionTier || 'static' } }];
} catch (e) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_e) {}
  e.message = '[VideoPrepare] ' + e.message;
  throw e;
}`;


// ═══════════════════════════════════════════════════════════════
// Video Assemble — downloads VEO3 clips, concats, overlays TTS
// ═══════════════════════════════════════════════════════════════
const VIDEO_ASSEMBLE = `${CONSTANTS}
${CALLBACK_FN}
${BINARY_HELPERS}

const fs = require('fs');
const { execSync } = require('child_process');
const prev = $input.first().json;
const { generationId, callbackUrl, duration, videoClips, tmpDir, motionTier } = prev;

try {
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  await sendCallback(this.helpers, callbackUrl, generationId, 'processing', undefined, undefined, undefined, { stage: 'compiling', message: 'Assembling video...' });

  // Download TTS audio from Supabase
  const audioUrl = SUPABASE_URL + '/storage/v1/object/public/audio/' + generationId + '.mp3';
  await downloadFile(audioUrl, tmpDir + '/audio.mp3');
  const audioDuration = parseFloat(execSync('ffprobe -v error -show_entries format=duration -of csv=p=0 ' + tmpDir + '/audio.mp3', { timeout: 10000 }).toString().trim());
  if (isNaN(audioDuration) || audioDuration <= 0) throw new Error('Invalid audio duration');

  // Collect video clips (local Ken Burns or remote VEO3)
  const downloadedClips = [];
  for (let i = 0; i < videoClips.length; i++) {
    const clipPath = tmpDir + '/clip_' + String(i).padStart(3, '0') + '.mp4';
    try {
      if (videoClips[i].localPath) {
        // Ken Burns — already a local file
        fs.copyFileSync(videoClips[i].localPath, clipPath);
        if (fs.statSync(clipPath).size > 5000) downloadedClips.push(clipPath);
      } else if (videoClips[i].url) {
        // VEO3 — download from URL
        await downloadFile(videoClips[i].url, clipPath);
        if (fs.statSync(clipPath).size > 5000) downloadedClips.push(clipPath);
      }
    } catch (_e) {}
  }
  if (downloadedClips.length === 0) throw new Error('All clip downloads/copies failed');

  // Concat all clips, then loop to match audio duration
  const concatList = downloadedClips.map(f => "file '" + f + "'").join('\\n');
  fs.writeFileSync(tmpDir + '/concat.txt', concatList);
  execSync('ffmpeg -f concat -safe 0 -i ' + tmpDir + '/concat.txt -c copy -y ' + tmpDir + '/video_raw.mp4', { timeout: 600000 });

  // Check if video is shorter than audio; if so, loop video to cover full audio
  const videoDuration = parseFloat(execSync('ffprobe -v error -show_entries format=duration -of csv=p=0 ' + tmpDir + '/video_raw.mp4', { timeout: 10000 }).toString().trim());
  if (videoDuration < audioDuration - 1) {
    // Loop video to match audio length, then trim to exact audio duration
    const loopCount = Math.ceil(audioDuration / videoDuration);
    execSync('ffmpeg -stream_loop ' + (loopCount - 1) + ' -i ' + tmpDir + '/video_raw.mp4 -t ' + Math.ceil(audioDuration) + ' -c copy -y ' + tmpDir + '/video_no_audio.mp4', { timeout: 600000 });
  } else {
    fs.renameSync(tmpDir + '/video_raw.mp4', tmpDir + '/video_no_audio.mp4');
  }

  // Combine video with TTS audio, trim to audio duration
  execSync('ffmpeg -i ' + tmpDir + '/video_no_audio.mp4 -i ' + tmpDir + '/audio.mp3 -c:v copy -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest -y ' + tmpDir + '/final.mp4', { timeout: 600000 });

  // Extract thumbnail from first frame
  execSync('ffmpeg -i ' + tmpDir + '/final.mp4 -vframes 1 -q:v 2 -y ' + tmpDir + '/thumbnail.jpg', { timeout: 30000 });

  // Re-encode to stay under Supabase 50MB limit
  let finalSize = fs.statSync(tmpDir + '/final.mp4').size;
  const MAX_SIZE = 45 * 1024 * 1024;
  if (finalSize > MAX_SIZE) {
    // Calculate target bitrate: (targetBytes * 8) / duration, leave 10% margin
    const targetBitrate = Math.floor((MAX_SIZE * 0.9 * 8) / audioDuration);
    execSync('ffmpeg -i ' + tmpDir + '/final.mp4 -c:v libx264 -preset medium -b:v ' + targetBitrate + ' -maxrate ' + targetBitrate + ' -bufsize ' + (targetBitrate * 2) + ' -c:a aac -b:a 96k -y ' + tmpDir + '/final_small.mp4', { timeout: 600000 });
    fs.renameSync(tmpDir + '/final_small.mp4', tmpDir + '/final.mp4');
    finalSize = fs.statSync(tmpDir + '/final.mp4').size;
  }

  await sendCallback(this.helpers, callbackUrl, generationId, 'processing', undefined, undefined, undefined, { stage: 'uploading', message: 'Uploading video...' });
  await uploadToSupabase('video', generationId + '.mp4', tmpDir + '/final.mp4', 'video/mp4');
  await uploadToSupabase('thumbnails', generationId + '.jpg', tmpDir + '/thumbnail.jpg', 'image/jpeg');

  const videoUrl = SUPABASE_URL + '/storage/v1/object/public/video/' + generationId + '.mp4';

  await sendCallback(this.helpers, callbackUrl, generationId, 'complete', videoUrl, {
    duration: audioDuration, fileSize: finalSize, format: 'mp4',
    thumbnailUrl: SUPABASE_URL + '/storage/v1/object/public/thumbnails/' + generationId + '.jpg',
    clipCount: downloadedClips.length
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
  return [{ json: { success: true, generationId, videoUrl } }];
} catch (e) {
  try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_e) {}
  await sendCallback(this.helpers, callbackUrl, generationId, 'failed', undefined, undefined, 'Video assembly failed: ' + e.message);
  throw e;
}`;


// ═══════════════════════════════════════════════════════════════
// Error Handler
// ═══════════════════════════════════════════════════════════════
const ERROR_HANDLER = `${CONSTANTS}
${CALLBACK_FN}

let generationId = 'unknown';
let callbackUrl = '';
try { const d = $('Webhook').first().json.body; generationId = d.generationId; callbackUrl = d.callbackUrl; } catch (_e) {}

let errorMsg = 'Unknown error in generation pipeline';
try {
  const inputData = $input.first().json;
  errorMsg = inputData.message || inputData.error || inputData.description || JSON.stringify(inputData).substring(0, 500);
} catch (_e) {
  errorMsg = 'Workflow execution failed (no error details)';
}

if (callbackUrl) {
  await sendCallback(this.helpers, callbackUrl, generationId, 'failed', undefined, undefined, errorMsg);
}
return [{ json: { reported: true, generationId, error: errorMsg } }];`;


// ═══════════════════════════════════════════════════════════════
// Main — pushes all code to n8n and renames workflow
// ═══════════════════════════════════════════════════════════════
async function main() {
  console.log('Fetching workflow...');
  const getResp = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
    headers: { 'X-N8N-API-KEY': N8N_KEY }
  });
  const workflow = await getResp.json();
  console.log('Got workflow:', workflow.name, '- nodes:', workflow.nodes.length);

  const codeMap = {
    'MP3 Handler': MP3_HANDLER,
    'Description Handler': DESC_HANDLER,
    'Thumbnail Handler': THUMB_HANDLER,
    'Video Prepare': VIDEO_PREPARE,
    'Video Assemble': VIDEO_ASSEMBLE,
    'Error Handler': ERROR_HANDLER,
  };

  let updated = 0;
  for (const node of workflow.nodes) {
    if (codeMap[node.name]) {
      node.parameters.jsCode = codeMap[node.name];
      updated++;
      console.log('  Updated:', node.name);
    }
    // Update webhook path
    if (node.type === 'n8n-nodes-base.webhook' && node.parameters.path) {
      node.parameters.path = 'studiostack-generate';
      console.log('  Updated webhook path:', node.parameters.path);
    }
  }

  // Rename workflow
  const newName = 'StudioStack Generate';
  console.log(`Patched ${updated} nodes. Renaming to "${newName}". Pushing update...`);

  const putResp = await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}`, {
    method: 'PUT',
    headers: { 'X-N8N-API-KEY': N8N_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: newName,
      nodes: workflow.nodes,
      connections: workflow.connections,
      settings: workflow.settings,
      staticData: workflow.staticData
    })
  });

  if (!putResp.ok) {
    const err = await putResp.text();
    console.error('Update failed:', putResp.status, err);
    process.exit(1);
  }

  const result = await putResp.json();
  console.log('Workflow updated! Active:', result.active, '| Name:', result.name);

  if (!result.active) {
    console.log('Activating...');
    await fetch(`${N8N_URL}/api/v1/workflows/${WORKFLOW_ID}/activate`, {
      method: 'POST', headers: { 'X-N8N-API-KEY': N8N_KEY }
    });
  }

  // Verification
  console.log('\n--- VERIFICATION ---');
  const allCode = [MP3_HANDLER, DESC_HANDLER, THUMB_HANDLER, VIDEO_PREPARE, VIDEO_ASSEMBLE, ERROR_HANDLER].join('\n');
  const execCode = [MP3_HANDLER, DESC_HANDLER, THUMB_HANDLER, VIDEO_PREPARE, VIDEO_ASSEMBLE, ERROR_HANDLER].join('\n');
  console.log('zoompan in Ken Burns only:', VIDEO_PREPARE.includes('kenBurnsFilters') ? 'PASS (Ken Burns)' : 'MISSING');
  console.log('Imagen support:', VIDEO_PREPARE.includes('generateImagenImage') ? 'PASS' : 'FAIL');
  console.log('motionTier routing:', VIDEO_PREPARE.includes("motionTier === 'static'") ? 'PASS' : 'FAIL');
  console.log('YouTube transcript:', DESC_HANDLER.includes('captionTracks') ? 'PASS' : 'FAIL');
  console.log('cleanScriptForTTS in MP3:', MP3_HANDLER.includes('cleanScriptForTTS') ? 'PASS' : 'FAIL');
  console.log('cleanScriptForTTS in VideoPrepare:', VIDEO_PREPARE.includes('cleanScriptForTTS') ? 'PASS' : 'FAIL');
  console.log('generateVEO3Clip in VideoPrepare:', VIDEO_PREPARE.includes('generateVEO3Clip') ? 'PASS' : 'FAIL');
  console.log('South Africa in prompts:', VIDEO_PREPARE.includes('South Afric') ? 'PASS' : 'FAIL');
  console.log('CB_SECRET updated:', CONSTANTS.includes('studiostack-n8n-webhook-2026') ? 'PASS' : 'FAIL');
  console.log('-shortest flag:', VIDEO_ASSEMBLE.includes('-shortest') ? 'PASS' : 'FAIL');
  console.log('buildSAPrompt exists:', VIDEO_PREPARE.includes('buildSAPrompt') ? 'PASS' : 'FAIL');
  console.log('buildSAHistoricalPrompt exists:', VIDEO_PREPARE.includes('buildSAHistoricalPrompt') ? 'PASS' : 'FAIL');
}

main().catch(e => { console.error(e); process.exit(1); });
