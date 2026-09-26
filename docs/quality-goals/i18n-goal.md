Make the software capable of supporting different languages, regions and
cultural conventions without forcing the application into an unnecessarily
elaborate internationalisation architecture.

Look for assumptions that accidentally make the product specific to one
language, locale or cultural convention.

Pay particular attention to:

- user-visible strings embedded directly in application logic;
- string concatenation that will break grammar in other languages;
- pluralisation;
- gender or grammatical assumptions;
- dates and times;
- time zones;
- numbers and decimal separators;
- currencies;
- names and addresses;
- sorting and comparison;
- text expansion and contraction;
- right-to-left layouts where relevant;
- images or icons containing language;
- server-generated and client-generated messages;
- emails, notifications, PDFs and exported data;
- accessibility labels that also require translation.

Do not internationalise things that are genuinely internal and will never be
shown to users.

Do not turn every constant into a translation key.

Do not create layers of abstraction merely because they might theoretically be
useful for a future language.

Prefer boundaries that make localisation obvious:

- UI copy belongs in localisation resources;
- domain identifiers remain stable;
- formatting goes through locale-aware formatting functions;
- APIs transport semantic values rather than already-formatted display strings.

Check whether translations have enough contextual information to be translated
correctly.

Avoid translation keys such as:

`common.message_17`

Prefer keys or structures that preserve meaning.

When reviewing existing architecture, ask:

> If we added a substantially different language tomorrow, what would actually
> break?

Fix those boundaries.

The desired result is not "every string goes through i18n".

The desired result is:

> Language and locale are presentation concerns rather than assumptions
> embedded throughout the software.
