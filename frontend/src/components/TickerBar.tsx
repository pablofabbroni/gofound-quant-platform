import { useEffect, useRef } from 'react';
import type { TickerItem } from '../types';

interface Props {
  items: TickerItem[];
}

function formatPrice(symbol: string, price: number | null): string {
  if (price === null) return '—';
  const digits = symbol.includes('JPY') || symbol.includes('XAU') || symbol.includes('XAG') ? 2 : 5;
  return price.toFixed(digits);
}

function formatChange(pct: number | null): { text: string; positive: boolean } | null {
  if (pct === null) return null;
  return { text: `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`, positive: pct >= 0 };
}

export default function TickerBar({ items }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!trackRef.current) return;
    const clone = trackRef.current.cloneNode(true) as HTMLElement;
    clone.setAttribute('aria-hidden', 'true');
    trackRef.current.parentElement?.appendChild(clone);
  }, [items]);

  const renderItem = (item: TickerItem, key: string) => {
    const chg = formatChange(item.change_pct_24h);
    const isActive = item.last_update && (Date.now() - new Date(item.last_update).getTime()) < 600000;

    return (
      <div key={key} className="flex items-center gap-3 px-4 py-1.5 border-r border-white/[0.06] text-xs whitespace-nowrap">
        <span className="font-semibold text-gray-300">{item.symbol}</span>
        <span className="font-mono text-white">{formatPrice(item.symbol, item.current_price)}</span>
        {chg && (
          <span className={`font-mono ${chg.positive ? 'text-green' : 'text-red'}`}>
            {chg.text}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="h-9 bg-surface-card/80 border-b border-white/[0.06] overflow-hidden flex items-center">
      <div
        ref={trackRef}
        className="flex animate-ticker"
      >
        {items.map((item, i) => renderItem(item, `a-${i}`))}
        {items.map((item, i) => renderItem(item, `b-${i}`))}
      </div>
    </div>
  );
}
