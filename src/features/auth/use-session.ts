import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/shared/api/client";
import type { UserPublic } from "@/types";

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: async () => {
      const { data } = await api.get<{ user: UserPublic | null }>("/session");
      return data;
    },
  });
}

export function useClearPrivateCache() {
  const qc = useQueryClient();
  return () => {
    qc.clear();
  };
}
