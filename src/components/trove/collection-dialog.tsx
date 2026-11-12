"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createCollection, updateCollection } from "@/lib/actions";
import { useMutation } from "./use-mutation";

export function CollectionDialog({
  collection,
  children,
}: {
  collection?: { id: number; name: string; description: string | null };
  children?: React.ReactNode;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(collection?.name ?? "");
  const [description, setDescription] = useState(collection?.description ?? "");
  const { run, pending } = useMutation();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (collection) {
      run(() => updateCollection(collection.id, { name, description }), { success: "Collection updated", onSuccess: () => setOpen(false) });
    } else {
      run(() => createCollection({ name, description }), {
        success: "Collection created",
        onSuccess: (data) => {
          setOpen(false);
          setName("");
          setDescription("");
          if (data) router.push(`/collections/${data.id}`);
        },
      });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children ?? (
          <Button>
            <Plus /> New collection
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{collection ? "Edit collection" : "New collection"}</DialogTitle>
        </DialogHeader>
        <form id="collection-form" onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Summer reads" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-desc">Description</Label>
            <Textarea id="c-desc" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
        </form>
        <DialogFooter>
          <Button type="submit" form="collection-form" disabled={pending}>
            {pending && <Loader2 className="animate-spin" />}
            {collection ? "Save" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
