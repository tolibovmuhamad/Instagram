import { AppSidebar } from "@/components/nav/AppSidebar";
import { MessagesDock } from "@/components/nav/MessagesDock";
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
      <AppSidebar />
      {/* Рейл фиксированный, поэтому контенту хватает отступа слева; на мобильном
          вместо него нижний таб-бар и отступ снизу. */}
      <div className="min-h-screen w-full pb-16 md:pb-0 md:pl-[72px]">
        <PageTransition>{children}</PageTransition>
      </div>
      <MessagesDock />
      <MobileTabBar />
    </AuthGuard>
  );
}
