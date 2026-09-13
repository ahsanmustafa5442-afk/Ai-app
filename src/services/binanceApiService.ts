import { BinanceLiveAccountStatus, BinanceLivePosition } from '../types';

export async function fetchBinanceLiveStatus(): Promise<BinanceLiveAccountStatus> {
  try {
    const res = await fetch('/api/binance/status');
    if (!res.ok) {
      throw new Error(`Status check returned ${res.status}`);
    }
    const data = await res.json();
    return data;
  } catch (err: any) {
    return {
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
      error: err?.message || 'Failed to fetch Binance live status',
      lastChecked: Date.now(),
    };
  }
}

export async function saveBinanceCredentials(
  apiKey: string,
  apiSecret: string
): Promise<{ success: boolean; error?: string; data?: BinanceLiveAccountStatus }> {
  try {
    const res = await fetch('/api/binance/credentials', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey, apiSecret }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data?.error || 'Failed to connect Binance credentials.' };
    }

    return { success: true, data };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error saving credentials' };
  }
}

export async function testBinanceConnection(): Promise<{
  success: boolean;
  message?: string;
  latencyMs?: number;
  canTrade?: boolean;
  balance?: any;
  error?: string;
}> {
  try {
    const res = await fetch('/api/binance/test-connection', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data?.error || 'Connection test failed.' };
    }

    return {
      success: true,
      message: data.message,
      latencyMs: data.latencyMs,
      canTrade: data.canTrade,
      balance: data.balance,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error testing connection' };
  }
}

export async function toggleLiveTrading(
  enabled: boolean,
  confirmed: boolean
): Promise<{ success: boolean; liveTradingEnabled?: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/binance/toggle-live-trading', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled, confirmed }),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      return { success: false, error: data?.error || 'Failed to toggle live trading.' };
    }

    return {
      success: true,
      liveTradingEnabled: data.liveTradingEnabled,
      message: data.message,
    };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Network error toggling live trading' };
  }
}

export async function disconnectBinance(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch('/api/binance/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const data = await res.json();
    return { success: true, message: data?.message };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to disconnect Binance credentials' };
  }
}

export async function fetchLivePositions(): Promise<{ positions: BinanceLivePosition[]; error?: string }> {
  try {
    const res = await fetch('/api/binance/positions');
    const data = await res.json();
    if (!res.ok) {
      return { positions: [], error: data?.error };
    }
    return { positions: data.positions || [] };
  } catch (err: any) {
    return { positions: [], error: err?.message || 'Failed to fetch live positions' };
  }
}
