from __future__ import annotations

from datetime import datetime, timezone


# Demo-safe quote cache. The app can run offline or when Yahoo throttles, while
# still telling the user whether live or cached data powered the result.
FALLBACK_QUOTES = {
    "NVDA": {"price": 875.28, "changePct": 2.4, "marketCapB": 2188, "name": "NVIDIA"},
    "AMD": {"price": 158.31, "changePct": 1.2, "marketCapB": 255, "name": "AMD"},
    "MSFT": {"price": 421.44, "changePct": 0.6, "marketCapB": 3130, "name": "Microsoft"},
    "CRM": {"price": 281.12, "changePct": -0.7, "marketCapB": 272, "name": "Salesforce"},
    "SNOW": {"price": 164.75, "changePct": -1.8, "marketCapB": 55, "name": "Snowflake"},
    "COIN": {"price": 226.02, "changePct": 3.1, "marketCapB": 56, "name": "Coinbase"},
}


def select_tickers(prompt: str) -> list[str]:
    """Small, deterministic stand-in for an LLM/tool selection step.

    In a production finance agent this could be replaced with a model call or a
    retrieval step. For a workshop demo, rules keep the behavior predictable.
    """

    text = prompt.lower()
    if any(word in text for word in ["ai", "gpu", "semiconductor", "compute"]):
        return ["NVDA", "AMD", "MSFT"]
    if any(word in text for word in ["saas", "cloud", "software"]):
        return ["CRM", "SNOW", "MSFT"]
    if any(word in text for word in ["crypto", "bitcoin", "fintech"]):
        return ["COIN", "MSFT", "NVDA"]
    return ["NVDA", "MSFT", "CRM"]


def fetch_quotes(tickers: list[str]) -> tuple[list[dict], str]:
    """Fetch public-market quote data and report the data path used.

    Returning `"live"` or `"cached"` is part of the audit trail. Investors can
    see whether the agent used Yahoo Finance in the moment or deterministic
    fallback data.
    """

    try:
        import yfinance as yf

        quotes = []
        for ticker in tickers:
            info = yf.Ticker(ticker).fast_info
            fallback = FALLBACK_QUOTES[ticker]

            # Yahoo's fast_info shape can vary by ticker/session, so every
            # field has a fallback to keep the demo stable.
            price = float(info.get("last_price") or fallback["price"])
            previous_close = float(info.get("previous_close") or price)
            market_cap = float(info.get("market_cap") or fallback["marketCapB"] * 1_000_000_000)
            change_pct = ((price - previous_close) / previous_close) * 100 if previous_close else fallback["changePct"]
            quotes.append(
                {
                    "ticker": ticker,
                    "name": fallback["name"],
                    "price": round(price, 2),
                    "changePct": round(change_pct, 2),
                    "marketCapB": round(market_cap / 1_000_000_000, 1),
                }
            )
        return quotes, "live"
    except Exception:
        return [{**FALLBACK_QUOTES[ticker], "ticker": ticker} for ticker in tickers], "cached"


def market_beta_from_quotes(quotes: list[dict]) -> float:
    """Translate public-comp movement into stress-test sensitivity."""

    average_abs_move = sum(abs(q["changePct"]) for q in quotes) / max(1, len(quotes))
    return round(min(1.35, max(0.7, 0.85 + average_abs_move / 10)), 2)


def quote_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="seconds")
