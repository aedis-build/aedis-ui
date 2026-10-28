import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import AbuseGateSimulator from "@/examples/abuse-gate/simulator";
import BruteForceGuardSimulator from "@/examples/brute-force-guard/simulator";
import FormTokenSimulator from "@/examples/form-token/simulator";
import { violations } from "./a11y";

describe("abuse simulators (#200)", () => {
  it("are labelled and axe-clean, and report into a log", async () => {
    const user = userEvent.setup();
    for (const [Sim, button, log] of [
      [AbuseGateSimulator, "Submit", "Gate results"],
      [BruteForceGuardSimulator, "Sign in", "Sign-in results"],
      [FormTokenSimulator, "Render form", "Submit results"],
    ] as const) {
      const { container, unmount } = render(<Sim />);
      await user.click(screen.getByRole("button", { name: button }));
      expect(await screen.findByRole("listitem")).toBeInTheDocument();
      expect(screen.getByRole("log", { name: log })).toBeInTheDocument();
      expect(await violations(container)).toEqual([]);
      unmount();
    }
  });
});
