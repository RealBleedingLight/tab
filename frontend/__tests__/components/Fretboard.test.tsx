import { render, screen } from "@testing-library/react";
import Fretboard from "@/components/Fretboard";
import type { FretboardPosition } from "@/lib/types";

const positions: FretboardPosition[] = [
  { string: 0, fret: 5, note: "A", isRoot: true },
  { string: 0, fret: 7, note: "B", isRoot: false },
  { string: 1, fret: 5, note: "D", isRoot: false },
];

describe("Fretboard", () => {
  it("renders an SVG element", () => {
    const { container } = render(<Fretboard positions={positions} />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });

  it("renders note labels", () => {
    render(<Fretboard positions={positions} />);
    expect(screen.getAllByText("A").length).toBeGreaterThan(0);
    expect(screen.getAllByText("B").length).toBeGreaterThan(0);
  });

  it("renders root note differently", () => {
    const { container } = render(<Fretboard positions={positions} />);
    const rootCircles = container.querySelectorAll("circle.root-note");
    expect(rootCircles.length).toBeGreaterThan(0);
  });
});
