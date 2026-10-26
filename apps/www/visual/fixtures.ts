import { expect, test as base } from "@playwright/test";

/** The behaviour specs' test: any uncaught error on the page (a crash, a CSP refusal of a script) fails it. */
export const test = base.extend<{ pageErrors: string[] }>({
  pageErrors: [
    async ({ page }, use) => {
      const errors: string[] = [];
      page.on("pageerror", (e) => errors.push(e.message));
      await use(errors);
      expect(errors, "uncaught errors on the page").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };
