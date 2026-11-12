"use client";

import { useRouter } from "next/navigation";
import { Pencil, Trash2, X } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteCollection, setBookInCollection } from "@/lib/actions";
import { CollectionDialog } from "./collection-dialog";
import { useMutation } from "./use-mutation";

type C = { id: number; name: string; description: string | null };

export function CollectionToolbar({ collection, addable }: { collection: C; addable: { id: number; title: string }[] }) {
  const router = useRouter();
  const { run, pending } = useMutation();
  return (
    <>
      {addable.length > 0 && (
        <Select
          value=""
          onValueChange={(v) => run(() => setBookInCollection(collection.id, Number(v), true), { success: "Added to collection" })}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Add a book…" />
          </SelectTrigger>
          <SelectContent>
            {addable.map((b) => (
              <SelectItem key={b.id} value={String(b.id)}>
                {b.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
      <CollectionDialog collection={collection}>
        <Button variant="outline">
          <Pencil /> Edit
        </Button>
      </CollectionDialog>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Delete collection">
            <Trash2 />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete “{collection.name}”?</AlertDialogTitle>
            <AlertDialogDescription>The books stay in your library — only the collection is removed.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={pending}
              onClick={() => run(() => deleteCollection(collection.id), { success: "Collection deleted", onSuccess: () => router.push("/collections") })}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export function RemoveFromCollection({ collectionId, bookId }: { collectionId: number; bookId: number }) {
  const { run, pending } = useMutation();
  return (
    <Button
      variant="secondary"
      size="icon-xs"
      aria-label="Remove from collection"
      disabled={pending}
      className="absolute top-1.5 left-1.5 z-10 opacity-0 shadow group-hover/item:opacity-100 focus-visible:opacity-100"
      onClick={() => run(() => setBookInCollection(collectionId, bookId, false))}
    >
      <X />
    </Button>
  );
}
