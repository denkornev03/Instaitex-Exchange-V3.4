import React from 'react';
import { Settings, Save } from 'lucide-react';
import { CoinData, CoinId } from '../types';

interface AdminPanelProps {
  coins: CoinData[];
  onUpdateCoin: (id: CoinId, updates: Partial<CoinData>) => void;
  onClose: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ coins, onUpdateCoin, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gray-900 border-b border-gray-800 p-6 flex justify-between items-center z-10">
          <div className="flex items-center gap-3">
            <div className="bg-purple-500/20 p-2 rounded-lg text-purple-400">
              <Settings size={24} />
            </div>
            <h2 className="text-2xl font-bold text-white">Market Control</h2>
          </div>
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg transition-colors text-sm font-medium"
          >
            Close Admin
          </button>
        </div>

        <div className="p-6 space-y-8">
          <p className="text-gray-400 text-sm bg-gray-800/50 p-4 rounded-lg border border-gray-700">
            Adjusting the <strong>Base Price</strong> will shift the real-time simulation center point. 
            The chart will immediately react to the new baseline, fluctuating ±2% around it.
          </p>

          <div className="grid gap-6">
            {coins.map((coin) => (
              <div key={coin.id} className="bg-gray-800/40 rounded-xl border border-gray-700 p-5">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-3 h-3 rounded-full`} style={{ backgroundColor: coin.color }} />
                  <h3 className="text-lg font-bold text-white">{coin.name} ({coin.symbol})</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Balance Control */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      Portfolio Balance (qty)
                    </label>
                    <input
                      type="number"
                      value={coin.balance}
                      onChange={(e) => onUpdateCoin(coin.id, { balance: parseFloat(e.target.value) || 0 })}
                      className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  {/* Price Control */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
                      Target Base Price ($)
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                      <input
                        type="number"
                        step="0.0001"
                        value={coin.basePrice}
                        onChange={(e) => onUpdateCoin(coin.id, { basePrice: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-gray-950 border border-gray-700 text-white rounded-lg pl-8 pr-3 py-2.5 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all font-mono"
                      />
                    </div>
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>Sim Range:</span>
                      <span className="font-mono">
                        ${(coin.basePrice * 0.98).toFixed(4)} - ${(coin.basePrice * 1.02).toFixed(4)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;