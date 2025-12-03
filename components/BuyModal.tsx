import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Wallet, Info } from 'lucide-react';

interface BuyModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentPrice: number;
  symbol: string;
}

const BuyModal: React.FC<BuyModalProps> = ({ isOpen, onClose, currentPrice, symbol }) => {
  const [amount, setAmount] = useState<string>('');
  const [totalCost, setTotalCost] = useState<string>('');
  const [mode, setMode] = useState<'amount' | 'total'>('amount'); // Tracks which input is driving the calculation

  // Sync total cost when amount changes
  const handleAmountChange = (val: string) => {
    setAmount(val);
    setMode('amount');
    const num = parseFloat(val);
    if (!isNaN(num)) {
      setTotalCost((num * currentPrice).toFixed(2));
    } else {
      setTotalCost('');
    }
  };

  // Sync amount when total cost changes
  const handleTotalChange = (val: string) => {
    setTotalCost(val);
    setMode('total');
    const num = parseFloat(val);
    if (!isNaN(num) && currentPrice > 0) {
      setAmount((num / currentPrice).toFixed(6));
    } else {
      setAmount('');
    }
  };

  // Update calculations if price changes live while modal is open
  useEffect(() => {
      if (mode === 'amount') {
          const num = parseFloat(amount);
          if (!isNaN(num)) setTotalCost((num * currentPrice).toFixed(2));
      } else if (mode === 'total') {
          const num = parseFloat(totalCost);
          if (!isNaN(num) && currentPrice > 0) setAmount((num / currentPrice).toFixed(6));
      }
  }, [currentPrice, mode]); // Added mode to deps to ensure logic holds

  if (!isOpen) return null;

  const handleBuy = () => {
    const finalAmount = parseFloat(amount);
    const finalTotal = parseFloat(totalCost);
    
    if (!finalAmount || !finalTotal) return;

    const message = `Заявка на покупку:
Монета: ${symbol}
Количество: ${finalAmount}
Цена: $${currentPrice.toFixed(8)}
Сумма: $${finalTotal.toFixed(2)}`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://t.me/Insbitg?text=${encodedMessage}`, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-in fade-in duration-200">
      <div className="bg-[#1e2329] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden border border-[#2b3139] flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-[#2b3139] flex justify-between items-center bg-[#1e2329]">
          <div>
             <h2 className="text-xl font-bold text-[#EAECEF] flex items-center gap-2">
                Buy {symbol}
             </h2>
             <p className="text-xs text-gray-500 mt-1 font-medium">Place Market Order</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[#2b3139] rounded-full text-gray-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Price Display */}
          <div className="flex justify-between items-end bg-[#161a1e] p-4 rounded-xl border border-[#2b3139]/50">
            <div>
                <span className="text-xs text-gray-500 font-bold uppercase block mb-1">Current Price</span>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[#3b82f6] font-mono font-bold">Live</span>
                </div>
            </div>
            <div className="text-right">
                <div className="text-2xl font-mono font-bold text-[#EAECEF]">${currentPrice.toFixed(8)}</div>
                <div className="text-xs text-gray-500">USDT per {symbol}</div>
            </div>
          </div>

          {/* Input Fields */}
          <div className="space-y-3">
              
              {/* Amount Input */}
              <div className="relative group">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 pl-1">I want to buy (Amount)</label>
                <div className="relative flex items-center">
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => handleAmountChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#121518] border border-[#2b3139] rounded-xl py-4 pl-4 pr-20 text-white font-mono text-lg outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder-gray-700"
                        autoFocus
                    />
                    <span className="absolute right-4 text-sm font-bold text-gray-400 pointer-events-none">{symbol}</span>
                </div>
              </div>

              {/* Divider */}
              <div className="flex justify-center relative z-10 opacity-50">
                 <div className="bg-[#2b3139] rounded-full p-1 border border-[#1e2329]">
                    <ArrowRight className="w-3 h-3 text-gray-400 rotate-90" />
                 </div>
              </div>

              {/* Total Input */}
              <div className="relative group">
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2 pl-1">I will pay (Total)</label>
                <div className="relative flex items-center">
                    <input
                        type="number"
                        value={totalCost}
                        onChange={(e) => handleTotalChange(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#121518] border border-[#2b3139] rounded-xl py-4 pl-4 pr-20 text-white font-mono text-lg outline-none focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6] transition-all placeholder-gray-700"
                    />
                    <span className="absolute right-4 text-sm font-bold text-gray-400 pointer-events-none">USDT</span>
                </div>
              </div>

          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 rounded-lg p-3 flex gap-3 border border-blue-500/20">
             <Info className="w-5 h-5 text-blue-400 shrink-0" />
             <div className="text-xs text-blue-200/80 leading-relaxed">
                Order details will be pre-filled in Telegram. Please confirm sending the message to the bot to process your transaction.
             </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleBuy}
            disabled={!amount || parseFloat(amount) <= 0}
            className="w-full bg-[#3b82f6] hover:bg-[#2563eb] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl text-base transition-all transform active:scale-[0.98] shadow-lg shadow-blue-900/20 flex justify-center items-center gap-2"
          >
            Continue to Telegram <Wallet size={18} />
          </button>

        </div>
      </div>
    </div>
  );
};

export default BuyModal;