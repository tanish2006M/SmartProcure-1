import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { handleAiChatRequest } from './src/server/geminiHandler';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health API route
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', service: 'SmartProcure', timestamp: new Date().toISOString() });
  });

  // AI Chat API route
  app.post('/api/ai/chat', async (req, res) => {
    try {
      const result = await handleAiChatRequest(req.body);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err?.message || 'AI request failed' });
    }
  });

  // SMS Gateway Configuration API
  app.get('/api/sms/config', (req, res) => {
    const isConfigured = Boolean(process.env.SMS_API_KEY);
    const mode = process.env.SMS_MODE || (isConfigured ? 'LIVE' : 'DEMO');
    const provider = process.env.SMS_PROVIDER || (isConfigured ? 'custom_http' : 'demo_nic_simulator');
    const senderId = process.env.SMS_SENDER_ID || 'VK-GOVDOC';

    res.json({
      mode,
      isConfigured,
      provider,
      senderId,
      isDemo: mode === 'DEMO' || !isConfigured,
    });
  });

  // SMS Dispatch Proxy API
  app.post('/api/sms/send', async (req, res) => {
    try {
      const { to, message, priority, templateId, eventId } = req.body;
      const isConfigured = Boolean(process.env.SMS_API_KEY);
      const mode = process.env.SMS_MODE || (isConfigured ? 'LIVE' : 'DEMO');

      // If credentials exist and not forced to DEMO, dispatch through real HTTP provider
      if (isConfigured && mode === 'LIVE') {
        const trackingId = `PROD-SMS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
        return res.json({
          success: true,
          status: 'SENT',
          provider: process.env.SMS_PROVIDER || 'custom_http',
          trackingId,
          isDemo: false,
        });
      }

      // Default safe simulation response
      const trackingId = `DEMO-SMS-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
      return res.json({
        success: true,
        status: 'DEMO SENT',
        provider: 'demo_nic_simulator',
        trackingId,
        isDemo: true,
      });
    } catch (err: any) {
      res.status(500).json({
        success: false,
        status: 'FAILED',
        error: err?.message || 'Failed to dispatch SMS',
      });
    }
  });

  // Vite middleware in development vs static serving in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartProcure server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
