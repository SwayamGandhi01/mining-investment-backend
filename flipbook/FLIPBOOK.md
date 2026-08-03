# Flipbook — how it works

A book-style PDF reader: pages turn with a real page-flip animation instead of
scrolling. Ported from the `Mining-Discovery-new` repo (`feature/changes` branch,
`src/components/FlipbookViewer.tsx`) and adapted for Next.js App Router + React 19.

Implementation: [`FlipbookViewer.tsx`](./FlipbookViewer.tsx)

---

## 1. The short version

There is no PDF-flipping library. The effect is two libraries stacked:

| Library | Version | Job |
| --- | --- | --- |
| `react-pdf` (wraps Mozilla's pdf.js) | `^10.4.1` | Turns each PDF page into a `<canvas>` image |
| `react-pageflip` (wraps `page-flip`) | `^2.0.3` | Takes those canvases as children and animates the page turn |

So the pipeline is:

```
PDF URL
  └─> <Document file={pdfUrl}>          ← react-pdf downloads + parses the PDF
        └─> <HTMLFlipBook>              ← react-pageflip owns the animation
              ├─ <div><Page 1 /></div>  ← each child is one physical page
              ├─ <div><Page 2 /></div>
              └─ …
```

`HTMLFlipBook` does not know what a PDF is. It just sees a list of fixed-size
`<div>`s and flips between them. You could put images or plain HTML in there and it
would behave identically. Everything PDF-specific happens inside `<Page>`.

---

## 2. The two rendering modes

The component picks a mode from viewport width and re-checks on every resize.

**Desktop (≥ 768px)** — real flipbook. `HTMLFlipBook` renders a two-page spread with
`showCover`, so page 1 sits alone as a cover and pages 2/3, 4/5 … pair up as spreads.
Users can drag a page corner, click, or use the Previous/Next buttons.

**Mobile (< 768px)** — the flip animation is dropped entirely. A single `<Page>` is
rendered and Previous/Next just move a `currentPage` counter. This is deliberate: a
two-page spread is unreadable on a phone, and the flip gesture fights with scrolling.

This is why there are two parallel sets of navigation state — see §4.

---

## 3. Page sizing

`getResponsivePageSize()` computes a pixel width/height on every resize:

1. Pick a base width by breakpoint — `<480px`: up to 280px, `<768px`: up to 360px,
   desktop: up to 420px, or half the viewport minus gutters, whichever is smaller.
2. Height = width × **1.414** (√2, the ISO 216 / A4 paper ratio — this is what makes
   it read as a page rather than a box).
3. If that height overflows the viewport (`viewportHeight − 280px` of chrome), clamp
   the height and back-solve the width from the same ratio so the proportion holds.

The result is passed to *both* `HTMLFlipBook` (as `width`/`height`) and each `<Page>`
(as `width`). They must agree — `HTMLFlipBook` uses `size="fixed"`, so if the canvas
were a different size than the page container the spread would tear or clip.

---

## 4. State

| State | Meaning |
| --- | --- |
| `numPages` | Total pages, from pdf.js after the PDF loads |
| `rawIdx` | **Desktop only.** Index of the left-hand page of the current spread, reported by `HTMLFlipBook`'s `onFlip` |
| `currentPage` | **Mobile only.** 1-based page number, driven by the buttons |
| `visiblePageCount` | How many pages have been handed to the flipbook so far (see §5) |
| `loading` / `error` / `loadProgress` | Download + parse status of the PDF itself |
| `isMobile` / `pageSize` | Viewport-derived layout |

`rawIdx` and `currentPage` are intentionally separate. `HTMLFlipBook` owns its own
internal page position and only *reports* it via `onFlip` — you cannot drive it by
setting state. Mobile has no flipbook instance, so it needs a counter the component
actually controls. `goNext`/`goPrev` branch on `isMobile` for exactly this reason:

```tsx
const goNext = useCallback(() => {
  if (isMobile) {
    setCurrentPage((prev) => Math.min(numPages, prev + 1));  // we own the position
    return;
  }
  bookRef.current?.pageFlip()?.flipNext();                   // the library owns it
}, [isMobile, numPages]);
```

`bookRef.current.pageFlip()` reaches the underlying `page-flip` instance. It is
`undefined` until the book mounts, hence the optional chaining.

---

## 5. Progressive page loading (the important perf trick)

Rendering every page of a 100-page PDF to canvas up front would freeze the tab for
seconds. Instead the component starts with **2** pages and adds 2 more every 120ms:

```tsx
useEffect(() => {
  if (isMobile || visiblePageCount >= numPages) return;

  const timer = window.setTimeout(() => {
    setVisiblePageCount((prev) => Math.min(numPages, prev + PAGE_BATCH_SIZE));
  }, PAGE_BATCH_DELAY_MS);

  return () => window.clearTimeout(timer);
}, [isMobile, numPages, visiblePageCount]);
```

The effect re-triggers itself through its own `visiblePageCount` dependency, so it
walks up to the full count and then stops (the guard returns early once
`visiblePageCount >= numPages`). The first spread is interactive almost immediately
while the rest fills in behind the reader.

**Trade-off to know about:** the page count grows *while the book is mounted*.
`react-pageflip` re-initialises when the number of children changes, so on a very
large PDF a user flipping fast during the first second may see the book settle. Raise
`PAGE_BATCH_SIZE` or drop `PAGE_BATCH_DELAY_MS` to shorten that window at the cost of
a heavier initial render. Mobile skips this entirely — it renders one page on demand.

---

## 6. The pdf.js worker

pdf.js parses PDFs in a Web Worker. That worker file has to be reachable at runtime:

```tsx
const PDF_WORKER_SRC = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;
```

Two rules, both from the react-pdf docs, both easy to get wrong:

1. **`workerSrc` must be set in the same module that renders `<Document>`/`<Page>`.**
   Putting it in a layout, a provider, or an `_app`-style file can get overwritten
   back to the default depending on module execution order.
2. **`new URL(..., import.meta.url)`** lets the bundler resolve the worker out of
   `node_modules` and emit it as an asset — nothing needs to be copied into
   `public/`. (The original Vite repo instead committed the worker to
   `public/pdf.worker.min.mjs` and hardcoded `"/pdf.worker.min.mjs"`. That still
   works if your bundler chokes on `new URL` asset imports — just swap the constant.)

---

## 7. Next.js: this component cannot be server-rendered

pdf.js touches browser-only globals, so the module must never execute on the server.
Load it with `ssr: false` from a **Client Component** — per the Next 16 docs,
`ssr: false` is not allowed in a Server Component:

```tsx
"use client";
import dynamic from "next/dynamic";

const FlipbookViewer = dynamic(
  () => import("@/components/flipbook/FlipbookViewer"),
  { ssr: false, loading: () => <p>Loading reader…</p> }
);

export default function BrochureReader({ brochure }) {
  return (
    <FlipbookViewer
      title={brochure.title}
      subtitle={brochure.publishDate}
      pdfUrl={brochure.pdfUrl}
      coverImageUrl={brochure.coverImage}
      onBack={() => router.back()}
    />
  );
}
```

Skipping the `ssr: false` will surface as a build/runtime error about `DOMMatrix`,
`window`, or `Promise.withResolvers` being undefined.

---

## 8. Props

| Prop | Required | Effect |
| --- | --- | --- |
| `title` | ✅ | Shown in the top bar; also named in the "no PDF" empty state |
| `subtitle` | | Small line under the title — a publish date reads well |
| `pdfUrl` | | Absolute or same-origin URL. **Falsy renders the empty state, not the reader** |
| `coverImageUrl` | | Blurred backdrop behind the loading spinner |
| `description` | | Only surfaced in the "no PDF" empty state |
| `onBack` | | Renders the Back button when provided |
| `onClose` | | Renders the X button when provided |

`pdfUrl` is the only prop that changes behaviour rather than presentation — the
component early-returns an empty state before any pdf.js code runs when it is absent.

---

## 9. Data flow in the source repo (for reference)

The original had three near-identical wrappers — `MagazineFlipbook`,
`NewsletterFlipbook`, `OurArticlesFlipbook`. Each did the same three things:

1. Fetch a list from Strapi (`/api/magazines?populate=*` etc.), cached in
   `sessionStorage`.
2. Find the record by id, and resolve its PDF and cover URLs, prefixing the CMS base
   URL when the API returns a relative path.
3. Render `<FlipbookViewer />` with those URLs.

None of that logic lives in the viewer, which is why the viewer ports cleanly. For
this project the equivalent source is the brochures API — fetch the record, hand
`pdfUrl` to the viewer, done.

---

## 10. Gotchas

- **Text is not selectable.** Both `renderTextLayer` and `renderAnnotationLayer` are
  `false` on every `<Page>`, for performance — the pages are flat canvas images, so
  there is no text selection, no in-PDF search, and no clickable links. Enabling them
  means also importing `react-pdf/dist/Page/TextLayer.css` and
  `AnnotationLayer.css`, and accepting a slower render.
- **Cross-origin PDFs need CORS.** pdf.js fetches the file with XHR/fetch, so the PDF
  host must send `Access-Control-Allow-Origin`. A URL that opens fine in a browser tab
  can still fail here.
- **`HTMLFlipBook` is cast to a local prop type.** `react-pageflip` types all ~20 of
  its settings as *required*, so using it directly means listing every one. The file
  declares a `FlipBookProps` type with just the settings actually used and casts once,
  with the reason noted inline. The upstream repo used `as any` instead — avoided here
  because `@typescript-eslint/no-explicit-any` is an error in this codebase.
- **Resize is not debounced.** Every resize event recomputes page size and re-renders
  every visible canvas. Fine in practice, worth knowing if you add more pages per batch.
