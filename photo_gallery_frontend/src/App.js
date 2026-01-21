import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

/**
 * Simple, frontend-only photo gallery.
 * - Responsive masonry-like grid (CSS grid with auto-fill)
 * - Click image to open modal viewer
 * - Keyboard accessible (Esc to close, arrows to navigate)
 */

/** Local placeholder images (no backend). */
const PHOTO_SEED = [
  { id: "sea", title: "Sea", photographer: "Kavia Studio" },
  { id: "forest", title: "Forest", photographer: "Kavia Studio" },
  { id: "city", title: "City", photographer: "Kavia Studio" },
  { id: "mountain", title: "Mountain", photographer: "Kavia Studio" },
  { id: "desert", title: "Desert", photographer: "Kavia Studio" },
  { id: "aurora", title: "Aurora", photographer: "Kavia Studio" },
  { id: "flowers", title: "Flowers", photographer: "Kavia Studio" },
  { id: "waterfall", title: "Waterfall", photographer: "Kavia Studio" },
  { id: "architecture", title: "Architecture", photographer: "Kavia Studio" },
  { id: "night", title: "Night", photographer: "Kavia Studio" },
  { id: "lake", title: "Lake", photographer: "Kavia Studio" },
  { id: "canyon", title: "Canyon", photographer: "Kavia Studio" },
];

/**
 * Creates stable, deterministic image URLs using picsum.
 * We avoid any backend and keep the list static.
 */
function makePhotoUrl(seed, width, height) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

// PUBLIC_INTERFACE
function App() {
  /** Build gallery items once. */
  const photos = useMemo(() => {
    // Vary heights a bit to make the grid feel more gallery-like.
    const heights = [900, 820, 760, 980, 840, 920];
    return PHOTO_SEED.map((p, idx) => {
      const h = heights[idx % heights.length];
      return {
        ...p,
        // Use a reasonably sized image for grid; modal loads larger.
        thumbUrl: makePhotoUrl(p.id, 900, h),
        fullUrl: makePhotoUrl(p.id, 1800, Math.round(h * 1.2)),
      };
    });
  }, []);

  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(null); // number | null

  const filteredPhotos = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return photos;
    return photos.filter((p) => {
      return (
        p.title.toLowerCase().includes(q) || p.photographer.toLowerCase().includes(q) || p.id.toLowerCase().includes(q)
      );
    });
  }, [photos, query]);

  const modalOpen = activeIndex !== null;

  // When filtering while modal open, keep modal stable or close if out of range.
  useEffect(() => {
    if (!modalOpen) return;
    if (activeIndex >= filteredPhotos.length) setActiveIndex(null);
  }, [filteredPhotos.length, modalOpen, activeIndex]);

  // Focus management for modal.
  const closeButtonRef = useRef(null);
  const lastActiveElementRef = useRef(null);

  // Keyboard shortcuts: Esc closes, arrows navigate.
  useEffect(() => {
    if (!modalOpen) return;

    lastActiveElementRef.current = document.activeElement;
    // Focus close button after open for accessibility.
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setActiveIndex(null);
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        setActiveIndex((prev) => {
          if (prev === null) return prev;
          return Math.min(prev + 1, filteredPhotos.length - 1);
        });
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setActiveIndex((prev) => {
          if (prev === null) return prev;
          return Math.max(prev - 1, 0);
        });
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      // Restore focus to whichever element opened the modal.
      const el = lastActiveElementRef.current;
      if (el && typeof el.focus === "function") el.focus();
    };
  }, [modalOpen, filteredPhotos.length]);

  // Prevent background scroll while modal open.
  useEffect(() => {
    if (!modalOpen) return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [modalOpen]);

  const activePhoto = modalOpen ? filteredPhotos[activeIndex] : null;

  // PUBLIC_INTERFACE
  const openModalAt = (index) => {
    setActiveIndex(index);
  };

  // PUBLIC_INTERFACE
  const closeModal = () => setActiveIndex(null);

  // PUBLIC_INTERFACE
  const goPrev = () => {
    setActiveIndex((prev) => {
      if (prev === null) return prev;
      return Math.max(prev - 1, 0);
    });
  };

  // PUBLIC_INTERFACE
  const goNext = () => {
    setActiveIndex((prev) => {
      if (prev === null) return prev;
      return Math.min(prev + 1, filteredPhotos.length - 1);
    });
  };

  return (
    <div className="App">
      <header className="pg-header">
        <div className="pg-header__inner">
          <div className="pg-brand">
            <div className="pg-logo" aria-hidden="true">
              <span className="pg-logo__dot" />
              <span className="pg-logo__dot pg-logo__dot--alt" />
            </div>
            <div className="pg-brand__text">
              <h1 className="pg-title">Photo Gallery</h1>
              <p className="pg-subtitle">Responsive grid · Modal viewer · Frontend-only</p>
            </div>
          </div>

          <div className="pg-controls" role="search">
            <label className="pg-search">
              <span className="sr-only">Search photos</span>
              <input
                className="pg-search__input"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search (e.g., forest, night, lake)…"
                inputMode="search"
              />
              {query ? (
                <button className="pg-search__clear" type="button" onClick={() => setQuery("")} aria-label="Clear search">
                  ×
                </button>
              ) : null}
            </label>
          </div>
        </div>
      </header>

      <main className="pg-main">
        <section className="pg-toolbar" aria-label="Gallery info">
          <div className="pg-pill">
            <span className="pg-pill__label">Showing</span>{" "}
            <strong className="pg-pill__value">{filteredPhotos.length}</strong>{" "}
            <span className="pg-pill__label">photos</span>
          </div>
          <p className="pg-hint">
            Tip: Click a photo to open. Use <kbd>Esc</kbd> to close, <kbd>←</kbd>/<kbd>→</kbd> to navigate.
          </p>
        </section>

        <section className="pg-grid" aria-label="Photo grid">
          {filteredPhotos.map((photo, idx) => (
            <button
              key={photo.id}
              type="button"
              className="pg-card"
              onClick={() => openModalAt(idx)}
              aria-label={`Open photo: ${photo.title}`}
            >
              <div className="pg-card__media">
                <img className="pg-card__img" src={photo.thumbUrl} alt={photo.title} loading="lazy" />
              </div>
              <div className="pg-card__meta">
                <div className="pg-card__title">{photo.title}</div>
                <div className="pg-card__sub">{photo.photographer}</div>
              </div>
            </button>
          ))}
          {filteredPhotos.length === 0 ? (
            <div className="pg-empty" role="status" aria-live="polite">
              <h2 className="pg-empty__title">No results</h2>
              <p className="pg-empty__desc">Try a different search term.</p>
            </div>
          ) : null}
        </section>
      </main>

      {modalOpen ? (
        <div className="pg-modal" role="dialog" aria-modal="true" aria-label="Photo viewer">
          <div className="pg-modal__backdrop" onClick={closeModal} aria-hidden="true" />

          <div className="pg-modal__panel">
            <div className="pg-modal__topbar">
              <div className="pg-modal__caption">
                <div className="pg-modal__title">{activePhoto?.title}</div>
                <div className="pg-modal__sub">{activePhoto?.photographer}</div>
              </div>

              <div className="pg-modal__actions">
                <button
                  type="button"
                  className="pg-iconbtn"
                  onClick={goPrev}
                  disabled={activeIndex <= 0}
                  aria-label="Previous photo"
                  title="Previous (←)"
                >
                  ←
                </button>
                <button
                  type="button"
                  className="pg-iconbtn"
                  onClick={goNext}
                  disabled={activeIndex >= filteredPhotos.length - 1}
                  aria-label="Next photo"
                  title="Next (→)"
                >
                  →
                </button>
                <button
                  ref={closeButtonRef}
                  type="button"
                  className="pg-iconbtn pg-iconbtn--primary"
                  onClick={closeModal}
                  aria-label="Close modal"
                  title="Close (Esc)"
                >
                  ×
                </button>
              </div>
            </div>

            <figure className="pg-modal__figure">
              <img className="pg-modal__img" src={activePhoto?.fullUrl} alt={activePhoto?.title || "Selected photo"} />

              <div className="pg-modal__nav" aria-hidden="false">
                <button
                  type="button"
                  className="pg-modal__navbtn"
                  onClick={goPrev}
                  disabled={activeIndex <= 0}
                  aria-label="Previous photo"
                  title="Previous (←)"
                >
                  ‹
                </button>
                <button
                  type="button"
                  className="pg-modal__navbtn"
                  onClick={goNext}
                  disabled={activeIndex >= filteredPhotos.length - 1}
                  aria-label="Next photo"
                  title="Next (→)"
                >
                  ›
                </button>
              </div>
            </figure>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
