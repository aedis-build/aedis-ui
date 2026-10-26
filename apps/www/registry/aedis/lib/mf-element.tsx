"use client";

import * as React from "react";
import { createRoot, type Root } from "react-dom/client";

export type AttributeType = "string" | "number" | "boolean" | "json";

export type MfElementOptions = {
  /** Attributes the element reads (kebab-case), mapped to camelCase props of the same type. */
  attributes?: Record<string, AttributeType>;
  /** Events the component may emit; anything else is refused. They leave as composed, bubbling CustomEvents. */
  events?: string[];
  /** CSS for the shadow root (e.g. the built Tailwind stylesheet). Shadow DOM keeps it from leaking either way. */
  css?: string;
  /** Largest JSON attribute accepted. */
  maxJsonBytes?: number;
};

/** What the component receives besides its attributes and properties. */
export type MfElementProps = { emit: (event: string, detail?: unknown) => void };

const TAG = /^[a-z][a-z0-9._]*-[a-z0-9._-]*$/;
const camel = (name: string) => name.replace(/-([a-z0-9])/g, (_m, c: string) => c.toUpperCase());

function parse(type: AttributeType, value: string | null, maxJsonBytes: number): unknown {
  if (type === "boolean") return value !== null;
  if (value === null) return undefined;
  if (type === "number") {
    const n = Number(value);
    return value.trim() !== "" && Number.isFinite(n) ? n : undefined;
  }
  if (type === "json") {
    if (new TextEncoder().encode(value).length > maxJsonBytes) return undefined;
    try {
      return JSON.parse(value);
    } catch {
      return undefined;
    }
  }
  return value;
}

/**
 * Registers a React component as a Web Component (`<agent-panel>`): rendered in a shadow root, attributes and
 * properties become props, and `emit` dispatches allowed CustomEvents. Its code runs in the host page's origin, so
 * anything it holds is reachable by every script on that page: never give it a token unless the host accepts that.
 * Registering the same tag twice keeps the first definition.
 */
export function defineMfElement<P extends object>(tag: string, Component: React.ComponentType<P & MfElementProps>, { attributes = {}, events = [], css, maxJsonBytes = 16 * 1024 }: MfElementOptions = {}) {
  if (!TAG.test(tag)) throw new Error(`defineMfElement: "${tag}" is not a valid custom element name`);
  if (typeof customElements === "undefined" || customElements.get(tag)) return;
  const names = Object.keys(attributes);
  const allowed = new Set(events);
  // A constructed stylesheet is CSSOM, which a CSP without style-src 'unsafe-inline' allows; a <style> it blocks.
  let sheet: CSSStyleSheet | null = null;
  if (css && typeof CSSStyleSheet !== "undefined" && "replaceSync" in CSSStyleSheet.prototype) {
    sheet = new CSSStyleSheet();
    sheet.replaceSync(css);
  }

  class MfElement extends HTMLElement {
    static observedAttributes = names;
    #root: Root | null = null;
    #mount: HTMLDivElement;
    #props: Record<string, unknown> = {};

    constructor() {
      super();
      const shadow = this.attachShadow({ mode: "open" });
      if (sheet) shadow.adoptedStyleSheets = [sheet];
      else if (css) {
        const style = document.createElement("style");
        style.textContent = css;
        shadow.append(style);
      }
      this.#mount = document.createElement("div");
      shadow.append(this.#mount);
    }

    #emit = (event: string, detail?: unknown) => {
      if (!allowed.has(event)) throw new Error(`<${tag}>: event "${event}" is not declared`);
      this.dispatchEvent(new CustomEvent(event, { detail, bubbles: true, composed: true }));
    };

    #render() {
      if (!this.#root) return;
      const props = { ...this.#props } as P;
      this.#root.render(<Component {...props} emit={this.#emit} />);
    }

    connectedCallback() {
      for (const name of names) this.#props[camel(name)] ??= parse(attributes[name], this.getAttribute(name), maxJsonBytes);
      this.#root ??= createRoot(this.#mount);
      this.#render();
    }

    disconnectedCallback() {
      // Moving the element in the DOM disconnects and reconnects it in the same task: only unmount if it stays out.
      queueMicrotask(() => {
        if (this.isConnected || !this.#root) return;
        this.#root.unmount();
        this.#root = null;
      });
    }

    attributeChangedCallback(name: string, _old: string | null, value: string | null) {
      this.#props[camel(name)] = parse(attributes[name], value, maxJsonBytes);
      this.#render();
    }

    /** Props that are not attributes (objects, callbacks) are set as properties: `el.props = { … }`. */
    get props(): Partial<P> {
      return { ...this.#props } as Partial<P>;
    }

    set props(value: Partial<P>) {
      this.#props = { ...this.#props, ...value };
      this.#render();
    }
  }

  for (const name of names) {
    const prop = camel(name);
    Object.defineProperty(MfElement.prototype, prop, {
      configurable: true,
      get(this: MfElement) {
        return (this.props as Record<string, unknown>)[prop];
      },
      set(this: MfElement, value: unknown) {
        this.props = { [prop]: value } as Partial<P>;
      },
    });
  }

  customElements.define(tag, MfElement);
}
