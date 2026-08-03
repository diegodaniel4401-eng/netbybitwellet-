import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ASSET_METADATA, SupportedAsset } from '../types';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, Copy, Check, Shield } from 'lucide-react';

export const ReceivePage: React.FC = () => {
  const { user, depositAddresses } = useAuth();
  const [selectedAsset, setSelectedAsset] = useState<SupportedAsset>('BTC');
  const [copied, setCopied] = useState(false);

  if (!user) return null;

  const assetInfo = ASSET_METADATA[selectedAsset];
  const address = depositAddresses[selectedAsset] || assetInfo.defaultAddress;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-md mx-auto space-y-8 pb-12">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto flex items-center justify-center">
          <QrCode className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-extrabold text-neutral-100">Receive Crypto</h1>
        <p className="text-xs text-neutral-400">
          Share your address or QR code to receive deposits directly to your NETBYBIT account
        </p>
      </div>

      <div className="bg-neutral-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-6">
        <div>
          <label className="block text-xs font-medium text-neutral-400 mb-2">Select Asset</label>
          <div className="grid grid-cols-3 gap-1.5">
            {Object.values(ASSET_METADATA).map((a) => (
              <button
                key={a.id}
                onClick={() => setSelectedAsset(a.id)}
                className={`p-2 rounded-lg text-xs font-bold transition-all border ${
                  selectedAsset === a.id
                    ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                    : 'bg-neutral-950 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                }`}
              >
                {a.symbol}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 bg-white rounded-2xl inline-block mx-auto shadow-xl">
          <QRCodeSVG value={address} size={180} level="H" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] text-amber-400 font-bold block">{assetInfo.name} ({assetInfo.network})</span>
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 font-mono text-xs text-neutral-200 select-all break-all">
            {address}
          </div>
          <button
            onClick={handleCopy}
            className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold text-xs flex items-center justify-center space-x-1 transition-all"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Address Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4" />
                <span>Copy Wallet Address</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
