import { render, screen } from "@testing-library/react";
import SaveIndicator from "@/components/SaveIndicator";

describe("SaveIndicator", () => {
  it("shows saving state", () => {
    render(<SaveIndicator state="saving" savedAt={null} />);
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });

  it("shows saved with timestamp", () => {
    const savedAt = new Date(Date.now() - 2 * 60 * 1000); // 2 min ago
    render(<SaveIndicator state="saved" savedAt={savedAt} />);
    expect(screen.getByText(/2 min ago/i)).toBeInTheDocument();
  });

  it("shows offline state", () => {
    render(<SaveIndicator state="offline" savedAt={null} />);
    expect(screen.getByText(/offline/i)).toBeInTheDocument();
  });
});
