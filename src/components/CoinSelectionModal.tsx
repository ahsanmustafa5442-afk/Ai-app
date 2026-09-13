import React, { useState, useMemo, useEffect } from 'react';
import {
  Check,
  CheckCircle2,
  Filter,
  Info,
  Layers,
  Lock,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import {
  CORE_SYMBOLS,
  DEFAULT_USER_SELECTED_SYMBOLS,
  fetchAvailableFuturesContracts,
  isCoreSymbol,
  saveUserSelectedSymbols,
} from '../services/coinSelectionService';
import { AvailableFuturesContract } from '../types';

interface CoinSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSelectedSymbols: string[];
  onSaveSelection: (newSelectedSymbols: string[]) => void;
}

export const CoinSelectionModal: React.FC<CoinSelectionModalProps> = ({
  isOpen,
  onClose,
  currentSelectedSymbols,
  onSaveSelection,
}) => {
  const [contracts, setContracts] = useState<AvailableFuturesContract[]>([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCoins, setSelectedCoins] = useState<string[]>([]);
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'L1' | 'DEFI' | 'AI_MEME'>('ALL');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync selected coins when modal opens
  useEffect(() => {
    if (isOpen) {
      const initial =
        currentSelectedSymbols && currentSelectedSymbols.length === 4
          ? [...currentSelectedSymbols]
          : [...DEFAULT_USER_SELECTED_SYMBOLS];
      setSelectedCoins(initial);
      setSearchQuery('');
      setErrorMessage(null);
    }
  }, [isOpen, currentSelectedSymbols]);

  // Load contracts catalog with live Binance data
  useEffect(() => {
    let isMounted = true;
    async function loadCatalog() {
      setIsLoadingContracts(true);
      try {
        const data = await fetchAvailableFuturesContracts();
        if (isMounted) {
          setContracts(data);
        }
      } catch (err) {
        console.error('Failed to load futures contracts', err);
      } finally {
        if (isMounted) setIsLoadingContracts(false);
      }
    }

    if (isOpen) {
      loadCatalog();
    }
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Filtered contracts list
  const filteredContracts = useMemo(() => {
    const q = searchQuery.toUpperCase().trim();
    return contracts.filter((c) => {
      // Exclude core coins from user-selectable pool (they are already permanent)
      if (isCoreSymbol(c.symbol)) return false;

      // Category filter
      if (categoryFilter === 'L1') {
        const l1s = ['ETHUSDT', 'ADAUSDT', 'AVAXUSDT', 'NEARUSDT', 'APTUSDT', 'DOTUSDT', 'SEIUSDT', 'FTMUSDT', 'ATOMUSDT', 'ALGOUSDT'];
        if (!l1s.includes(c.symbol)) return false;
      } else if (categoryFilter === 'DEFI') {
        const defi = ['LINKUSDT', 'UNIUSDT', 'AAVEUSDT', 'INJUSDT', 'MKRUSDT', 'CRVUSDT', 'RUNEUSDT'];
        if (!defi.includes(c.symbol)) return false;
      } else if (categoryFilter === 'AI_MEME') {
        const aimeme = ['PEPEUSDT', 'WIFUSDT', 'BONKUSDT', 'FLOKIUSDT', 'RENDERUSDT', 'FETUSDT', 'NEARUSDT'];
        if (!aimeme.includes(c.symbol)) return false;
      }

      if (!q) return true;
      return (
        c.symbol.toUpperCase().includes(q) ||
        c.baseAsset.toUpperCase().includes(q) ||
        c.name.toUpperCase().includes(q)
      );
    });
  }, [contracts, searchQuery, categoryFilter]);

  if (!isOpen) return null;

  const isFull = selectedCoins.length === 4;

  const handleToggleCoin = (symbol: string) => {
    setErrorMessage(null);
    if (isCoreSymbol(symbol)) return; // Core coins cannot be toggled

    if (selectedCoins.includes(symbol)) {
      // Deselect
      setSelectedCoins((prev) => prev.filter((s) => s !== symbol));
    } else {
      // Select
      if (selectedCoins.length >= 4) {
        setErrorMessage('Maximum 4 additional coins allowed. Please deselect one coin first.');
        return;
      }
      setSelectedCoins((prev) => [...prev, symbol]);
    }
  };

  const handleRemoveSelected = (symbol: string) => {
    setErrorMessage(null);
    setSelectedCoins((prev) => prev.filter((s) => s !== symbol));
  };

  const handleResetToDefault = () => {
    setSelectedCoins([...DEFAULT_USER_SELECTED_SYMBOLS]);
    setErrorMessage(null);
  };

  const handleSave = () => {
    if (selectedCoins.length !== 4) {
      setErrorMessage(`Please select exactly 4 additional coins (${selectedCoins.length}/4 currently selected).`);
      return;
    }
    onSaveSelection(selectedCoins);
    onClose();
  };

  return (
    <div
      id="select-coins-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="select-coins-modal"
        className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-start justify-between gap-3 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  SELECT COINS
                </h2>
                <span
                  className={`px-2 py-0.5 rounded-full text-[11px] font-mono font-black border transition-all ${
                    isFull
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40'
                      : 'bg-amber-500/15 text-amber-400 border-amber-500/40'
                  }`}
                >
                  {selectedCoins.length}/4 Selected
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose 4 additional Binance Futures USDT-M coins to scan with the 6 permanent Core coins.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition shrink-0"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Section: 10-Coin Active Scanner Overview (Core 6 + User Selected 4) */}
        <div className="p-4 bg-slate-950/90 border-b border-slate-800/80 space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-extrabold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              Active Scanner Composition (10 Coins Total)
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              6 CORE + 4 USER SELECTED
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {/* 6 Permanent Core Coins */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" />
                  CORE COINS (6 Permanent)
                </span>
                <span className="text-[9px] text-slate-500">Always Active</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CORE_SYMBOLS.map((sym) => (
                  <span
                    key={sym}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-500/10 border border-amber-500/25 text-[11px] font-mono font-bold text-amber-300"
                    title="Permanent Priority Coin"
                  >
                    <Lock className="w-2.5 h-2.5 text-amber-400/70" />
                    {sym.replace('USDT', '')}
                  </span>
                ))}
              </div>
            </div>

            {/* 4 User Selected Coins */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  USER SELECTED ({selectedCoins.length}/4)
                </span>
                {selectedCoins.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedCoins([])}
                    className="text-[10px] text-rose-400 hover:text-rose-300 font-semibold"
                  >
                    Clear All
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[26px] items-center">
                {selectedCoins.map((sym) => (
                  <span
                    key={sym}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-cyan-500/15 border border-cyan-500/30 text-[11px] font-mono font-bold text-cyan-300 group"
                  >
                    {sym.replace('USDT', '')}
                    <button
                      type="button"
                      onClick={() => handleRemoveSelected(sym)}
                      className="text-cyan-400/60 hover:text-rose-400 transition"
                      title={`Remove ${sym}`}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                {Array.from({ length: Math.max(0, 4 - selectedCoins.length) }).map((_, idx) => (
                  <span
                    key={`slot-${idx}`}
                    className="inline-flex items-center px-2 py-0.5 rounded-lg border border-dashed border-slate-700 text-[11px] font-mono text-slate-500"
                  >
                    + Empty Slot
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Validation Notice / Feedback */}
          {errorMessage ? (
            <div className="p-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs font-semibold flex items-center gap-2">
              <Info className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : isFull ? (
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-medium flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Ready: 4 additional coins chosen. Click "Save & Update Scanner" below.</span>
              </span>
              <span className="font-mono text-[10px] text-emerald-400 font-bold hidden sm:inline">10 / 10 COINS READY</span>
            </div>
          ) : (
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs font-medium flex items-center gap-1.5">
              <Info className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Select {4 - selectedCoins.length} more coin{4 - selectedCoins.length > 1 ? 's' : ''} from the list below to complete the 10-coin scanner list.</span>
            </div>
          )}
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-3 border-b border-slate-800 bg-slate-900/90 flex flex-wrap items-center gap-2">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              id="search-futures-coins"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search coin (e.g., ADA, AVAX, LINK, PEPE)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-8 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Category Chips */}
          <div className="flex items-center gap-1 text-[11px] overflow-x-auto pb-0.5">
            <button
              type="button"
              onClick={() => setCategoryFilter('ALL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                categoryFilter === 'ALL'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              All ({contracts.filter((c) => !isCoreSymbol(c.symbol)).length})
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('L1')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                categoryFilter === 'L1'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Layer 1
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('DEFI')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                categoryFilter === 'DEFI'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              DeFi
            </button>
            <button
              type="button"
              onClick={() => setCategoryFilter('AI_MEME')}
              className={`px-2.5 py-1 rounded-lg font-bold transition ${
                categoryFilter === 'AI_MEME'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              AI & Meme
            </button>
          </div>
        </div>

        {/* Scrollable Contracts List */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-1.5 min-h-[260px] max-h-[420px]">
          {isLoadingContracts && contracts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
              <span className="text-xs">Loading Binance Futures USDT-M contracts...</span>
            </div>
          ) : filteredContracts.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No matching contracts found for "{searchQuery}".
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredContracts.map((contract) => {
                const isSelected = selectedCoins.includes(contract.symbol);
                const canSelectMore = selectedCoins.length < 4;

                return (
                  <div
                    key={contract.symbol}
                    id={`contract-item-${contract.symbol}`}
                    onClick={() => handleToggleCoin(contract.symbol)}
                    className={`p-2.5 sm:p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 select-none ${
                      isSelected
                        ? 'bg-cyan-950/40 border-cyan-500/60 shadow-md shadow-cyan-500/10 ring-1 ring-cyan-500/30'
                        : canSelectMore
                        ? 'bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-950'
                        : 'bg-slate-950/40 border-slate-800/60 opacity-60 hover:opacity-100'
                    }`}
                  >
                    {/* Left info */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      {/* Checkbox circle */}
                      <div
                        className={`w-5 h-5 rounded-lg flex items-center justify-center shrink-0 border transition-all ${
                          isSelected
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'border-slate-700 bg-slate-900'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : null}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-xs text-white">
                            {contract.symbol}
                          </span>
                          <span className="text-[10px] text-slate-400 truncate">
                            {contract.name}
                          </span>
                        </div>
                        {contract.currentPrice && (
                          <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2 mt-0.5">
                            <span>${contract.currentPrice >= 1 ? contract.currentPrice.toLocaleString() : contract.currentPrice}</span>
                            {contract.change24h !== undefined && (
                              <span
                                className={`font-semibold ${
                                  contract.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'
                                }`}
                              >
                                {contract.change24h >= 0 ? '+' : ''}
                                {contract.change24h.toFixed(2)}%
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right action tag */}
                    <div className="shrink-0 text-right">
                      {isSelected ? (
                        <span className="text-[10px] font-bold text-cyan-400 bg-cyan-500/15 px-2 py-0.5 rounded-md border border-cyan-500/30">
                          SELECTED
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 hover:text-cyan-400 flex items-center gap-0.5">
                          <Plus className="w-3 h-3" /> Add
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/80 flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetToDefault}
            className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 font-medium px-2 py-1 rounded transition"
            title="Reset to default selection: ADA, AVAX, LINK, NEAR"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset to Default (ADA, AVAX, LINK, NEAR)</span>
          </button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              id="save-coins-selection-btn"
              onClick={handleSave}
              disabled={!isFull}
              className={`px-4 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition active:scale-95 shadow-md ${
                isFull
                  ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>SAVE & UPDATE SCANNER ({selectedCoins.length}/4)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
