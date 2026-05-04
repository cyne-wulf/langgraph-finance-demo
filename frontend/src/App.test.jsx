import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";
import { App } from "./main.jsx";

test("renders the dashboard and trace panel", () => {
  render(<App />);
  expect(screen.getByText("Cap Table Stress-Test Console")).toBeInTheDocument();
  expect(screen.getByTestId("scenario-chart")).toBeInTheDocument();
  expect(screen.getByTestId("trace-panel")).toBeInTheDocument();
});
