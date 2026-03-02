import Link from 'next/link';

export default function LandingPage() {
  return (
    <>
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        .pl-body { font-family: 'JetBrains Mono', 'Fira Code', 'Courier New', monospace; background: #0a0e0a; color: #f0fdf4; }
        .pl-nav { position: sticky; top: 0; z-index: 50; border-bottom: 1px solid #1a2e1a; background: rgba(10,14,10,0.92); backdrop-filter: blur(8px); }
        .pl-nav-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; height: 52px; display: flex; align-items: center; justify-content: space-between; }
        .pl-logo { color: #4ade80; font-size: 17px; font-weight: 700; letter-spacing: -0.02em; text-decoration: none; }
        .pl-logo span { color: #6b7280; }
        .pl-nav-links { display: flex; gap: 24px; list-style: none; }
        .pl-nav-links a { color: #6b7280; font-size: 13px; text-decoration: none; transition: color 0.15s; }
        .pl-nav-links a:hover { color: #4ade80; }
        .pl-open-btn { background: #14532d; color: #4ade80; border: 1px solid #166534; border-radius: 6px; padding: 6px 16px; font-size: 13px; text-decoration: none; font-weight: 500; font-family: inherit; }
        .pl-open-btn:hover { background: #166534; }
        .pl-hero { min-height: 88vh; display: flex; align-items: center; padding: 80px 24px; }
        .pl-hero-inner { max-width: 1100px; margin: 0 auto; width: 100%; }
        .pl-badge { display: inline-flex; align-items: center; gap: 8px; background: #0d1f0d; border: 1px solid #1a3a1a; border-radius: 4px; padding: 4px 12px; margin-bottom: 36px; }
        .pl-badge-dot { color: #4ade80; font-size: 12px; }
        .pl-badge-text { color: #6b7280; font-size: 12px; }
        .pl-h1 { color: #f0fdf4; font-size: clamp(40px, 6vw, 72px); font-weight: 700; line-height: 1.1; letter-spacing: -0.04em; margin-bottom: 24px; }
        .pl-h1-green { color: #4ade80; }
        .pl-h1-dim { color: #6b7280; }
        .pl-subtitle { color: #9ca3af; font-size: 18px; line-height: 1.7; max-width: 560px; margin-bottom: 40px; }
        .pl-ctas { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
        .pl-cta-primary { background: #16a34a; color: #fff; border-radius: 6px; padding: 12px 28px; font-size: 15px; text-decoration: none; font-weight: 600; letter-spacing: -0.01em; font-family: inherit; }
        .pl-cta-primary:hover { background: #15803d; }
        .pl-cta-ghost { color: #6b7280; font-size: 14px; text-decoration: none; display: flex; align-items: center; gap: 6px; }
        .pl-cta-ghost:hover { color: #9ca3af; }
        .pl-code-block { margin-top: 64px; background: #0d1a0d; border: 1px solid #1a3a1a; border-radius: 8px; padding: 20px 24px; max-width: 680px; }
        .pl-dots { display: flex; gap: 6px; margin-bottom: 16px; align-items: center; }
        .pl-dot { width: 10px; height: 10px; border-radius: 50%; background: #3f3f3f; display: inline-block; }
        .pl-file { color: #4b5563; font-size: 12px; margin-left: 8px; }
        .pl-pre { font-size: 13px; line-height: 1.7; color: #d1fae5; white-space: pre-wrap; word-break: break-word; font-family: inherit; }
        .pl-kw { color: #6ee7b7; }
        .pl-dim { color: #4b5563; }
        .pl-acc { color: #4ade80; }
        .pl-features { background: #060b06; padding: 96px 24px; border-top: 1px solid #1a2e1a; }
        .pl-section-inner { max-width: 1100px; margin: 0 auto; }
        .pl-eyebrow { color: #4ade80; font-size: 12px; letter-spacing: 0.12em; margin-bottom: 12px; text-transform: uppercase; }
        .pl-h2 { color: #f0fdf4; font-size: clamp(28px, 4vw, 44px); font-weight: 700; letter-spacing: -0.03em; margin-bottom: 64px; }
        .pl-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 24px; }
        .pl-card { background: #0d1a0d; border: 1px solid #1a3a1a; border-radius: 8px; padding: 28px 24px; }
        .pl-card-icon { color: #4ade80; font-size: 20px; margin-bottom: 12px; }
        .pl-card-title { color: #f0fdf4; font-size: 15px; font-weight: 600; margin-bottom: 8px; letter-spacing: -0.01em; }
        .pl-card-desc { color: #6b7280; font-size: 13px; line-height: 1.7; }
        .pl-pricing { background: #0a0e0a; padding: 96px 24px; border-top: 1px solid #1a2e1a; }
        .pl-pricing-inner { max-width: 820px; margin: 0 auto; }
        .pl-pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 24px; }
        .pl-plan { background: #0d1a0d; border: 1px solid #1a3a1a; border-radius: 10px; padding: 32px; }
        .pl-plan-featured { background: #0d200d; border-color: #166534; position: relative; }
        .pl-plan-badge { position: absolute; top: -12px; left: 24px; background: #16a34a; color: #fff; font-size: 11px; font-weight: 600; padding: 2px 10px; border-radius: 20px; letter-spacing: 0.05em; }
        .pl-plan-label { color: #6b7280; font-size: 12px; text-transform: uppercase; letter-spacing: 0.1em; margin-bottom: 8px; }
        .pl-plan-price { color: #f0fdf4; font-size: 40px; font-weight: 700; margin-bottom: 4px; }
        .pl-plan-price span { font-size: 18px; color: #6b7280; }
        .pl-plan-note { color: #4b5563; font-size: 13px; margin-bottom: 28px; }
        .pl-plan-list { list-style: none; margin: 0 0 32px; display: flex; flex-direction: column; gap: 10px; }
        .pl-plan-list li { color: #9ca3af; font-size: 13px; display: flex; gap: 8px; }
        .pl-plan-list li span { color: #4ade80; }
        .pl-plan-btn { display: block; text-align: center; border: 1px solid #1a3a1a; color: #4ade80; border-radius: 6px; padding: 10px 0; font-size: 13px; text-decoration: none; font-weight: 500; font-family: inherit; }
        .pl-plan-btn:hover { background: #0d1f0d; }
        .pl-plan-btn-primary { background: #16a34a; color: #fff; border-color: #16a34a; }
        .pl-plan-btn-primary:hover { background: #15803d; }
        .pl-footer { background: #060b06; border-top: 1px solid #1a2e1a; padding: 32px 24px; text-align: center; }
        .pl-footer p { color: #374151; font-size: 13px; }
        .pl-footer a { color: #4b5563; text-decoration: none; }
        .pl-footer a:hover { color: #6b7280; }
      `}</style>

      <div className="pl-body">
        {/* NAV */}
        <nav className="pl-nav">
          <div className="pl-nav-inner">
            <a href="/" className="pl-logo">
              <span>$ </span>promptlab
            </a>
            <ul className="pl-nav-links">
              <li><a href="#features">docs</a></li>
              <li><a href="#pricing">pricing</a></li>
              <li><a href="https://github.com/SpencerStiles/promptlab">github</a></li>
            </ul>
            <Link href="/dashboard" className="pl-open-btn">
              open_app →
            </Link>
          </div>
        </nav>

        {/* HERO */}
        <section className="pl-hero">
          <div className="pl-hero-inner">
            <div className="pl-badge">
              <span className="pl-badge-dot">●</span>
              <span className="pl-badge-text">MIT licensed · self-hostable</span>
            </div>

            <h1 className="pl-h1">
              <span className="pl-h1-green">engineer</span> your prompts.<br />
              <span className="pl-h1-dim">not just write them.</span>
            </h1>

            <p className="pl-subtitle">
              Version, test, and compare prompts across GPT-4o and Claude side-by-side.
              Track costs per run. Find what actually works.
            </p>

            <div className="pl-ctas">
              <Link href="/dashboard" className="pl-cta-primary">
                Start Free →
              </Link>
              <a href="https://github.com/SpencerStiles/promptlab" className="pl-cta-ghost">
                ★ View on GitHub
              </a>
            </div>

            {/* Code block */}
            <div className="pl-code-block">
              <div className="pl-dots">
                <span className="pl-dot" />
                <span className="pl-dot" />
                <span className="pl-dot" />
                <span className="pl-file">prompt-v3.txt</span>
              </div>
              <pre className="pl-pre">
                <span className="pl-kw">system</span>{': You are a helpful assistant.\n'}
                <span className="pl-dim">{'        specialized in {domain}.\n\n'}</span>
                <span className="pl-kw">user</span>{': Summarize the following in {tone} tone:\n'}
                <span className="pl-dim">{'        {content}\n\n'}</span>
                <span className="pl-acc">▶ GPT-4o</span>
                <span className="pl-dim">{' · 142 tokens · $0.0014 · 890ms'}</span>
              </pre>
            </div>
          </div>
        </section>

        {/* FEATURES */}
        <section id="features" className="pl-features">
          <div className="pl-section-inner">
            <p className="pl-eyebrow">features</p>
            <h2 className="pl-h2">Everything a prompt engineer needs</h2>
            <div className="pl-grid">
              {[
                {
                  icon: '⬡',
                  title: 'Template System',
                  desc: 'Variables with {curly_braces} — define inputs once, test across every variant automatically.',
                },
                {
                  icon: '⇄',
                  title: 'Multi-Model Compare',
                  desc: "Run the same prompt against GPT-4o and Claude simultaneously. See outputs diff'd side-by-side.",
                },
                {
                  icon: '$',
                  title: 'Cost Tracking',
                  desc: 'Per-run token counts and USD cost. Know exactly what each prompt iteration is costing you.',
                },
                {
                  icon: '◷',
                  title: 'Version History',
                  desc: 'Every edit is stored. Roll back to any version, compare diffs, and audit what changed.',
                },
              ].map((f) => (
                <div key={f.title} className="pl-card">
                  <div className="pl-card-icon">{f.icon}</div>
                  <h3 className="pl-card-title">{f.title}</h3>
                  <p className="pl-card-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PRICING */}
        <section id="pricing" className="pl-pricing">
          <div className="pl-pricing-inner">
            <p className="pl-eyebrow">pricing</p>
            <h2 className="pl-h2">Simple. No surprises.</h2>
            <div className="pl-pricing-grid">
              {/* Self-hosted */}
              <div className="pl-plan">
                <p className="pl-plan-label">self-hosted</p>
                <div className="pl-plan-price">$0</div>
                <p className="pl-plan-note">forever. MIT license.</p>
                <ul className="pl-plan-list">
                  {['Full source code access', 'Unlimited prompts & runs', 'All models supported', 'Your own infrastructure', 'Community support'].map((item) => (
                    <li key={item}><span>✓</span> {item}</li>
                  ))}
                </ul>
                <a href="https://github.com/SpencerStiles/promptlab" className="pl-plan-btn">
                  Clone on GitHub →
                </a>
              </div>
              {/* Hosted */}
              <div className="pl-plan pl-plan-featured">
                <div className="pl-plan-badge">HOSTED</div>
                <p className="pl-plan-label">cloud</p>
                <div className="pl-plan-price">$19<span>/mo</span></div>
                <p className="pl-plan-note">no ops, just prompts.</p>
                <ul className="pl-plan-list">
                  {['Everything in self-hosted', 'Managed PostgreSQL', 'Automatic backups', 'Zero-config deploy', 'Email support'].map((item) => (
                    <li key={item}><span>✓</span> {item}</li>
                  ))}
                </ul>
                <Link href="/dashboard" className="pl-plan-btn pl-plan-btn-primary">
                  Get Started →
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="pl-footer">
          <p>
            <span style={{ color: '#4ade80' }}>promptlab</span> · MIT License ·{' '}
            <a href="https://github.com/SpencerStiles/promptlab">github</a>
          </p>
        </footer>
      </div>
    </>
  );
}
