/**
 * aiService.js
 *
 * Single entry point for all AI calls in the application.
 */

require('dotenv').config();
const ApiError = require('../utils/ApiError');

const PROVIDER = process.env.AI_PROVIDER || 'gemini';
const API_KEY = process.env.AI_API_KEY;
const MODEL = process.env.AI_MODEL || 'gemini-3.6-flash';

const MAX_RETRIES = 2;

// Robust JSON cleaner and parser
function parseJsonResponse(text) {
  let cleaned = text.trim();

  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  }

  // Isolate outermost JSON braces
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    // Sanitize unescaped control characters & newlines
    let repaired = cleaned
      .replace(/[\r\n]+/g, ' ')
      .replace(/\t/g, ' ')
      .replace(/[\x00-\x1F\x7F]/g, '');

    // Auto-close open quote or brace if cut off
    if (!repaired.endsWith('}')) {
      const quoteCount = (repaired.match(/(?<!\\)"/g) || []).length;
      if (quoteCount % 2 !== 0) {
        repaired += '"';
      }
      repaired += '}';
    }

    return JSON.parse(repaired);
  }
}

async function callAnthropic({ systemPrompt, userPrompt, temperature, maxTokens }) {
  const response = await fetch('[https://api.anthropic.com/v1/messages](https://api.anthropic.com/v1/messages)', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': (process.env.AI_API_KEY || API_KEY || '').trim(),
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || MODEL || 'claude-sonnet-4-6',
      max_tokens: maxTokens || 4096,
      temperature: temperature ?? 0.3,
      system: systemPrompt,
      messages: [{ role: 'user', content: userPrompt }],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new ApiError(502, `AI provider error (${response.status}): ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const textBlock = data.content?.find((c) => c.type === 'text');
  if (!textBlock) {
    throw new ApiError(502, 'AI provider returned no text content');
  }
  return textBlock.text;
}

async function callOpenAI({ systemPrompt, userPrompt, temperature, maxTokens }) {
  const response = await fetch('[https://api.openai.com/v1/chat/completions](https://api.openai.com/v1/chat/completions)', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + (process.env.AI_API_KEY || API_KEY || '').trim(),
    },
    body: JSON.stringify({
      model: process.env.AI_MODEL || MODEL || 'gpt-4o-mini',
      max_tokens: maxTokens || 4096,
      temperature: temperature ?? 0.3,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new ApiError(502, `AI provider error (${response.status}): ${errBody.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content;
  if (!text) {
    throw new ApiError(502, 'AI provider returned no text content');
  }
  return text;
}

async function callGemini({ systemPrompt, userPrompt, temperature, maxTokens, expectJson }) {
  const targetModel = process.env.AI_MODEL || MODEL || 'gemini-3.6-flash';
  const targetKey = (process.env.AI_API_KEY || API_KEY || '').trim();

  // Send request cleanly with key passed in header to avoid URL parsing issues
const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + targetModel + ':generateContent';

  const generationConfig = {
    temperature: temperature ?? 0.1,
    maxOutputTokens: 16384,
  };

  if (expectJson) {
    generationConfig.responseMimeType = 'application/json';
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-goog-api-key': targetKey,
    },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt + '\nRespond with pure valid JSON only.' }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig,
    }),
  });

  if (!response.ok) {
    const errBody = await response.text().catch(() => '');
    throw new ApiError(502, `AI provider error (${response.status}): ${errBody.slice(0, 300)}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
  if (!text) {
    const reason = data.candidates?.[0]?.finishReason;
    throw new ApiError(502, `AI provider returned no text content${reason ? ` (finishReason: ${reason})` : ''}`);
  }
  return text;
}

// Routes request to the active provider
async function callProvider(params) {
  const currentKey = (process.env.AI_API_KEY || API_KEY || '').trim();
  if (!currentKey) {
    throw new ApiError(
      503,
      'AI provider is not configured. Set AI_API_KEY in the server .env file.'
    );
  }

  const activeProvider = (process.env.AI_PROVIDER || PROVIDER || '').toLowerCase();

  if (activeProvider === 'openai') return callOpenAI(params);
  if (activeProvider === 'anthropic') return callAnthropic(params);
  return callGemini(params);
}

/**
 * callAI - core wrapper with auto-retries
 */
async function callAI({ systemPrompt, userPrompt, expectJson = true, temperature, maxTokens }) {
  let lastError;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    try {
      const prompt =
        attempt === 0
          ? userPrompt
          : `${userPrompt}\n\nIMPORTANT: Your previous response was not valid JSON. Respond with ONLY valid JSON, no markdown fences, no commentary.`;

      const rawText = await callProvider({
        systemPrompt,
        userPrompt: prompt,
        temperature,
        maxTokens,
        expectJson,
      });

      if (!expectJson) return rawText;

      return parseJsonResponse(rawText);
    } catch (err) {
      lastError = err;
      if (err instanceof ApiError && err.statusCode === 503) throw err;
      const isParseError = err instanceof SyntaxError;
      const isTransient = err instanceof ApiError && err.statusCode >= 500;
      if (!isParseError && !isTransient) throw err;
    }
  }

  throw new ApiError(502, `AI request failed after ${MAX_RETRIES + 1} attempts: ${lastError.message}`);
}

module.exports = { callAI };