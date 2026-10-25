import { useState } from 'react';
import './style.css';

const names = ['Moving Average', 'Momentum', 'Mean Reversion', 'Range Breakout', 'Volatility-Targeted Trend'];
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;

function parse(text) {
  const lines = text.trim().split(/\r?\n/);
  const headers = lines[0].split(',').map(x => x.trim().toLowerCase());
  const ci = headers.indexOf('close'), di = headers.indexOf('date');
  if (ci < 0) throw Error('CSV must contain a close column.');
  return lines.slice(1).map(line => {
    const cells = line.split(',');
    return { date: di < 0 ? '' : cells[di]?.trim(), close: Number(cells[ci]) };
  }).filter(x => Number.isFinite(x.close) && x.close > 0);
}

function backtest(rows) {
  const p = rows.map(x => x.close), n = p.length;
  const sig = Object.fromEntries(names.map(x => [x, Array(n).fill(0)]));
  for (let i = 1; i < n; i++) {
    if (i >= 49) sig[names[0]][i] = mean(p.slice(i - 19, i + 1)) > mean(p.slice(i - 49, i + 1)) ? 1 : 0;
    if (i >= 126) sig[names[1]][i] = p[i] > p[i - 126] ? 1 : 0;
    if (i >= 19) {
      const w = p.slice(i - 19, i + 1), m = mean(w);
      const z = (p[i] - m) / (Math.sqrt(mean(w.map(x => (x - m) ** 2))) || 1);
      sig[names[2]][i] = z < -2 || (sig[names[2]][i - 1] && z < 0) ? 1 : 0;
    }
    if (i >= 20) {
      const high = Math.max(...p.slice(i - 20, i)), low = Math.min(...p.slice(i - 10, i));
      sig[names[3]][i] = p[i] > high || (sig[names[3]][i - 1] && p[i] >= low) ? 1 : 0;
    }
    if (i >= 50) {
      const w = p.slice(i - 19, i + 1), r = w.slice(1).map((x, j) => x / w[j] - 1), mr = mean(r);
      const vol = Math.sqrt(mean(r.map(x => (x - mr) ** 2))) * Math.sqrt(252);
      const uptrend = mean(p.slice(i - 19, i + 1)) > mean(p.slice(i - 49, i + 1));
      sig[names[4]][i] = uptrend ? Math.min(1, 0.10 / (vol || 1)) : 0;
    }
  }
  return names.map(name => {
    let equity = 1, peak = 1, drawdown = 0, entries = 0, invested = false;
    for (let i = 0; i < n - 1; i++) {
      const exposure = sig[name][i], now = exposure > 0;
      if (now && !invested) entries++;
      equity *= 1 + exposure * (p[i + 1] / p[i] - 1);
      peak = Math.max(peak, equity); drawdown = Math.max(drawdown, (peak - equity) / peak);
      invested = now;
    }
    return { name, returnPct: (equity - 1) * 100, drawdownPct: drawdown * 100, entries };
  });
}

export default function App() {
  const [rows, setRows] = useState([]), [error, setError] = useState('');
  function upload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try {
      const data = parse(String(reader.result));
      if (data.length < 2) throw Error('CSV needs at least two valid close prices.');
      setRows(data); setError('');
    } catch (err) { setRows([]); setError(err.message); } };
    reader.readAsText(file);
  }
  const results = rows.length > 1 ? backtest(rows) : [];
  return <main className="page">
    <h1>Trading Strategy Backtester</h1>
    <p>Upload daily price history in CSV format with date and close columns.</p>
    <label className="upload">Choose CSV file<input type="file" accept=".csv,text/csv" onChange={upload} hidden /></label>
    {error && <p className="error">{error}</p>}
    {rows.length > 0 && <><p>Loaded {rows.length} prices{rows[0].date && rows[rows.length - 1].date ? ' (' + rows[0].date + ' to ' + rows[rows.length - 1].date + ')' : ''}</p>
      <div className="scroll"><table><thead><tr><th>Strategy</th><th>Total return</th><th>Max drawdown</th><th>Entries</th></tr></thead>
        <tbody>{results.map(x => <tr key={x.name}><td>{x.name}</td><td>{x.returnPct.toFixed(2)}%</td><td>{x.drawdownPct.toFixed(2)}%</td><td>{x.entries}</td></tr>)}</tbody></table></div></>}
    <p className="note">Educational backtest only. Excludes fees, taxes, slippage, and dividends. Past performance does not predict future results.</p>
  </main>;
}
