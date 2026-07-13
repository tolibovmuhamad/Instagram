import { PageTransition } from "@/components/PageTransition";

// Экраны авторизации всегда тёмные — независимо от выбранной темы приложения,
// как и полноэкранный AuthLoadingScreen, который показывается сразу после входа.
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="dark min-h-screen bg-background text-foreground">
      <PageTransition>{children}</PageTransition>
    </div>
  );
}
