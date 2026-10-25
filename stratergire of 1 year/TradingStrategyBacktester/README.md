# Trading Strategy Backtester

A React app that compares five long-only strategies using uploaded daily closing prices: Moving Average, Momentum, Mean Reversion, Range Breakout, and Volatility-Targeted Trend.

## Run locally

Install Node.js, open a terminal in this folder, run `npm install`, then run `npm run dev` and open the local URL shown in the terminal.

## CSV format

The CSV must contain a `close` column. A `date` column is optional.

    date,close
    2025-01-02,100.25
    2025-01-03,101.10

Signals are applied to the following day's price change. Results omit fees, taxes, slippage, and dividends. They are historical simulations, not forecasts.
