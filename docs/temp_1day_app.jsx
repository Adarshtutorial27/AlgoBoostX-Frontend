import { useMemo, useState } from 'react';
import './style.css';

const strategies = [
  'EMA Trend', 'RSI Oversold', 'Bollinger Dip',
  '20-Period Breakout', 'MACD Trend', 'One-Day Reversal',
];
const average = values => values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 3) throw Error('CSV needs a header and at least two data rows.');
  const headers = lines[0].split(',').map(x => x.trim().toLowerCase());
  const ix = key => headers.indexOf(key);
  if (ix('date') < 0 || ix('close') < 0) throw Error('CSV must contain date and close columns.');
  return lines.slice(1).map(line => {
    const c = line.split(',');
    return { date: c[ix('date')]?.trim(), open: Number(c[ix('open')]), high: Number(c[ix('high')]), low: Number(c[ix('low')]), close: Number(c[ix('close')]), volume: Number(c[ix('volume')]) };
  }).filter(r => r.date && Number.isFinite(r.close) && r.close > 0)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function makeSignals(rows) {
  const p = rows.map(r => r.close), n = p.length;
  const out = Object.fromEntries(strategies.map(s => [s, Array(n).fill(0)]));
  const ema = (period, end) => {
    const start = Math.max(0, end - period * 4);
    let value = p[start], alpha = 2 / (period + 1);
    for (let i = start + 1; i <= end; i++) value = p[i] * alpha + value * (1 - alpha);
    return value;
  };
  const rsi = end => {
    if (end < 14) return 50;
    const changes = p.slice(end - 14, end + 1).slice(1).map((x, j) => x - p[end - 14 + j]);
    const gain = average(changes.map(x => Math.max(0, x)));
    const loss = average(changes.map(x => Math.max(0, -x)));
    return loss === 0 ? 100 : 100 - 100 / (1 + gain / loss);
  };
  for (let i = 1; i < n; i++) {
    // Each signal is calculated at close i and applied only to the next session.
    if (i >= 25 && ema(9, i) > ema(21, i)) out[strategies[0]][i] = 1;
    if (i >= 14 && rsi(i) < 30) out[strategies[1]][i] = 1;
    if (i >= 19) {
      const w = p.slice(i - 19, i + 1), mid = average(w);
      const sd = Math.sqrt(average(w.map(x => (x - mid) ** 2)));
      if (p[i] < mid - 2 * sd) out[strategies[2]][i] = 1;
    }
    if (i >= 20 && p[i] > Math.max(...p.slice(i - 20, i))) out[strategies[3]][i] = 1;
    if (i >= 34) {
      const macd = ema(12, i) - ema(26, i);
      const recent = Array.from({ length: 9 }, (_, j) => {
        const k = i - 8 + j;
        return ema(12, k) - ema(26, k);
      });
      if (macd > average(recent)) out[strategies[4]][i] = 1;
    }
    if (i >= 1 && p[i] / p[i - 1] - 1 <= -0.015) out[strategies[5]][i] = 1;
  }
  return out;
}

function summarize(rows, signals) {
  const p = rows.map(r => r.close);
  return strategies.map(name => {
    let equity = 1, peak = 1, maxDrawdown = 0, trades = 0;
    for (let i = 0; i < p.length - 1; i++) {
      const signal = signals[name][i];
      if (signal) trades++;
      equity *= 1 + signal * (p[i + 1] / p[i] - 1);
      peak = Math.max(peak, equity);
      maxDrawdown = Math.max(maxDrawdown, (peak - equity) / peak);
    }
    return { name, returnPct: (equity - 1) * 100, maxDrawdown: maxDrawdown * 100, trades };
  });
}

export default function App() {
  const [rows, setRows] = useState([]), [error, setError] = useState('');
  const signals = useMemo(() => makeSignals(rows), [rows]);
  const results = useMemo(() => rows.length > 1 ? summarize(rows, signals) : [], [rows, signals]);
  function upload(event) {
    const file = event.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try {
      const data = parseCSV(String(reader.result));
      if (data.length < 2) throw Error('Could not find enough valid price rows.');
      setRows(data); setError('');
    } catch (e) { setRows([]); setError(e.message || 'Could not read the CSV.'); } };
    reader.readAsText(file);
  }
  const has24 = rows.some(r => r.date.startsWith('2026-10-24'));
  const has25 = rows.some(r => r.date.startsWith('2026-10-25'));
  return <main className="page">
    <h1>Crypto One-Day Strategy Backtester</h1>
    <p>Upload about one year of daily OHLCV data for BTC, ETH, or another crypto pair. Every signal uses a completed daily candle and holds for the following candle only.</p>
    <label className="upload">Choose CSV file<input type="file" accept=".csv,text/csv" onChange={upload} hidden /></label>
    {error && <p className="error">{error}</p>}
    <section className="date-note"><strong>Crypto trades 24/7, including October 24–25, 2026.</strong> Candle date boundaries can differ by exchange and timezone. The date check below uses the date labels in your uploaded CSV.</section>
    {rows.length > 0 && <>
      <p>Loaded {rows.length} rows: {rows[0].date} to {rows[rows.length - 1].date}.</p>
      <p>Bars for Oct 24: {has24 ? 'found' : 'not found'} · Oct 25: {has25 ? 'found' : 'not found'}</p>
      <div className="scroll"><table><thead><tr><th>Strategy</th><th>Return</th><th>Max drawdown</th><th>One-session entries</th></tr></thead>
        <tbody>{results.map(r => <tr key={r.name}><td>{r.name}</td><td>{r.returnPct.toFixed(2)}%</td><td>{r.maxDrawdown.toFixed(2)}%</td><td>{r.trades}</td></tr>)}</tbody></table></div>
    </>}
    <h2>Strategies</h2>
    <ol><li>EMA Trend: 9-period EMA above 21-period EMA.</li><li>RSI Oversold: 14-period RSI below 30.</li><li>Bollinger Dip: close below the 20-period lower band (2 standard deviations).</li><li>20-Period Breakout: close above the previous 20-bar high.</li><li>MACD Trend: MACD line above its 9-period signal average.</li><li>One-Day Reversal: previous daily return at or below −1.5%.</li></ol>
    <p className="note">Educational backtest, not a forecast or investment recommendation. Results exclude transaction costs, slippage, taxes, and dividends. One year of history is a limited sample.</p>
  </main>;
}
