import Link from "next/link";

export default function PrivacyDocument({ publicNavigation = false }: { publicNavigation?: boolean }) {
  return (
    <div className={`${publicNavigation ? "retro-shell " : ""}pixel-terms min-h-screen`}>
      {publicNavigation && (
        <header className="auth-topbar">
        <div className="auth-topbar-inner">
          <Link href="/login" className="wordmark">REVERSI CLUB</Link>
          <nav className="flex gap-4 text-xs font-bold">
            <Link href={publicNavigation ? "/legal/terms" : "/terms"}>Terms</Link>
            <Link href="/login">Sign In</Link>
          </nav>
        </div>
        </header>
      )}

      <main className="p-6 sm:p-12 min-h-screen">
        <article className="max-w-4xl mx-auto">
          <section className="mb-16">
            <span className="label-micro">Updated: July 21, 2026</span>
            <h1 className="mt-5 mb-5">PRIVACY POLICY</h1>
            <p className="text-lg max-w-2xl border-l-4 border-tertiary pl-6 py-2">
              A practical description of the information this project stores and uses.
            </p>
          </section>

          <div className="terms-info-box mb-16">
            <p>
              This deployment does not use advertising trackers, hardware identifiers,
              IP geolocation, or commercial analytics, and it does not sell personal data.
            </p>
          </div>

          <div className="space-y-16">
            <LegalSection number="01" title="Account and profile data">
              <p>
                Local registration stores your email address, username, password hash,
                optional biography, optional avatar URL, account creation time, XP, level,
                wins, and losses. Plain-text passwords are not stored. Passwords are hashed
                with Argon2.
              </p>
            </LegalSection>

            <LegalSection number="02" title="Google sign-in">
              <p>
                If you choose Google sign-in, Google provides a verified email address,
                display name, and profile picture URL. The project stores those values to
                create or identify your account. Your Google password is never received.
              </p>
            </LegalSection>

            <LegalSection number="03" title="Games and social features">
              <p>
                The service stores game participants, moves, timers, results, and dates.
                It also stores friendships, pending friend requests, private chat messages,
                message senders, and timestamps. In-game chat is temporary and is not stored
                in the database.
              </p>
            </LegalSection>

            <LegalSection number="04" title="Sessions and browser storage">
              <p>
                Access and refresh tokens are stored in your browser local storage. The
                database stores a hash of each refresh token and its expiration time.
                Refresh sessions expire after seven days by default and can be revoked on
                logout. Use Logout and avoid shared browser profiles on shared computers.
              </p>
            </LegalSection>

            <LegalSection number="05" title="Visibility and sharing">
              <p>
                Other authenticated users can see your username, biography, avatar, online
                status, game statistics, XP, level, leaderboard position, and current game
                when applicable. Email addresses and authentication data are not included
                in public profiles. Data is not shared commercially. Google processes data
                separately when its optional sign-in flow is used.
              </p>
            </LegalSection>

            <LegalSection number="06" title="Retention and choices">
              <p>
                Project data is retained in the deployment database while the academic
                service remains available. The application currently has no self-service
                account export or deletion screen. You can edit your username and biography
                and remove friendships. Requests concerning account access or deletion must
                be directed to the team responsible for the current deployment.
              </p>
            </LegalSection>

            <LegalSection number="07" title="Security and changes">
              <p>
                The project uses HTTPS, authenticated API routes, password hashing, and
                hashed refresh tokens. No system can guarantee absolute security. This
                policy may be updated when features or stored data change; the date above
                identifies the current version.
              </p>
            </LegalSection>
          </div>

          <footer className="mt-20 py-10 flex flex-wrap justify-between gap-4">
            <span className="text-xs font-black">FT_TRANSCENDENCE // PRIVACY</span>
            <Link href={publicNavigation ? "/legal/terms" : "/terms"} className="label-micro underline">Read Terms of Service</Link>
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
