import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import StatusBadge from "../StatusBadge";

describe("StatusBadge Component Tests", () => {
  it("renders status text accurately", () => {
    render(<StatusBadge status="online" />);
    expect(screen.getByText("online")).toBeInTheDocument();
  });

  it("renders custom label when provided", () => {
    render(<StatusBadge status="active" label="System Active" />);
    expect(screen.getByText("System Active")).toBeInTheDocument();
  });

  it("renders default fallback text when status is undefined", () => {
    render(<StatusBadge status={null} />);
    expect(screen.getByText("Unknown")).toBeInTheDocument();
  });
});
