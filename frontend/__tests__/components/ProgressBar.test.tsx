import { render, screen } from "@testing-library/react";
import ProgressBar from "@/components/ProgressBar";

describe("ProgressBar", () => {
  it("renders completed/total label", () => {
    render(<ProgressBar completed={5} total={22} />);
    expect(screen.getByText("5 / 22")).toBeInTheDocument();
  });

  it("shows percentage width", () => {
    const { container } = render(<ProgressBar completed={11} total={22} />);
    const bar = container.querySelector("[style]");
    expect(bar?.getAttribute("style")).toContain("50%");
  });

  it("handles zero total gracefully", () => {
    render(<ProgressBar completed={0} total={0} />);
    expect(screen.getByText("0 / 0")).toBeInTheDocument();
  });
});
