# Discoverability audit — 29 September 2026

## Live baseline

- `https://drone.actuallymaybe.com/` returns HTTP 200, but its initial HTML is only an empty `#app` element. The lesson and its chapter links require JavaScript to appear.
- The fourteen chapters use fragment routes such as `/#/ch/0`. These are not independent, indexable document URLs.
- `/robots.txt` and `/sitemap.xml` return HTTP 404.
- The initial document has a title and description, but no canonical URL, social preview metadata, or structured data.
- HTTP redirects to HTTPS. Unknown paths return real 404 responses.
- The new `drone` TXT verification record made the parent domain's wildcard address inapplicable
  to this name. Vercel's authoritative nameservers initially returned no A record even though
  the local resolver still had a cached address. Google reported a DNS error and could not fetch
  the sitemap. An explicit `drone` A record to Vercel (`76.76.21.21`) fixes the authoritative
  answer; resolver caches may take time to refresh.

## Goal

Expose a readable, useful HTML overview and a stable URL for each chapter, generated from the existing ten locale files. Keep the interactive lesson as the primary experience. Publish a sitemap and robots rules, add metadata and structured data, then submit the sitemap to the search consoles and verify the deployed responses.

## References

- [Google's JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics) recommends server-side rendering or prerendering for JavaScript sites and cautions against fragment-based routing for content discovery.
