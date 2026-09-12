import { scenarios } from "@/mocks/scenarios";
import { api } from "@/shared/api/client";
import { useQueryClient } from "@tanstack/react-query";

export function DebugPanel() {
  const params = new URLSearchParams(window.location.search);
  const visible = params.get("debugMocks") === "1";
  const qc = useQueryClient();
  if (!visible) return null;
  return (
    <aside className="fixed bottom-16 right-4 z-50 w-64 rounded-lg border border-line bg-panel p-3 text-xs shadow-lg">
      <p className="mb-2 font-medium">Painel MSW</p>
      <label htmlFor="scenario">Cenário</label>
      <select
        id="scenario"
        className="mt-1 w-full rounded border border-line bg-canvas p-1"
        defaultValue={params.get("scenario") ?? "default"}
        onChange={async (e) => {
          await api.post("/debug/reset", { scenario: e.target.value });
          const next = new URL(window.location.href);
          next.searchParams.set("debugMocks", "1");
          next.searchParams.set("scenario", e.target.value);
          window.location.href = next.toString();
        }}
      >
        {scenarios.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <button
        type="button"
        className="mt-2 w-full rounded bg-kurio-orange py-1 text-black"
        onClick={async () => {
          await api.post("/debug/reset", { scenario: "default" });
          qc.clear();
          window.location.reload();
        }}
      >
        Resetar cenário
      </button>
    </aside>
  );
}
