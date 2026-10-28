import { ProofList } from "@/registry/aedis/blocks/proof-list";

export default function ProofListDemo() {
  return (
    <ProofList
      title="In numbers"
      items={[
        { value: "12", label: "Years in practice" },
        { value: "140+", label: "Brands launched", detail: "From bakeries to hotels." },
        { value: "98%", label: "Clients who return" },
        { label: "Independent", detail: "No holding, no outsourcing." },
      ]}
    />
  );
}
