from app.graph import finance_graph


def test_graph_returns_investor_result_with_fallback_safe_data():
    # Integration smoke test for the full LangGraph path. The assertions mirror
    # the demo story: select comps, load quotes, build scenarios, summarize, and
    # expose an ordered trace for the UI.
    result = finance_graph.invoke(
        {
            "prompt": "Stress test an AI infrastructure investment against public comps",
            "assumptions": {"raiseAmountM": 40},
            "trace": [],
        }
    )

    assert result["tickers"] == ["NVDA", "AMD", "MSFT"]
    assert len(result["quotes"]) == 3
    assert len(result["scenarios"]) == 4
    assert "Base case implies" in result["summary"]
    assert [step["node"] for step in result["trace"]] == [
        "parse_prompt",
        "select_tickers",
        "yahoo_finance",
        "market_shocks",
        "cap_table",
        "investor_summary",
    ]
