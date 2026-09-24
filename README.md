# Tuntematon — artist portfolio site

Portfolio site for **Tuntematon**, an anonymous conceptual artist. Built as
a static site: plain HTML, CSS, and vanilla JavaScript — no framework, no
build step, no dependencies.

The whole site is a design experiment in binaries — yes/no, order/chaos,
known/unknown — which shows up literally in the Home page's interaction
model (see below). Read this file before changing anything; several
choices that look like arbitrary constraints (fixed 240px modules, exactly
two typefaces, black/white only) are deliberate and documented in more
detail in `design-system.md` and `TZ-sait-hudozhnika.md` if those files
travel with this handoff — check the repo root for them.

## What this site is

- **Home (`index.html`)** is not a landing page — it's a grid of square
  modules, edge-to-edge, no gaps. Eight are fixed navigation modules
  (Works, About, Manifesto, Exhibitions, Blog, Shop, Contact, Legal);
  eight more are individual works, randomly selected from the pool on
  every load. Position and (for nav modules) background color reshuffle
  on every page load — the site is meant to look different every time
  you open it, while critical navigation stays findable (fixed labels,
  fixed set of nav items, alternating info/work layout).
- **A work has no separate detail page.** Clicking a work module opens a
  pop-up — that pop-up *is* the work's entire presentation (title, year,
  medium, status, description, photo(s)). This applies both on Home and
  on the Works archive page.
- Two typefaces only, everywhere: **Press Start 2P** (pixel font, for all
  headings and module titles) and **PT Mono** (body copy, descriptions,
  long text). This is intentional — do not add other typefaces without
  checking with the team first.
- English is the site's language, with one deliberate exception: "This
  Is Not Art" (photographs of real Russian-language road signs) keeps
  its original Russian, because it documents a real object rather than
  a translatable text — see the comment next to that entry in
  `js/data/works.js`. (The painting "ОКРАШЕНО" was retitled "WET PAINT"
  by the artist with new English-language photography — it's no longer
  an exception.)

## Current structure

```
index.html            Home — the module grid
works.html             Works archive, filterable by medium
about.html              Bio, awards, talks, credits
manifesto.html           Artist's statement
exhibitions.html          Exhibition history
blog.html                 Links out to the Telegram fan channel (see "Blog page" below — a true embed doesn't work)
shop.html                   Limited editions / prints (placeholder data)
contact.html                  Single email contact
legal.html                     Imprint / privacy / copyright (placeholder)

css/
  style.css              Single shared stylesheet for the whole site

js/
  data/works.js          Single source of truth: the 8 nav modules and
                          every work. Both home.js and works.js load
                          this and use it directly — see "Info-module
                          vs. work-module rendering" below.
  common.js              Shared utilities + the WorkPopup module (the
                          pop-up used by both Home and Works, including
                          the photo carousel — see "Photo carousel" below)
  home.js                 Home page: grid render logic (data comes from
                          js/data/works.js)
  works.js                 Works page: filter + grid render logic (data
                          comes from js/data/works.js)
  shop.js                   Shop page: placeholder catalogue + its own
                             simple pop-up (does not use WorkPopup)

assets/images/
  works/                  One representative photo per work
  works/interim-inspection-report/
                          8-photo gallery — the only work currently
                          wired up to the multi-photo carousel (see below)
```

No `about.js` / `manifesto.js` / etc. — those pages are static HTML, no
interactivity needed.

### Photo carousel

`js/common.js` → `WorkPopup` supports a work having either a single `img`
or a `gallery` (array of image paths). If `gallery.length > 1`, the pop-up
shows carousel arrows in the margins on either side of the photo (not
overlaid on top of it — this was a deliberate revision, see git history /
prior design notes if they travel with this handoff) and dot indicators
below the photo (Instagram-style: filled = current, hollow = others,
clickable). The same carousel also works in the fullscreen photo view
(tap the photo to open it full-screen; arrows/dots persist there too).

Currently only **Interim Inspection Report No. 0126—12/1702** has a
`gallery` (all 8 submitted photos). Every other work has a single `img`.
Wiring up more galleries is just a data change in `js/data/works.js`
(add a `gallery` array, drop images in
`assets/images/works/<slug>/`) — no new code needed.

### Info-module vs. work-module rendering

Both `infoItems` and `workPool` live in `js/data/works.js`. An info item
needs `type: "info"` and `href` (the page it links to). A work needs
`type: "work"`, `ph` (a hex fallback color used before the photo loads /
if it fails), `tags` (drives the medium filter on works.html), and
either `img` or `gallery`. Add a new work once, in that one file — both
`home.js` and `works.js` pick it up automatically.

### Blog page

An earlier version tried to embed the Telegram channel live, via an
`<iframe>` pointed at Telegram's own preview page (`t.me/s/...`).
**Telegram blocks this** — the preview page sends response headers
(`X-Frame-Options` / CSP `frame-ancestors`) that tell the browser to
refuse framing it from another site. This isn't a bug in our code and
isn't fixable with a plain iframe; the browser shows something like
"t.me refused to connect" instead of the feed, on every visit, in every
browser. `blog.html` now just links out to the channel instead of
pretending to embed it.

If a real embedded feed matters enough to be worth the extra
complexity, two options actually work:

1. **Telegram's official single-post widget**
   (`https://telegram.org/js/telegram-widget.js?22` with
   `data-telegram-post="tuntematon_art/<message id>"`). This is a
   different, Telegram-sanctioned embed mechanism (unlike raw framing of
   `t.me/s/`) and it does render. The catch: it embeds specific posts by
   ID, not a continuously live feed — someone (or an agent) has to look
   up new post IDs and add them by hand each time. Good for a "recent
   highlights" strip, not a true live feed.
2. **A small serverless proxy** (a single Cloudflare Worker / Vercel
   function) that fetches `t.me/s/tuntematon_art` server-side and
   returns the content for our page to render itself. Server-to-server
   fetches aren't subject to the browser's framing restriction, so this
   gives a genuinely live feed — at the cost of introducing the site's
   first piece of backend infrastructure, which the rest of this project
   deliberately avoids (see `package.json` / "Technologies" above).
   Worth it only if the live-ness is actually important to the team.

## Technologies

Plain HTML5, CSS3 (custom properties not currently used — flat values
throughout), vanilla ES6 JavaScript. Two Google Fonts (Press Start 2P, PT
Mono) loaded via `@import` in `css/style.css`. No npm dependencies are
required to run the site; `package.json` (if present) only offers a
convenience script for a local static server.

## Running locally

Any static file server works. From the project root:

```
npx serve .
```

or, with no Node installed:

```
python3 -m http.server 8000
```

Do **not** open `index.html` directly via `file://` — inter-page links
(`href="works.html"` etc.) and the module grid work fine that way, but
some browsers restrict other local-file behavior over `file://`; serving
over `http://localhost` avoids surprises and matches how it'll actually
be deployed.

## Open items for future agents

Roughly in order of how blocking they are:

1. **Real content still missing:**
   - About page: sections for performance-documentation videos, awards,
     and talks & teaching were removed entirely (not just placeholders)
     since there was no content — re-add them once the artist supplies
     something. The site-developer line in Credits is still a
     placeholder ("TBD").
   - Legal page: Imprint and Privacy Policy now have real text from the
     artist's representative (see `legal.html`) — still worth a
     jurisdiction check / lawyer review before launch, but no longer
     placeholder copy.
   - Shop page: all three items are fake placeholder data, kept as-is
     for now on purpose — real editions will be added incrementally.
     Real pricing and a purchase flow (external link vs. built-in
     checkout — undecided) are still needed once there's real inventory.

2. **Confirmed / resolved — no longer open:**
   - The set of 8 nav modules is final.
   - "Site-specific / public" showings stay separate from the formal
     exhibition list on `exhibitions.html`, as currently built.
   - The medium-filter taxonomy on `works.html` is confirmed as-is.
   - Module reshuffle happens only on page load — no timer-based
     reshuffle.
   - The "recent" half of the 50/50 work-module pick reads from the
     **front** of `workPool` (`js/data/works.js`) — when adding a new
     work, add it at the top of the array, not the bottom. This is
     enforced in `js/home.js`'s `pickWorks()` and documented in a
     comment at the top of `workPool`.

3. **Code-quality follow-ups, not urgent:**
   - `shop.js` has its own small pop-up instead of reusing `WorkPopup` —
     intentional for now since shop items aren't works, but worth
     reconsidering once real purchase-flow requirements exist.
   - No automated tests, no linting config. If this project graduates to
     a real build pipeline, `eslint` + `stylelint` with a plain config
     would be enough — no need for anything heavier given the site's
     size.
