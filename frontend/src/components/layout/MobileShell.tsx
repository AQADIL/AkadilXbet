import BottomNav from "@/components/nav/BottomNav";

interface MobileShellProps {
  children: React.ReactNode;
}

export default function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="relative flex flex-col min-h-svh w-full max-w-lg mx-auto bg-surface-base overflow-x-hidden">
      <main className="flex-1 pb-20">{children}</main>
      <BottomNav />
    </div>
  );
}
