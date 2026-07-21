import Link from "next/link";

export default function TermsDocument({ publicNavigation = false }: { publicNavigation?: boolean }) {
  return (
    <div className={`${publicNavigation ? "retro-shell " : ""}pixel-terms min-h-screen`}>
      {publicNavigation && (
        <header className="auth-topbar">
        <div className="auth-topbar-inner">
          <Link href="/login" className="wordmark">REVERSI CLUB</Link>
          <nav className="flex gap-4 text-xs font-bold">
            <Link href={publicNavigation ? "/legal/privacy" : "/privacy"}>Privacy</Link>
            <Link href="/login">Sign In</Link>
          </nav>
        </div>
        </header>
      )}

      <main className="p-6 sm:p-12 min-h-screen">
        <article className="max-w-4xl mx-auto">
          <section className="mb-16">
            <span className="label-micro">Updated: July 21, 2026</span>
            <h1 className="mt-5 mb-5">TERMS OF SERVICE</h1>
            <p className="text-lg max-w-2xl border-l-4 border-tertiary pl-6 py-2">
              Rules for using this educational multiplayer Reversi project.
            </p>
          </section>

          <div className="terms-info-box mb-16">
            <p>
              FT_TRANSCENDENCE is a student project provided for learning, demonstration,
              and evaluation. It is not a commercial gaming service.
            </p>
          </div>

          <div className="space-y-16">
            <LegalSection number="01" title="Using the service">
              <p>
                You may create a local account or sign in with Google, maintain a public
                player profile, play Reversi, communicate with friends, and spectate games
                that allow spectators. You are responsible for activity performed through
                your account and for keeping access to your browser session secure.
              </p>
            </LegalSection>

            <LegalSection number="02" title="Fair play and conduct">
              <p>
                Do not interfere with the service, exploit vulnerabilities, automate game
                actions, impersonate another person, or attempt to access another account.
                Messages, usernames, biographies, and profile images must not be abusive,
                threatening, discriminatory, unlawful, or deliberately disruptive.
              </p>
            </LegalSection>

            <LegalSection number="03" title="Games and rankings">
              <p>
                Ranked game results affect XP, level, wins, losses, and leaderboard position.
                Friendly games do not award ranked progress. Connections can be interrupted,
                and the application may apply its documented reconnection or abandonment
                rules. Bugs should be reported to the project team rather than exploited.
              </p>
            </LegalSection>

            <LegalSection number="04" title="Availability and data">
              <p>
                This service is provided as-is for an academic project. Availability,
                uninterrupted operation, permanent account storage, and recovery of all
                messages or match data are not guaranteed. The deployment may be restarted,
                reset, or removed after evaluation.
              </p>
            </LegalSection>

            <LegalSection number="05" title="Third-party sign-in">
              <p>
                Google sign-in is optional and is governed additionally by Google policies.
                FT_TRANSCENDENCE receives only the account information described in the
                <Link href={publicNavigation ? "/legal/privacy" : "/privacy"} className="underline ml-1">Privacy Policy</Link>.
              </p>
            </LegalSection>

            <LegalSection number="06" title="Changes and acceptance">
              <p>
                These terms may be updated when the project changes. The update date at the
                top identifies the current version. By registering or continuing to use the
                service, you acknowledge these terms and the Privacy Policy.
              </p>
            </LegalSection>
          </div>

          <footer className="mt-20 py-10 flex flex-wrap justify-between gap-4">
            <span className="text-xs font-black">FT_TRANSCENDENCE // TERMS</span>
            <Link href={publicNavigation ? "/legal/privacy" : "/privacy"} className="label-micro underline">Read Privacy Policy</Link>
          </footer>
        </article>
      </main>
    </div>
  );
}

function LegalSection({ number, title, children }: {
  number: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="flex items-center gap-5 mb-5">
        <span className="terms-section-number">{number}</span>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>
      <div className="leading-relaxed text-on-surface-variant">{children}</div>
    </section>
  );
}
