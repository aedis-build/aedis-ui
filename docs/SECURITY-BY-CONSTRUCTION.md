# Security by construction

How Aedis UI treats each class of attack a browser application faces, what it cannot treat and leaves to the
backend, and how the repository meets level **L3 Regulated** of the [Aedis Platform conformance levels](https://github.com/aedis-build/aedis-platform/blob/main/docs/conformance.md).

## Principle: defense at the sink, never a string filter

Like [aedis-dotnet](https://github.com/aedis-build/aedis/blob/main/docs/INJECTION-DEFENSE.md), there is no
"sanitize everything" layer: a filter does not know where a string goes and would corrupt legitimate data. A UI owns
four sinks, and each one defends itself:

| Sink | Defense | Where |
|---|---|---|
| **DOM** (what is shown) | React escapes text; markdown renders without raw HTML and with safe link protocols; hidden code points are removed | `Markdown`, `Chat`, `ApprovalCard`, `HandRaise`, `untrusted` |
| **Transport** (what is sent to the backend) | same-origin paths only, redirects refused, custom header for CSRF, JSON only, timeout | `api` |
| **Session** (what the browser holds) | nothing readable by script: the session is an HttpOnly cookie; idle timeout; `no-store`; opener isolation | `api`, `useIdleTimeout`, `securityHeaders` |
| **Input** (what a person types) | length limits by default; hidden code points removed before anything reaches an agent | `Input`, `Textarea`, `Chat`, `HandRaise`, `ApprovalCard` |

Components take **content as props and render it as data**. There is no prop that accepts markup, and
`dangerouslySetInnerHTML` is forbidden by SAST.

## How each attack is treated

| Attack | Resolved at | How in Aedis UI | Status |
|---|---|---|---|
| **XSS / HTML injection** | DOM | React escaping; `Markdown` ignores raw HTML (no rehype-raw), `safeUrl` keeps only http, https, mailto and relative links; images off by default; SAST forbids `dangerouslySetInnerHTML` and rehype-raw | ✅ structural |
| **Prompt injection, hidden** (Unicode tags, zero-width text, bidi overrides that make a person read one thing while the agent reads another) | DOM and input | `stripInvisible` on everything the components show and on everything they send: chat drafts, hand-raise answers, change requests | ✅ default |
| **Prompt injection, visible** | agent layer | Out of the UI's reach: it cannot tell an instruction from data. The UI makes the boundary visible: agent output is rendered as data, actions that leave the company go through an `AlertDialog` that starts on Cancel, a "lasting rule" answer says so before it is sent. Guardrails live in the agent (see `Aedis.AI`: tool input is untrusted) | ✅ boundary · agent for the rest |
| **Session hijacking / token theft** | server + browser | Session in an HttpOnly, Secure, SameSite cookie set by the backend; streams that need a bearer go through `bffStream`, which adds it on the server; no token ever in script, storage or URL (SAST rule); `api()` sends credentials only same-origin and refuses redirects; `Cross-Origin-Opener-Policy`; `Cache-Control: no-store`; `useIdleTimeout` ends idle sessions; revocation stays on the server (aedis-dotnet denylist by `jti`) | ✅ default |
| **Unprotected Server Actions** (every action is a public POST endpoint, including ones no screen calls) | server | `secureAction`: authorization is a required argument and runs inside the action, then rate limit, size limit and Standard Schema validation; the client gets a code, never the error message; `server-only` import, `taintSecret` for tokens; guide for `allowedOrigins` and `bodySizeLimit` | ✅ structural |
| **CSRF** | server, helped by the browser | `api()` always sends `X-Requested-With`, which a cross-site form cannot; with SameSite cookies a backend that requires it is covered. Double-submit token through `csrfCookie` when the backend uses one | ✅ default |
| **Clickjacking** | response headers | `frame-ancestors 'none'` and `X-Frame-Options: DENY` from `securityHeaders` | ✅ default |
| **Unbounded input** (fields without a limit, memory and storage abuse) | input | `Input` text-like types default to 256 characters, `Textarea` to 4000, `Chat` composer to 8000; the limit can be changed, not removed; raw `<input>`/`<textarea>` flagged by SAST | ✅ default |
| **Open redirect / link injection** | DOM and transport | `safeUrl` drops `javascript:`, `data:`, `vbscript:`; external links get `rel="noopener noreferrer"`; `api()` refuses absolute and protocol-relative paths | ✅ structural |
| **Browser-side SSRF / data exfiltration** | transport | `api()` and `connectEventStream()` only reach this origin (and the stream refuses a token in the query string); `connect-src 'self'` in the CSP blocks everything else, including a compromised dependency phoning home | ✅ default |
| **Denial of service against the client** | transport | 30 s timeout on every call; the event stream parser bounds event and connection size, ignores malformed JSON and unknown event types, and backs off with a cap; bounded inputs | ✅ default |
| **CSS injection through a theme** (an imported or shared theme closing a rule, `@import`, `url()` exfiltration, hiding safety cues, unreadable text) | style | A theme is typed data, never CSS: `custom-theme` accepts colors only as hex or `oklch()` and numbers within ranges, writes every value back in canonical form, applies it with `style.setProperty` one variable at a time, refuses any theme that fails contrast AA or makes destructive look like primary, allows only system fonts, and validates stored themes again on load | ✅ structural |
| **Supply chain** | repository and install | Registry items depend only on Aedis items; exact versions, frozen lockfile, Dependabot with cooldown, actions pinned by SHA, signed and attested release of the registry. `@aedis/cli` verifies that attestation (Sigstore, this repository's release workflow or the platform builder it calls, this tag, the archive's sha256) before writing any file, installs npm dependencies at exact versions at least 7 days old by the npm registry's own dates, runs no install scripts and writes only inside the project; it is published with npm Trusted Publishing and provenance | ✅ process |
| **Information disclosure** | response headers | `Referrer-Policy`, `no-store`, `nosniff`; components show generic errors, never the server's message | ✅ default |

### What the UI cannot do

The browser is the attacker's machine. Everything above makes exploitation harder and keeps the honest client
honest; the decision stays on the server. The backend must: set the session cookie `HttpOnly; Secure;
SameSite=Strict` (or `Lax` plus the custom header check), verify authorization on every call, rate-limit and
revoke sessions, validate every field again with its own limits, and keep prompt-injection guardrails in the agent.
aedis-dotnet does this by default (`AedisApiHost`, `Aedis.Security`, `Aedis.AI`).

## MITRE ATT&CK and ATLAS coverage

| Technique | Treatment in Aedis UI |
|---|---|
| **T1189** Drive-by Compromise · **T1059.007** JavaScript | CSP with nonce and `strict-dynamic`, no inline script, no eval, no plugins |
| **T1185** Browser Session Hijacking · **T1539** Steal Web Session Cookie | HttpOnly cookie, nothing in storage, same-origin transport, COOP, idle timeout |
| **T1557** Adversary-in-the-Middle | HSTS with preload, `upgrade-insecure-requests` |
| **T1566.002** Phishing: Spearphishing Link | `safeUrl`, `noopener`, links inside agent output are visibly external |
| **T1195** Supply Chain Compromise | pinned dependencies, frozen lockfile, Dependabot, SHA-pinned actions, attested release |
| **T1499** Endpoint Denial of Service | timeouts, bounded inputs, ignored malformed events |
| **ATLAS AML.T0051.001** LLM Prompt Injection: Indirect (hidden text) | `stripInvisible` at render and before send |
| **ATLAS AML.T0051** LLM Prompt Injection (visible) | boundary only: agent output as data, confirmation before outbound actions; the rest belongs to the agent layer |

## L3 Regulated in this repository

| Requirement | How it is met |
|---|---|
| Scorecard checks under the process at 10 | `permissions: {}` at the top of every workflow, actions pinned by SHA, no binaries, Dependabot, `SECURITY.md`, `LICENSE` + REUSE, SAST and CodeQL on every PR, branch ruleset as code (`.github/rulesets/main.json`), attested release (`release.yml`, through the platform's `release-registry-js.yml`, SLSA Build L3), property-based tests with **fast-check** (Fuzzing) |
| Best Practices gold | criteria tracked by `aedis org audit`; this repository ships the files and workflows the audit checks |
| Coverage ≥ 85 % lines, ≥ 70 % branches, no regression | the platform's `coverage-js.yml` gate at **95 / 85** (the same bar as the .NET framework), `coverage-summary` artifact in the platform contract, no-regression against the last green run |
| PLT-13 SAST gate | the platform's `sast.yml`: Semgrep public rulesets for JS/TS/React/Next plus the shared Aedis rules (`aedis.dangerously-set-inner-html`, `aedis.rehype-raw`, `aedis.secret-in-web-storage`, `aedis.fetch-credentials-include`, `aedis.raw-text-field`); CodeQL `security-extended` |
| PLT-14 DAST gate | OWASP ZAP baseline against the built site and registry on every PR (`aedis-ci.yml`), `dast-summary` artifact |
| PLT-10 production only by PR with review | `main` ruleset: linear history, 1 approval, code owners, required checks, squash; Pages deploys from `main` only |
| PLT-21 evidence retained | `coverage-summary`, `sast-summary`, `dast-summary` and `scorecard` artifacts on every run |
| PLT-19 attestation verified at admission · PLT-16 drift report · PLT-20 WAF | **not applicable**: this repository ships source files, not a container image or an API. The app that consumes the registry runs on the platform, which applies them |

## Checklist for an app built with Aedis UI

- [ ] Session in an `HttpOnly; Secure; SameSite` cookie set by the backend; never a token in script, storage or URL.
- [ ] Backend requires `X-Requested-With` (or a double-submit token) on every mutating route.
- [ ] `securityHeaders({ nonce })` applied from the framework's middleware; the nonce is passed to the framework's scripts and to `ScrollArea`, whose scrollbar style is an inline `<style>` element.
- [ ] `useIdleTimeout` wired to a sign-out that revokes the session on the server.
- [ ] Every call to the backend goes through `api()`; every text field is an Aedis `Input` or `Textarea` with a limit that matches the server's.
- [ ] Agent and user text rendered through `Markdown` or as plain text, never as markup.
- [ ] Actions that leave the company go through `AlertDialog` or `ApprovalCard`.
- [ ] The app's CI is the platform's `app-ci.yml` with `language: node`, so the shared SAST rules, the coverage gate and DAST run without glue in the app.
