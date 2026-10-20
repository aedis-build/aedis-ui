import axe from "axe-core";

/** Runs axe on a rendered container and returns the violations, so tests can assert an empty list. */
export async function violations(container: HTMLElement) {
  // color-contrast needs real layout, which jsdom does not have.
  // iframes: the frame's own content belongs to the embedded app, and jsdom cannot host axe inside it.
  const result = await axe.run(container, { iframes: false, rules: { "color-contrast": { enabled: false } } });
  return result.violations.map((v) => `${v.id}: ${v.help}`);
}
