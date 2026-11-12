import { useTransition } from "react";
import { useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import type { ActionResult } from "@/lib/types";

/**
 * Run a server function with pending state and error/success toasts.
 * After a successful write, `onSuccess` runs first (so a navigation away from a deleted item happens
 * before refetching), then the router is invalidated so every visible loader re-reads the database.
 */
export function useMutation() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run<T>(
    action: () => Promise<ActionResult<T>>,
    opts: { success?: string; onSuccess?: (data: T | undefined) => unknown } = {},
  ) {
    startTransition(async () => {
      const res = await action();
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      if (opts.success) toast.success(opts.success);
      await opts.onSuccess?.(res.data);
      await router.invalidate();
    });
  }

  return { pending, run };
}
