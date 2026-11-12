"use client";

import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { loadSampleData } from "@/lib/actions";
import { useMutation } from "./use-mutation";

export function SampleDataButton() {
  const { run, pending } = useMutation();
  return (
    <Button variant="outline" disabled={pending} onClick={() => run(() => loadSampleData(), { success: "Sample library loaded" })}>
      {pending ? <Loader2 className="animate-spin" /> : <Sparkles />}
      Load sample library
    </Button>
  );
}
