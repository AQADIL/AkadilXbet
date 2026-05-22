import MobileShell from "@/components/layout/MobileShell";

export default function TermsPage() {
  return (
    <MobileShell>
      <div className="px-4 pt-10 pb-24 flex flex-col gap-6">
        <h1 className="text-brutalist text-3xl text-text-primary">Terms & <span className="text-brand-glow">Conditions</span></h1>
        <div className="flex flex-col gap-4 text-text-secondary text-sm leading-relaxed">
          <Section title="1. Acceptance">
            By registering and using AkadilXbet, you agree to be bound by these Terms and Conditions. If you do not agree, do not use the service.
          </Section>
          <Section title="2. Eligibility">
            You must be at least 18 years old to use this platform. By registering, you confirm you meet this requirement.
          </Section>
          <Section title="3. Account Responsibility">
            You are responsible for maintaining the confidentiality of your account credentials and all activity that occurs under your account.
          </Section>
          <Section title="4. Fair Use">
            Abuse of bonuses, use of bots, or any fraudulent activity will result in immediate account suspension and forfeiture of funds.
          </Section>
          <Section title="5. Responsible Gambling">
            We are committed to responsible gambling. If you feel you have a problem, please contact support or use our self-exclusion tools.
          </Section>
          <Section title="6. Changes">
            We reserve the right to update these terms at any time. Continued use of the platform constitutes acceptance of the updated terms.
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
