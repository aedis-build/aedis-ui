import { Sidebar } from "@/registry/aedis/ui/sidebar";

export default function SidebarDemo() {
  return (
    <Sidebar
      className="w-60 rounded-xl"
      header={<span className="px-2 font-semibold">Acme Studio</span>}
      groups={[
        {
          label: "Areas",
          items: [
            { href: "#pipeline", label: "Sales pipeline" },
            { href: "#social", label: "Social media", disabled: true, disabledReason: "opens after hiring a social media agent" },
          ],
        },
        {
          label: "Work",
          items: [
            { href: "#home", label: "Home", active: true },
            { href: "#approvals", label: "Approvals", count: 3, countLabel: "3 waiting" },
            { href: "#hands", label: "Raised hands", count: 1, countLabel: "1 waiting" },
          ],
        },
      ]}
      footer={<span className="px-2">Jordan · CEO</span>}
    />
  );
}
