import { useEffect, useRef } from 'react';

interface TradingViewWidgetProps {
  symbol: string;
  theme?: 'light' | 'dark';
}

export default function TradingViewWidget({ symbol, theme = 'light' }: TradingViewWidgetProps) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Create a new div for the widget
    const widgetDiv = document.createElement('div');
    widgetDiv.className = 'tradingview-widget-container';
    
    if (container.current) {
      container.current.innerHTML = '';
      container.current.appendChild(widgetDiv);
    }

    // Create the script element
    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.async = true;
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js';

    // Configure the widget
    script.innerHTML = JSON.stringify({
      "autosize": true,
      "symbol": `BINANCE:${symbol}USDT`,
      "interval": "D",
      "timezone": "Etc/UTC",
      "theme": theme,
      "style": "1",
      "locale": "en",
      "enable_publishing": false,
      "allow_symbol_change": true,
      "support_host": "https://www.tradingview.com",
      "width": "100%",
      "height": "600",
      "save_image": false,
      "calendar": false,
      "hide_volume": false,
      "support_host": "https://www.tradingview.com"
    });

    // Add the script to the widget container
    widgetDiv.appendChild(script);

    return () => {
      if (container.current) {
        container.current.innerHTML = '';
      }
    };
  }, [symbol, theme]);

  return (
    <div 
      ref={container} 
      className="w-full h-[600px] bg-white rounded-lg overflow-hidden"
    />
  );
} 