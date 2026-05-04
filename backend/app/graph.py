from __future__ import annotations

from typing import TypedDict

from langgraph.graph import END, StateGraph

from .cap_table import CapTableInputs, build_scenarios
from .market_data import fetch_quotes, market_beta_from_quotes, quote_timestamp, select_tickers


class FinanceState(TypedDict, total=False):
    """Shared memory that moves through every LangGraph node.

    This is the main object to show during the demo. Each node reads a few keys,
    writes a few keys, and returns the updated state for the next node.
    """

    prompt: str
    assumptions: dict
    tickers: list[str]
    quotes: list[dict]
    dataSource: str
    marketBeta: float
    scenarios: list[dict]
    summary: str
    trace: list[dict]
    quoteTimestamp: str


def _trace(state: FinanceState, node: str, message: str) -> FinanceState:
    """Append a human-readable progress event for the frontend trace panel."""

    state["trace"] = [*state.get("trace", []), {"node": node, "status": "complete", "message": message}]
    return state


def parse_prompt(state: FinanceState) -> FinanceState:
    """Normalize dashboard inputs into the graph's assumptions shape."""

    prompt = state["prompt"].strip()
    assumptions = state.get("assumptions", {})
    state["assumptions"] = {
        "currentSharePrice": float(assumptions.get("currentSharePrice", 12)),
        "existingSharesM": float(assumptions.get("existingSharesM", 42)),
        "founderOwnershipPct": float(assumptions.get("founderOwnershipPct", 38)),
        "optionPoolPct": float(assumptions.get("optionPoolPct", 12)),
        "raiseAmountM": float(assumptions.get("raiseAmountM", 35)),
        "valuationDiscountPct": float(assumptions.get("valuationDiscountPct", 20)),
        "liquidationPrefMultiple": float(assumptions.get("liquidationPrefMultiple", 1)),
    }
    return _trace(state, "parse_prompt", f"Parsed investor question: {prompt[:96]}")


def choose_tickers(state: FinanceState) -> FinanceState:
    """Pick public-market comparables from the investor prompt."""

    state["tickers"] = select_tickers(state["prompt"])
    return _trace(state, "select_tickers", f"Selected comps: {', '.join(state['tickers'])}")


def load_market_data(state: FinanceState) -> FinanceState:
    """Call the market-data tool and preserve the source for auditability."""

    quotes, source = fetch_quotes(state["tickers"])
    state["quotes"] = quotes
    state["dataSource"] = source
    state["quoteTimestamp"] = quote_timestamp()
    return _trace(state, "yahoo_finance", f"Loaded {len(quotes)} Yahoo Finance quotes from {source} data")


def model_scenarios(state: FinanceState) -> FinanceState:
    """Convert quote movement into a scenario beta for the cap table model."""

    state["marketBeta"] = market_beta_from_quotes(state["quotes"])
    return _trace(state, "market_shocks", f"Calibrated stress beta at {state['marketBeta']}x")


def run_cap_table_node(state: FinanceState) -> FinanceState:
    """Bridge LangGraph state into deterministic finance calculations."""

    a = state["assumptions"]
    inputs = CapTableInputs(
        current_share_price=a["currentSharePrice"],
        existing_shares_m=a["existingSharesM"],
        founder_ownership_pct=a["founderOwnershipPct"],
        option_pool_pct=a["optionPoolPct"],
        raise_amount_m=a["raiseAmountM"],
        valuation_discount_pct=a["valuationDiscountPct"],
        liquidation_pref_multiple=a["liquidationPrefMultiple"],
    )
    state["scenarios"] = build_scenarios(inputs, state["marketBeta"])
    return _trace(state, "cap_table", "Computed dilution, ownership, and preference proceeds")


def summarize(state: FinanceState) -> FinanceState:
    """Turn structured scenario outputs into an investor-facing takeaway."""

    downside = state["scenarios"][0]
    base = state["scenarios"][2]
    state["summary"] = (
        f"Base case implies {base['investorOwnershipPct']}% new investor ownership and "
        f"{base['founderPostPct']}% founder ownership after the round. In the downside case, "
        f"the modeled preference floor is ${downside['downsideProceedsM']}M."
    )
    return _trace(state, "investor_summary", "Prepared board-ready recommendation")


def build_graph():
    """Declare the graph topology: nodes first, then directed edges."""

    graph = StateGraph(FinanceState)

    # Nodes are named business steps. These names appear in the streamed trace.
    graph.add_node("parse_prompt", parse_prompt)
    graph.add_node("select_tickers", choose_tickers)
    graph.add_node("yahoo_finance", load_market_data)
    graph.add_node("market_shocks", model_scenarios)
    graph.add_node("cap_table", run_cap_table_node)
    graph.add_node("investor_summary", summarize)

    # Edges are the operating model for this demo. Linear today, branchable later.
    graph.set_entry_point("parse_prompt")
    graph.add_edge("parse_prompt", "select_tickers")
    graph.add_edge("select_tickers", "yahoo_finance")
    graph.add_edge("yahoo_finance", "market_shocks")
    graph.add_edge("market_shocks", "cap_table")
    graph.add_edge("cap_table", "investor_summary")
    graph.add_edge("investor_summary", END)
    return graph.compile()


# Compile once at import time so FastAPI can reuse the graph for every request.
finance_graph = build_graph()
