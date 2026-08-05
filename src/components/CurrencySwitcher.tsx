import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { SUPPORTED_FIAT_CURRENCIES, FiatCurrency } from '../lib/currencies';
import { DollarSign, ChevronDown, Search, Check, Globe } from 'lucide-react';

interface CurrencySwitcherProps {
  variant?: 'header' | 'hero' | 'compact' | 'full';
  className?: string;
}

export const CurrencySwitcher: React.FC<CurrencySwitcherProps> = ({ variant = 'header', className = '' }) => {
  const { selectedCurrency, setSelectedCurrency, fiatRates } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  const currentCurrency =
    SUPPORTED_FIAT_CURRENCIES.find((c) => c.code.toUpperCase() === selectedCurrency.toUpperCase()) ||
    SUPPORTED_FIAT_CURRENCIES[0];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredCurrencies = SUPPORTED_FIAT_CURRENCIES.filter(
    (c) =>
      c.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelect = (curr: FiatCurrency) => {
    setSelectedCurrency(curr.code);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      {variant === 'hero' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-neutral-900/90 border border-amber-500/30 hover:border-amber-500/60 text-amber-300 hover:text-amber-200 text-xs font-mono font-bold transition-all shadow-md group"
          title="Change Display Currency"
        >
          <span className="text-sm">{currentCurrency.flag}</span>
          <span className="text-amber-400 font-extrabold">{currentCurrency.code}</span>
          <span className="text-neutral-400 font-normal">({currentCurrency.symbol})</span>
          <ChevronDown className={`w-3.5 h-3.5 text-amber-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : variant === 'compact' ? (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 border border-neutral-700 text-neutral-200 text-xs font-mono font-semibold transition-all"
        >
          <span>{currentCurrency.flag}</span>
          <span>{currentCurrency.code}</span>
          <ChevronDown className="w-3 h-3 text-neutral-400" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-neutral-900 border border-neutral-800 hover:border-amber-500/40 text-neutral-200 text-xs font-semibold transition-all shadow-sm group"
        >
          <Globe className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-45 transition-transform" />
          <span className="text-sm">{currentCurrency.flag}</span>
          <span className="font-mono font-bold text-neutral-100">{currentCurrency.code}</span>
          <span className="text-neutral-400 font-mono text-[11px]">{currentCurrency.symbol}</span>
          <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 rounded-2xl bg-neutral-950 border border-neutral-800 shadow-2xl z-50 overflow-hidden backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150">
          <div className="p-3 border-b border-neutral-800/80 bg-neutral-900/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-neutral-200 flex items-center space-x-1.5">
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span>Select Display Currency</span>
              </span>
              <span className="text-[10px] text-neutral-500 font-mono">30+ Fiat Currencies</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="Search currency (e.g. NGN, EUR, Yen)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-amber-500/50"
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-neutral-900 p-1 custom-scrollbar">
            {filteredCurrencies.length === 0 ? (
              <div className="p-4 text-center text-xs text-neutral-500">
                No matching currency found
              </div>
            ) : (
              filteredCurrencies.map((curr) => {
                const isSelected = curr.code.toUpperCase() === selectedCurrency.toUpperCase();
                const rate = fiatRates[curr.code] || curr.defaultRateToUsd;
                const noDecimals = ['JPY', 'KRW', 'IDR', 'VND'].includes(curr.code);

                return (
                  <button
                    key={curr.code}
                    type="button"
                    onClick={() => handleSelect(curr)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-colors text-xs ${
                      isSelected
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                        : 'hover:bg-neutral-900 text-neutral-300 hover:text-neutral-100'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="text-base">{curr.flag}</span>
                      <div>
                        <div className="flex items-center space-x-1.5">
                          <span className="font-bold font-mono text-neutral-100">{curr.code}</span>
                          <span className="text-[11px] text-amber-400 font-mono">({curr.symbol})</span>
                        </div>
                        <p className="text-[10px] text-neutral-400 truncate max-w-[140px]">{curr.name}</p>
                      </div>
                    </div>

                    <div className="text-right flex items-center space-x-2">
                      <div className="text-[10px] text-neutral-400 font-mono">
                        1 USD = {curr.symbol}{rate.toLocaleString('en-US', { minimumFractionDigits: noDecimals ? 0 : 2, maximumFractionDigits: noDecimals ? 0 : 2 })}
                      </div>
                      {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
