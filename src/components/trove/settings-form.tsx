import { useState } from "react";
import { Loader2 } from "lucide-react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { resetAllData, updateSettings } from "@/lib/actions";
import type { Settings } from "@/lib/types";
import { useMutation } from "./use-mutation";

export function SettingsForm({ settings }: { settings: Settings }) {
  const [form, setForm] = useState({
    displayName: settings.displayName,
    dailyPageGoal: String(settings.dailyPageGoal),
    yearlyBookGoal: String(settings.yearlyBookGoal),
  });
  const { run, pending } = useMutation();
  const reset = useMutation();

  return (
    <div className="max-w-xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile & goals</CardTitle>
          <CardDescription>Goals drive your daily quests, the goal ring, and the yearly challenge.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              run(() => updateSettings(form), { success: "Settings saved" });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="name">Display name</Label>
              <Input id="name" required value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="daily">Daily page goal</Label>
                <Input id="daily" type="number" min={1} required value={form.dailyPageGoal} onChange={(e) => setForm({ ...form, dailyPageGoal: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearly">Books per year</Label>
                <Input id="yearly" type="number" min={1} required value={form.yearlyBookGoal} onChange={(e) => setForm({ ...form, yearlyBookGoal: e.target.value })} />
              </div>
            </div>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="animate-spin" />}
              Save
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Danger zone</CardTitle>
          <CardDescription>Permanently delete every book, session, review, and collection.</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive">Reset all data</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Erase your entire trove?</AlertDialogTitle>
                <AlertDialogDescription>This can&apos;t be undone. Your settings are kept; everything else is deleted.</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction variant="destructive" disabled={reset.pending} onClick={() => reset.run(() => resetAllData(), { success: "All data erased" })}>
                  Erase everything
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
