
import React, { useState, useEffect } from 'react';
import { Activity, Lock, User, ExternalLink, TrendingUp, Database, ArrowUpRight, ArrowDownRight, Wallet, BarChart2, Hammer, Clock, Shield, Menu, X, Rabbit, FileText, Globe, PlayCircle, Newspaper, ArrowLeft, Share2, Gift, CheckCircle, Loader2, Download, ArrowRight, Box } from 'lucide-react';
import { INITIAL_COINS, MAX_HISTORY_POINTS, SIMULATION_INTERVAL, MOCK_NEWS } from './constants';
import { CoinData, CoinId, NewsItem } from './types';
import PriceChart from './components/PriceChart';
import CountdownTimer from './components/CountdownTimer';
import BuyModal from './components/BuyModal';
import VoxelTrade from './components/VoxelTrade';

function App() {
  const [coins, setCoins] = useState<CoinData[]>(INITIAL_COINS);
  const [buyModalCoin, setBuyModalCoin] = useState<CoinId | null>(null);
  const [activeTab, setActiveTab] = useState<'markets' | 'trade' | 'news' | 'airdrop' | 'voxel'>('markets');
  const [selectedTradeCoinId, setSelectedTradeCoinId] = useState<CoinId>('USTC');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  // News State
  const [selectedNewsItem, setSelectedNewsItem] = useState<NewsItem | null>(null);
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);

  // Airdrop State
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [isConnectingWallet, setIsConnectingWallet] = useState(false);
  const [isAirdropClaimed, setIsAirdropClaimed] = useState(false);

  // Simulation Engine
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCoins(currentCoins => {
        return currentCoins.map(coin => {
          // Volatility logic: +/- 2% from basePrice
          const randomFactor = 0.98 + Math.random() * 0.04;
          const newPrice = coin.basePrice * randomFactor;
          
          const newPoint = {
            time: new Date().toLocaleTimeString(),
            value: newPrice
          };

          const newHistory = [...coin.history, newPoint];
          if (newHistory.length > MAX_HISTORY_POINTS) {
            newHistory.shift();
          }

          return {
            ...coin,
            currentPrice: newPrice,
            history: newHistory
          };
        });
      });
    }, SIMULATION_INTERVAL);

    return () => clearInterval(intervalId);
  }, []);

  const getCoin = (id: CoinId) => coins.find(c => c.id === id);

  // Helper to calculate fake "24h Change" based on current price vs base price
  const getChangePercent = (current: number, base: number) => {
    const change = ((current - base) / base) * 100;
    return change;
  };

  const selectedTradeCoin = coins.find(c => c.id === selectedTradeCoinId) || coins[0];
  const selectedTradeChange = getChangePercent(selectedTradeCoin.currentPrice, selectedTradeCoin.basePrice);

  const handleNewsClick = (news: NewsItem) => {
    if (news.category === 'article' || news.category === 'video') {
      setSelectedNewsItem(news);
      window.scrollTo(0, 0);
    } else if (news.category === 'website') {
      if (news.url) window.open(news.url, '_blank');
    }
  };

  const handleBackToNews = () => {
    setSelectedNewsItem(null);
  };

  const handleConnectWallet = () => {
    setIsConnectingWallet(true);
    // Simulate network delay
    setTimeout(() => {
      setIsConnectingWallet(false);
      setIsWalletConnected(true);
    }, 2000);
  };

  const handleClaimAirdrop = () => {
    const message = "Здравствуйте! Я подключил кошелек и хочу получить Airdrop 1,000 INSb.";
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://t.me/Insbitg?text=${encodedMessage}`, '_blank');
    setIsAirdropClaimed(true);
  };

  return (
    <div className="min-h-screen bg-[#0e1012] text-[#EAECEF] font-sans antialiased flex flex-col">
      
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-40 w-full bg-[#121518] border-b border-[#2b3139] h-16 flex items-center justify-between px-4 lg:px-6 flex-none shadow-sm relative">
        <div className="flex items-center gap-8">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 cursor-pointer group select-none" onClick={() => { setActiveTab('markets'); setSelectedNewsItem(null); }}>
            <div className="relative w-9 h-9 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#f7a600] rounded-lg opacity-20 rotate-6 group-hover:rotate-12 transition-transform duration-300 ease-out"></div>
              <div className="absolute inset-0 bg-gradient-to-br from-[#f7a600] to-[#d97706] rounded-lg shadow-lg shadow-orange-500/20 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                   <path d="M3 13.2V21H21V13.2M3 13.2L8.5 7.5L12.5 11.5L18.5 5.5M18.5 5.5H13.5M18.5 5.5V10.5" stroke="#121518" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="flex flex-col justify-center h-full pt-1">
              <span className="font-black text-xl tracking-tight text-[#EAECEF] leading-none group-hover:text-white transition-colors">
                INSTA<span className="text-[#f7a600]">ITEX</span>
              </span>
              <span className="text-[9px] font-bold tracking-[0.25em] text-gray-500 uppercase group-hover:text-[#f7a600] transition-colors">
                инсайт биржа
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex space-x-6 text-sm font-medium text-gray-400 h-16 items-center ml-4">
            <button 
              onClick={() => { setActiveTab('markets'); setSelectedNewsItem(null); }}
              className={`h-full border-b-[3px] transition-all px-1 ${activeTab === 'markets' ? 'text-[#EAECEF] border-[#f7a600]' : 'border-transparent hover:text-[#EAECEF] hover:border-gray-700'}`}
            >
              Markets
            </button>
            <button 
              onClick={() => { setActiveTab('trade'); setSelectedNewsItem(null); }}
              className={`h-full border-b-[3px] transition-all px-1 ${activeTab === 'trade' ? 'text-[#EAECEF] border-[#f7a600]' : 'border-transparent hover:text-[#EAECEF] hover:border-gray-700'}`}
            >
              Trade
            </button>
            <button 
              onClick={() => setActiveTab('news')}
              className={`h-full border-b-[3px] transition-all px-1 ${activeTab === 'news' ? 'text-[#EAECEF] border-[#f7a600]' : 'border-transparent hover:text-[#EAECEF] hover:border-gray-700'}`}
            >
              News
            </button>
            <button 
              onClick={() => setActiveTab('airdrop')}
              className={`h-full border-b-[3px] transition-all px-1 flex items-center gap-2 ${activeTab === 'airdrop' ? 'text-[#EAECEF] border-[#f7a600]' : 'border-transparent hover:text-[#EAECEF] hover:border-gray-700'}`}
            >
              Airdrop <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
            </button>
            <button 
              onClick={() => setActiveTab('voxel')}
              className={`h-full border-b-[3px] transition-all px-1 flex items-center gap-2 ${activeTab === 'voxel' ? 'text-[#EAECEF] border-[#f7a600]' : 'border-transparent hover:text-[#EAECEF] hover:border-gray-700'}`}
            >
              Voxel Trade <Box size={14} className="text-cyan-400" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 bg-[#1e2227] px-3 py-1.5 rounded border border-[#2b3139] hover:border-gray-600 transition-colors">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Est. Assets</span>
            <span className="text-sm font-mono text-white">
              ${coins.reduce((acc, c) => acc + (c.balance * c.currentPrice), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          
          {/* Mobile Menu Toggle */}
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden text-gray-400 hover:text-white p-2 hover:bg-[#2b3139] rounded-full transition-colors"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu Dropdown */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#121518] border-b border-[#2b3139] w-full fixed top-16 left-0 z-30 shadow-xl animate-in slide-in-from-top-5 duration-200">
          <div className="flex flex-col p-4 space-y-2">
            <button 
              onClick={() => { setActiveTab('markets'); setSelectedNewsItem(null); setIsMobileMenuOpen(false); }}
              className={`text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors ${activeTab === 'markets' ? 'bg-[#2b3139] text-[#f7a600]' : 'text-gray-400 hover:bg-[#1e2329] hover:text-white'}`}
            >
              Markets
            </button>
            <button 
              onClick={() => { setActiveTab('trade'); setSelectedNewsItem(null); setIsMobileMenuOpen(false); }}
              className={`text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors ${activeTab === 'trade' ? 'bg-[#2b3139] text-[#f7a600]' : 'text-gray-400 hover:bg-[#1e2329] hover:text-white'}`}
            >
              Trade
            </button>
             <button 
              onClick={() => { setActiveTab('news'); setIsMobileMenuOpen(false); }}
              className={`text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors ${activeTab === 'news' ? 'bg-[#2b3139] text-[#f7a600]' : 'text-gray-400 hover:bg-[#1e2329] hover:text-white'}`}
            >
              News
            </button>
            <button 
              onClick={() => { setActiveTab('airdrop'); setIsMobileMenuOpen(false); }}
              className={`text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-between ${activeTab === 'airdrop' ? 'bg-[#2b3139] text-[#f7a600]' : 'text-gray-400 hover:bg-[#1e2329] hover:text-white'}`}
            >
              Airdrop <Gift size={14} className="text-red-500" />
            </button>
            <button 
              onClick={() => { setActiveTab('voxel'); setIsMobileMenuOpen(false); }}
              className={`text-left px-4 py-3 rounded-lg font-medium text-sm transition-colors flex items-center justify-between ${activeTab === 'voxel' ? 'bg-[#2b3139] text-[#f7a600]' : 'text-gray-400 hover:bg-[#1e2329] hover:text-white'}`}
            >
              Voxel Trade <Box size={14} className="text-cyan-400" />
            </button>
            
            {/* Mobile Assets Display */}
            <div className="mt-4 pt-4 border-t border-[#2b3139]">
               <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 px-4">Total Assets</div>
               <div className="text-lg font-mono text-white px-4">
                  ${coins.reduce((acc, c) => acc + (c.balance * c.currentPrice), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-grow flex flex-col relative">
        
        {activeTab === 'voxel' ? (
          <VoxelTrade />
        ) : selectedNewsItem ? (
          // FULL ARTICLE VIEW
          <div className="container mx-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
             <button 
                onClick={handleBackToNews}
                className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors text-sm font-medium"
             >
                <ArrowLeft size={16} /> Back to News
             </button>

             <div className="flex flex-col lg:flex-row gap-8">
                {/* Main Article Content */}
                <div className="flex-1 bg-[#1e2329] rounded-xl border border-[#2b3139] overflow-hidden">
                   <div className="relative h-64 md:h-80 w-full">
                      {selectedNewsItem.category === 'video' && selectedNewsItem.embedUrl ? (
                         <iframe 
                           src={selectedNewsItem.embedUrl} 
                           className="w-full h-full"
                           allow="autoplay"
                           title={selectedNewsItem.title}
                         ></iframe>
                      ) : (
                          <>
                            <img 
                                src={selectedNewsItem.imageUrl} 
                                alt={selectedNewsItem.title} 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#1e2329] via-transparent to-transparent"></div>
                          </>
                      )}
                      
                      <div className="absolute bottom-6 left-6 right-6 pointer-events-none">
                        <div className="flex items-center gap-3 mb-3">
                           <span className="px-2 py-1 bg-[#2b3139]/80 backdrop-blur-md text-white text-[10px] font-bold uppercase tracking-wider rounded border border-gray-600">
                              {selectedNewsItem.relatedCoinId} Update
                           </span>
                           <span className="text-gray-300 text-xs flex items-center gap-1">
                              <Clock size={12} /> {selectedNewsItem.date}
                           </span>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight shadow-sm text-shadow-md">
                           {selectedNewsItem.title}
                        </h1>
                      </div>
                   </div>

                   <div className="p-8 md:p-10">
                      <div 
                        className="prose prose-invert prose-lg max-w-none text-gray-300 leading-relaxed"
                        dangerouslySetInnerHTML={{ __html: selectedNewsItem.content || selectedNewsItem.summary }}
                      />
                      
                      {/* Internal Navigation Action Button */}
                      {selectedNewsItem.internalLink === 'airdrop' && (
                        <div className="mt-8">
                           <button
                             onClick={() => { setActiveTab('airdrop'); setSelectedNewsItem(null); }}
                             className="w-full md:w-auto px-8 py-4 bg-[#f7a600] hover:bg-[#d97706] text-black font-bold rounded-lg shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                           >
                             Перейти в раздел Airdrop <ArrowRight size={20} />
                           </button>
                        </div>
                      )}

                      {/* External Source Button */}
                      {selectedNewsItem.url && (
                        <div className="mt-8">
                           <a
                             href={selectedNewsItem.url}
                             target="_blank"
                             rel="noreferrer"
                             className="w-full md:w-auto px-8 py-4 bg-[#2b3139] hover:bg-[#374151] border border-gray-600 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02]"
                           >
                             Перейти на первоисточник <ExternalLink size={20} />
                           </a>
                        </div>
                      )}

                      <div className="mt-10 pt-6 border-t border-[#2b3139] flex items-center justify-between">
                         <div className="flex items-center gap-4">
                            <span className="text-sm text-gray-500">Share this article:</span>
                            <button className="p-2 bg-[#2b3139] hover:bg-gray-700 rounded-full text-gray-300 transition-colors">
                               <Share2 size={16} />
                            </button>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Sidebar */}
                <div className="w-full lg:w-80 space-y-6">
                    {/* Coin Price Ticker Widget */}
                    <div className="bg-[#1e2329] rounded-xl border border-[#2b3139] p-5 sticky top-24">
                       <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">Market Reaction</h3>
                       {(() => {
                          const coin = getCoin(selectedNewsItem.relatedCoinId);
                          if (!coin) return null;
                          const change = getChangePercent(coin.currentPrice, coin.basePrice);
                          return (
                             <div className="text-center">
                                <div className="flex justify-center items-center gap-3 mb-2">
                                   <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold border-2 shadow-lg`} style={{ backgroundColor: coin.color, borderColor: coin.color }}>
                                      {coin.symbol}
                                   </div>
                                </div>
                                <div className="text-3xl font-mono font-bold text-white mb-1">
                                   ${coin.currentPrice.toFixed(6)}
                                </div>
                                <div className={`inline-flex items-center gap-1 px-2 py-1 rounded text-sm font-bold ${selectedNewsItem.priceImpact.startsWith('+') ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                   {selectedNewsItem.priceImpact.startsWith('+') ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                   {selectedNewsItem.priceImpact}
                                </div>
                                <p className="text-xs text-gray-500 mt-4 leading-relaxed">
                                   Price change recorded since news release based on market aggregation.
                                </p>
                                <button 
                                   onClick={() => { setSelectedTradeCoinId(coin.id); setActiveTab('trade'); setSelectedNewsItem(null); }}
                                   className="w-full mt-4 py-2 bg-[#2b3139] hover:bg-[#363c45] border border-gray-600 text-white rounded font-medium transition-colors text-sm"
                                >
                                   Trade {coin.symbol}
                                </button>
                             </div>
                          );
                       })()}
                    </div>
                </div>
             </div>
          </div>
        ) : activeTab === 'markets' ? (
          // MARKETS DASHBOARD VIEW
          <div className="container mx-auto px-4 py-6 space-y-6 animate-in fade-in duration-300">
            {/* Market Ticker Bar */}
            <div className="hidden lg:flex gap-8 overflow-x-auto pb-2 text-xs border-b border-[#2b3139] mb-6">
              {coins.map(coin => {
                const change = getChangePercent(coin.currentPrice, coin.basePrice);
                return (
                  <div key={coin.id} className="flex items-center gap-2 whitespace-nowrap cursor-pointer hover:bg-[#1e2329] p-1 rounded transition-colors" onClick={() => {
                    setSelectedTradeCoinId(coin.id);
                    setActiveTab('trade');
                  }}>
                    <span className="font-bold text-[#EAECEF]">{coin.symbol}/USDT</span>
                    <span className={`font-mono ${change >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {coin.currentPrice.toFixed(coin.basePrice < 1 ? 6 : 4)}
                    </span>
                    <span className={`font-mono ${change >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5 gap-4">
              
              {/* 1. USTC - RSW Shares */}
              <div className="bg-[#1e2329] rounded-sm border border-[#2b3139] flex flex-col hover:border-gray-600 transition-colors">
                <div className="p-4 flex justify-between items-center border-b border-[#2b3139]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-emerald-900/30 rounded-full flex items-center justify-center text-emerald-500 font-bold text-xs border border-emerald-500/20">
                      RSW
                    </div>
                    <div>
                      <h3 className="font-bold text-[#EAECEF] text-lg leading-none flex items-center gap-2">
                        USTC <span className="text-xs bg-[#2b3139] text-gray-400 px-1 rounded font-normal">Shares</span>
                      </h3>
                      <span className="text-xs text-gray-500">{coins[0].name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono text-[#0ecb81] tracking-tight">
                      {coins[0].currentPrice.toFixed(4)}
                    </div>
                    <div className="text-xs font-mono text-[#0ecb81] flex items-center justify-end gap-1">
                      <ArrowUpRight size={12} /> 
                      +{getChangePercent(coins[0].currentPrice, coins[0].basePrice).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-4">
                    <div>
                      <div className="mb-1">Holding (Vol)</div>
                      <div className="text-[#EAECEF] font-mono text-sm">{coins[0].balance.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="mb-1">Total Value</div>
                      <div className="text-[#EAECEF] font-mono text-sm">
                        ${(coins[0].balance * coins[0].currentPrice).toLocaleString(undefined, {maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-32 mb-4">
                    <PriceChart data={coins[0].history} color="#0ecb81" />
                  </div>

                  <div className="space-y-3 mt-auto">
                    <a 
                      href="https://rsw-systems.com/?r=101716" 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#0ecb81] hover:bg-[#0ecb81]/90 text-white font-semibold rounded text-sm transition-colors"
                    >
                      Buy Shares <ExternalLink size={14} />
                    </a>
                    <CountdownTimer />
                  </div>
                </div>
              </div>

              {/* 2. INSb - Exchange Token (Was DKR) */}
              <div className="bg-[#1e2329] rounded-sm border border-[#2b3139] flex flex-col hover:border-gray-600 transition-colors">
                <div className="p-4 flex justify-between items-center border-b border-[#2b3139]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-900/30 rounded-full flex items-center justify-center text-blue-500 font-bold text-xs border border-blue-500/20">
                      INSb
                    </div>
                    <div>
                      <h3 className="font-bold text-[#EAECEF] text-lg leading-none flex items-center gap-2">
                        INSb <span className="text-xs bg-[#2b3139] text-gray-400 px-1 rounded font-normal">Token</span>
                      </h3>
                      <span className="text-xs text-gray-500">{coins[1].name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono text-[#3b82f6] tracking-tight">
                      {coins[1].currentPrice.toFixed(6)}
                    </div>
                    <div className="text-xs font-mono text-[#3b82f6] flex items-center justify-end gap-1">
                      <ArrowDownRight size={12} /> 
                      {(getChangePercent(coins[1].currentPrice, coins[1].basePrice)).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-4">
                    <div>
                      <div className="mb-1">Holding (Vol)</div>
                      <div className="text-[#EAECEF] font-mono text-sm">{coins[1].balance.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="mb-1">Total Value</div>
                      <div className="text-[#EAECEF] font-mono text-sm">
                        ${(coins[1].balance * coins[1].currentPrice).toLocaleString(undefined, {maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>

                  <div className="h-32 mb-4">
                    <PriceChart data={coins[1].history} color="#3b82f6" />
                  </div>

                  <div className="space-y-3 mt-auto">
                    <button
                      onClick={() => setBuyModalCoin('INSb')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-semibold rounded text-sm transition-colors"
                    >
                      Buy / Trade <TrendingUp size={14} />
                    </button>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      Secure Telegram Gateway
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. HOT - Mining */}
              <div className="bg-[#1e2329] rounded-sm border border-[#2b3139] flex flex-col relative overflow-hidden hover:border-gray-600 transition-colors">
                <div className="absolute top-0 right-0 p-2 opacity-20">
                   <Database size={100} className="text-gray-700 transform rotate-12" />
                </div>

                <div className="p-4 flex justify-between items-center border-b border-[#2b3139] relative z-10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-orange-900/30 rounded-full flex items-center justify-center text-orange-500 font-bold text-xs border border-orange-500/20">
                      HOT
                    </div>
                    <div>
                      <h3 className="font-bold text-[#EAECEF] text-lg leading-none flex items-center gap-2">
                        HOT <span className="text-xs bg-[#2b3139] text-gray-400 px-1 rounded font-normal">Utility</span>
                      </h3>
                      <span className="text-xs text-gray-500">{coins[2].name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono text-[#EAECEF] tracking-tight">
                      {coins[2].currentPrice.toFixed(2)}
                    </div>
                    <div className="text-xs font-mono text-gray-400 flex items-center justify-end gap-1">
                      0.00%
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-grow flex flex-col justify-between relative z-10">
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-4">
                    <div>
                      <div className="mb-1">Holding (Vol)</div>
                      <div className="text-[#EAECEF] font-mono text-sm">{coins[2].balance.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="mb-1">Est. Value</div>
                      <div className="text-[#EAECEF] font-mono text-sm">
                        ${(coins[2].balance * coins[2].currentPrice).toLocaleString(undefined, {maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>

                  <div className="h-32 mb-4 grayscale opacity-50">
                    <PriceChart data={coins[2].history} color="#f97316" />
                  </div>

                  <div className="space-y-3 mt-auto">
                    <button
                      disabled
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#2b3139] text-gray-500 font-semibold rounded text-sm cursor-not-allowed border border-[#363c45]"
                    >
                      Mining Unavailable
                    </button>
                    <div className="text-center text-[10px] text-gray-600 uppercase tracking-wider">
                      Network Congested
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. KEEP - Storage */}
              <div className="bg-[#1e2329] rounded-sm border border-[#2b3139] flex flex-col hover:border-gray-600 transition-colors">
                <div className="p-4 flex justify-between items-center border-b border-[#2b3139]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-purple-900/30 rounded-full flex items-center justify-center text-purple-500 font-bold text-xs border border-purple-500/20">
                      KEEP
                    </div>
                    <div>
                      <h3 className="font-bold text-[#EAECEF] text-lg leading-none flex items-center gap-2">
                        KEEP <span className="text-xs bg-[#2b3139] text-gray-400 px-1 rounded font-normal">Храни</span>
                      </h3>
                      <span className="text-xs text-gray-500">{coins[3].name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono text-[#a855f7] tracking-tight">
                      {coins[3].currentPrice.toFixed(6)}
                    </div>
                    <div className="text-xs font-mono text-[#a855f7] flex items-center justify-end gap-1">
                      <ArrowUpRight size={12} /> 
                      +{getChangePercent(coins[3].currentPrice, coins[3].basePrice).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-4">
                    <div>
                      <div className="mb-1">Holding (Vol)</div>
                      <div className="text-[#EAECEF] font-mono text-sm">{coins[3].balance.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="mb-1">Total Value</div>
                      <div className="text-[#EAECEF] font-mono text-sm">
                        ${(coins[3].balance * coins[3].currentPrice).toLocaleString(undefined, {maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-32 mb-4">
                    <PriceChart data={coins[3].history} color="#a855f7" />
                  </div>

                  <div className="space-y-3 mt-auto">
                    <a 
                      href="https://keepfiles.ru" 
                      target="_blank" 
                      rel="noreferrer"
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#a855f7] hover:bg-[#9333ea] text-white font-semibold rounded text-sm transition-colors"
                    >
                      Buy KEEP <Shield size={14} />
                    </a>
                    <div className="text-center text-[10px] text-gray-600 uppercase tracking-wider">
                       Direct Server Access
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. RBTC - RabBitcoin */}
              <div className="bg-[#1e2329] rounded-sm border border-[#2b3139] flex flex-col hover:border-gray-600 transition-colors">
                <div className="p-4 flex justify-between items-center border-b border-[#2b3139]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-pink-900/30 rounded-full flex items-center justify-center text-pink-500 font-bold text-xs border border-pink-500/20">
                      RBTC
                    </div>
                    <div>
                      <h3 className="font-bold text-[#EAECEF] text-lg leading-none flex items-center gap-2">
                        RBTC <span className="text-xs bg-[#2b3139] text-gray-400 px-1 rounded font-normal">Rabbit</span>
                      </h3>
                      <span className="text-xs text-gray-500">{coins[4].name}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-mono text-[#ec4899] tracking-tight">
                      {coins[4].currentPrice.toFixed(7)}
                    </div>
                    <div className="text-xs font-mono text-[#ec4899] flex items-center justify-end gap-1">
                      <ArrowUpRight size={12} /> 
                      +{getChangePercent(coins[4].currentPrice, coins[4].basePrice).toFixed(2)}%
                    </div>
                  </div>
                </div>

                <div className="p-4 flex-grow flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 mb-4">
                    <div>
                      <div className="mb-1">Holding (Vol)</div>
                      <div className="text-[#EAECEF] font-mono text-sm">{coins[4].balance.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="mb-1">Total Value</div>
                      <div className="text-[#EAECEF] font-mono text-sm">
                        ${(coins[4].balance * coins[4].currentPrice).toLocaleString(undefined, {maximumFractionDigits: 2})}
                      </div>
                    </div>
                  </div>
                  
                  <div className="h-32 mb-4">
                    <PriceChart data={coins[4].history} color="#ec4899" />
                  </div>

                  <div className="space-y-3 mt-auto">
                    <button
                      onClick={() => setBuyModalCoin('RBTC')}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-[#ec4899] hover:bg-[#db2777] text-white font-semibold rounded text-sm transition-colors"
                    >
                      Buy RBTC (Telegram) <Rabbit size={14} />
                    </button>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      Secure Telegram Gateway
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        ) : activeTab === 'trade' ? (
          // TRADE VIEW
          <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)] bg-[#121518] animate-in fade-in duration-300">
            
            {/* Left Side: Coin Selector */}
            <div className="w-full lg:w-72 bg-[#1e2329] border-r border-[#2b3139] flex flex-col order-2 lg:order-1 h-48 lg:h-auto">
              <div className="p-3 border-b border-[#2b3139] text-xs font-bold text-gray-400 flex justify-between bg-[#161a1e] sticky top-0 z-10">
                <span>PAIR</span>
                <span>PRICE</span>
              </div>
              <div className="overflow-y-auto flex-1 custom-scrollbar">
                {coins.map(coin => {
                  const change = getChangePercent(coin.currentPrice, coin.basePrice);
                  const isSelected = selectedTradeCoinId === coin.id;
                  return (
                    <button
                      key={coin.id}
                      onClick={() => setSelectedTradeCoinId(coin.id)}
                      className={`w-full flex items-center justify-between p-3 border-b border-[#2b3139]/50 hover:bg-[#2b3139] transition-colors ${isSelected ? 'bg-[#2b3139] border-l-4 border-l-[#f7a600]' : 'border-l-4 border-l-transparent'}`}
                    >
                      <div className="flex items-center gap-2">
                        <div style={{color: coin.color}} className="font-bold">{coin.symbol}</div>
                        <div className="text-xs text-gray-500">/USDT</div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-mono ${change >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                          {coin.currentPrice.toFixed(coin.basePrice < 1 ? 6 : 4)}
                        </div>
                        <div className={`text-[10px] ${change >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                          {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Center: Chart & Actions */}
            <div className="flex-1 flex flex-col min-w-0 order-1 lg:order-2">
              
              {/* Header Bar */}
              <div className="h-16 border-b border-[#2b3139] bg-[#1e2329] flex items-center px-4 lg:px-6 justify-between shadow-sm flex-shrink-0">
                <div className="flex items-center gap-4">
                  <h1 className="text-xl lg:text-2xl font-bold text-[#EAECEF] flex items-center gap-2">
                    {selectedTradeCoin.symbol}
                    <span className="text-sm font-normal text-gray-500">/USDT</span>
                  </h1>
                  <div className={`text-base lg:text-lg font-mono font-medium ${selectedTradeChange >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}`}>
                    ${selectedTradeCoin.currentPrice.toFixed(selectedTradeCoin.basePrice < 1 ? 6 : 4)}
                  </div>
                  <div className="hidden md:block text-xs text-gray-500 bg-[#2b3139] px-2 py-1 rounded">
                    24h Change: <span className={selectedTradeChange >= 0 ? 'text-[#0ecb81]' : 'text-[#f6465d]'}>{selectedTradeChange >= 0 ? '+' : ''}{selectedTradeChange.toFixed(2)}%</span>
                  </div>
                </div>
                <div className="hidden lg:flex text-xs text-gray-400 items-center gap-4">
                    <div className="flex items-center gap-1"><Clock size={14}/> Spot Market</div>
                    <div className="flex items-center gap-1 text-[#f7a600]"><BarChart2 size={14}/> Trading View</div>
                </div>
              </div>

              {/* Chart Area */}
              <div className="flex-1 bg-[#161a1e] relative p-2 lg:p-4 flex flex-col min-h-[300px] lg:min-h-0">
                 <div className="flex-grow w-full h-full">
                    <PriceChart 
                      data={selectedTradeCoin.history} 
                      color={selectedTradeCoin.color} 
                      height="100%"
                      detailed={true}
                    />
                 </div>
              </div>

              {/* Trading Action Panel */}
              <div className="h-auto lg:h-24 bg-[#1e2329] border-t border-[#2b3139] p-4 flex flex-col md:flex-row items-center justify-between gap-4 flex-shrink-0">
                <div className="hidden md:flex gap-8 text-sm">
                   <div>
                      <div className="text-gray-500 text-xs mb-1">Your Balance</div>
                      <div className="font-mono text-white">{selectedTradeCoin.balance.toLocaleString()} {selectedTradeCoin.symbol}</div>
                   </div>
                   <div>
                      <div className="text-gray-500 text-xs mb-1">Equity Value</div>
                      <div className="font-mono text-white">${(selectedTradeCoin.balance * selectedTradeCoin.currentPrice).toLocaleString(undefined, {maximumFractionDigits: 2})}</div>
                   </div>
                </div>

                <div className="flex items-center gap-4 w-full md:w-auto">
                    {selectedTradeCoinId === 'USTC' && (
                        <div className="flex flex-col md:flex-row gap-3 w-full">
                            <div className="w-full md:w-48">
                                <CountdownTimer />
                            </div>
                            <a 
                                href="https://rsw-systems.com/?r=101716" 
                                target="_blank" 
                                rel="noreferrer"
                                className="flex-1 md:flex-none px-8 bg-[#0ecb81] hover:bg-[#0ecb81]/90 text-white font-bold py-2.5 rounded flex items-center justify-center gap-2 transition-colors"
                            >
                                Buy Shares
                            </a>
                        </div>
                    )}

                    {selectedTradeCoinId === 'INSb' && (
                        <button
                            onClick={() => setBuyModalCoin('INSb')}
                            className="w-full md:w-64 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold py-3 rounded transition-colors flex items-center justify-center gap-2"
                        >
                            Buy INSb (Telegram) <TrendingUp size={16} />
                        </button>
                    )}

                    {selectedTradeCoinId === 'HOT' && (
                        <button
                            onClick={() => window.open('https://app.hot-labs.org/link?624146uu', '_blank')}
                            className="w-full md:w-64 bg-[#f97316] hover:bg-[#ea580c] text-white font-bold py-3 rounded transition-colors flex items-center justify-center gap-2 animate-pulse"
                        >
                            <Hammer size={18} /> Start Mining HOT
                        </button>
                    )}

                    {selectedTradeCoinId === 'KEEP' && (
                        <button
                            onClick={() => window.open('https://keepfiles.ru', '_blank')}
                            className="w-full md:w-64 bg-[#8b5cf6] hover:bg-[#7c3aed] text-white font-bold py-3 rounded transition-colors flex items-center justify-center gap-2"
                        >
                            Buy KEEP <ExternalLink size={18} />
                        </button>
                    )}

                    {selectedTradeCoinId === 'RBTC' && (
                        <button
                            onClick={() => setBuyModalCoin('RBTC')}
                            className="w-full md:w-64 bg-[#ec4899] hover:bg-[#db2777] text-white font-bold py-3 rounded transition-colors flex items-center justify-center gap-2"
                        >
                            Buy RBTC (Telegram) <Rabbit size={16} />
                        </button>
                    )}
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'airdrop' ? (
          // AIRDROP VIEW
          <div className="container mx-auto px-4 py-12 animate-in fade-in duration-300">
             <div className="max-w-4xl mx-auto">
                
                {/* Header */}
                <div className="text-center mb-12">
                   <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/20 rounded-full mb-4">
                      <Gift size={32} className="text-blue-500" />
                   </div>
                   <h1 className="text-3xl md:text-5xl font-black text-white mb-4">INSb Community Airdrop</h1>
                   <p className="text-gray-400 text-lg max-w-2xl mx-auto">
                      Join the Instaitex revolution. Connect your TON wallet to claim your share of the governance token pool.
                   </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
                   <div className="bg-[#1e2329] border border-[#2b3139] p-6 rounded-xl text-center">
                      <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Total Airdrop Pool</div>
                      <div className="text-2xl font-mono text-blue-400 font-bold">99,999,799 INSb</div>
                   </div>
                   <div className="bg-[#1e2329] border border-[#2b3139] p-6 rounded-xl text-center">
                      <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Claim Per User</div>
                      <div className="text-2xl font-mono text-white font-bold">1,000 INSb</div>
                   </div>
                   <div className="bg-[#1e2329] border border-[#2b3139] p-6 rounded-xl text-center">
                      <div className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Status</div>
                      <div className="text-2xl font-bold text-emerald-500 flex items-center justify-center gap-2">
                         <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div> Live
                      </div>
                   </div>
                </div>

                {/* Action Card */}
                <div className="bg-[#1e2329] border border-[#2b3139] rounded-2xl p-8 relative overflow-hidden">
                   <div className="absolute top-0 right-0 p-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                   
                   <div className="relative z-10">
                      <div className="flex items-center gap-4 mb-8">
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${isWalletConnected ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'}`}>
                            {isWalletConnected ? <CheckCircle size={20} /> : '1'}
                         </div>
                         <div className="flex-1">
                            <h3 className="text-xl font-bold text-white">Connect TON Wallet</h3>
                            <p className="text-sm text-gray-500">Link your Tonkeeper or compatible wallet to verify eligibility.</p>
                         </div>
                         {!isWalletConnected && (
                            <button 
                               onClick={handleConnectWallet}
                               disabled={isConnectingWallet}
                               className="px-6 py-3 bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold rounded-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed min-w-[160px] flex items-center justify-center"
                            >
                               {isConnectingWallet ? <Loader2 size={20} className="animate-spin" /> : <span className="flex items-center gap-2"><Wallet size={18} /> Connect</span>}
                            </button>
                         )}
                         {isWalletConnected && (
                            <div className="px-6 py-3 bg-[#2b3139] text-emerald-500 font-bold rounded-lg border border-emerald-500/20 flex items-center gap-2">
                               <span className="w-2 h-2 bg-emerald-500 rounded-full"></span> UQ...8f2A
                            </div>
                         )}
                      </div>

                      <div className={`flex items-center gap-4 transition-opacity duration-500 ${isWalletConnected ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                         <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg transition-colors ${isAirdropClaimed ? 'bg-emerald-500 text-white' : 'bg-[#2b3139] text-gray-500 border border-gray-600'}`}>
                            {isAirdropClaimed ? <CheckCircle size={20} /> : '2'}
                         </div>
                         <div className="flex-1">
                            <h3 className="text-xl font-bold text-white">Claim Rewards</h3>
                            <p className="text-sm text-gray-500">Receive 1,000 INSb directly to your connected wallet.</p>
                         </div>
                         
                         {isAirdropClaimed ? (
                            <button disabled className="px-6 py-3 bg-emerald-500/10 text-emerald-500 font-bold rounded-lg border border-emerald-500/20 cursor-default">
                               Tokens Sent!
                            </button>
                         ) : (
                            <button 
                               onClick={handleClaimAirdrop}
                               className="px-6 py-3 bg-[#f7a600] hover:bg-[#d97706] text-black font-bold rounded-lg transition-all active:scale-95 min-w-[160px] flex items-center justify-center gap-2"
                            >
                               <Download size={18} /> Claim Now
                            </button>
                         )}
                      </div>

                      {isAirdropClaimed && (
                         <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 text-center animate-in zoom-in duration-300">
                            <p className="font-bold">Success! You have received 1,000 INSb.</p>
                            <p className="text-xs opacity-80 mt-1">Transaction hash: 0x7f...3a29</p>
                         </div>
                      )}
                   </div>
                </div>

             </div>
          </div>
        ) : (
          // NEWS VIEW (GRID)
          <div className="container mx-auto px-4 py-8 animate-in fade-in duration-300">
            <div className="mb-8 flex items-center gap-3">
              <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                <Newspaper className="w-6 h-6 text-indigo-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Market News & Insights</h1>
                <p className="text-sm text-gray-500">Latest updates, articles, and media from the ecosystem.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {MOCK_NEWS.map(news => {
                const coin = getCoin(news.relatedCoinId);
                const coinColor = coin?.color || '#gray';
                const isVideoPlaying = playingVideoId === news.id;
                
                return (
                  <div key={news.id} className="group bg-[#1e2329] border border-[#2b3139] hover:border-gray-600 rounded-xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:shadow-black/20">
                    
                    {/* Media Section */}
                    <div className="h-48 bg-gray-900 relative overflow-hidden cursor-pointer" onClick={() => {
                        if ((news.category === 'video' && news.videoUrl) || (news.category === 'video' && news.embedUrl)) {
                            setPlayingVideoId(news.id);
                        } else {
                            handleNewsClick(news);
                        }
                    }}>
                      {isVideoPlaying ? (
                        news.embedUrl ? (
                           <iframe 
                             src={news.embedUrl} 
                             className="w-full h-full"
                             allow="autoplay"
                             title={news.title}
                           ></iframe>
                        ) : news.videoUrl ? (
                           <video 
                              src={news.videoUrl} 
                              controls 
                              autoPlay 
                              className="w-full h-full object-cover"
                           />
                        ) : null
                      ) : (
                         <>
                            <img 
                              src={news.imageUrl} 
                              alt={news.title}
                              className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500"
                            />
                            {/* Category Badge */}
                            <div className="absolute top-3 left-3">
                              <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider text-white shadow-sm flex items-center gap-1.5`} style={{ backgroundColor: news.category === 'video' ? '#ef4444' : news.category === 'website' ? '#3b82f6' : '#10b981' }}>
                                {news.category === 'video' ? <PlayCircle size={10} /> : news.category === 'website' ? <Globe size={10} /> : <FileText size={10} />}
                                {news.category.toUpperCase()}
                              </span>
                            </div>

                            {/* Price Impact Badge */}
                            <div className="absolute top-3 right-3">
                               <div className={`flex items-center gap-1 px-2 py-1 rounded backdrop-blur-md text-[10px] font-bold border ${news.priceImpact.startsWith('+') ? 'bg-emerald-500/80 border-emerald-400/50 text-white' : 'bg-red-500/80 border-red-400/50 text-white'}`}>
                                  {news.priceImpact.startsWith('+') ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
                                  {news.priceImpact}
                               </div>
                            </div>

                            {/* Video Play Overlay */}
                            {news.category === 'video' && (
                              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                                <PlayCircle className="w-16 h-16 text-white drop-shadow-lg opacity-90 group-hover:scale-110 transition-transform" />
                              </div>
                            )}
                         </>
                      )}
                    </div>

                    <div className="p-5 flex-grow flex flex-col">
                      {/* Date */}
                      <div className="text-xs text-gray-500 mb-3 flex items-center gap-2">
                        <span>{news.date}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-600"></span>
                        <span className="uppercase tracking-wide text-gray-500">Source: Official</span>
                      </div>

                      {/* Content */}
                      <h3 
                        className="text-lg font-bold text-white mb-2 leading-snug group-hover:text-[#f7a600] transition-colors cursor-pointer"
                        onClick={() => handleNewsClick(news)}
                      >
                        {news.title}
                      </h3>
                      <p className="text-sm text-gray-400 line-clamp-3 mb-6">
                        {news.summary}
                      </p>

                      {/* Footer */}
                      <div className="mt-auto pt-4 border-t border-[#2b3139] flex items-center justify-between">
                        <div className="flex items-center gap-2" style={{ color: coinColor }}>
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: coinColor }}></span>
                          <span className="text-xs font-bold font-mono">{news.relatedCoinId}</span>
                        </div>
                        
                        <button 
                          onClick={() => handleNewsClick(news)}
                          className="text-xs font-semibold text-gray-300 group-hover:text-white flex items-center gap-1 transition-colors hover:underline"
                        >
                          {news.category === 'video' ? 'Play Video' : news.category === 'website' ? 'Visit Site' : 'Read Full Article'}
                          <ExternalLink size={12} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {(buyModalCoin === 'INSb' || buyModalCoin === 'RBTC') && (
        <BuyModal 
          isOpen={true}
          onClose={() => setBuyModalCoin(null)}
          currentPrice={getCoin(buyModalCoin)?.currentPrice || 0}
          symbol={getCoin(buyModalCoin)?.symbol || ''}
        />
      )}

    </div>
  );
}

export default App;
