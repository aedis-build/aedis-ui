import { render, screen } from "@testing-library/react";
import fc from "fast-check";

import { LocaleProvider } from "@/registry/aedis/lib/locale";
import { ptBR } from "@/registry/aedis/lib/locales/pt-br";
import { Breadcrumb, BreadcrumbEllipsis, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/registry/aedis/ui/breadcrumb";
import { Item, ItemActions, ItemContent, ItemDescription, ItemFooter, ItemGroup, ItemHeader, ItemMedia, ItemSeparator, ItemTitle } from "@/registry/aedis/ui/item";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/registry/aedis/ui/pagination";
import { MAX_PAGES, paginationRange, parsePage } from "@/registry/aedis/lib/pagination";
import { violations } from "./a11y";

describe("Breadcrumb", () => {
  it("is a labelled trail with safe links and the current page marked", async () => {
    const { container } = render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/">Home</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbEllipsis />
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="javascript:alert(1)">Evil</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="https://docs.example.com">Docs</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Approvals</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(screen.getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("href", "/");
    expect(screen.queryByRole("link", { name: "Evil" })).toBeNull();
    expect(screen.getByRole("link", { name: "Docs (external site)" })).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Approvals")).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("More")).toHaveClass("sr-only");
    expect(await violations(container)).toEqual([]);
  });

  it("passes the safe href to a router link", () => {
    const Router = (props: React.ComponentProps<"a">) => <a data-router="" {...props} />;
    render(
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/docs" render={<Router />}>Docs</BreadcrumbLink>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>,
    );
    expect(screen.getByRole("link", { name: "Docs" })).toHaveAttribute("data-router");
  });
});

describe("parsePage and paginationRange", () => {
  it("reads page numbers as integers within bounds", () => {
    expect(parsePage("3", 10)).toBe(3);
    expect(parsePage(" 7 ", 10)).toBe(7);
    expect(parsePage("99", 10)).toBe(10);
    expect(parsePage("0", 10)).toBe(1);
    for (const bad of ["-1", "1.5", "2e3", "0x10", "abc", "", null, undefined, Number.NaN, Infinity, 2.5, {}, "9999999999"]) expect(parsePage(bad, 10)).toBe(1);
    expect(parsePage(5, Number.NaN)).toBe(1);
    expect(parsePage(5, -3)).toBe(1);
  });

  it("always returns an integer in [1, total] (property)", () => {
    fc.assert(
      fc.property(fc.anything(), fc.integer({ min: -5, max: 10 ** 9 }), (value, total) => {
        const p = parsePage(value, total);
        expect(Number.isInteger(p)).toBe(true);
        expect(p).toBeGreaterThanOrEqual(1);
        expect(p).toBeLessThanOrEqual(Math.max(1, Math.min(total, MAX_PAGES)));
      }),
    );
  });

  it("shows the edges, the current page and its neighbours", () => {
    expect(paginationRange(1, 1)).toEqual([1]);
    expect(paginationRange(1, 2)).toEqual([1, 2]);
    expect(paginationRange(5, 10)).toEqual([1, "ellipsis", 4, 5, 6, "ellipsis", 10]);
    expect(paginationRange(3, 10)).toEqual([1, 2, 3, 4, "ellipsis", 10]);
    expect(paginationRange(10, 10)).toEqual([1, "ellipsis", 9, 10]);
    expect(paginationRange("evil", 10)).toEqual([1, 2, "ellipsis", 10]);
    expect(paginationRange(5, 10, 2)).toEqual([1, 2, 3, 4, 5, 6, 7, "ellipsis", 10]);
  });

  it("is short, sorted and contains the current page (property)", () => {
    fc.assert(
      fc.property(fc.integer({ min: -10, max: 10 ** 7 }), fc.integer({ min: 1, max: 10 ** 7 }), fc.integer({ min: -2, max: 9 }), (page, total, siblings) => {
        const range = paginationRange(page, total, siblings);
        const numbers = range.filter((x): x is number => x !== "ellipsis");
        expect(range.length).toBeLessThanOrEqual(15);
        expect(numbers).toEqual([...numbers].sort((a, b) => a - b));
        expect(numbers).toContain(parsePage(page, total));
        expect(numbers[0]).toBe(1);
      }),
    );
  });
});

describe("Pagination", () => {
  it("labels previous and next, marks the current page and refuses unsafe links", async () => {
    const { container } = render(
      <LocaleProvider locale="pt-BR" messages={ptBR}>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href="?page=1" />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="?page=1">1</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="?page=2" isActive>2</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationEllipsis />
            </PaginationItem>
            <PaginationItem>
              <PaginationLink href="javascript:alert(1)">9</PaginationLink>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext href="?page=3" />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </LocaleProvider>,
    );
    expect(screen.getByRole("navigation", { name: "Paginação" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para a página anterior" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Ir para a próxima página" })).toHaveAttribute("href", "?page=3");
    expect(screen.getByRole("link", { name: "2" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("link", { name: "9" })).toBeNull();
    expect(screen.getByText("9")).toHaveAttribute("aria-disabled", "true");
    expect(await violations(container)).toEqual([]);
  });
});

describe("Pagination ends", () => {
  it("renders a disabled end that is not a link but keeps its name (#160)", () => {
    render(
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="?page=0" disabled />
          </PaginationItem>
        </PaginationContent>
      </Pagination>,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(screen.getByText("Go to previous page").closest("[aria-disabled]")).toHaveAttribute("aria-disabled", "true");
  });
});

describe("Item", () => {
  it("is a listitem in a group, and a safe link when it has an href", async () => {
    const { container } = render(
      <ItemGroup aria-label="Agents">
        <Item variant="outline">
          <ItemHeader>Sales</ItemHeader>
          <ItemMedia variant="icon">
            <svg viewBox="0 0 16 16" aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Avalo</ItemTitle>
            <ItemDescription>Answers leads on WhatsApp.</ItemDescription>
          </ItemContent>
          <ItemActions>
            <button type="button">Pause</button>
          </ItemActions>
          <ItemFooter>3 waiting</ItemFooter>
        </Item>
        <ItemSeparator />
        <Item href="/agents/talbot">
          <ItemContent>
            <ItemTitle>Talbot</ItemTitle>
          </ItemContent>
        </Item>
        <Item href="https://example.com/x">External</Item>
        <Item href="javascript:alert(1)">Evil</Item>
      </ItemGroup>,
    );
    expect(screen.getAllByRole("listitem")).toHaveLength(4);
    expect(screen.getByRole("link", { name: "Talbot" })).toHaveAttribute("href", "/agents/talbot");
    expect(screen.getByRole("link", { name: "Talbot" }).parentElement).toHaveAttribute("role", "listitem");
    expect(screen.getByText("External").closest("[data-slot=item]")).toHaveAttribute("rel", "noopener noreferrer");
    expect(screen.getByText("Evil").closest("[data-slot=item]")).not.toHaveAttribute("href");
    expect(await violations(container)).toEqual([]);
  });

  it("is a plain div outside a group", () => {
    const { container } = render(<Item>Alone</Item>);
    expect(container.firstElementChild).not.toHaveAttribute("role");
    expect(container.firstElementChild!.tagName).toBe("DIV");
  });
});
