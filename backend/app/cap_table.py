from __future__ import annotations

from dataclasses import dataclass


@dataclass(frozen=True)
class CapTableInputs:
    """Finance assumptions controlled by the dashboard.

    Amounts with an `_m` suffix are in millions. Keeping these inputs in a
    dataclass makes the cap table math independent from LangGraph, FastAPI, and
    the React UI, which is important for testability in finance workflows.
    """

    current_share_price: float = 12.0
    existing_shares_m: float = 42.0
    founder_ownership_pct: float = 38.0
    option_pool_pct: float = 12.0
    raise_amount_m: float = 35.0
    valuation_discount_pct: float = 20.0
    liquidation_pref_multiple: float = 1.0


def run_cap_table(inputs: CapTableInputs, market_shock_pct: float) -> dict:
    """Run one deterministic financing scenario.

    LangGraph decides when this function runs. This function owns the financial
    math. That separation is the key demo point: agents orchestrate, but
    deterministic code calculates values that investors will rely on.
    """

    # Market shocks reprice the company's implied public-comps valuation.
    shocked_price = max(0.01, inputs.current_share_price * (1 + market_shock_pct / 100))
    pre_money_m = shocked_price * inputs.existing_shares_m

    # The demo models a valuation discount to reflect private-market pricing.
    discounted_pre_m = pre_money_m * (1 - inputs.valuation_discount_pct / 100)

    # Post-money is the company value after the new investment lands.
    post_money_m = discounted_pre_m + inputs.raise_amount_m
    new_investor_ownership_pct = (inputs.raise_amount_m / post_money_m) * 100

    # New investor ownership is the dilution experienced by existing holders.
    dilution_pct = new_investor_ownership_pct
    founder_post_pct = inputs.founder_ownership_pct * (1 - dilution_pct / 100)
    option_pool_post_pct = inputs.option_pool_pct * (1 - dilution_pct / 100)
    new_shares_m = inputs.raise_amount_m / max(0.01, discounted_pre_m / inputs.existing_shares_m)

    # A simple liquidation preference floor shows downside protection.
    downside_proceeds_m = max(
        inputs.raise_amount_m * inputs.liquidation_pref_multiple,
        post_money_m * (new_investor_ownership_pct / 100),
    )

    return {
        "shockPct": round(market_shock_pct, 2),
        "sharePrice": round(shocked_price, 2),
        "preMoneyM": round(pre_money_m, 1),
        "discountedPreM": round(discounted_pre_m, 1),
        "postMoneyM": round(post_money_m, 1),
        "newSharesM": round(new_shares_m, 2),
        "investorOwnershipPct": round(new_investor_ownership_pct, 1),
        "founderPostPct": round(founder_post_pct, 1),
        "optionPoolPostPct": round(option_pool_post_pct, 1),
        "dilutionPct": round(dilution_pct, 1),
        "downsideProceedsM": round(downside_proceeds_m, 1),
    }


def build_scenarios(inputs: CapTableInputs, market_beta: float) -> list[dict]:
    """Build the four cases shown in the dashboard chart."""

    base_shocks = [-30, -15, 0, 15]
    return [run_cap_table(inputs, shock * market_beta) for shock in base_shocks]
