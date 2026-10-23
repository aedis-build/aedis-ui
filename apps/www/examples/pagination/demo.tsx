import { paginationRange } from "@/registry/aedis/lib/pagination";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/registry/aedis/ui/pagination";

export default function PaginationDemo() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious href="?page=4" />
        </PaginationItem>
        {paginationRange(5, 12).map((p, i) => (
          <PaginationItem key={i}>{p === "ellipsis" ? <PaginationEllipsis /> : <PaginationLink href={`?page=${p}`} isActive={p === 5}>{p}</PaginationLink>}</PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext href="?page=6" />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
