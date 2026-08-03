export const LOCALES = ["en", "pl"] as const;
export type Locale = (typeof LOCALES)[number];

/**
 * Structure only, per the roadmap — this shape covers a representative
 * slice of the app (nav + a couple of auth strings) to prove the pattern
 * works end to end. It does not replace any hardcoded copy in the app yet;
 * that's a separate, much larger effort (every page/component would need
 * to swap literal strings for dictionary lookups). `tenants.defaultLocale`
 * (added in Phase 1) is the intended source for which dictionary a tenant
 * gets, once that wiring happens.
 */
export type Dictionary = {
  nav: {
    dashboard: string;
    employees: string;
    documents: string;
    templates: string;
    settings: string;
  };
  auth: {
    signIn: string;
    signUp: string;
    email: string;
    password: string;
  };
};
