import { Sidebar } from "@/registry/aedis/ui/sidebar";

export default function SidebarNested() {
  return (
    <Sidebar
      className="w-64 rounded-xl"
      header={
        <div className="flex flex-col px-2">
          <span className="font-semibold">Acme</span>
          <span className="text-caption text-muted-foreground">Production workspace</span>
        </div>
      }
      groups={[
        { label: "Workspace", items: [{ href: "#overview", label: "Overview" }] },
        {
          label: "Products",
          items: [
            {
              label: "Identity",
              items: [
                {
                  label: "Access",
                  items: [
                    { href: "#applications", label: "Applications" },
                    { href: "#agents", label: "Agents" },
                    { href: "#approvals", label: "Approvals", count: 3, countLabel: "3 waiting", active: true },
                  ],
                },
                { label: "Users", items: [{ href: "#people", label: "People" }, { href: "#organizations", label: "Organizations" }] },
                { label: "Monitoring", items: [{ href: "#security", label: "Security", count: 1, countLabel: "1 alert" }, { href: "#events", label: "Events" }] },
              ],
            },
            {
              label: "Compliance",
              items: [
                { href: "#controls", label: "Controls" },
                { href: "#evidence", label: "Evidence", disabled: true, disabledReason: "opens after the first audit" },
              ],
            },
          ],
        },
        { label: "Settings", items: [{ href: "#workspace-settings", label: "Workspace settings" }, { href: "#account", label: "Account" }] },
      ]}
      footer={<span className="px-2">Jordan · Admin</span>}
    />
  );
}
