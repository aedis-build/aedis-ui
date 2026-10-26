import { AppShell } from "@/registry/aedis/ui/app-shell";
import { Sidebar } from "@/registry/aedis/ui/sidebar";

export default function AppShellDemo() {
  return (
    <div className="h-80 w-full overflow-hidden rounded-xl border border-border">
      <AppShell
        className="h-full min-h-0"
        // The docs page already has a <main>.
        main={false}
        title="Approvals"
        sidebar={
          <Sidebar
            className="w-60"
            header={<span className="px-2 font-semibold">Acme Studio</span>}
            groups={[
              {
                label: "Work",
                items: [
                  { href: "#home", label: "Home" },
                  { href: "#approvals", label: "Approvals", count: 3, countLabel: "3 waiting", active: true },
                ],
              },
            ]}
            footer={<span className="px-2">Jordan · CEO</span>}
          />
        }
      >
        <p className="text-callout text-muted-foreground">Page content.</p>
      </AppShell>
    </div>
  );
}
