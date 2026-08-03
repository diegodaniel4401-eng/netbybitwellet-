import React, { useState, useEffect } from 'react';
import { NetbybitLogo } from './NetbybitLogo';
import { CryptoIcon } from './CryptoIcon';
import { ASSET_METADATA, SupportedAsset } from '../types';
import {
  X,
  CreditCard,
  ExternalLink,
  ShieldCheck,
  Globe,
  Sparkles,
  Building2,
  Check,
  AlertCircle,
  Smartphone,
} from 'lucide-react';

interface BuyCryptoModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultAsset?: SupportedAsset;
}

interface Provider {
  id: string;
  name: string;
  logoUrl: string;
  badge: string;
  rating: string;
  paymentMethods: string[];
  supportedRegions: string[];
  redirectUrl: (asset: string) => string;
  features: string[];
}

const PROVIDERS: Provider[] = [
  {
    id: 'moonpay',
    name: 'MoonPay',
    logoUrl: 'https://images.unsplash.com/photo-1622979135225-d2ba269bc1bd?w=100&auto=format&fit=crop',
    badge: 'Popular Global Gateway',
    rating: '4.8 ★',
    paymentMethods: ['Visa / Mastercard', 'Apple Pay', 'Google Pay', 'Bank Transfer'],
    supportedRegions: ['US', 'EU', 'UK', 'CA', 'AU', 'GLOBAL'],
    redirectUrl: (asset) => `https://buy.moonpay.com/?defaultCurrencyCode=${asset.toLowerCase()}`,
    features: ['Instant Card Delivery', 'No KYC under $150', 'Zero Slippage Rate'],
  },
  {
    id: 'ramp',
    name: 'Ramp Network',
    logoUrl: 'https://images.unsplash.com/photo-1621416894569-0f39ed31d247?w=100&auto=format&fit=crop',
    badge: 'Fastest SEPA & Open Banking',
    rating: '4.9 ★',
    paymentMethods: ['Apple Pay', 'Open Banking', 'Visa / Mastercard', 'SEPA Instant'],
    supportedRegions: ['EU', 'UK', 'US', 'CA', 'GLOBAL'],
    redirectUrl: (asset) => `https://buy.ramp.network/?defaultAsset=${asset}`,
    features: ['Lowest European Fees', 'Direct On-Ramp', 'Sub-second Processing'],
  },
  {
    id: 'transak',
    name: 'Transak',
    logoUrl: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=100&auto=format&fit=crop',
    badge: '160+ Countries Supported',
    rating: '4.7 ★',
    paymentMethods: ['Credit/Debit Card', 'Faster Payments (FPS)', 'UPI / PayID', 'SEPA'],
    supportedRegions: ['US', 'EU', 'UK', 'CA', 'AU', 'GLOBAL'],
    redirectUrl: (asset) => `https://global.transak.com/?cryptoCurrencyCode=${asset}`,
    features: ['Multi-Local Banking', 'High Limits', 'Bank Transfer Discounts'],
  },
  {
    id: 'banxa',
    name: 'Banxa',
    logoUrl: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=100&auto=format&fit=crop',
    badge: 'Institutional On-Ramp',
    rating: '4.8 ★',
    paymentMethods: ['Visa / Mastercard', 'Interac e-Transfer', 'POLi / PayID', 'SEPA'],
    supportedRegions: ['CA', 'AU', 'US', 'EU', 'GLOBAL'],
    redirectUrl: (asset) => `https://banxa.com/?coin=${asset}`,
    features: ['Zero Fraud Risk', 'High Volume Approval', 'Strict Compliance'],
  },
  {
    id: 'simplex',
    name: 'Simplex (Nuvei)',
    logoUrl: 'https://images.unsplash.com/photo-1642543492481-44e81e3914a7?w=100&auto=format&fit=crop',
    badge: '100% Fraud Guarantee',
    rating: '4.6 ★',
    paymentMethods: ['Visa / Mastercard', 'Apple Pay', 'SWIFT Wire'],
    supportedRegions: ['US', 'EU', 'GLOBAL'],
    redirectUrl: (asset) => `https://buy.simplex.com/?crypto=${asset}`,
    features: ['Global Acceptance', 'Instant Card Processing', '24/7 Live Support'],
  },
];

const REGIONS = [
  { code: 'AUTO', name: 'Auto-Detect Region', flag: '🌐' },
  { code: 'US', name: 'United States ($ USD)', flag: '🇺🇸' },
  { code: 'EU', name: 'European Union (€ EUR)', flag: '🇪🇺' },
  { code: 'UK', name: 'United Kingdom (£ GBP)', flag: '🇬🇧' },
  { code: 'CA', name: 'Canada ($ CAD)', flag: '🇨🇦' },
  { code: 'AU', name: 'Australia ($ AUD)', flag: '🇦🇺' },
  { code: 'GLOBAL', name: 'International / Other', flag: '🌍' },
];

export const BuyCryptoModal: React.FC<BuyCryptoModalProps> = ({
  isOpen,
  onClose,
  defaultAsset = 'BTC',
}) => {
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>(defaultAsset);
  const [selectedRegion, setSelectedRegion] = useState<string>('AUTO');
  const [detectedRegionName, setDetectedRegionName] = useState<string>('United States / Global');

  useEffect(() => {
    // Attempt auto-detection based on user browser locale & timezone
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
      if (tz.includes('America/New_York') || tz.includes('America/Los_Angeles') || tz.includes('America/Chicago')) {
        setDetectedRegionName('United States (USD)');
      } else if (tz.includes('Europe/London')) {
        setDetectedRegionName('United Kingdom (GBP)');
      } else if (tz.includes('Europe/')) {
        setDetectedRegionName('European Union (EUR)');
      } else if (tz.includes('America/Toronto') || tz.includes('America/Vancouver')) {
        setDetectedRegionName('Canada (CAD)');
      } else if (tz.includes('Australia/')) {
        setDetectedRegionName('Australia (AUD)');
      }
    } catch {
      // Fallback
    }
  }, []);

  if (!isOpen) return null;

  const filteredProviders = PROVIDERS.filter((p) => {
    if (selectedRegion === 'AUTO') return true;
    return p.supportedRegions.includes(selectedRegion) || p.supportedRegions.includes('GLOBAL');
  });

  const handleLaunchProvider = (provider: Provider) => {
    const symbol = ASSET_METADATA[selectedAsset]?.symbol || 'BTC';
    const targetUrl = provider.redirectUrl(symbol);
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-neutral-950 border border-amber-500/30 rounded-3xl p-6 sm:p-8 shadow-2xl overflow-hidden space-y-6 max-h-[90vh] overflow-y-auto">
        {/* Glow ambient accent */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-2xl bg-gradient-to-tr from-amber-500/20 to-yellow-500/10 border border-amber-500/30 text-amber-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-neutral-100 flex items-center space-x-2">
                <span>Buy Crypto with Fiat</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-neutral-400">
                Official third-party fiat-to-crypto gateways & bank on-ramps
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-amber-400 hover:border-amber-500/30 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Region & Asset Selection Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Select Crypto Asset */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
              Select Crypto to Purchase
            </label>
            <div className="grid grid-cols-3 gap-2">
              {Object.values(ASSET_METADATA).map((asset) => {
                const isSelected = selectedAsset === asset.id;
                return (
                  <button
                    key={asset.id}
                    onClick={() => setSelectedAsset(asset.id)}
                    className={`p-2.5 rounded-xl border text-xs font-bold flex flex-col items-center justify-center space-y-1 transition-all ${
                      isSelected
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-md shadow-amber-500/10'
                        : 'bg-neutral-900/80 text-neutral-400 border-neutral-800 hover:border-neutral-700'
                    }`}
                  >
                    <CryptoIcon asset={asset.id} size="sm" />
                    <span>{asset.symbol}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Region / Currency Filter */}
          <div>
            <label className="block text-xs font-bold text-neutral-300 uppercase tracking-wider mb-1.5">
              Detected Region / Currency
            </label>
            <select
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
              className="w-full bg-neutral-900/90 border border-neutral-800 rounded-xl px-3 py-3 text-xs text-neutral-100 font-semibold focus:outline-none focus:border-amber-500/50"
            >
              {REGIONS.map((r) => (
                <option key={r.code} value={r.code} className="bg-neutral-950 text-neutral-100">
                  {r.flag} {r.name}
                </option>
              ))}
            </select>
            <span className="text-[10px] text-amber-400/90 font-mono mt-1.5 block flex items-center space-x-1">
              <Globe className="w-3 h-3 text-amber-400 inline shrink-0" />
              <span>Location: {detectedRegionName}</span>
            </span>
          </div>
        </div>

        {/* Security & Non-Custodial Disclaimer */}
        <div className="p-3.5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300 flex items-start space-x-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <p className="font-bold text-neutral-100">Secure Direct On-Ramp Policy</p>
            <p className="text-[11px] text-neutral-400 leading-relaxed">
              NETBYBIT never processes credit cards or stores fiat payments directly. Purchases are fulfilled securely on the verified portal of regulated partners (MoonPay, Ramp, Transak, Banxa, Simplex).
            </p>
          </div>
        </div>

        {/* Gateway Providers List */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center justify-between">
            <span>Supported Gateways ({filteredProviders.length})</span>
            <span className="text-[10px] text-amber-400 font-mono font-normal">0% NETBYBIT Platform Surcharge</span>
          </h3>

          <div className="space-y-2.5">
            {filteredProviders.map((provider) => (
              <div
                key={provider.id}
                className="p-4 rounded-2xl bg-neutral-900/80 border border-neutral-800/90 hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg group"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-extrabold text-neutral-100 group-hover:text-amber-300 transition-colors">
                      {provider.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/20">
                      {provider.badge}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400 font-bold">
                      {provider.rating}
                    </span>
                  </div>

                  {/* Payment methods tags */}
                  <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-neutral-400">
                    {provider.paymentMethods.map((pm, idx) => (
                      <span key={idx} className="bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800/80">
                        {pm}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => handleLaunchProvider(provider)}
                  className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-neutral-950 font-black text-xs shadow-md shadow-amber-500/20 hover:from-amber-400 hover:to-yellow-300 transition-all flex items-center justify-center space-x-1.5 shrink-0 transform hover:-translate-y-0.5"
                >
                  <span>Buy on {provider.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-neutral-950" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Note */}
        <div className="text-center pt-2 border-t border-neutral-800/80">
          <p className="text-[11px] text-neutral-500 font-mono">
            Purchases will deposit to your primary wallet address upon blockchain confirmation.
          </p>
        </div>
      </div>
    </div>
  );
};
