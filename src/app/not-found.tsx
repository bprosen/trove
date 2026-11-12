import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-24 text-center">
      <p className="font-heading text-6xl font-semibold text-primary">404</p>
      <p className="text-muted-foreground">This page seems to have been checked out.</p>
      <Button asChild variant="outline">
        <Link href="/library">Back to the library</Link>
      </Button>
    </div>
  );
}
