import { Minus, Plus } from "lucide-react";

export function Qty({
  value,
  min = 1,
  max,
  onChange,
}: {
  value: number;
  min?: number;
  max?: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="inline-flex items-center gap-3 rounded-full border border-kurio-orange/80 px-3 py-1 text-kurio-orange">
      <button type="button" aria-label="Diminuir" onClick={() => onChange(Math.max(min, value - 1))}>
        <Minus size={14} />
      </button>
      <span className="min-w-4 text-center text-kurio-cream">{value}</span>
      <button type="button" aria-label="Aumentar" onClick={() => onChange(Math.min(max ?? 99, value + 1))}>
        <Plus size={14} />
      </button>
    </div>
  );
}
