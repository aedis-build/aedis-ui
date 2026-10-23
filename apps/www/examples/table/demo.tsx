import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/registry/aedis/ui/table";

export default function TableDemo() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Agent</TableHead>
          <TableHead>Role</TableHead>
          <TableHead className="text-right">Ceiling used</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell>Rafael</TableCell>
          <TableCell>Account Executive</TableCell>
          <TableCell className="text-right">12%</TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
