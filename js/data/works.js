/* Tuntematon — single source of truth for site content that appears
   on more than one page: the 8 fixed nav modules (Home grid) and every
   work (Home grid + Works archive). Load this file before js/home.js,
   js/works.js, or js/common.js.

   To add a new work: add one object to workPool below (with a unique
   `tags` array for the Works filter) and drop its photo(s) in
   assets/images/works/. Nothing else needs to change — both pages
   pick it up automatically. */

const infoItems = [
  { "t": "Works", "type": "info", "desc": "Full archive of works, filterable by medium", "href": "works.html" },
  { "t": "About", "type": "info", "desc": "Bio, awards, talks, credits", "href": "about.html" },
  { "t": "Manifesto", "type": "info", "desc": "The artist's statement", "href": "manifesto.html" },
  { "t": "Exhibitions", "type": "info", "desc": "Exhibition history 2025–2026", "href": "exhibitions.html" },
  { "t": "Blog", "type": "info", "desc": "News, press, texts", "href": "blog.html" },
  { "t": "Shop", "type": "info", "desc": "Limited editions and prints", "href": "shop.html" },
  { "t": "Contact", "type": "info", "desc": "Get in touch with the artist", "href": "contact.html" },
  { "t": "Legal", "type": "info", "desc": "Legal information", "href": "legal.html" }
];

/* Order matters for two independent reasons:
   1. Home's "50/50 recent vs. rest" pick treats EARLIER entries as
      "more recently added" (js/home.js, pickWorks()) — add new works
      to the FRONT of this array, not the end.
   2. Otherwise cosmetic — Works archive filtering doesn't care about
      order.
   `tags` values (kept in one place here now) drive the medium filter
   on works.html — see README.md, "Decisions made but not yet
   re-validated", re: whether this taxonomy is final. */
const workPool = [
  {
    "t": "AUTOMATIC PORTRAIT",
    "type": "work",
    "meta": "2020–2026 · paper, print, intervention",
    "desc": "Tuntematon opens a new direction: prompt art. Why create an image, if you can create the instruction for its appearance? Brushes and paints become redundant. A prompt doesn't describe a picture — it contains it. Any generation from this prompt is only a sketch, approaching an ideal that will never be reached. But the ideal itself is already here, in the text. Prompt art is an art without an object, existing in standby mode. It requires the viewer not as a witness, but as an accomplice, ready to complete what's absent. In this sense Tuntematon doesn't refuse the image — he postpones it. Forever.",
    "ph": "#f2f2ef",
    "img": "assets/images/works/automatic-portrait.jpg",
    "tags": ["intervention"]
  },
  {
    "t": "Old Church — Saint Begnet's Church, Dalkey Island",
    "type": "work",
    "meta": "2026 · kraft paper, pastel, 11.5 × 17.5 cm · private collection",
    "desc": "Without a gilded roof, praying is even easier — fewer obstacles between you and the addressee. But you'll have to put up with the rain.",
    "ph": "#c9a876",
    "img": "assets/images/works/saint-begnets-church.jpg",
    "tags": ["painting"]
  },
  {
    "t": "STAND NUMBER ZERO",
    "type": "work",
    "meta": "2026 · Cosmoscow art fair (VIP preview day)",
    "desc": "On the VIP preview day of Cosmoscow, the artist rented 25 square meters of empty space through a proxy. White walls. No objects. No price tags. The booth is occupied but it's empty — not for sale, not insured, not listed in the catalog. Participation in the form of total absence. At a fair where everything has a price, emptiness is the only priceless exhibit, even if everybody misses it.",
    "ph": "#e5e5e3",
    "img": "assets/images/works/stand-number-zero.jpg",
    "tags": ["intervention"]
  },
  {
    "t": "Broken Fountain",
    "type": "work",
    "meta": "1917–2025 · ready-made, mixed media",
    "desc": "A urinal wrapped in a black plastic bag. A direct quote of Duchamp's \"Fountain.\"",
    "ph": "#5a5650",
    "gallery": [
      "assets/images/works/broken-fountain/01.jpg",
      "assets/images/works/broken-fountain/02.jpg"
    ],
    "img": "assets/images/works/broken-fountain/01.jpg",
    "tags": ["ready-made"]
  },
  {
    "t": "Hidden Protocol 11-25",
    "type": "work",
    "meta": "2025 · site-specific installation",
    "desc": "Red corrugated tubing on a wall painted the same color.",
    "ph": "#7a2e24",
    "img": "assets/images/works/hidden-protocol-11-25.jpg",
    "tags": ["installation"]
  },
  {
    // Kept as photographed — the signs in the photo are physically in
    // Russian, so this can't be "translated" without restaging the work.
    "t": "This Is Not Art",
    "type": "work",
    "meta": "site-specific, objects",
    "desc": "Two blue diamond road signs in an empty winter field. [RU signage — see note]",
    "ph": "#c9d3dc",
    "img": "assets/images/works/this-is-not-art.jpg",
    "tags": ["object", "intervention"]
  },
  {
    "t": "OKPAIIIEHO!!!",
    "type": "work",
    "meta": "2026 · street intervention",
    "desc": "Paper notices on city railings, mimicking wet-paint warning stripes with no real paint.",
    "ph": "#dedad2",
    "img": "assets/images/works/wet-paint.jpg",
    "tags": ["intervention"]
  },
  {
    "t": "Almost Black Square",
    "type": "work",
    "meta": "2025 · relief + performance",
    "desc": "A grid of small black wooden cubes forming a near-suprematist square.",
    "ph": "#161513",
    "videoUrl": "https://disk.yandex.ru/i/BSHO5lIsKS3obA",
    "tags": ["installation", "performance"]
  },
  {
    "t": "I CAN'T SEE YOU",
    "type": "work",
    "meta": "2025 · IMMA, Dublin",
    "desc": "The artist stands with his back to the museum, head buried in a boxwood hedge.",
    "ph": "#4c5f3d",
    "img": "assets/images/works/i-cant-see-you.jpg",
    "tags": ["performance"]
  },
  {
    "t": "WHO IS MR TUNTEMATON? (STEP INTO ART)",
    "type": "work",
    "meta": "2025 · URALRUIN",
    "desc": "A floor mural in a former felt-boot factory. Each participant painted one \"pixel\" — a crude \"digitized\" copy of a Petrov-Vodkin painting.",
    "ph": "#8c7a5a",
    "img": "assets/images/works/who-is-mr-tuntematon.jpg",
    "videoUrl": "https://drive.google.com/file/d/1QHigf6gd-v9Yg4QqbHaVl-Psz5m9uen6/view?usp=drive_link",
    "tags": ["performance"]
  },
  {
    "t": "I Am Not Here",
    "type": "work",
    "meta": "2025 · ARTPLAY",
    "desc": "A ready-made intervention about the invisible wait for catastrophe.",
    "ph": "#8a8a86",
    "img": "assets/images/works/i-am-not-here.jpg",
    "tags": ["ready-made"]
  },
  {
    "t": "Interim Inspection Report No. 0126—12/1702",
    "type": "work",
    "meta": "2026 · Podolsk railway station",
    "desc": "The artist, acting as registrar, documents a column's surface: cracks, rust, patches of paint — framed as an inspection protocol.",
    "ph": "#c7c2ba",
    "gallery": [
      "assets/images/works/interim-inspection-report/01.jpg",
      "assets/images/works/interim-inspection-report/02.jpg",
      "assets/images/works/interim-inspection-report/03.jpg",
      "assets/images/works/interim-inspection-report/04.jpg",
      "assets/images/works/interim-inspection-report/05.jpg",
      "assets/images/works/interim-inspection-report/06.jpg",
      "assets/images/works/interim-inspection-report/07.jpg",
      "assets/images/works/interim-inspection-report/08.jpg"
    ],
    "img": "assets/images/works/interim-inspection-report/01.jpg",
    "tags": ["public-art"]
  },
  {
    "t": "WET PAINT",
    "type": "work",
    "meta": "2016 · canvas, non-drying oil paint, 60×40 cm",
    "desc": "The words \"WET PAINT\" written in paint that will never dry. An unfinished piece of art that still leaves a mark.",
    "ph": "#e8e6e1",
    "gallery": [
      "assets/images/works/wet-paint-painting/01.jpg",
      "assets/images/works/wet-paint-painting/02.jpg"
    ],
    "img": "assets/images/works/wet-paint-painting/01.jpg",
    "tags": ["painting"]
  }
];
