import { PageHeader } from "@/components/trove/page-header";
import { SettingsForm } from "@/components/trove/settings-form";
import { getSettings } from "@/lib/queries";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const settings = await getSettings();
  return (
    <div>
      <PageHeader title="Settings" />
      <SettingsForm settings={settings} />
    </div>
  );
}
