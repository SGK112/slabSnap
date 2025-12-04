/**
 * AI Proxy Routes - Securely proxy AI requests
 * Keys are stored on server, never exposed to client
 */

import express from 'express';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * POST /api/ai/chat
 * Proxy chat requests to OpenAI/Anthropic
 */
router.post('/chat', protect, async (req, res) => {
  try {
    const { messages, model = 'gpt-4o-mini', provider = 'openai' } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Messages array is required' });
    }

    let response;

    if (provider === 'anthropic') {
      // Anthropic API
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Anthropic not configured' });
      }

      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: model || 'claude-3-haiku-20240307',
          max_tokens: 4096,
          messages: messages.map(m => ({
            role: m.role === 'system' ? 'user' : m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'Anthropic API error');
      }

      return res.json({
        content: data.content[0]?.text || '',
        model: data.model,
        usage: data.usage,
      });
    } else {
      // OpenAI API (default)
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI not configured' });
      }

      response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: 4096,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || 'OpenAI API error');
      }

      return res.json({
        content: data.choices[0]?.message?.content || '',
        model: data.model,
        usage: data.usage,
      });
    }
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ error: error.message || 'AI request failed' });
  }
});

/**
 * POST /api/ai/image
 * Generate image with DALL-E or other providers
 */
router.post('/image', protect, async (req, res) => {
  try {
    const { prompt, size = '1024x1024', quality = 'standard' } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI not configured' });
    }

    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'dall-e-3',
        prompt,
        n: 1,
        size,
        quality,
      }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Image generation failed');
    }

    res.json({
      url: data.data[0]?.url,
      revised_prompt: data.data[0]?.revised_prompt,
    });
  } catch (error) {
    console.error('Image generation error:', error);
    res.status(500).json({ error: error.message || 'Image generation failed' });
  }
});

/**
 * POST /api/ai/transcribe
 * Transcribe audio with Whisper
 */
router.post('/transcribe', protect, async (req, res) => {
  try {
    const { audioUrl, audioBase64 } = req.body;

    if (!audioUrl && !audioBase64) {
      return res.status(400).json({ error: 'Audio URL or base64 is required' });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OpenAI not configured' });
    }

    // For base64, we need to convert to a file
    let audioBuffer;
    if (audioBase64) {
      audioBuffer = Buffer.from(audioBase64, 'base64');
    } else {
      const audioResponse = await fetch(audioUrl);
      audioBuffer = await audioResponse.arrayBuffer();
    }

    const formData = new FormData();
    formData.append('file', new Blob([audioBuffer]), 'audio.m4a');
    formData.append('model', 'whisper-1');

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
      body: formData,
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || 'Transcription failed');
    }

    res.json({ text: data.text });
  } catch (error) {
    console.error('Transcription error:', error);
    res.status(500).json({ error: error.message || 'Transcription failed' });
  }
});

/**
 * POST /api/ai/tts
 * Text-to-speech with ElevenLabs or OpenAI
 */
router.post('/tts', protect, async (req, res) => {
  try {
    const { text, voice = 'alloy', provider = 'openai' } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    if (provider === 'elevenlabs') {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'ElevenLabs not configured' });
      }

      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voice}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text,
            model_id: 'eleven_monolingual_v1',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('ElevenLabs TTS failed');
      }

      const audioBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(audioBuffer).toString('base64');

      return res.json({ audio: base64, format: 'mp3' });
    } else {
      // OpenAI TTS
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'OpenAI not configured' });
      }

      const response = await fetch('https://api.openai.com/v1/audio/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'tts-1',
          input: text,
          voice,
        }),
      });

      if (!response.ok) {
        throw new Error('OpenAI TTS failed');
      }

      const audioBuffer = await response.arrayBuffer();
      const base64 = Buffer.from(audioBuffer).toString('base64');

      return res.json({ audio: base64, format: 'mp3' });
    }
  } catch (error) {
    console.error('TTS error:', error);
    res.status(500).json({ error: error.message || 'TTS failed' });
  }
});

export default router;
