import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import SecurityHeadersBuilder from "@/examples/security-headers/builder";
import { violations } from "./a11y";

describe("securityHeaders builder (#201)", () => {
  it("shows the policy for the typed origins and names what it dropped", async () => {
    const user = userEvent.setup();
    const { container } = render(<SecurityHeadersBuilder />);
    const policy = screen.getByRole("list", { name: "Content-Security-Policy" });
    expect(policy).toHaveTextContent("media-src 'self' https://media.rlfn.studio;");
    expect(screen.getByRole("status")).toHaveTextContent("https://*.cdn.example");
    await user.click(screen.getByRole("switch", { name: "upgradeInsecureRequests" }));
    expect(policy).not.toHaveTextContent("upgrade-insecure-requests");
    expect(await violations(container)).toEqual([]);
  });
});
