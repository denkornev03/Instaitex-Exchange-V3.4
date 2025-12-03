import React from 'react';
import { Rocket, ArrowRight } from 'lucide-react';

const CountdownTimer: React.FC = () => {
  const handlePodwayClick = () => {
    window.open('https://www.podwaynepal.com/', '_blank');
  };

  return (
    <button 
      onClick={handlePodwayClick}
      className="group w-full bg-[#2b3139]/50 border border-[#2b3139] hover:border-emerald-500/50 hover:bg-[#2b3139] rounded p-2.5 flex items-center justify-center gap-2 transition-all"
    >
      <Rocket className="w-4 h-4 text-emerald-500 group-hover:scale-110 transition-transform" />
      <span className="text-xs font-bold text-emerald-500 group-hover:text-emerald-400 uppercase tracking-wide">
        PODWAY LAUNCH
      </span>
      <ArrowRight className="w-3 h-3 text-emerald-500 group-hover:translate-x-1 transition-transform" />
    </button>
  );
};

export default CountdownTimer;