import BottomNav from "@/components/nav/BottomNav";

interface MobileShellProps {
  children: React.ReactNode;
  flush?: boolean;
}

export default function MobileShell({ children, flush = false }: MobileShellProps) {
  return (
    <div className="relative flex flex-col min-h-svh w-full max-w-lg mx-auto bg-surface-base overflow-x-hidden">
      <main className={`flex-1 ${flush ? "" : "pb-20"}`}>{children}</main>
      <BottomNav />
    </div>
  );
}
