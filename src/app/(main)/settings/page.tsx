import { Suspense } from "react";

import { SettingsView } from "./SettingsView";

export default function SettingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-sm text-muted-foreground">Загрузка…</div>}>
      <SettingsView />
    </Suspense>
  );
}
