import React from 'react';

const CryptoMarket = () => (
  <div>
    <style>{`
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        padding: 20px;
        background-color: #f9f9f9;
        color: #333;
      }
      h1 {
        font-size: 2.5em;
        color: #4a90e2;
        margin-bottom: 10px;
      }
      h2 {
        font-size: 2em;
        color: #333;
        margin: 20px 0 10px;
      }
      h3 {
        font-size: 1.5em;
        color: #555;
        margin: 15px 0 8px;
      }
      p {
        margin: 10px 0;
      }
      ul {
        margin: 10px 0 20px 20px;
      }
      .highlight {
        background-color: #e7f3fe;
        padding: 5px;
        border-radius: 5px;
      }
      blockquote {
        border-left: 4px solid #4a90e2;
        padding-left: 20px;
        margin: 10px 0;
        color: #555;
      }
      .divider {
        height: 2px;
        background-color: #4a90e2;
        margin: 20px 0;
      }
      .citation {
        font-size: 0.9em;
        color: #777;
        margin: 15px 0;
      }
      .emoji {
        margin-right: 5px;
      }
    `}</style>

    <h1>📈 February 2025 Crypto Market Analysis</h1>

    <section>
      <h2>🌐 Overview</h2>
      <p>
        The cryptocurrency market in February 2025 has been marked by significant volatility, with both Bitcoin (BTC) and Ethereum (ETH) experiencing fluctuations. Key factors influencing the market include:
      </p>
      <ul>
        <li>Institutional adoption</li>
        <li>Regulatory developments</li>
        <li>Macroeconomic conditions</li>
      </ul>
    </section>

    <div className="divider"></div>

    <section>
      <h2>🐋 Bitcoin (BTC) Analysis</h2>
      <ul>
        <li>
          <strong>Price Movements</strong>: Bitcoin started February trading around <span className="highlight">$98,600</span>, reaching highs of <span className="highlight">$100,100</span> before facing selling pressure that pushed the price down to approximately <span className="highlight">$96,070</span> by February 7.
        </li>
        <li>
          <strong>Institutional Activity</strong>: Bitcoin ETFs have seen substantial inflows, indicating increased institutional interest. Analysts predict potential highs of <span className="highlight">$250,000</span> by the end of 2025.
        </li>
        <li>
          <strong>Technical Analysis</strong>: The 50-day moving average acts as resistance, while the 200-day moving average provides support. Short-term bearish momentum is indicated by prices below the 9-day and 20-day moving averages.
        </li>
      </ul>
    </section>

    <div className="divider"></div>

    <section>
      <h2>🔗 Ethereum (ETH) Analysis</h2>
      <ul>
        <li>
          <strong>Price Volatility</strong>: Ethereum experienced sharp price fluctuations, initially opening lower but briefly recovering to <span className="highlight">$2,797</span> before declining due to selling pressure.
        </li>
        <li>
          <strong>Technical Analysis</strong>: The 50-day moving average is acting as resistance, with the 200-day moving average providing support. The price is below key moving averages, suggesting short-term bearish momentum.
        </li>
        <li>
          <strong>Support and Resistance</strong>: Key support levels are around <span className="highlight">$2,500</span>, with resistance near <span className="highlight">$2,800</span>.
        </li>
      </ul>
    </section>

    <div className="divider"></div>

    <section>
      <h2>🚀 Altcoin Season 2025</h2>
      <ul>
        <li>
          <strong>Indicators</strong>: An altcoin season is often signaled by declining Bitcoin dominance, Ethereum outperforming Bitcoin, and surging trading volumes in altcoins.
        </li>
        <li>
          <strong>Macroeconomic Factors</strong>: Lower inflation and regulatory clarity could boost altcoin growth, while institutional involvement could provide stability.
        </li>
        <li>
          <strong>Bitcoin’s Influence</strong>: Bitcoin’s price movements significantly impact altcoins.
        </li>
      </ul>
    </section>

    <div className="divider"></div>

    <section>
      <h2>📰 Recent Developments</h2>
      <ul>
        <li>
          <strong>Regulatory Updates</strong>: Grayscale has filed for an XRP ETF, and Coinbase has secured approval to expand services in Argentina.
        </li>
        <li>
          <strong>Market Volatility</strong>: Early February saw heightened volatility due to concerns over U.S. tariff policies affecting risk assets globally.
        </li>
        <li>
          <strong>Memecoins</strong>: Some memecoins like SPX6900, FARTCOIN, and AI16Z experienced significant price drops in early February.
        </li>
      </ul>
    </section>

    <div className="divider"></div>

    <section>
      <h2>🔍 Conclusion</h2>
      <p>
        The cryptocurrency market in February 2025 is characterized by volatility and potential for growth driven by institutional adoption and regulatory developments. While short-term trends may be bearish, the long-term outlook remains positive, especially if Bitcoin stabilizes and altcoin seasons are triggered.
      </p>
    </section>

    <div className="divider"></div>

    <section>
      <h2>📚 References</h2>
      <p className="citation">
        <a href="https://www.riotimesonline.com/market-moves-analyzing-bitcoin-and-ethereums-price-trends-in-february-2025/">
          Riot Times
        </a>
      </p>
      <p className="citation">
        <a href="https://mudrex.com/learn/altcoin-season-2025-crypto-market-outlook/">
          Mudrex
        </a>
      </p>
      <p className="citation">
        <a href="https://zerocap.com/insights/weekly-crypto-market-wrap/weekly-crypto-market-wrap-3rd-february-2025/">
          ZeroCap
        </a>
      </p>
      <p className="citation">
        <a href="https://www.binance.com/en/research/analysis/monthly-market-insights-2025-02">
          Binance Research
        </a>
      </p>
      <p className="citation">
        <a href="https://www.ccn.com/analysis/crypto/memecoins-crashed-first-week-february/">
          CCN
        </a>
      </p>
    </section>
  </div>
);

export default CryptoMarket;
