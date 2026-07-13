import { AppSidebar } from "@/components/nav/AppSidebar";
import { MobileTabBar } from "@/components/nav/MobileTabBar";
import { PageTransition } from "@/components/PageTransition";
import { AuthGuard } from "@/features/auth/AuthGuard";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="mx-auto flex min-h-screen w-full max-w-6xl">
        <AppSidebar />
        <div className="flex-1 pb-16 md:pb-0">
          <PageTransition>{children}</PageTransition>
        </div>
      </div>
      <MobileTabBar />
    </AuthGuard>
  );
}
