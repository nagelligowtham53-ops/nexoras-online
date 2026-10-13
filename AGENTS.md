# Architecture rules

- Link founder Person and Organization structured data through stable canonical `@id` values, and keep those relationships consistent with visible About content so search engines receive one unambiguous identity.
- Keep Google Gen AI access in the shared server-only Gemini module, with endpoint authentication and database-backed per-user limits; this prevents secret exposure and divergent error handling.
- Default existing AI entry points to the explicitly configured Gemini model after verified failure of legacy integrations, while retaining explicit Groq and BYO provider branches; never silently fail over between providers.
- Gemini presentation settings never persist or transmit a browser-supplied key; the shared server credential is the only supported Gemini credential.