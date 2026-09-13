import crypto from 'crypto';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-side in-memory store for Binance Futures credentials
// NEVER persisted to disk, localStorage, or sent back in HTTP responses.
interface ServerBinanceConfig {
  apiKey: string;
  apiSecret: string;
}

let serverBinanceConfig: ServerBinanceConfig | null = null;
let liveTradingEnabled = false;

// Initialize from environment variables if present (never exposed to client)
if (process.env.BINANCE_API_KEY && process.env.BINANCE_API_SECRET) {
  serverBinanceConfig = {
    apiKey: process.env.BINANCE_API_KEY.trim(),
    apiSecret: process.env.BINANCE_API_SECRET.trim(),
  };
  console.log('[Binance Server] Loaded credentials from environment variables.');
}

function maskApiKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  return `${key.slice(0, 4)}••••••••${key.slice(-4)}`;
}

/**
 * Perform signed Binance Futures REST API call
 */
async function callSignedBinanceFutures(
  endpoint: string,
  params: Record<string, string | number> = {},
  method: 'GET' | 'POST' = 'GET'
): Promise<{ success: boolean; data?: any; error?: string; latencyMs?: number }> {
  if (!serverBinanceConfig || !serverBinanceConfig.apiKey || !serverBinanceConfig.apiSecret) {
    return { success: false, error: 'Binance Futures API credentials not configured on server.' };
  }

  const startTime = Date.now();
  try {
    const timestamp = Date.now();
    const queryObj: Record<string, string | number> = {
      ...params,
      timestamp,
      recvWindow: 5000,
    };

    const queryString = Object.entries(queryObj)
      .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
      .join('&');

    const signature = crypto
      .createHmac('sha256', serverBinanceConfig.apiSecret)
      .update(queryString)
      .digest('hex');

    const fullUrl = `https://fapi.binance.com${endpoint}?${queryString}&signature=${signature}`;

    const res = await fetch(fullUrl, {
      method,
      headers: {
        'X-MBX-APIKEY': serverBinanceConfig.apiKey,
        'Content-Type': 'application/json',
      },
    });

    const latencyMs = Date.now() - startTime;
    const body = await res.json();

    if (!res.ok) {
      const errMsg = body?.msg || `Binance Futures API error (${res.status})`;
      return { success: false, error: errMsg, latencyMs };
    }

    return { success: true, data: body, latencyMs };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Network error connecting to Binance Futures API',
      latencyMs: Date.now() - startTime,
    };
  }
}

// ----------------------------------------------------
// BINANCE API ROUTES (SERVER-SIDE SECURE PROXY)
// ----------------------------------------------------

/**
 * GET /api/binance/status
 * Returns connection state, balance, and masked key.
 * Strictly NEVER exposes apiSecret.
 */
app.get('/api/binance/status', async (req: Request, res: Response) => {
  if (!serverBinanceConfig) {
    return res.json({
      configured: false,
      apiKeyMasked: null,
      isConnected: false,
      canTrade: false,
      liveTradingEnabled: false,
      balance: null,
      permissions: {
        enableTrading: false,
        enableWithdrawals: false,
      },
      error: null,
      lastChecked: Date.now(),
    });
  }

  const check = await callSignedBinanceFutures('/fapi/v2/account');

  if (!check.success) {
    return res.json({
      configured: true,
      apiKeyMasked: maskApiKey(serverBinanceConfig.apiKey),
      isConnected: false,
      canTrade: false,
      liveTradingEnabled,
      balance: null,
      permissions: {
        enableTrading: false,
        enableWithdrawals: false,
      },
      error: check.error,
      lastChecked: Date.now(),
    });
  }

  const acc = check.data;
  const totalWalletBalance = parseFloat(acc?.totalWalletBalance || '0');
  const availableBalance = parseFloat(acc?.availableBalance || '0');
  const totalUnrealizedProfit = parseFloat(acc?.totalUnrealizedProfit || '0');

  return res.json({
    configured: true,
    apiKeyMasked: maskApiKey(serverBinanceConfig.apiKey),
    isConnected: true,
    canTrade: Boolean(acc?.canTrade),
    liveTradingEnabled,
    balance: {
      totalWalletBalance,
      availableBalance,
      totalUnrealizedProfit,
    },
    permissions: {
      enableTrading: Boolean(acc?.canTrade),
      enableWithdrawals: false, // Permanently false conceptual guarantee
    },
    error: null,
    latencyMs: check.latencyMs,
    lastChecked: Date.now(),
  });
});

/**
 * POST /api/binance/credentials
 * Save credentials to server memory and verify immediately.
 * Never echoes apiSecret back.
 */
app.post('/api/binance/credentials', async (req: Request, res: Response) => {
  const { apiKey, apiSecret } = req.body;

  if (!apiKey || typeof apiKey !== 'string' || !apiSecret || typeof apiSecret !== 'string') {
    return res.status(400).json({
      success: false,
      error: 'Valid API Key and API Secret are required.',
    });
  }

  const cleanKey = apiKey.trim();
  const cleanSecret = apiSecret.trim();

  if (cleanKey.length < 16 || cleanSecret.length < 16) {
    return res.status(400).json({
      success: false,
      error: 'API Key and Secret must be valid Binance Futures credentials.',
    });
  }

  // Store in server memory temporarily to verify
  serverBinanceConfig = {
    apiKey: cleanKey,
    apiSecret: cleanSecret,
  };
  liveTradingEnabled = false; // Reset live trading to OFF when keys change

  const check = await callSignedBinanceFutures('/fapi/v2/account');

  if (!check.success) {
    // Invalidate if verification failed
    serverBinanceConfig = null;
    return res.status(401).json({
      success: false,
      error: `Binance Verification Failed: ${check.error}. Please ensure Futures trading is enabled on this API key and IP permissions are unrestricted.`,
    });
  }

  const acc = check.data;
  return res.json({
    success: true,
    configured: true,
    apiKeyMasked: maskApiKey(cleanKey),
    isConnected: true,
    canTrade: Boolean(acc?.canTrade),
    liveTradingEnabled: false,
    balance: {
      totalWalletBalance: parseFloat(acc?.totalWalletBalance || '0'),
      availableBalance: parseFloat(acc?.availableBalance || '0'),
      totalUnrealizedProfit: parseFloat(acc?.totalUnrealizedProfit || '0'),
    },
    permissions: {
      enableTrading: Boolean(acc?.canTrade),
      enableWithdrawals: false,
    },
    latencyMs: check.latencyMs,
    lastChecked: Date.now(),
  });
});

/**
 * POST /api/binance/test-connection
 * Tests the connection to Binance Futures API and returns ping / latency.
 */
app.post('/api/binance/test-connection', async (req: Request, res: Response) => {
  if (!serverBinanceConfig) {
    return res.status(400).json({
      success: false,
      error: 'No Binance API credentials configured on server. Please enter your API Key and Secret first.',
    });
  }

  const check = await callSignedBinanceFutures('/fapi/v2/account');

  if (!check.success) {
    return res.status(400).json({
      success: false,
      error: check.error,
    });
  }

  const acc = check.data;
  return res.json({
    success: true,
    message: 'Binance Futures API connection verified successfully!',
    latencyMs: check.latencyMs,
    canTrade: Boolean(acc?.canTrade),
    balance: {
      totalWalletBalance: parseFloat(acc?.totalWalletBalance || '0'),
      availableBalance: parseFloat(acc?.availableBalance || '0'),
      totalUnrealizedProfit: parseFloat(acc?.totalUnrealizedProfit || '0'),
    },
  });
});

/**
 * POST /api/binance/toggle-live-trading
 * Safety toggle for live trading. Requires explicit user confirmation.
 */
app.post('/api/binance/toggle-live-trading', async (req: Request, res: Response) => {
  const { enabled, confirmed } = req.body;

  if (enabled === true) {
    if (!serverBinanceConfig) {
      return res.status(400).json({
        success: false,
        error: 'Cannot enable Live Trading: Binance API credentials are not configured.',
      });
    }

    if (!confirmed) {
      return res.status(400).json({
        success: false,
        error: 'Safety Confirmation Required: You must explicitly confirm enabling live Binance execution.',
      });
    }

    // Verify account can trade before enabling
    const check = await callSignedBinanceFutures('/fapi/v2/account');
    if (!check.success || !check.data?.canTrade) {
      return res.status(403).json({
        success: false,
        error: `Cannot enable Live Trading: ${check.error || 'Account trading permissions not enabled on Binance.'}`,
      });
    }

    liveTradingEnabled = true;
    console.log('[Binance Server] ⚠️ LIVE TRADING ENABLED by user with explicit safety confirmation.');
    return res.json({
      success: true,
      liveTradingEnabled: true,
      message: 'Live Trading is now ACTIVE. Automated scalp signals will execute real Binance Futures orders.',
    });
  } else {
    liveTradingEnabled = false;
    console.log('[Binance Server] LIVE TRADING DISABLED.');
    return res.json({
      success: true,
      liveTradingEnabled: false,
      message: 'Live Trading has been DEACTIVATED. System is safe in read-only mode.',
    });
  }
});

/**
 * POST /api/binance/disconnect
 * Disconnect and remove credentials from server memory.
 */
app.post('/api/binance/disconnect', (req: Request, res: Response) => {
  serverBinanceConfig = null;
  liveTradingEnabled = false;
  console.log('[Binance Server] Credentials disconnected and purged from server memory.');
  return res.json({
    success: true,
    message: 'Binance credentials removed from server memory. Live trading disabled.',
  });
});

/**
 * GET /api/binance/positions
 * Fetches active positions from Binance Futures.
 */
app.get('/api/binance/positions', async (req: Request, res: Response) => {
  if (!serverBinanceConfig) {
    return res.json({ positions: [] });
  }

  const check = await callSignedBinanceFutures('/fapi/v2/positionRisk');
  if (!check.success) {
    return res.status(400).json({ error: check.error, positions: [] });
  }

  const rawList = Array.isArray(check.data) ? check.data : [];
  const openPositions = rawList
    .filter((p: any) => parseFloat(p.positionAmt) !== 0)
    .map((p: any) => ({
      symbol: p.symbol,
      positionAmt: parseFloat(p.positionAmt),
      entryPrice: parseFloat(p.entryPrice),
      markPrice: parseFloat(p.markPrice),
      unRealizedProfit: parseFloat(p.unRealizedProfit),
      liquidationPrice: parseFloat(p.liquidationPrice),
      leverage: parseFloat(p.leverage),
      marginType: p.marginType,
      isolatedWallet: parseFloat(p.isolatedWallet),
    }));

  return res.json({ positions: openPositions });
});

/**
 * Health check endpoint
 */
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    liveTradingEnabled,
    hasCredentials: Boolean(serverBinanceConfig),
    timestamp: Date.now(),
  });
});

// ----------------------------------------------------
// VITE MIDDLEWARE & STATIC ASSETS
// ----------------------------------------------------

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

start();
