
export type CoinId = 'USTC' | 'INSb' | 'HOT' | 'KEEP' | 'RBTC' | 'GAFR';

export interface PricePoint {
  time: string;
  value: number;
}

export interface CoinData {
  id: CoinId;
  name: string;
  symbol: string;
  description: string;
  balance: number;
  basePrice: number; // The price set by admin
  currentPrice: number; // The fluctuating price (+/- 2%)
  history: PricePoint[];
  color: string;
}

export interface CoinConfig {
    balance: number;
    basePrice: number;
}

export type NewsCategory = 'article' | 'website' | 'video';

export interface NewsItem {
  id: string;
  category: NewsCategory;
  title: string;
  summary: string;
  content?: string; // Full HTML/Text content for articles
  date: string;
  imageUrl?: string;
  url?: string; // External URL
  videoUrl?: string; // Direct video source (MP4)
  embedUrl?: string; // Iframe source (Google Drive, YouTube)
  relatedCoinId: CoinId;
  priceImpact: string; // e.g. "+15.4%" or "-2.1%"
  internalLink?: 'markets' | 'trade' | 'news' | 'airdrop'; // Internal navigation target
}