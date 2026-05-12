import MobileShell from "@/components/layout/MobileShell";

export default function ProfilePage() {
  return (
    <MobileShell>
      <div className="flex flex-col items-center justify-center min-h-[calc(100svh-4rem)] gap-4 px-4">
        <p className="text-brutalist text-3xl text-brand-glow glow-green">Profile</p>
        <p className="text-text-muted text-sm">Coming soon</p>
      </div>
    </MobileShell>
  );
}
