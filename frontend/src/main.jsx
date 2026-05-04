import React, { useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import { Activity, BarChart3, CircleDollarSign, Play, RefreshCw, SlidersHorizontal } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import "./styles.css";

const API_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

// The default prompt is intentionally investor-shaped rather than technical.
// It lets the demo start from the kind of question a partner might ask.
const DEFAULT_PROMPT =
  "Stress test a $35M Series B for an AI infrastructure company using public GPU and cloud software comps.";

// These assumptions are the left-side controls in the dashboard.
// The backend normalizes the same keys inside the LangGraph state.
const DEFAULT_ASSUMPTIONS = {
  currentSharePrice: 12,
  existingSharesM: 42,
  founderOwnershipPct: 38,
  optionPoolPct: 12,
  raiseAmountM: 35,
  valuationDiscountPct: 20,
  liquidationPrefMultiple: 1,
};

// The UI has a complete fallback result so the dashboard remains presentable if
// the backend is not running during rehearsal. The backend has its own Yahoo
// Finance fallback as well; this one protects the frontend experience.
const FALLBACK_RESULT = {
  tickers: ["NVDA", "AMD", "MSFT"],
  dataSource: "cached",
  quoteTimestamp: "offline-demo",
  marketBeta: 1.12,
  quotes: [
    { ticker: "NVDA", name: "NVIDIA", price: 875.28, changePct: 2.4, marketCapB: 2188 },
    { ticker: "AMD", name: "AMD", price: 158.31, changePct: 1.2, marketCapB: 255 },
    { ticker: "MSFT", name: "Microsoft", price: 421.44, changePct: 0.6, marketCapB: 3130 },
  ],
  scenarios: [
    { shockPct: -33.6, sharePrice: 7.97, preMoneyM: 334.7, discountedPreM: 267.8, postMoneyM: 302.8, investorOwnershipPct: 11.6, founderPostPct: 33.6, optionPoolPostPct: 10.6, dilutionPct: 11.6, downsideProceedsM: 35 },
    { shockPct: -16.8, sharePrice: 9.98, preMoneyM: 419.3, discountedPreM: 335.5, postMoneyM: 370.5, investorOwnershipPct: 9.4, founderPostPct: 34.4, optionPoolPostPct: 10.9, dilutionPct: 9.4, downsideProceedsM: 35 },
    { shockPct: 0, sharePrice: 12, preMoneyM: 504, discountedPreM: 403.2, postMoneyM: 438.2, investorOwnershipPct: 8, founderPostPct: 35, optionPoolPostPct: 11, dilutionPct: 8, downsideProceedsM: 35 },
    { shockPct: 16.8, sharePrice: 14.02, preMoneyM: 588.7, discountedPreM: 470.9, postMoneyM: 505.9, investorOwnershipPct: 6.9, founderPostPct: 35.4, optionPoolPostPct: 11.2, dilutionPct: 6.9, downsideProceedsM: 35 },
  ],
  summary:
    "Base case implies 8% new investor ownership and 35% founder ownership after the round. In the downside case, the modeled preference floor is $35M.",
  trace: [
    { node: "parse_prompt", status: "complete", message: "Parsed investor question" },
    { node: "select_tickers", status: "complete", message: "Selected comps: NVDA, AMD, MSFT" },
    { node: "yahoo_finance", status: "complete", message: "Loaded 3 Yahoo Finance quotes from cached data" },
    { node: "market_shocks", status: "complete", message: "Calibrated stress beta at 1.12x" },
    { node: "cap_table", status: "complete", message: "Computed dilution, ownership, and preference proceeds" },
    { node: "investor_summary", status: "complete", message: "Prepared board-ready recommendation" },
  ],
};

export function App() {
  // Local UI state mirrors the graph inputs and outputs:
  // prompt + assumptions go in, result + trace come back.
  const [prompt, setPrompt] = useState(DEFAULT_PROMPT);
  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);
  const [result, setResult] = useState(FALLBACK_RESULT);
  const [trace, setTrace] = useState(FALLBACK_RESULT.trace);
  const [isRunning, setIsRunning] = useState(false);

  // The zero-shock case is the base scenario displayed in the metric strip.
  const baseScenario = useMemo(() => result.scenarios?.find((s) => s.shockPct === 0) || result.scenarios?.[2], [result]);

  // Recharts expects chart-friendly arrays. This transforms the base cap table
  // result into ownership bars for founders, option pool, investors, and others.
  const ownershipData = useMemo(
    () => [
      { name: "Founder", pct: baseScenario?.founderPostPct || 0 },
      { name: "Option Pool", pct: baseScenario?.optionPoolPostPct || 0 },
      { name: "New Investor", pct: baseScenario?.investorOwnershipPct || 0 },
      {
        name: "Other Holders",
        pct: Math.max(
          0,
          100 -
            ((baseScenario?.founderPostPct || 0) +
              (baseScenario?.optionPoolPostPct || 0) +
              (baseScenario?.investorOwnershipPct || 0)),
        ),
      },
    ],
    [baseScenario],
  );

  async function runAnalysis(nextAssumptions = assumptions) {
    // The API returns the final LangGraph state. We replay the trace with a
    // small delay so workshop attendees can see each node appear in order.
    setIsRunning(true);
    setTrace([]);
    try {
      const response = await fetch(`${API_URL}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, assumptions: nextAssumptions }),
      });
      const data = await response.json();
      const animatedTrace = [];
      for (const item of data.trace) {
        animatedTrace.push(item);
        setTrace([...animatedTrace]);
        await new Promise((resolve) => setTimeout(resolve, 320));
      }
      setResult(data);
    } catch {
      // Frontend fallback keeps the visual demo alive if the local API is down.
      const animatedTrace = [];
      for (const item of FALLBACK_RESULT.trace) {
        animatedTrace.push(item);
        setTrace([...animatedTrace]);
        await new Promise((resolve) => setTimeout(resolve, 320));
      }
      setResult(FALLBACK_RESULT);
    } finally {
      setIsRunning(false);
    }
  }

  function updateAssumption(key, value) {
    // Assumption edits are plain numbers because the backend performs the
    // finance normalization before the graph starts.
    const next = { ...assumptions, [key]: Number(value) };
    setAssumptions(next);
    return next;
  }

  return (
    <main className="app-shell">
      <section className="topbar">
        <div>
          <p className="eyebrow">LangGraph + Yahoo Finance</p>
          <h1>Cap Table Stress-Test Console</h1>
        </div>
        <button className="primary-button" onClick={() => runAnalysis()} disabled={isRunning}>
          {isRunning ? <RefreshCw className="spin" size={18} /> : <Play size={18} />}
          {isRunning ? "Running" : "Run Analysis"}
        </button>
      </section>

      <section className="workspace">
        <aside className="control-panel">
          <div className="panel-title">
            <SlidersHorizontal size={18} />
            <h2>Investor Prompt</h2>
          </div>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} />
          <div className="assumption-grid">
            <NumberInput label="Raise ($M)" value={assumptions.raiseAmountM} onChange={(v) => updateAssumption("raiseAmountM", v)} />
            <NumberInput label="Share Price" value={assumptions.currentSharePrice} onChange={(v) => updateAssumption("currentSharePrice", v)} />
            <NumberInput label="Shares (M)" value={assumptions.existingSharesM} onChange={(v) => updateAssumption("existingSharesM", v)} />
            <NumberInput label="Discount %" value={assumptions.valuationDiscountPct} onChange={(v) => updateAssumption("valuationDiscountPct", v)} />
            <NumberInput label="Founder %" value={assumptions.founderOwnershipPct} onChange={(v) => updateAssumption("founderOwnershipPct", v)} />
            <NumberInput label="Pool %" value={assumptions.optionPoolPct} onChange={(v) => updateAssumption("optionPoolPct", v)} />
          </div>
          <button className="secondary-button" onClick={() => runAnalysis(updateAssumption("raiseAmountM", assumptions.raiseAmountM + 5))}>
            Rerun with +$5M raise
          </button>
        </aside>

        <section className="analytics">
          <div className="metric-strip">
            <Metric icon={<CircleDollarSign />} label="Base Post-Money" value={`$${baseScenario?.postMoneyM || 0}M`} />
            <Metric icon={<Activity />} label="Market Beta" value={`${result.marketBeta}x`} />
            <Metric icon={<BarChart3 />} label="Investor Ownership" value={`${baseScenario?.investorOwnershipPct || 0}%`} />
          </div>

          <div className="chart-grid">
            <section className="viz-panel wide" data-testid="scenario-chart">
              <h2>Scenario Outcomes</h2>
              <ResponsiveContainer width="100%" height={270}>
                <LineChart data={result.scenarios}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d7dce2" />
                  <XAxis dataKey="shockPct" label={{ value: "Market shock %", position: "insideBottom", offset: -4 }} />
                  {/* Valuation and ownership live on different scales, so they
                      need separate axes. Otherwise the ownership line looks
                      artificially flat next to hundreds of millions of dollars. */}
                  <YAxis
                    yAxisId="valuation"
                    tickFormatter={(value) => `$${value}M`}
                    width={72}
                    domain={["dataMin - 25", "dataMax + 25"]}
                  />
                  <YAxis
                    yAxisId="ownership"
                    orientation="right"
                    tickFormatter={(value) => `${value}%`}
                    width={56}
                    domain={["dataMin - 1", "dataMax + 1"]}
                  />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="valuation"
                    type="monotone"
                    dataKey="postMoneyM"
                    name="Post-money $M"
                    stroke="#146c5f"
                    strokeWidth={3}
                  />
                  <Line
                    yAxisId="ownership"
                    type="monotone"
                    dataKey="investorOwnershipPct"
                    name="Investor ownership %"
                    stroke="#b45309"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </section>

            <section className="viz-panel">
              <h2>Base Ownership</h2>
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={ownershipData} layout="vertical" margin={{ left: 24 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#d7dce2" />
                  <XAxis type="number" domain={[0, 55]} />
                  <YAxis dataKey="name" type="category" width={92} />
                  <Tooltip />
                  <Bar dataKey="pct" name="Ownership %" fill="#3f5f8f" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </section>
          </div>

          <section className="market-row">
            {result.quotes.map((quote) => (
              <article className="quote-card" key={quote.ticker}>
                <span>{quote.name}</span>
                <strong>{quote.ticker}</strong>
                <p>${quote.price}</p>
                <small className={quote.changePct >= 0 ? "up" : "down"}>{quote.changePct}% today</small>
              </article>
            ))}
          </section>

          <section className="summary-panel">
            <h2>Investor Takeaway</h2>
            <p>{result.summary}</p>
            <small>
              Data source: {result.dataSource} Yahoo Finance path. Quote timestamp: {result.quoteTimestamp}.
            </small>
          </section>
        </section>

        <aside className="trace-panel" data-testid="trace-panel">
          <div className="panel-title">
            <Activity size={18} />
            <h2>LangGraph Trace</h2>
          </div>
          <ol>
            {trace.map((item) => (
              <li key={`${item.node}-${item.message}`}>
                <strong>{item.node}</strong>
                <span>{item.message}</span>
              </li>
            ))}
          </ol>
        </aside>
      </section>
    </main>
  );
}

function NumberInput({ label, value, onChange }) {
  return (
    <label>
      <span>{label}</span>
      <input type="number" value={value} onChange={(event) => onChange(event.target.value)} />
    </label>
  );
}

function Metric({ icon, label, value }) {
  return (
    <article className="metric">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

const root = document.getElementById("root");
if (root) {
  createRoot(root).render(<App />);
}
