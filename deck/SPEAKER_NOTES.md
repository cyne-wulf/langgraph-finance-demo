# Speaker Notes: LangGraph Introduction with a Finance Example

These notes are written for a non-technical investor or builder audience seeing LangGraph for the first time. The narrative starts with first principles, then uses the finance app as the running example.

Suggested pacing: 20-25 minutes.

## Slide 1: LangGraph Introduction with a Finance Example

**Main point:** We are learning LangGraph first, then applying it to a finance workflow.

**Speaker notes:**

Today is not just an app demo. It is a LangGraph introduction using finance as the example we can keep returning to.

The finance use case is a cap table stress-test. An investor asks what happens to valuation and ownership if public-market comps move. That sounds like one prompt, but the work is actually a sequence: understand the ask, choose comps, fetch data, run math, summarize, and show the trace.

That is the perfect shape for LangGraph. LangGraph helps us make the steps visible instead of burying the whole process inside one large prompt.

**Transition:** Before we look at the finance dashboard, let’s build the mental model from scratch.

## Slide 2: What Is LangGraph?

**Main point:** LangGraph turns agent behavior into an explicit workflow.

**Speaker notes:**

LangGraph is a framework for building agents as graphs.

In plain English, that means we describe the work as named steps connected by paths. The input enters the graph, each step does part of the job, and the graph eventually produces a result.

The code is less important than the shape. We create a `StateGraph`, add nodes, then connect them with edges.

For the finance example, the input is an investor question and the result is an investor dashboard.

**Transition:** The first building block is a node.

## Slide 3: What Is a Node?

**Main point:** A node is one named unit of work.

**Speaker notes:**

A node is one step in the workflow.

The important pattern is state in, node does work, state out.

In the finance app, `parse_prompt` is a node. It takes the investor prompt and dashboard inputs, normalizes them, and writes clean assumptions into the state.

The node is just a normal function. LangGraph does not require every step to be some special AI object. A node can be ordinary code as long as it follows the state-in, state-out pattern.

**Transition:** Once you know what a node is, the next question is what kind of work belongs inside one.

## Slide 4: What Kinds of Work Can Go Inside a Node?

**Main point:** Nodes can contain ordinary code, model calls, tools, rules, or formatting.

**Speaker notes:**

A node is flexible. It can parse text, call an API, ask a model to reason over context, run deterministic math, check a policy, or write an output.

The finance app uses several kinds of nodes. One chooses public-market comparables. One calls the market data tool. One converts market movement into scenarios. One runs deterministic cap table math. One prepares the summary.

This is useful because we can keep responsibilities separate. The market data node does not also do cap table math. The cap table node does not also decide which tickers to use.

**Transition:** Nodes become a workflow when we connect them.

## Slide 5: What Is an Edge?

**Main point:** An edge says what runs next.

**Speaker notes:**

An edge is the path from one node to another.

If `parse_prompt` finishes, we want `select_tickers` to run next. That relationship is an edge.

For a non-technical audience, think of an edge as the handoff. The first analyst finishes their part and hands the folder to the next analyst.

Edges make the agent’s process explicit. We can see the operating model instead of hoping one prompt remembers the whole job.

**Transition:** Some workflows always run in one line. Others need branches.

## Slide 6: What Is a Conditional Edge?

**Main point:** Conditional routing chooses the next step based on state.

**Speaker notes:**

A conditional edge is a decision point.

Instead of always going from A to B, the graph looks at state and chooses a route.

For example, if data confidence is high, use the live market data path. If confidence is low, use cached data. Or if a valuation move is large, route to human review before the summary.

The current finance app is mostly linear, which is fine for a small demo. This slide shows the concept you would use when the process needs business rules.

**Transition:** With nodes, edges, and conditional routing, we can describe a whole graph.

## Slide 7: How Nodes Compose Into a Graph

**Main point:** A graph is the workflow made from nodes and paths.

**Speaker notes:**

This is the finance workflow in miniature.

The prompt comes in. The graph selects comps. It loads quotes. It runs cap table math. It writes the summary.

The code shows the LangGraph pieces: set the entry point, add edges, connect to `END`, then compile the graph.

`compile()` matters because it turns the graph definition into something the app can run.

**Transition:** Graphs can have different shapes depending on the process.

## Slide 8: Example Graph Configurations

**Main point:** The graph shape should match the operating process.

**Speaker notes:**

Not every LangGraph app has the same shape.

A simple assistant might be linear: A to B to C.

A research agent might branch: if the first source is weak, search again.

A data workflow might have tool fallback: try live data, then cached data if needed.

A finance or compliance workflow might add human review: if the risk score is high, pause for approval.

This is why LangGraph is useful for serious workflows. It gives builders a direct way to encode process, policy, and review.

**Transition:** All of these shapes need one shared memory object.

## Slide 9: What Is Graph State?

**Main point:** State is the shared working memory passed through the graph.

**Speaker notes:**

State is the graph’s working memory.

At the start, state might only contain the investor prompt and user assumptions.

As the graph runs, each node adds fields: selected tickers, market quotes, scenarios, summary, and trace.

For finance, this matters because the final answer should not be disconnected from the evidence path. We want to preserve what the user asked, what comps were selected, which data source was used, what math ran, and what summary was produced.

**Transition:** Now let’s watch that state change over time.

## Slide 10: How State Changes as It Passes Through Nodes

**Main point:** Each node receives current state, adds work, and passes updated state forward.

**Speaker notes:**

This is the same state at three moments.

At the start, only the prompt is filled.

In the middle, the graph has selected tickers and loaded quotes.

At the end, the summary is filled too.

The key idea is that every node is adding to the same working memory. The graph is not a collection of disconnected prompts. It is one process carrying context forward.

**Transition:** Now that the LangGraph basics are clear, let’s apply them to the finance example.

## Slide 11: Investors Do Not Just Need a Chatbot

**Main point:** Finance agents need process, not just conversation.

**Speaker notes:**

Most people’s first mental model for AI is a chatbot. You type something and it replies.

That is useful, but finance workflows need more structure. Investors care about data source, assumptions, calculations, and repeatability.

This demo turns a fuzzy investor question into a structured workflow. LangGraph is the system that makes the workflow explicit.

**Transition:** Before we go deeper into the app, let’s make sure the finance vocabulary is clear.

## Slide 12: The Terms This Demo Is Calculating

**Main point:** Define the finance terms needed to understand the dashboard.

**Speaker notes:**

The most important term is post-money valuation: what the company is worth immediately after the new investment.

Pre-money valuation is the value before the round. Dilution means existing owners own a smaller percentage because new shares are issued. A cap table is the ownership map. The option pool reserves shares for employees. Liquidation preference protects investors in downside outcomes.

The point is not to turn everyone into a cap table expert. The point is to see how a graph can connect market movement to ownership and valuation consequences.

**Transition:** Now we can look at the finance workflow as LangGraph nodes.

## Slide 13: A Finance Agent Is a Workflow, Not One Prompt

**Main point:** The finance app is a sequence of named LangGraph steps.

**Speaker notes:**

Here is the finance example mapped to nodes.

The investor prompt enters on the left. The decision dashboard comes out on the right.

In between, the graph parses the ask, selects comps, loads quotes, builds scenarios, runs the cap table, and summarizes the result.

Because these are named steps, we can inspect them, test them, change them, and stream their progress to the UI.

**Transition:** The next two slides zoom into the state object used by this workflow.

## Slide 14: The Graph State Is the Agent's Working Memory

**Main point:** `FinanceState` defines what the workflow needs to remember.

**Speaker notes:**

This is the finance app’s state schema.

The graph needs the prompt, assumptions, tickers, quotes, data source, market beta, scenarios, summary, trace, and quote timestamp.

You do not need to read every line. The important idea is that we name the information the workflow must preserve.

For finance, this is the audit trail. If someone asks why the dashboard reached a conclusion, we can look back through state and trace.

**If showing code:** Open `backend/app/graph.py` and point to `FinanceState`.

**Transition:** The declaration becomes useful when nodes start filling it.

## Slide 15: The Declaration Becomes a Populated Deal File

**Main point:** State starts sparse and becomes populated as nodes complete.

**Speaker notes:**

Before the graph runs, state mostly has the prompt and assumptions.

After the graph runs, the selected tickers, quote data, market beta, scenarios, summary, and trace are filled in.

Think of this as a deal file moving across a team. Each person adds their work to the file, and the final answer contains the path used to produce it.

**Transition:** Now let’s look at the node functions that do that filling.

## Slide 16: Each Node Reads State, Writes State, Returns State

**Main point:** Nodes should be small, testable business steps.

**Speaker notes:**

This slide shows two finance nodes.

`choose_tickers` reads the prompt and writes selected tickers.

`load_market_data` reads those tickers, fetches quotes, records the data source, and returns state.

The pattern is simple: read state, do one finance job, write state.

**If showing code:** Point to `choose_tickers` and `load_market_data` in `backend/app/graph.py`.

**Transition:** Once the nodes exist, LangGraph wires them together.

## Slide 17: LangGraph Wires the Finance Workflow

**Main point:** `StateGraph`, `add_node`, `set_entry_point`, `add_edge`, `END`, and `compile` define the runnable workflow.

**Speaker notes:**

This is the most LangGraph-specific part of the app.

First, we create `StateGraph(FinanceState)`.

Then we register each node with `add_node`.

Then we set the start with `set_entry_point`.

Then we connect the nodes with `add_edge`, ending at `END`.

Finally, `compile()` turns the definition into the graph object the API can run.

This app is linear today, but the same structure can support conditional edges later.

**If showing code:** Point to `build_graph()` in `backend/app/graph.py`.

**Transition:** Now let’s look at the first external tool boundary.

## Slide 18: Live Yahoo Finance, Deterministic Fallback

**Main point:** Tools should be isolated, and fallback behavior should be explicit.

**Speaker notes:**

Finance agents often depend on external data. In this demo, the market data function uses Yahoo Finance through `yfinance`.

It also includes cached fallback data.

That is useful for demos, but it is also a real design pattern. The graph records whether the data came from the live path or fallback path, so users know what produced the analysis.

**If showing code:** Open `backend/app/market_data.py` and point to `fetch_quotes`.

**Transition:** After market data, the graph runs deterministic finance math.

## Slide 19: The LLM Should Not Improvise Cap Table Math

**Main point:** Agents orchestrate; deterministic functions calculate.

**Speaker notes:**

The language model should not invent cap table math.

LangGraph coordinates the workflow. Ordinary Python calculates the numbers.

The math pipeline is market shock, share price, pre-money valuation, raise amount, post-money valuation, and investor ownership.

That boundary matters. Use AI for interpretation and explanation. Use deterministic code for calculations you need to test.

**If showing code:** Open `backend/app/cap_table.py` and point to `run_cap_table`.

**Transition:** Once the graph runs, the UI can show the execution trace.

## Slide 20: Show Investors How the Agent Got There

**Main point:** Streaming trace turns the agent into an auditable process.

**Speaker notes:**

The trace is the visible audit trail.

Each node appends a progress event when it finishes. The frontend streams those events so the audience can see the graph execute.

For non-technical users, it looks like a checklist. For technical users, it is streamed graph execution.

**If showing code:** Open `backend/app/main.py` and point to `/analyze/stream`.

**Transition:** Now let’s look at the investor-facing result.

## Slide 21: The Dashboard Maps Graph State to Decisions

**Main point:** The dashboard renders structured graph state.

**Speaker notes:**

The dashboard is a projection of graph state.

The cards, charts, market comps, and summary all come from structured fields produced by the graph.

That is why the app can rerun when assumptions change. The graph updates the state, and the UI renders the new result.

**Transition:** The next slide shows the trace while the graph is running.

## Slide 22: The Audience Sees the Graph Execute

**Main point:** The trace makes agent behavior visible.

**Speaker notes:**

This is useful for skeptical audiences.

The graph does not jump straight from prompt to answer. It selects comps, loads data, models shocks, runs cap table calculations, and summarizes the result.

In a real fund, the trace could include timestamps, data-source IDs, retrieved documents, confidence scores, and human approvals.

**Transition:** Now we’ll watch the full path in motion.

## Slide 23: Prompt, Run, Result, Rerun

**Main point:** The workflow is repeatable and assumption-driven.

**Speaker notes:**

The video shows the full path.

The investor prompt is already in the dashboard. The analysis runs. Trace events appear. Market data loads. Scenario charts and cap table outputs render. Then an assumption changes and the graph reruns.

That rerun is important. Finance work is usually a chain of “what if?” questions. LangGraph gives those reruns structure.

**Transition:** Let’s talk about how this extends beyond the demo.

## Slide 24: Where Builders Take It Next

**Main point:** The same architecture extends to real fund workflows.

**Speaker notes:**

This demo is small, but the pattern scales.

You can add branching for confidence or valuation thresholds. You can swap tools for CapIQ, PitchBook, internal KPIs, or portfolio reporting. You can persist memory by deal or investment committee. You can generate memo sections, IC slides, model exports, and diligence checklists.

The important part is that LangGraph gives you a framework for wiring these pieces together as an inspectable process.

**Transition:** Let’s close with the design pattern to remember.

## Slide 25: LangGraph Is the Control Plane for Finance Agents

**Main point:** LangGraph provides structure, state, control, and visibility.

**Speaker notes:**

If you remember one thing, remember this:

LangGraph is the control plane for agents that need to follow a process.

Use graph state for facts the workflow must preserve. Use nodes for testable business steps. Use tools for external data. Use deterministic functions for financial calculations. Use streaming traces so users can trust the path, not just the answer.

This demo is educational, not investment advice. The architecture pattern is the takeaway.

## Optional Live Code Walkthrough

Use this if you have 4-6 extra minutes.

1. Open `backend/app/graph.py`.
   - Use the dedicated `graph.py` walkthrough below.

2. Open `backend/app/market_data.py`.
   - Show `select_tickers`.
   - Show `fetch_quotes`.
   - Emphasize `"live"` versus `"cached"`.

3. Open `backend/app/cap_table.py`.
   - Show `CapTableInputs`.
   - Show `run_cap_table`.
   - Emphasize deterministic math.

4. Open `frontend/src/main.jsx`.
   - Show `runAnalysis`.
   - Show trace animation.
   - Show the dual-axis chart.

5. Open `backend/tests/test_graph.py`.
   - Show that the graph path is tested.

## Dedicated `graph.py` Walkthrough

Use this section when you open `backend/app/graph.py`. This is the best file for teaching the LangGraph-specific pieces in the app: `StateGraph`, `FinanceState`, `add_node`, `add_edge`, `set_entry_point`, `END`, `compile`, and runtime execution with `invoke` or `stream`.

### Opening Frame

**Say:**

This file shows the whole LangGraph mental model.

Look for three shapes:

1. A shared state object.
2. A set of node functions.
3. A graph wiring section that connects those nodes.

### Part 1: LangGraph Imports

**Point at:** `from langgraph.graph import END, StateGraph`

**Say:**

`StateGraph` creates a workflow where every node receives and returns shared state.

`END` is LangGraph’s marker for “the workflow is complete.”

These are the first LangGraph-specific pieces in the file.

### Part 2: `FinanceState`

**Point at:** `class FinanceState(TypedDict, total=False):`

**Say:**

This is the graph’s working memory.

It starts with prompt and assumptions. Nodes add tickers, quotes, data source, market beta, scenarios, summary, trace, and quote timestamp.

`FinanceState` is a normal Python type, but LangGraph uses it when we create `StateGraph(FinanceState)`.

### Part 3: `_trace`

**Point at:** `def _trace(...)`

**Say:**

This helper is not LangGraph itself. It supports visibility.

Every node calls `_trace` when it finishes. The frontend uses those events to show the graph running step by step.

### Part 4: Node Functions

**Point at:** `parse_prompt`, `choose_tickers`, `load_market_data`, `model_scenarios`, `run_cap_table_node`, `summarize`

**Say:**

These functions are the nodes.

Each one takes state, does one business step, writes new fields, and returns state.

LangGraph lets nodes be ordinary Python functions. That is why the business logic remains testable and easy to explain.

### Part 5: `build_graph()`

**Point at:** `def build_graph():`

**Say:**

This is where ordinary functions become a LangGraph workflow.

`graph = StateGraph(FinanceState)` creates the graph.

`graph.add_node(...)` registers named steps.

`graph.set_entry_point("parse_prompt")` chooses the first step.

`graph.add_edge(...)` defines what runs next.

`graph.add_edge("investor_summary", END)` marks completion.

`graph.compile()` returns the runnable graph.

The current app mainly uses linear edges. If we wanted conditional routing, this is where we would add `add_conditional_edges(...)`.

### Part 6: `finance_graph = build_graph()`

**Point at:** `finance_graph = build_graph()`

**Say:**

This compiles the graph once when the app starts.

FastAPI imports this object and runs it when the dashboard requests analysis.

The graph can run with `invoke`, which returns the final result, or `stream`, which yields updates as nodes complete.

**If connecting to `main.py`:**

Open `backend/app/main.py` and point to:

- `/analyze`: uses `finance_graph.invoke(...)`
- `/analyze/stream`: uses `finance_graph.stream(...)`

### Closing Summary

**Say:**

At a high level, `graph.py` does four things:

1. It defines shared state.
2. It defines each business step as a node.
3. It wires those nodes into a LangGraph workflow.
4. It compiles the workflow so the API can run it.

The LangGraph-specific pieces are `StateGraph`, `add_node`, `set_entry_point`, `add_edge`, conceptual `add_conditional_edges`, `END`, `compile`, and runtime `invoke` or `stream`.

## One-Sentence Explanation of LangGraph

LangGraph is a way to build AI agents as explicit workflows: named steps connected by edges, passing shared state, with tools, branches, memory, and traceability.

## Plain-English Analogy

If a chatbot is like asking one analyst for a written answer, LangGraph is like giving a deal team an operating checklist: one person selects comps, one pulls data, one runs the model, one writes the summary, and every handoff is recorded.

## Q&A Prep

**Is LangGraph the AI model?**

No. LangGraph is the workflow framework. It can use AI models inside nodes, but it also coordinates normal code, APIs, tools, and deterministic calculations.

**Why not put the whole task in one prompt?**

Because finance workflows need control, auditability, testability, and repeatability. One prompt hides too much.

**Can this use private data?**

Yes. The Yahoo Finance tool in the demo can be swapped for internal databases, portfolio reporting, CRM data, documents, or approved vendor APIs.

**Where would human review fit?**

As another node or branch in the graph. For example, if confidence is low or a valuation crosses a threshold, route to a human approval step.

**What should be deterministic?**

Calculations, compliance-sensitive rules, recordkeeping, and anything you need to test exactly.

**What should AI do?**

Interpret prompts, choose the next step, retrieve context, summarize results, draft memos, and explain structured outputs in human language.

**Live handoff**

On the final slide, click **Launch live demo** to open the dashboard at `http://127.0.0.1:5173`.

If you want to launch it from Terminal, copy and run:

```bash
open http://127.0.0.1:5173
```
