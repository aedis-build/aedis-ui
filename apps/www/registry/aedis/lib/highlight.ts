import type { HighlighterCore } from "shiki/core";

export type CodeToken = { content: string; color?: string | undefined };

// Token colors are theme variables (--syntax-*) set by the Aedis theme; anything else is dropped.
const SYNTAX_COLOR = /^var\(--syntax-[a-z-]+\)$/;

let highlighter: Promise<HighlighterCore> | undefined;

function load() {
  // The JavaScript regex engine needs no WebAssembly, so a strict CSP without 'wasm-unsafe-eval' still works.
  highlighter ??= Promise.all([import("shiki/core"), import("shiki/engine/javascript"), import("shiki")]).then(([core, engine, shiki]) =>
    core.createHighlighterCore({
      themes: [shiki.createCssVariablesTheme({ name: "aedis", variablePrefix: "--syntax-", variableDefaults: {}, fontStyle: false })],
      langs: [],
      engine: engine.createJavaScriptRegexEngine(),
    }),
  );
  return highlighter;
}

/**
 * Splits code into lines of colored tokens: data for React to render as text, never HTML. Resolves to null for a
 * language shiki does not bundle, so the caller shows plain text.
 */
export async function highlight(code: string, lang: string): Promise<CodeToken[][] | null> {
  const { bundledLanguages } = await import("shiki");
  if (!Object.prototype.hasOwnProperty.call(bundledLanguages, lang)) return null;
  const hl = await load();
  if (!hl.getLoadedLanguages().includes(lang)) await hl.loadLanguage(bundledLanguages[lang as keyof typeof bundledLanguages]);
  return hl.codeToTokensBase(code, { lang, theme: "aedis" }).map((line) =>
    line.map((t) => ({ content: t.content, color: t.color && SYNTAX_COLOR.test(t.color) ? t.color : undefined })),
  );
}
