"use client";

/**
 * PDF flipbook reader — ported from Mining-Discovery-new (feature/changes branch,
 * src/components/FlipbookViewer.tsx) and adapted for Next.js App Router + React 19.
 *
 * pdf.js renders each page to a canvas; react-pageflip wraps those canvases to give
 * the page-turn animation. Desktop gets a two-page spread, mobile falls back to a
 * single page with prev/next controls.
 *
 * Install:
 *   npm install react-pdf react-pageflip
 *
 * Usage — this MUST be loaded with `ssr: false`, because pdf.js cannot run on the
 * server. Import it from a Client Component:
 *
 *   "use client";
 *   import dynamic from "next/dynamic";
 *
 *   const FlipbookViewer = dynamic(
 *     () => import("@/components/flipbook/FlipbookViewer"),
 *     { ssr: false, loading: () => <p>Loading reader…</p> }
 *   );
 *
 *   <FlipbookViewer title="Q3 Brochure" pdfUrl={brochure.pdfUrl} onBack={router.back} />
 *
 * The pdf.js worker is resolved from node_modules by the bundler, so nothing needs to
 * be copied into public/. If your bundler cannot handle `new URL(...)` asset imports,
 * copy `node_modules/pdfjs-dist/build/pdf.worker.min.mjs` into public/ and swap
 * PDF_WORKER_SRC for the string "/pdf.worker.min.mjs".
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties, ReactNode, Ref } from "react";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
  X,
} from "lucide-react";
import { Document, Page, pdfjs } from "react-pdf";
import HTMLFlipBook from "react-pageflip";

// react-pdf requires workerSrc to be set in the same module that renders
// <Document>/<Page>, otherwise module execution order can reset it to the default.
const PDF_WORKER_SRC = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

pdfjs.GlobalWorkerOptions.workerSrc = PDF_WORKER_SRC;

/**
 * react-pageflip types every setting as required, so the exported component cannot be
 * used without listing all ~20 of them. This is the subset we actually set.
 */
type FlipBookProps = {
  ref?: Ref<FlipBookHandle>;
  width: number;
  height: number;
  size?: "fixed" | "stretch";
  usePortrait?: boolean;
  showCover?: boolean;
  drawShadow?: boolean;
  flippingTime?: number;
  mobileScrollSupport?: boolean;
  startZIndex?: number;
  maxShadowOpacity?: number;
  className?: string;
  style?: CSSProperties;
  onFlip?: (event: { data: number }) => void;
  children: ReactNode;
};

type FlipBookHandle = {
  pageFlip: () => { flipNext: () => void; flipPrev: () => void } | undefined;
};

const FlipBook = HTMLFlipBook as unknown as (props: FlipBookProps) => ReactNode;

export type FlipbookViewerProps = {
  /** Shown in the top bar. */
  title: string;
  /** Optional line under the title — a publish date reads well here. */
  subtitle?: string;
  /** Absolute or same-origin URL to the PDF. Renders an empty state when absent. */
  pdfUrl?: string | null;
  /** Shown behind the spinner while the PDF downloads. */
  coverImageUrl?: string | null;
  /** Only surfaced in the "no PDF" empty state. */
  description?: string;
  /** Renders a back button when provided. */
  onBack?: () => void;
  /** Renders a close (X) button when provided. */
  onClose?: () => void;
};

type PageSize = {
  width: number;
  height: number;
};

const MOBILE_BREAKPOINT = 768;
/** ISO 216 page ratio (√2) — matches A4/A5 artwork. */
const PAGE_RATIO = 1.414;
/** Pages are rendered 2 at a time so a 100-page PDF does not block the first paint. */
const PAGE_BATCH_SIZE = 2;
const PAGE_BATCH_DELAY_MS = 120;

const getResponsivePageSize = (): PageSize => {
  if (typeof window === "undefined") return { width: 280, height: 396 };

  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let baseWidth: number;
  if (viewportWidth < 480) {
    baseWidth = Math.min(280, viewportWidth - 32);
  } else if (viewportWidth < MOBILE_BREAKPOINT) {
    baseWidth = Math.min(360, viewportWidth - 48);
  } else {
    baseWidth = Math.min(420, (viewportWidth - 60) / 2);
  }

  const availableHeight = Math.max(300, viewportHeight - 280);
  let height = Math.round(baseWidth * PAGE_RATIO);

  if (height > availableHeight) {
    height = Math.max(300, Math.floor(availableHeight * 0.9));
    baseWidth = Math.max(180, Math.floor(height / PAGE_RATIO));
  }

  return { width: Math.max(180, baseWidth), height };
};

const spreadLabel = (rawIdx: number, numPages: number): string => {
  if (numPages <= 0) return "Loading pages…";
  if (rawIdx === 0) return `Cover · Page 1 of ${numPages}`;
  const left = rawIdx + 1;
  const right = rawIdx + 2;
  if (right > numPages) return `Page ${left} of ${numPages}`;
  return `Pages ${left}–${right} of ${numPages}`;
};

export default function FlipbookViewer({
  title,
  subtitle,
  pdfUrl,
  coverImageUrl,
  description,
  onBack,
  onClose,
}: FlipbookViewerProps) {
  const bookRef = useRef<FlipBookHandle | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [rawIdx, setRawIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [pageSize, setPageSize] = useState<PageSize>({ width: 420, height: 594 });
  const [visiblePageCount, setVisiblePageCount] = useState(PAGE_BATCH_SIZE);
  const [loadProgress, setLoadProgress] = useState(0);

  const isFirst = isMobile ? currentPage === 1 : rawIdx === 0;
  const isLast = isMobile
    ? currentPage >= numPages
    : numPages > 0 && rawIdx >= numPages - PAGE_BATCH_SIZE;

  const goNext = useCallback(() => {
    if (isMobile) {
      setCurrentPage((prev) => Math.min(numPages, prev + 1));
      return;
    }
    bookRef.current?.pageFlip()?.flipNext();
  }, [isMobile, numPages]);

  const goPrev = useCallback(() => {
    if (isMobile) {
      setCurrentPage((prev) => Math.max(1, prev - 1));
      return;
    }
    bookRef.current?.pageFlip()?.flipPrev();
  }, [isMobile]);

  useEffect(() => {
    const setFromViewport = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      setPageSize(getResponsivePageSize());
    };

    setFromViewport();
    window.addEventListener("resize", setFromViewport);
    return () => window.removeEventListener("resize", setFromViewport);
  }, []);

  // Reveal the remaining pages in small batches once the first spread is up.
  useEffect(() => {
    if (isMobile || visiblePageCount >= numPages) return;

    const timer = window.setTimeout(() => {
      setVisiblePageCount((prev) => Math.min(numPages, prev + PAGE_BATCH_SIZE));
    }, PAGE_BATCH_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, [isMobile, numPages, visiblePageCount]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight" && !isLast) goNext();
      if (event.key === "ArrowLeft" && !isFirst) goPrev();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrev, isFirst, isLast]);

  const currentSpread = useMemo(() => {
    if (isMobile) {
      return numPages > 0 ? `Page ${currentPage} of ${numPages}` : "Loading pages…";
    }
    return spreadLabel(rawIdx, numPages);
  }, [currentPage, isMobile, numPages, rawIdx]);

  if (!pdfUrl) {
    return (
      <div className="min-h-[70vh] rounded-[2rem] border border-slate-200 bg-white p-8 text-slate-700 shadow-sm">
        <div className="flex items-center gap-3 text-[#1E3B6E]">
          <BookOpen className="h-5 w-5" />
          <span className="text-sm font-semibold uppercase tracking-[0.25em]">
            Flipbook preview
          </span>
        </div>
        <h2 className="mt-6 text-2xl font-bold text-slate-900">
          No PDF is available for “{title}” yet.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
          {description ??
            "This item does not currently have a downloadable PDF, so the book-style reader cannot be opened."}
        </p>
        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#1E3B6E] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#2563EB]"
          >
            <ArrowLeft className="h-4 w-4" /> Go back
          </button>
        ) : null}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-2 py-2 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2 shadow-sm backdrop-blur">
          <div className="flex min-w-0 items-center gap-2">
            {onBack ? (
              <button
                type="button"
                onClick={onBack}
                className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft className="h-4 w-4" /> Back
              </button>
            ) : null}
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-slate-900">{title}</p>
              {subtitle ? (
                <p className="truncate text-xs text-slate-500">{subtitle}</p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-500 sm:text-sm">
              {currentSpread}
            </span>
            {onClose ? (
              <button
                type="button"
                onClick={onClose}
                aria-label="Close reader"
                className="inline-flex shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white p-2 text-slate-700 transition hover:bg-slate-50"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center overflow-hidden rounded-[2rem] border border-slate-200 bg-[#f8f8f7] p-2 shadow-[0_20px_70px_rgba(15,23,42,0.08)] sm:p-4 lg:p-6">
          <div className="flex w-full flex-col items-center justify-center">
            <div className="mb-4 flex flex-wrap items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 shadow-sm sm:gap-3 sm:px-4">
              <button
                type="button"
                onClick={goPrev}
                disabled={isFirst}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                type="button"
                onClick={goNext}
                disabled={isLast}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 transition disabled:cursor-not-allowed disabled:opacity-50 sm:px-3 sm:text-sm"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            <div className="flex w-full items-center justify-center overflow-x-auto px-1 sm:px-2">
              <Document
                file={pdfUrl}
                onLoadSuccess={(pdf) => {
                  setNumPages(pdf.numPages);
                  setVisiblePageCount(Math.min(PAGE_BATCH_SIZE, pdf.numPages));
                  setCurrentPage(1);
                  setRawIdx(0);
                  setLoadProgress(100);
                  setLoading(false);
                  setError(false);
                }}
                onLoadProgress={({ loaded, total }) => {
                  if (total) setLoadProgress(Math.round((loaded / total) * 100));
                }}
                onLoadError={() => {
                  setLoading(false);
                  setError(true);
                }}
                className="flex justify-center"
              >
                {loading ? (
                  <div className="relative flex min-h-[320px] items-center justify-center overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white px-4 py-6 text-slate-600 shadow-inner sm:min-h-[420px] sm:px-6 sm:py-8">
                    {coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={coverImageUrl}
                        alt=""
                        aria-hidden="true"
                        className="absolute inset-0 h-full w-full object-cover opacity-20 blur-sm"
                      />
                    ) : null}
                    <div className="relative flex flex-col items-center gap-3 text-center">
                      <Loader2 className="h-5 w-5 animate-spin text-[#1E3B6E]" />
                      <span>Preparing the flipbook…</span>
                      {loadProgress > 0 ? (
                        <span className="text-sm text-slate-500">
                          {loadProgress}% ready
                        </span>
                      ) : null}
                    </div>
                  </div>
                ) : error ? (
                  <div className="flex min-h-[320px] items-center justify-center rounded-[1.5rem] border border-slate-200 bg-white px-4 py-6 text-center text-slate-600 shadow-inner sm:min-h-[420px] sm:px-6 sm:py-8">
                    <p>This document could not be loaded right now.</p>
                  </div>
                ) : (
                  <div className="flex w-full flex-col items-center justify-center">
                    {isMobile ? (
                      <div className="flex w-full justify-center overflow-x-auto px-1 py-2 sm:px-2">
                        <div className="rounded-[1.25rem] border border-slate-200 bg-white p-2 shadow-sm">
                          <Page
                            pageNumber={currentPage}
                            width={Math.min(pageSize.width, window.innerWidth - 28)}
                            renderTextLayer={false}
                            renderAnnotationLayer={false}
                            renderMode="canvas"
                          />
                        </div>
                      </div>
                    ) : (
                      <FlipBook
                        ref={bookRef}
                        width={pageSize.width}
                        height={pageSize.height}
                        size="fixed"
                        usePortrait={false}
                        showCover={true}
                        drawShadow={true}
                        flippingTime={700}
                        mobileScrollSupport={false}
                        startZIndex={0}
                        onFlip={(event) => setRawIdx(event.data)}
                      >
                        {Array.from({ length: visiblePageCount }, (_, index) => (
                          <div
                            key={index}
                            className="overflow-hidden rounded-[1.25rem] border border-slate-200 bg-white shadow-sm"
                            style={{ width: pageSize.width, height: pageSize.height }}
                          >
                            <Page
                              pageNumber={index + 1}
                              width={pageSize.width}
                              renderTextLayer={false}
                              renderAnnotationLayer={false}
                              renderMode="canvas"
                            />
                          </div>
                        ))}
                      </FlipBook>
                    )}
                  </div>
                )}
              </Document>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
