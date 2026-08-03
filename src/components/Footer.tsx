import React from 'react';
import { ShieldCheck, Lock, Globe, Mail } from 'lucide-react';
import { NetbybitLogo } from './NetbybitLogo';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-neutral-950/90 border-t border-amber-500/20 text-neutral-400 py-12 px-4 sm:px-6 lg:px-8 mt-auto backdrop-blur-md relative overflow-hidden">
      {/* Background ambient glow effect */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8 relative z-10">
        {/* Col 1: Brand & URL */}
        <div className="space-y-4">
          <NetbybitLogo size="md" />
          <p className="text-xs text-neutral-400 leading-relaxed font-sans">
            Enterprise-grade multi-currency wallet custodian. Secure cold-storage architecture, instant real-time settlement, and multi-network deposit routing.
          </p>
          <div className="pt-2">
            <span className="text-[11px] font-mono text-amber-300 bg-amber-500/10 px-3 py-1.5 rounded-xl border border-amber-500/20 inline-flex items-center space-x-1.5 shadow-sm">
              <Globe className="w-3.5 h-3.5 text-amber-400" />
              <span>NETBYBIT Vault Official</span>
            </span>
          </div>
        </div>

        {/* Col 2: Supported Networks */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">Supported Assets</h4>
          <ul className="space-y-1.5 text-xs text-neutral-400 font-mono">
            <li className="hover:text-amber-300 transition-colors flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
              <span>Bitcoin (BTC Mainnet)</span>
            </li>
            <li className="hover:text-amber-300 transition-colors flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              <span>Ethereum (ETH ERC-20)</span>
            </li>
            <li className="hover:text-amber-300 transition-colors flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" />
              <span>BNB Smart Chain (BEP-20)</span>
            </li>
            <li className="hover:text-amber-300 transition-colors flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              <span>Tron Network (TRX TRC-20)</span>
            </li>
            <li className="hover:text-amber-300 transition-colors flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span>Tether USD (USDT ERC-20)</span>
            </li>
            <li className="hover:text-amber-300 transition-colors flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
              <span>Tether USD (USDT TRC-20)</span>
            </li>
          </ul>
        </div>

        {/* Col 3: Platform Security */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">Security Infrastructure</h4>
          <div className="space-y-2.5 text-xs text-neutral-400">
            <div className="flex items-center space-x-2 bg-neutral-900/60 p-2 rounded-xl border border-neutral-800">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cold Storage & SHA-256 Hashes</span>
            </div>
            <div className="flex items-center space-x-2 bg-neutral-900/60 p-2 rounded-xl border border-neutral-800">
              <Lock className="w-4 h-4 text-amber-400 shrink-0" />
              <span>Role-Based Custodial Access</span>
            </div>
            <div className="flex items-center space-x-2 bg-neutral-900/60 p-2 rounded-xl border border-neutral-800">
              <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Dynamic Admin Deposit Vaults</span>
            </div>
          </div>
        </div>

        {/* Col 4: Support */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 mb-3">Customer Support Desk</h4>
          <p className="text-xs text-neutral-400 mb-3 leading-relaxed">
            Our global custodial support desk monitors ticket submissions and deposit verifications 24/7.
          </p>
          <div className="flex items-center space-x-2 text-xs text-amber-300 bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20">
            <Mail className="w-4 h-4 text-amber-400 shrink-0" />
            <a href="mailto:netbybitsupport@gmail.com" className="font-mono underline hover:text-amber-200 truncate">
              netbybitsupport@gmail.com
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto border-t border-neutral-900 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-neutral-500 relative z-10">
        <p>© 2026 NETBYBIT Custodial Technologies Inc. All rights reserved.</p>
        <div className="flex items-center space-x-4 mt-2 sm:mt-0 font-mono text-[11px]">
          <a
            href="/api/download-zip"
            download="netbybit-project.zip"
            className="px-3 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center space-x-1.5 transition-all shadow-sm"
            title="Download full project source code + Firebase files"
          >
            <span>📦 Download Project ZIP</span>
          </a>
          <span className="text-neutral-700">•</span>
          <span className="text-neutral-400 font-semibold">NETBYBIT Vault v2.4</span>
          <span className="text-neutral-700">•</span>
          <span className="flex items-center space-x-1 text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Systems Normal</span>
          </span>
        </div>
      </div>
    </footer>
  );
};

