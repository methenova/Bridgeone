import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { Modal } from "../Modal";

describe("Modal Shared UI Component Tests", () => {
  it("does not render when isOpen is false", () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <div>Modal Content</div>
      </Modal>
    );
    expect(screen.queryByText("Test Modal")).not.toBeInTheDocument();
  });

  it("renders title, description, and children when isOpen is true", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal" description="Modal Description">
        <div>Modal Body Content</div>
      </Modal>
    );
    expect(screen.getByText("Test Modal")).toBeInTheDocument();
    expect(screen.getByText("Modal Description")).toBeInTheDocument();
    expect(screen.getByText("Modal Body Content")).toBeInTheDocument();
  });

  it("triggers onClose when close button is clicked", () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );

    const closeBtn = screen.getByRole("button", { name: /close modal/i });
    fireEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
