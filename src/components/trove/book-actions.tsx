import { Link, useNavigate } from "@tanstack/react-router";
import { FolderPlus, Heart, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteBook, setBookInCollection, setBookStatus, toggleFavorite } from "@/lib/actions";
import { BOOK_STATUSES, STATUS_LABELS, type Book, type BookStatus } from "@/lib/types";
import { cn } from "@/lib/utils";
import { useMutation } from "./use-mutation";

export function StatusSelect({ book }: { book: Pick<Book, "id" | "status"> }) {
  const { run, pending } = useMutation();
  return (
    <Select
      value={book.status}
      disabled={pending}
      onValueChange={(v) =>
        run(() => setBookStatus(book.id, v as BookStatus), {
          success: v === "finished" ? "Finished! Another one for the shelf 📚" : `Moved to ${STATUS_LABELS[v as BookStatus]}`,
        })
      }
    >
      <SelectTrigger className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {BOOK_STATUSES.map((s) => (
          <SelectItem key={s} value={s}>
            {STATUS_LABELS[s]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function FavoriteButton({ book }: { book: Pick<Book, "id" | "favorite"> }) {
  const { run, pending } = useMutation();
  return (
    <Button
      variant="outline"
      size="icon"
      disabled={pending}
      aria-pressed={book.favorite}
      aria-label={book.favorite ? "Remove from favorites" : "Add to favorites"}
      onClick={() => run(() => toggleFavorite(book.id))}
    >
      <Heart className={cn(book.favorite && "fill-rose-500 text-rose-500")} />
    </Button>
  );
}

export function CollectionsPopover({
  bookId,
  collections,
  memberOf,
}: {
  bookId: number;
  collections: { id: number; name: string }[];
  memberOf: number[];
}) {
  const { run, pending } = useMutation();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline">
          <FolderPlus /> Collections
          {memberOf.length > 0 && <span className="text-muted-foreground">({memberOf.length})</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64">
        {collections.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No collections yet.{" "}
            <Link to="/collections" className="text-primary hover:underline">
              Create one
            </Link>
          </p>
        ) : (
          <ul className="space-y-1">
            {collections.map((c) => {
              const checked = memberOf.includes(c.id);
              return (
                <li key={c.id}>
                  <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent">
                    <Checkbox
                      checked={checked}
                      disabled={pending}
                      onCheckedChange={(v) => run(() => setBookInCollection(c.id, bookId, v === true))}
                    />
                    {c.name}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function BookMenu({ book }: { book: Pick<Book, "id" | "title"> }) {
  const navigate = useNavigate();
  const { run, pending } = useMutation();
  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link to="/books/$id/edit" params={{ id: String(book.id) }}>
              <Pencil /> Edit details
            </Link>
          </DropdownMenuItem>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem variant="destructive">
              <Trash2 /> Delete book
            </DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete “{book.title}”?</AlertDialogTitle>
          <AlertDialogDescription>
            This removes the book along with its reading sessions and review.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={pending}
            onClick={() => run(() => deleteBook(book.id), { success: "Book deleted", onSuccess: () => navigate({ to: "/library" }) })}
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
