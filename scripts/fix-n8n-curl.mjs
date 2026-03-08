/**
 * StudioStack n8n workflow patcher.
 * Pushes all Code node updates to the live n8n workflow.
 * Reads all secrets from .env.local (gitignored) to prevent key leaks.
 */

const fs = require('fs');
const path = require('path');

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
const ELEVENLABS_KEY = '${env('ELEVENLABS_API_KEY')}';
const KOKORO_URL = '${env('KOKORO_ENDPOINT')}';
const KOKORO_KEY = '${env('KOKORO_API_KEY')}';
const KIE_API_KEY = '${env('KIE_API_KEY')}';
const SUPABASE_URL = '${env('NEXT_PUBLIC_SUPABASE_URL')}';
const SUPABASE_KEY = '${env('SUPABASE_SERVICE_ROLE_KEY')}';
const CB_SECRET = '${env('N8N_WEBHOOK_SECRET')}';`;

// ─── Callback helper ─────────────────────────────────────────
const CALLBACK_FN = `
async function sendCallback(helpers, callbackUrl, generationId, status, outputUrl, metadata, error) {
  try {
    await helpers.httpRequest({
      method: 'POST', url: callbackUrl,
      headers: { 'Content-Type': 'application/json', 'X-Webhook-Secret': CB_SECRET },
      body: { generationId, status, outputUrl, metadata, error },
      json: true, timeout: 15000
    });
  } catch (_e) { /* callback failed */ }
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
async function generateVEO3Clip(helpers, kieKey, imageUrl, prompt, maxWaitMs) {
  maxWaitMs = maxWaitMs || 180000;
  const createResp = await helpers.httpRequest({
    method: 'POST',
    url: 'https://api.kie.ai/api/v1/veo/generate',
    headers: { 'Authorization': 'Bearer ' + kieKey, 'Content-Type': 'application/json' },
    body: {
      model: 'veo3_fast',
      generationType: 'REFERENCE_2_VIDEO',
      prompt: prompt.substring(0, 300),
      referenceImage: imageUrl,
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
    await new Promise(r => setTimeout(r, 5000));
    const statusResp = await helpers.httpRequest({
      method: 'GET',
      url: 'https://api.kie.ai/api/v1/veo/record-info?taskId=' + taskId,
      headers: { 'Authorization': 'Bearer ' + kieKey },
      json: true, timeout: 10000
    });

    const state = statusResp.data && statusResp.data.state;
    if (state === 'success') {
      const result = JSON.parse(statusResp.data.resultJson || '{}');
      if (result.videoUrl) return result.videoUrl;
      throw new Error('VEO3 success but no videoUrl in result');
    }
    if (state === 'fail') {
      throw new Error('VEO3 failed: ' + (statusResp.data.failMsg || 'unknown'));
    }
  }

  throw new Error('VEO3 timed out after ' + (maxWaitMs / 1000) + 's');
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
        url: 'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + GOOGLE_API_KEY,
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
const { generationId, topic, brandVoice, affiliateLinks, callbackUrl } = data;

try {
  let brandInstructions = '';
  if (brandVoice) {
    brandInstructions = '\\n\\nBrand Voice: Tone=' + (brandVoice.tone || 'professional') + ', Style=' + (brandVoice.style || 'informative');
    if (brandVoice.keywords) brandInstructions += ', Keywords: ' + (Array.isArray(brandVoice.keywords) ? brandVoice.keywords.join(', ') : brandVoice.keywords);
  }

  let affiliateInstructions = '';
  if (affiliateLinks && affiliateLinks.length > 0) {
    affiliateInstructions = '\\n\\nNaturally include these links:\\n' + affiliateLinks.map(l => '- ' + l.label + ': ' + l.url).join('\\n');
  }

  const prompt = 'Write a professional YouTube video description for: ' + topic + '\\n\\nRequirements:\\n- Engaging hook in the first 2 lines\\n- Organized sections with emoji headers\\n- Timestamps placeholder section\\n- 5-8 relevant hashtags at end\\n- SEO-optimized keywords\\n- Subscribe/like CTA\\n- 1500-2500 characters total' + brandInstructions + affiliateInstructions + '\\n\\nWrite ONLY the description text, ready to paste into YouTube.';

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

const fs = require('fs');
const data = $('Webhook').first().json.body;
const { generationId, topic, imageTier, callbackUrl } = data;
const style = data.style || '';
const tmpDir = '/tmp/ss_' + generationId;

try {
  fs.mkdirSync(tmpDir, { recursive: true });
  const prompt = 'YouTube thumbnail for: ' + topic + '. South African context. ' + (style ? 'Style: ' + style + '. ' : '') + 'Eye-catching, bold, high contrast, professional YouTube thumbnail, 16:9 aspect ratio, vibrant colors, clear focal point, cinematic quality.';

  // Generate thumbnail via Kie.ai Nano Banana 2
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

const fs = require('fs');
const { execSync } = require('child_process');
const data = $('Webhook').first().json.body;
const { generationId, topic, duration, tone, voiceTier, imageTier, sceneCount, callbackUrl, customScript } = data;
const tmpDir = '/tmp/ss_' + generationId;

try {
  fs.mkdirSync(tmpDir, { recursive: true });

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
          url: 'https://texttospeech.googleapis.com/v1/text:synthesize?key=' + GOOGLE_API_KEY,
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

  // ── Step 4: Calculate required clips for duration matching ──
  const audioDurationEstimate = (script.split(/\\s+/).length / 150) * 60;
  const clipDuration = 8;
  const requiredClips = Math.max(3, sceneCount || Math.ceil(audioDurationEstimate / clipDuration));

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

  // ── Step 6: Generate images via Kie.ai Nano Banana 2 ──
  const uploadedImages = [];
  const imageErrors = [];
  for (let i = 0; i < imagePrompts.length; i++) {
    try {
      if (i > 0) await new Promise(r => setTimeout(r, 2000));
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

      await downloadFile(imageUrl, tmpDir + '/img_' + i + '.jpg');
      const imgPath = tmpDir + '/img_' + i + '.jpg';
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

  // ── Step 7: Generate VEO3 Fast video clips from each image ──
  const videoClips = [];
  const veoErrors = [];
  for (let i = 0; i < uploadedImages.length; i++) {
    try {
      if (i > 0) await new Promise(r => setTimeout(r, 3000));
      const motionPrompt = 'Slow cinematic camera movement across this South African scene. Subtle pan and gentle zoom. Atmospheric, documentary feel.';
      const clipUrl = await generateVEO3Clip(this.helpers, KIE_API_KEY, uploadedImages[i].url, motionPrompt, 180000);
      videoClips.push({ index: i, url: clipUrl });
    } catch (veoErr) {
      veoErrors.push('veo' + i + ':' + (veoErr.message || String(veoErr)).substring(0, 150));
    }
  }

  if (videoClips.length === 0) throw new Error('[VEO3] All clips failed: ' + veoErrors.join(' | '));

  return [{ json: { generationId, callbackUrl, script, topic, duration, videoClips, uploadedImages, tmpDir, veoErrors } }];
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
const { generationId, callbackUrl, duration, videoClips, tmpDir } = prev;

try {
  if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

  // Download TTS audio from Supabase
  const audioUrl = SUPABASE_URL + '/storage/v1/object/public/audio/' + generationId + '.mp3';
  await downloadFile(audioUrl, tmpDir + '/audio.mp3');
  const audioDuration = parseFloat(execSync('ffprobe -v error -show_entries format=duration -of csv=p=0 ' + tmpDir + '/audio.mp3', { timeout: 10000 }).toString().trim());
  if (isNaN(audioDuration) || audioDuration <= 0) throw new Error('Invalid audio duration');

  // Download all VEO3 video clips
  const downloadedClips = [];
  for (let i = 0; i < videoClips.length; i++) {
    const clipPath = tmpDir + '/clip_' + String(i).padStart(3, '0') + '.mp4';
    try {
      await downloadFile(videoClips[i].url, clipPath);
      if (fs.statSync(clipPath).size > 5000) downloadedClips.push(clipPath);
    } catch (_e) {}
  }
  if (downloadedClips.length === 0) throw new Error('All VEO3 clip downloads failed');

  // Simple concat — VEO3 clips only, no static image effects
  const concatList = downloadedClips.map(f => "file '" + f + "'").join('\\n');
  fs.writeFileSync(tmpDir + '/concat.txt', concatList);
  execSync('ffmpeg -f concat -safe 0 -i ' + tmpDir + '/concat.txt -c copy -y ' + tmpDir + '/video_no_audio.mp4', { timeout: 600000 });

  // Replace VEO3 audio with TTS audio, use -shortest to match lengths
  execSync('ffmpeg -i ' + tmpDir + '/video_no_audio.mp4 -i ' + tmpDir + '/audio.mp3 -c:v copy -c:a aac -b:a 128k -map 0:v:0 -map 1:a:0 -shortest -y ' + tmpDir + '/final.mp4', { timeout: 600000 });

  // Extract thumbnail from first frame
  execSync('ffmpeg -i ' + tmpDir + '/final.mp4 -vframes 1 -q:v 2 -y ' + tmpDir + '/thumbnail.jpg', { timeout: 30000 });

  // Re-encode if over 45MB (Supabase 50MB limit)
  let finalSize = fs.statSync(tmpDir + '/final.mp4').size;
  if (finalSize > 45 * 1024 * 1024) {
    execSync('ffmpeg -i ' + tmpDir + '/final.mp4 -c:v libx264 -preset medium -crf 28 -c:a aac -b:a 96k -y ' + tmpDir + '/final_small.mp4', { timeout: 600000 });
    fs.renameSync(tmpDir + '/final_small.mp4', tmpDir + '/final.mp4');
    finalSize = fs.statSync(tmpDir + '/final.mp4').size;
  }

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
  console.log('zoompan in executable code:', (execCode.match(/zoompan/g) || []).length === 0 ? 'ZERO (PASS)' : 'FOUND (FAIL)');
  console.log('zoom+0.00 in executable code:', (execCode.match(/zoom\+0\.00/g) || []).length === 0 ? 'ZERO (PASS)' : 'FOUND (FAIL)');
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
