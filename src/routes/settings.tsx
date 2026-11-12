import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/trove/page-header";
import { SettingsForm } from "@/components/trove/settings-form";
import { getSettingsPage } from "@/lib/data";

export const Route = createFileRoute("/settings")({
  loader: () => getSettingsPage(),
  head: () => ({ meta: [{ title: "Settings · Trove" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { settings } = Route.useLoaderData();
  return (
    <div>
      <PageHeader title="Settings" />
      <SettingsForm settings={settings} />
    </div>
  );
}
