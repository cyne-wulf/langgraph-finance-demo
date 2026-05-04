from app.cap_table import CapTableInputs, build_scenarios, run_cap_table


def test_cap_table_dilution_balances_raise_against_post_money():
    # A narrow unit test for the core finance math. This protects the demo from
    # accidentally changing the relationship between raise size, post-money
    # valuation, investor ownership, and founder dilution.
    result = run_cap_table(CapTableInputs(raise_amount_m=25, current_share_price=10, existing_shares_m=50), 0)

    assert result["discountedPreM"] == 400
    assert result["postMoneyM"] == 425
    assert result["investorOwnershipPct"] == 5.9
    assert result["founderPostPct"] == 35.8


def test_build_scenarios_applies_market_beta():
    # Scenario shocks are scaled by market beta before each cap table run.
    scenarios = build_scenarios(CapTableInputs(), 1.2)

    assert [s["shockPct"] for s in scenarios] == [-36, -18, 0, 18]
    assert scenarios[0]["sharePrice"] < scenarios[-1]["sharePrice"]
