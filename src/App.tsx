import React from 'react';
import { AnalysisFlowDrawer } from './components/AnalysisFlowDrawer';
import { CandleVisualizer } from './components/CandleVisualizer';
import { CoinSelectionModal } from './components/CoinSelectionModal';
import { LiveModeModal } from './components/LiveModeModal';
import { LiveScalpScannerDashboard } from './components/LiveScalpScannerDashboard';
import { LiveTradingPanel } from './components/LiveTradingPanel';
import { MarketStatsBar } from './components/MarketStats';
import { PaperTradeHistoryView } from './components/PaperTradeHistoryView';
import { PaperTradingView } from './components/PaperTradingView';
import { PortfolioRiskModal } from './components/PortfolioRiskModal';
import { RiskCalculator } from './components/RiskCalculator';
import { SignalCard } from './components/SignalCard';
import { SignalLogView } from './components/SignalLogView';
import { TimeframeCards } from './components/TimeframeCards';
import { MainViewTab, TopHeader } from './components/TopHeader';
import {
  Candle,
  ConfluenceAnalysis,
  MarketStats,
  PaperAccount,
  PaperTradeRecord,
  PortfolioRiskSettings,
  ScannerCoinState,
  SignalLogEntry,
  Timeframe,
  TradingMode,
} from './types';
import {
  generateMarketStats,
  generateRealisticCandles,
  getSymbolConfig,
} from './services/marketData';
import {
  getScannerService,
  ScannerEngineState,
} from './services/multiCoinScanner';
import {
  clearPaperTradingHistory,
  manualClosePaperTrade,
  openPaperTrade,
  saveDemoAccount,
  savePaperAccount,
  updatePositionsPrice,
} from './services/paperTrading';
import { runComprehensiveScalpAnalysis } from './services/scalpEngine';
import { Zap } from 'lucide-react';

export default function App() {
  // Navigation & View State
  const [activeView, setActiveView] = React.useState<MainViewTab>('SCANNER');
  const [symbol, setSymbol] = React.useState<string>('BTCUSDT');
  const [marketRegime, setMarketRegime] = React.useState<
    'BULLISH' | 'BEARISH' | 'RANGING' | 'LIQUIDITY_SWEEP'
  >('BULLISH');
  const [selectedTimeframe, setSelectedTimeframe] = React.useState<Timeframe>('15M');
  const [isAnalyzing, setIsAnalyzing] = React.useState<boolean>(false);
  const [priceTickDirection, setPriceTickDirection] = React.useState<'UP' | 'DOWN' | null>(null);
  const [showFlowDrawer, setShowFlowDrawer] = React.useState<boolean>(false);
  const [showLiveModal, setShowLiveModal] = React.useState<boolean>(false);
  const [showRiskModal, setShowRiskModal] = React.useState<boolean>(false);
  const [showCoinSelectionModal, setShowCoinSelectionModal] = React.useState<boolean>(false);
  const [toastMessage, setToastMessage] = React.useState<string | null>(null);

  // Multi-Coin Scanner Engine State
  const [scannerState, setScannerState] = React.useState<ScannerEngineState>(() =>
    getScannerService().getState()
  );

  // Subscribe to Multi-Coin Scanner Engine updates
  React.useEffect(() => {
    const scanner = getScannerService();
    const unsubscribe = scanner.subscribe((updatedState) => {
      setScannerState(updatedState);
    });
    return () => unsubscribe();
  }, []);

  // Detailed view candles & stats state for the currently inspected symbol
  const [timeframeCandles, setTimeframeCandles] = React.useState<Record<Timeframe, Candle[]>>(() => {
    const cfg = getSymbolConfig('BTCUSDT');
    const tfList: Timeframe[] = ['4H', '1H', '15M', '5M', '3M', '1M'];
    const record: Record<Timeframe, Candle[]> = {} as any;
    tfList.forEach((tf) => {
      record[tf] = generateRealisticCandles(cfg.basePrice, tf, 50, 'BULLISH');
    });
    return record;
  });

  const [marketStats, setMarketStats] = React.useState<MarketStats>(() => {
    const cfg = getSymbolConfig('BTCUSDT');
    return generateMarketStats(cfg.symbol, cfg.basePrice, 3.45);
  });

  // Confluence Analysis Result for current symbol
  const [analysis, setAnalysis] = React.useState<ConfluenceAnalysis>(() => {
    const cfg = getSymbolConfig('BTCUSDT');
    const tfList: Timeframe[] = ['4H', '1H', '15M', '5M', '3M', '1M'];
    const record: Record<Timeframe, Candle[]> = {} as any;
    tfList.forEach((tf) => {
      record[tf] = generateRealisticCandles(cfg.basePrice, tf, 50, 'BULLISH');
    });
    return runComprehensiveScalpAnalysis(
      cfg.symbol,
      record,
      cfg.basePrice,
      1650000000,
      3.8,
      2.7,
      'BULLISH'
    );
  });

  // Sync detailed analysis if the scanner has an updated analysis for current symbol
  React.useEffect(() => {
    const coinData = scannerState.coins[symbol];
    if (coinData?.analysis && coinData.analysis.confidenceScore > 0) {
      setAnalysis(coinData.analysis);
      if (coinData.marketStats) {
        setMarketStats(coinData.marketStats);
      }
    }
  }, [scannerState.coins, symbol]);

  // Run deep analysis manually or when symbol/regime changes
  const performDetailedAnalysis = React.useCallback(
    (targetSymbol: string, targetRegime: 'BULLISH' | 'BEARISH' | 'RANGING' | 'LIQUIDITY_SWEEP') => {
      setIsAnalyzing(true);
      const cfg = getSymbolConfig(targetSymbol);

      setTimeout(() => {
        const tfList: Timeframe[] = ['4H', '1H', '15M', '5M', '3M', '1M'];
        const newCandles: Record<Timeframe, Candle[]> = {} as any;

        tfList.forEach((tf) => {
          newCandles[tf] = generateRealisticCandles(cfg.basePrice, tf, 50, targetRegime);
        });

        const latestPrice = newCandles['15M'][newCandles['15M'].length - 1].close;
        const changePct =
          targetRegime === 'BULLISH'
            ? 3.8
            : targetRegime === 'BEARISH'
            ? -3.5
            : targetRegime === 'LIQUIDITY_SWEEP'
            ? 1.2
            : 0.2;

        const newStats = generateMarketStats(targetSymbol, latestPrice, changePct);
        const newAnalysis = runComprehensiveScalpAnalysis(
          targetSymbol,
          newCandles,
          latestPrice,
          newStats.openInterest,
          newStats.openInterestChange24h,
          changePct,
          targetRegime
        );

        setTimeframeCandles(newCandles);
        setMarketStats(newStats);
        setAnalysis(newAnalysis);
        setIsAnalyzing(false);

        setToastMessage(`Updated scalp analysis for ${targetSymbol}!`);
        setTimeout(() => setToastMessage(null), 3000);
      }, 300);
    },
    []
  );

  const handleSelectSymbol = (newSymbol: string) => {
    setSymbol(newSymbol);
    performDetailedAnalysis(newSymbol, marketRegime);
  };

  const handleSelectRegime = (
    newRegime: 'BULLISH' | 'BEARISH' | 'RANGING' | 'LIQUIDITY_SWEEP'
  ) => {
    setMarketRegime(newRegime);
    performDetailedAnalysis(symbol, newRegime);
  };

  const handleRunAnalysis = () => {
    performDetailedAnalysis(symbol, marketRegime);
  };

  const handleSelectCoinFromScanner = (selectedSymbol: string) => {
    setSymbol(selectedSymbol);
    setActiveView('DETAIL');
    performDetailedAnalysis(selectedSymbol, marketRegime);
  };

  const handleToggleScanner = () => {
    const scanner = getScannerService();
    scanner.setScannerActive(!scannerState.isScannerActive);
  };

  const handleSelectMode = (mode: TradingMode) => {
    const scanner = getScannerService();
    scanner.setTradingMode(mode);
    setToastMessage(`Active Mode: ${mode}`);
    setTimeout(() => setToastMessage(null), 3000);
    if (mode === 'LIVE') {
      setActiveView('LIVE_PANEL');
    }
  };

  const handleSaveRiskSettings = (settings: PortfolioRiskSettings) => {
    const scanner = getScannerService();
    scanner.updateRiskSettings(settings);
    setToastMessage(
      `Updated Portfolio Limits: Max ${settings.maxSimultaneousTrades} trades, ${settings.maxRiskPerTradePercent}% risk/trade, ${settings.maxTotalRiskPercent}% max risk.`
    );
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleClearHistory = () => {
    const scanner = getScannerService();
    if (scannerState.currentMode === 'DEMO') {
      scanner.resetDemoAccountAndHistory();
      setToastMessage('Demo exchange account reset back to $50,000.00 demo margin.');
    } else {
      scanner.resetPaperAccountAndHistory();
      setToastMessage('Paper account ledger reset back to $10,000.00 starting margin.');
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleManualCloseTrade = (tradeId: string) => {
    const scanner = getScannerService();
    scanner.manualCloseTrade(tradeId);
    setToastMessage('Position closed manually.');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Active ledger isolation (PAPER vs DEMO)
  const isDemo = scannerState.currentMode === 'DEMO';
  const currentTrades = isDemo ? scannerState.demoTrades : scannerState.trades;
  const currentAccount = isDemo ? scannerState.demoAccount : scannerState.account;
  const openTradesCount = currentTrades.filter((t) => t.status === 'OPEN').length;

  // Quick Paper / Demo Trade handler from SignalCard
  const handleQuickPaperTrade = (tradeType: 'LONG' | 'SHORT') => {
    const margin = 200;
    const leverage = 10;
    const { updatedAccount, error } = openPaperTrade(
      currentAccount,
      symbol,
      tradeType,
      analysis.entryPrice,
      analysis.stopLoss,
      analysis.takeProfit,
      margin,
      leverage
    );

    if (error) {
      setToastMessage(error);
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      if (isDemo) {
        saveDemoAccount(updatedAccount);
      } else {
        savePaperAccount(updatedAccount);
      }
      getScannerService().runFullMultiCoinScan();
      setToastMessage(
        `${isDemo ? 'Demo' : 'Paper'} ${tradeType} opened on ${symbol} at $${analysis.entryPrice.toFixed(2)}!`
      );
      setTimeout(() => setToastMessage(null), 4000);
      setActiveView('HISTORY');
    }
  };

  const handleApplyCalculatedMargin = (margin: number, leverage: number) => {
    if (analysis.signal === 'WAIT') {
      setToastMessage('Analysis is in WAIT mode. Waiting for higher confluence.');
      setTimeout(() => setToastMessage(null), 3000);
      return;
    }

    const { updatedAccount, error } = openPaperTrade(
      currentAccount,
      symbol,
      analysis.signal as 'LONG' | 'SHORT',
      analysis.entryPrice,
      analysis.stopLoss,
      analysis.takeProfit,
      margin,
      leverage
    );

    if (error) {
      setToastMessage(error);
      setTimeout(() => setToastMessage(null), 4000);
    } else {
      if (isDemo) {
        saveDemoAccount(updatedAccount);
      } else {
        savePaperAccount(updatedAccount);
      }
      getScannerService().runFullMultiCoinScan();
      setToastMessage(
        `Custom risk ${isDemo ? 'demo' : 'paper'} ${analysis.signal} opened ($${margin.toFixed(0)} margin @ ${leverage}x)!`
      );
      setTimeout(() => setToastMessage(null), 4000);
      setActiveView('HISTORY');
    }
  };

  const handleSaveCoinSelection = (newSymbols: string[]) => {
    getScannerService().setUserSelectedCoins(newSymbols);
    const shortNames = newSymbols.map((s) => s.replace('USDT', '')).join(', ');
    setToastMessage(`Scanner updated: 6 Core + 4 Selected (${shortNames}) = 10 Active Coins!`);
    setTimeout(() => setToastMessage(null), 4000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* 1. Sticky Navigation & Header */}
      <TopHeader
        currentSymbol={symbol}
        onSelectSymbol={handleSelectSymbol}
        onAnalyze={handleRunAnalysis}
        isAnalyzing={isAnalyzing}
        selectedRegime={marketRegime}
        onSelectRegime={handleSelectRegime}
        activeView={activeView}
        onSelectView={setActiveView}
        liveDataStatus={scannerState.liveDataStatus}
        lastUpdateTime={scannerState.lastUpdateTime}
        isScannerActive={scannerState.isScannerActive}
        onToggleScanner={handleToggleScanner}
        currentMode={scannerState.currentMode}
        onSelectMode={handleSelectMode}
        onOpenLiveModal={() => setShowLiveModal(true)}
        onOpenRiskModal={() => setShowRiskModal(true)}
        openTradesCount={openTradesCount}
      />

      {/* 2. Top Market Stats Bar (shows live ticker for inspected symbol) */}
      <MarketStatsBar
        stats={scannerState.coins[symbol]?.marketStats || marketStats}
        priceTickDirection={priceTickDirection}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-4 z-50 bg-slate-900 border border-amber-400/50 text-amber-300 text-xs px-3.5 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-3 duration-200">
          <Zap className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Content View Switcher */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-5 space-y-5">
        {/* VIEW 1: LIVE SCALP SCANNER (Requirement 8 & 2) */}
        {activeView === 'SCANNER' && (
          <LiveScalpScannerDashboard
            coins={scannerState.coins}
            rankedSymbols={scannerState.rankedSymbols}
            topSetupSymbol={scannerState.topSetupSymbol}
            isScannerActive={scannerState.isScannerActive}
            onToggleScannerActive={handleToggleScanner}
            onOpenRiskModal={() => setShowRiskModal(true)}
            onSelectCoinForDetail={handleSelectCoinFromScanner}
            onManualCloseTrade={handleManualCloseTrade}
            liveDataStatus={scannerState.liveDataStatus}
            lastScanTime={scannerState.lastScanTime}
            currentMode={scannerState.currentMode}
            accountBalance={currentAccount.balance}
            onSelectMode={handleSelectMode}
            target24h={scannerState.target24h}
            onOpenSelectCoins={() => setShowCoinSelectionModal(true)}
            userSelectedSymbols={getScannerService().getUserSelectedCoins()}
          />
        )}

        {/* VIEW 2: DETAILED CHARTS & MULTI-TIMEFRAME CONFLUENCE */}
        {activeView === 'DETAIL' && (
          <div className="space-y-4">
            {/* Candle Visualizer */}
            <CandleVisualizer
              candles={timeframeCandles[selectedTimeframe] || []}
              timeframe={selectedTimeframe}
              entryPrice={analysis.entryPrice}
              stopLoss={analysis.stopLoss}
              takeProfit={analysis.takeProfit}
              signal={analysis.signal}
            />

            {/* Primary Confluence Signal Card */}
            <SignalCard
              analysis={analysis}
              onQuickPaperTrade={handleQuickPaperTrade}
              onOpenFlowSteps={() => setShowFlowDrawer(true)}
            />

            {/* Multi-Timeframe Matrix Cards */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
                    Multi-Timeframe Scalp Confluence Matrix
                  </span>
                  <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded">
                    4H • 1H • 15M • 5M • 3M • 1M
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Click timeframe to view chart structure
                </span>
              </div>

              <TimeframeCards
                timeframes={analysis.timeframes}
                selectedTf={selectedTimeframe}
                onSelectTf={(tf) => setSelectedTimeframe(tf)}
              />
            </div>
          </div>
        )}

        {/* VIEW 3: TRADE HISTORY (PAPER / DEMO) */}
        {activeView === 'HISTORY' && (
          <PaperTradeHistoryView
            trades={currentTrades}
            onClearHistory={handleClearHistory}
            onManualCloseTrade={handleManualCloseTrade}
            mode={scannerState.currentMode}
            accountBalance={currentAccount.balance}
          />
        )}

        {/* VIEW 4: LIVE SCALP SIGNAL LOG (Requirement 9) */}
        {activeView === 'SIGNALS' && (
          <SignalLogView
            logs={scannerState.signalLogs}
            onClearLogs={() => {
              const scanner = getScannerService();
              scanner.addSignalLog({
                id: `clear-${Date.now()}`,
                time: Date.now(),
                symbol: 'ALL',
                signal: 'WAIT',
                confidence: 0,
                entry: 0,
                sl: 0,
                tp: 0,
                rr: 0,
                action: 'SIGNAL LOGS CLEARED',
              });
            }}
          />
        )}

        {/* VIEW 5: RISK & POSITION SIZING CALCULATOR */}
        {activeView === 'RISK' && (
          <RiskCalculator
            analysis={analysis}
            accountBalance={currentAccount.balance}
            onApplyCalculatedMargin={handleApplyCalculatedMargin}
          />
        )}

        {/* VIEW 6: DEDICATED LIVE API GATEWAY & BINANCE ACCOUNT (Requirement 3) */}
        {activeView === 'LIVE_PANEL' && (
          <LiveTradingPanel
            liveStatus={scannerState.liveStatus}
            onRefreshStatus={() => getScannerService().refreshLiveStatus()}
            onModeSelect={handleSelectMode}
          />
        )}
      </main>

      {/* 15-Step Flow Drawer Modal */}
      <AnalysisFlowDrawer
        isOpen={showFlowDrawer}
        onClose={() => setShowFlowDrawer(false)}
        flowSteps={analysis.flowSteps}
        symbol={symbol}
      />

      {/* Live Trading Mode Safety Confirmation Modal (Requirement 7) */}
      <LiveModeModal
        isOpen={showLiveModal}
        onClose={() => setShowLiveModal(false)}
        onConfirmLive={() => {
          setShowLiveModal(false);
          handleSelectMode('LIVE');
        }}
      />

      {/* Portfolio Risk Configuration Modal (Requirement 4) */}
      <PortfolioRiskModal
        isOpen={showRiskModal}
        onClose={() => setShowRiskModal(false)}
        currentSettings={scannerState.riskSettings}
        onSaveSettings={handleSaveRiskSettings}
      />

      {/* Select Coins Modal (Requirements 2, 3, 4, 5, 6, 7, 8, 9) */}
      <CoinSelectionModal
        isOpen={showCoinSelectionModal}
        onClose={() => setShowCoinSelectionModal(false)}
        currentSelectedSymbols={getScannerService().getUserSelectedCoins()}
        onSaveSelection={handleSaveCoinSelection}
      />

      {/* Institutional Legal & Safe Trading Disclaimer Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-900/60 py-4 px-3 sm:px-5 text-center text-xs text-slate-400">
        <div className="max-w-4xl mx-auto space-y-1">
          <p className="font-semibold text-slate-300">
            Binance Futures AI Analyzer — High-Confluence Scalp Engine & Multi-Coin Radar
          </p>
          <p className="text-[11px] text-slate-400">
            Strict Scalp System: 4H context, 1H bias, 15M setup, 5M/3M confirmation, 1M entry trigger, ~1:3 R:R filter.
            Paper simulation and Demo exchange mode do not place real Binance orders. Live trading involves real capital and substantial financial risk.
          </p>
        </div>
      </footer>
    </div>
  );
}
