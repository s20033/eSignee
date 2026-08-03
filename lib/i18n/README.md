# i18n

Phase 5 scaffold — structure only, per the roadmap. Not wired into any page
yet. `getDictionary(locale)` returns a typed `Dictionary` for `"en"` or
`"pl"`; both dictionaries currently cover a small representative slice
(nav labels, a few auth strings) to prove the shape works, not the whole
app's copy.

To actually localize a page: import `getDictionary`, call it with the
tenant's `defaultLocale` (added in Phase 1, not yet read by anything), and
replace hardcoded strings with `dictionary.section.key` lookups. Extending
the dictionary itself: add the key to `Dictionary` in `types.ts` first —
TypeScript will then require both `dictionaries/en.ts` and
`dictionaries/pl.ts` to provide it, so the two can't drift apart.
