import MobileShell from "@/components/layout/MobileShell";

export default function PrivacyPage() {
  return (
    <MobileShell>
      <div className="px-4 pt-10 pb-24 flex flex-col gap-6">
        <h1 className="text-brutalist text-3xl text-text-primary">Privacy <span className="text-brand-glow">Policy</span></h1>
        <div className="flex flex-col gap-4 text-text-secondary text-sm leading-relaxed">
          <Section title="1. Data We Collect">
            We collect your email address, username, and activity data (bets, sessions) to provide and improve our services.
          </Section>
          <Section title="2. How We Use Data">
            Your data is used to operate your account, process transactions, prevent fraud, and send you relevant communications.
          </Section>
          <Section title="3. Data Sharing">
            We do not sell your personal data. We may share data with payment processors and regulatory authorities as required by law.
          </Section>
          <Section title="4. Cookies">
            We use cookies to maintain your session and improve your experience. You can control cookies via your browser settings.
          </Section>
          <Section title="5. Data Retention">
            We retain your data for as long as your account is active or as required by applicable law.
          </Section>
          <Section title="6. Your Rights">
            You have the right to access, correct, or delete your personal data. Contact support to exercise your rights.
          </Section>
        </div>
      </div>
    </MobileShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass rounded-2xl p-4 flex flex-col gap-2">
      <h2 className="text-text-primary font-bold text-sm">{title}</h2>
      <p className="text-text-muted text-sm leading-relaxed">{children}</p>
    </div>
  );
}
