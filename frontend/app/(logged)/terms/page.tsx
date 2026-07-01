export default function TermsPage() {
  return (
    <>
      <main className="p-12 min-h-screen">
        <div className="max-w-4xl mx-auto">

          {/* Hero header */}
          <section className="mb-20">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-highest rounded-full mb-6">
              <div className="live-dot" />
              <span className="label-micro">Updated: Jan 2025</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter font-headline text-primary-fixed mb-4">
              LEGAL_CORE
            </h1>
            <p className="text-on-surface-variant text-lg max-w-2xl border-l-4 border-tertiary pl-6 py-2">
              Governing the velocity, privacy, and conduct standards within the FT_TRANSCENDANCE ecosystem.
              Please review these protocols before proceeding.
            </p>
          </section>

          {/* Protocol nav cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
            <a
              href="#privacy-policy"
              className="terms-protocol-card border-b-2 border-primary-dim/20 hover:border-primary-dim group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-primary text-3xl">security</span>
                <span className="label-micro">01_PROTOCOL</span>
              </div>
              <h3 className="text-xl font-headline font-bold text-white group-hover:text-primary-fixed transition-colors">
                Privacy Protocol
              </h3>
              <p className="text-sm text-on-surface-variant mt-2">
                Data encryption, collection standards, and user telemetry management.
              </p>
            </a>

            <a
              href="#terms-service"
              className="terms-protocol-card border-b-2 border-tertiary/20 hover:border-tertiary group"
            >
              <div className="flex justify-between items-start mb-4">
                <span className="material-symbols-outlined text-tertiary text-3xl">description</span>
                <span className="label-micro">02_PROTOCOL</span>
              </div>
              <h3 className="text-xl font-headline font-bold text-white group-hover:text-tertiary transition-colors">
                Terms of Service
              </h3>
              <p className="text-sm text-on-surface-variant mt-2">
                Licensing, user conduct, and tournament regulation frameworks.
              </p>
            </a>
          </div>

          {/* Article */}
          <article className="space-y-24">

            {/* Section 01 */}
            <section id="privacy-policy">
              <div className="flex items-center gap-6 mb-8">
                <span className="terms-section-number">01</span>
                <h2 className="text-3xl font-headline font-bold tracking-tight text-on-surface">
                  Data Telemetry &amp; Privacy
                </h2>
              </div>

              <div className="space-y-8 leading-relaxed text-on-surface-variant">
                <div className="terms-info-box">
                  <h4 className="label-micro accent tracking-[0.2em] mb-4">Identity Encryption</h4>
                  <p>
                    All player data within FT_TRANSCENDANCE is subjected to high-level asymmetric encryption.
                    We collect telemetry including match performance, ping cycles, and system specifications
                    solely to optimize the matchmaking engine and maintain game integrity. We do not sell your
                    personal identification to third-party entities.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
                  <div>
                    <h4 className="text-white font-headline font-bold mb-3">Collection Scope</h4>
                    <ul className="space-y-4 text-sm list-none">
                      {[
                        "User-provided account credentials (Email, Handle)",
                        "Network performance metrics and IP geolocation",
                        "Hardware ID (HWID) for anti-cheat verification",
                      ].map(item => (
                        <li key={item} className="flex items-start gap-3">
                          <span className="material-symbols-outlined text-primary text-lg flex-shrink-0">check_circle</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-white font-headline font-bold mb-3">Your Rights</h4>
                    <p className="text-sm">
                      You retain the right to request a complete wipe of your telemetry profile. Note that
                      data erasure may lead to the permanent termination of your velocity rank and competitive
                      standing within the ELITE_DIVISION.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 02 */}
            <section id="terms-service">
              <div className="flex items-center gap-6 mb-8">
                <span className="terms-section-number">02</span>
                <h2 className="text-3xl font-headline font-bold tracking-tight text-on-surface">
                  Universal Service Framework
                </h2>
              </div>

              <div className="space-y-12 leading-relaxed text-on-surface-variant">
                <p>
                  By accessing the FT_TRANSCENDANCE neural link, you agree to abide by the following conduct
                  codes. Failure to comply results in immediate de-platforming.
                </p>

                <div className="relative mt-12">
                  <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-tertiary via-transparent to-transparent" />
                  <div className="space-y-12 pl-8">
                    <div className="max-w-2xl">
                      <h4 className="text-tertiary font-headline font-bold mb-2">1. Competitive Integrity</h4>
                      <p className="text-sm">
                        Modification of game binaries, injection of external visual scripts, or utilization of
                        macro-automated inputs is strictly prohibited. The system uses real-time behavioral
                        analysis to detect anomalies.
                      </p>
                    </div>
                    <div className="max-w-2xl ml-auto text-right">
                      <h4 className="text-tertiary font-headline font-bold mb-2">2. Intellectual Property</h4>
                      <p className="text-sm">
                        All assets, including UI shaders, character meshes, and proprietary network protocols,
                        remain the sole property of FT_TRANSCENDANCE. Reverse engineering is a violation of
                        international copyright law.
                      </p>
                    </div>
                    <div className="max-w-2xl">
                      <h4 className="text-tertiary font-headline font-bold mb-2">3. Conduct &amp; Harassment</h4>
                      <p className="text-sm">
                        Velocity Noir is an inclusive space. Toxic behavior, hate speech, or targeted harassment
                        via communication channels will trigger an automated shadow-ban, restricting access to
                        private lobbies only.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="terms-warning-box">
                  <span className="material-symbols-outlined text-error text-4xl flex-shrink-0">warning</span>
                  <div>
                    <h3 className="text-white font-headline font-bold text-lg mb-2 uppercase">
                      Account Termination Warning
                    </h3>
                    <p className="text-sm">
                      Accounts flagged for critical breaches (Cheating/Fraud) are subject to permanent HWID bans.
                      There is no appeals process for tier-one violations. Your rank and digital assets will be
                      forfeited immediately.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Acceptance */}
            <section className="py-20 border-t border-outline-variant/20">
              <h2 className="text-xl font-headline font-bold text-white mb-4">ACCEPTANCE</h2>
              <p className="text-on-surface-variant text-sm mb-6">
                By continuing to use our services, you acknowledge that you have read and understood the
                protocols outlined above. We reserve the right to update these terms at any velocity.
                Significant changes will be broadcasted via the global notification hub.
              </p>
            </section>
          </article>

          {/* Footer */}
          <footer className="mt-20 py-10 flex justify-between items-center opacity-30 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-700">
            <div className="text-xs font-black tracking-widest font-headline uppercase">
              FT_TRANSCENDANCE // LEGAL
            </div>
            <div className="label-micro">Noir Velocity Engine © 2025</div>
          </footer>
        </div>
      </main>

      <div className="ambient-layer">
        <div className="ambient-blob -top-[10%] -right-[5%] w-[600px] h-[600px] bg-violet-600/5 blur-[120px]" />
        <div className="ambient-blob -bottom-[20%] -left-[10%] w-[800px] h-[800px] bg-primary/5 blur-[150px]" />
      </div>
    </>
  );
}
