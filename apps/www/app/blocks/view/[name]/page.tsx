import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { blocks } from "@/content/blocks";

export const dynamicParams = false;

export function generateStaticParams() {
  return blocks.map((b) => ({ name: b.name }));
}

export async function generateMetadata({ params }: { params: Promise<{ name: string }> }): Promise<Metadata> {
  const { name } = await params;
  return { title: `${blocks.find((b) => b.name === name)?.title} preview`, robots: { index: false } };
}

/** The block alone, for the preview frame of the Blocks pages. data-bare hides the site header (globals.css). */
export default async function BlockView({ params }: { params: Promise<{ name: string }> }) {
  const { name } = await params;
  const block = blocks.find((b) => b.name === name);
  if (!block) notFound();
  const Demo = block.demo;
  return (
    <main data-bare className="p-4 sm:p-6">
      <Demo />
    </main>
  );
}
