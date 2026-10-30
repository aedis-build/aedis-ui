import { Button } from "@/registry/aedis/ui/button";

const variants = ["default", "secondary", "outline", "ghost", "destructive", "link"] as const;

const Arrow = () => (
  <svg data-slot="icon" viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
);

export default function ButtonShapes() {
  return (
    <div className="grid w-full gap-4">
      {(["default", "pill"] as const).map((shape) => (
        <div key={shape} role="group" aria-label={`${shape} shape`} className="flex flex-wrap items-center gap-3">
          {variants.map((variant) => (
            <Button key={variant} variant={variant} shape={shape}>
              {variant}
            </Button>
          ))}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button shape="pill" size="lg">
          Talk to us
          <Arrow />
        </Button>
        <Button shape="pill" variant="outline">
          See the work
          <Arrow />
        </Button>
      </div>
    </div>
  );
}
