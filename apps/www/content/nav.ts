import type { NavGroup } from "@/components/site/docs-nav";
import { blocks } from "@/content/blocks";
import { categories, components, guides } from "@/content/components";

const entries = [
  ...guides,
  ...blocks.map((b) => ({ href: `/blocks/${b.name}`, title: b.title, description: b.description, category: "Blocks" as const })),
  ...[...components].sort((a, b) => a.title.localeCompare(b.title)).map((c) => ({ href: `/docs/${c.name}`, title: c.title, description: c.description, category: c.category })),
];

/** The sidebar, the phone sheet and the search, by category. */
export const navGroups: NavGroup[] = categories
  .map((title) => ({ title, items: entries.filter((e) => e.category === title).map(({ href, title }) => ({ href, title })) }))
  .filter((g) => g.items.length > 0);

/** The search index, built with the page: every guide and component, grouped like the sidebar. */
export const searchItems = navGroups.flatMap((g) => g.items.map((i) => ({ value: i.href, label: i.title, group: g.title, description: entries.find((e) => e.href === i.href)?.description })));
