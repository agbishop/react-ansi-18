import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import AnsiLog from "./AnsiLog";
import "@testing-library/jest-dom";

window.ResizeObserver =
  window.ResizeObserver ||
  jest.fn().mockImplementation(() => ({
    disconnect: jest.fn(),
    observe: jest.fn(),
    unobserve: jest.fn(),
  }));

describe("AnsiLog", () => {
  test("load with basic log line", async () => {
    render(<AnsiLog log={"my text"} />);
    await waitFor(async () => {
      expect(await screen.findByText("my text")).toBeInTheDocument();
    });
  });
});
