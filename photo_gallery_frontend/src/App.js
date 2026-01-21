import React, { useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

/**
 * Simple, frontend-only photo gallery.
 * - Responsive masonry-like grid (CSS grid with auto-fill)
 * - Click image to open modal viewer
 * - Keyboard accessible (Esc to close, arrows to navigate)
 * - Favorites (Step 01.05): heart toggles, persisted via localStorage, and a favorites-only view.
 * - Add image (Step 01.06): client-only add image via URL + optional local file upload (in-memory).
 */

/**
 * Local placeholder images (no backend).
 *
 * Data model (Step 01.03):
 * - title: short title shown in grid + modal header
 * - caption: longer human-friendly description shown in grid + modal body
 * - metadata: optional key/value details shown in the modal (and a small hint in the grid)
 */
const PHOTO_SEED = [
  {
    id: "sea",
    title: "Sea",
    caption: "Calm ocean tones with soft horizon light.",
    photographer: "Kavia Studio",
    tags: ["Nature", "Water", "Coast"],
    metadata: { location: "Coastline", camera: "KaviaCam X1", lens: "35mm", year: "2024" },
  },
  {
    id: "forest",
    title: "Forest",
    caption: "Evergreen canopy with filtered morning sun.",
    photographer: "Kavia Studio",
    tags: ["Nature", "Trees", "Green"],
    metadata: { location: "National Park", camera: "KaviaCam X1", year: "2024" },
  },
  {
    id: "city",
    title: "City",
    caption: "Clean lines and depth—an urban study in contrast.",
    photographer: "Kavia Studio",
    tags: ["Urban", "Architecture"],
    metadata: { location: "Downtown", camera: "KaviaCam X2", lens: "24mm", year: "2023" },
  },
  {
    id: "mountain",
    title: "Mountain",
    caption: "Ridgelines and clouds—high altitude serenity.",
    photographer: "Kavia Studio",
    tags: ["Nature", "Mountains", "Adventure"],
    metadata: { location: "Highlands", camera: "KaviaCam X2", year: "2023" },
  },
  {
    id: "desert",
    title: "Desert",
    caption: "Dunes shaped by wind with warm, golden shadows.",
    photographer: "Kavia Studio",
    tags: ["Nature", "Desert", "Sand"],
    metadata: { location: "Dune Field", camera: "KaviaCam X1", lens: "50mm", year: "2022" },
  },
  {
    id: "aurora",
    title: "Aurora",
    caption: "Night sky ribbons with a gentle glow.",
    photographer: "Kavia Studio",
    tags: ["Night", "Nature", "Sky"],
    metadata: { location: "Northern Lights", camera: "KaviaCam X3", year: "2024" },
  },
  {
    id: "flowers",
    title: "Flowers",
    caption: "Bright petals with soft background bokeh.",
    photographer: "Kavia Studio",
    tags: ["Nature", "Plants", "Macro"],
    metadata: { location: "Botanical Garden", camera: "KaviaCam X2", lens: "85mm" },
  },
  {
    id: "waterfall",
    title: "Waterfall",
    caption: "A smooth cascade framed by dark stone.",
    photographer: "Kavia Studio",
    tags: ["Nature", "Water", "Adventure"],
    metadata: { location: "River Gorge", camera: "KaviaCam X1", year: "2022" },
  },
  {
    id: "architecture",
    title: "Architecture",
    caption: "Modern geometry and repeating patterns in light.",
    photographer: "Kavia Studio",
    tags: ["Architecture", "Design", "Urban"],
    metadata: { location: "Civic Center", camera: "KaviaCam X3", lens: "24mm" },
  },
  {
    id: "night",
    title: "Night",
    caption: "Neon ambience—low light with crisp highlights.",
    photographer: "Kavia Studio",
    tags: ["Night", "Urban", "Neon"],
    metadata: { location: "Night Market", camera: "KaviaCam X3", year: "2023" },
  },
  {
    id: "lake",
    title: "Lake",
    caption: "Mirror reflections with a still, quiet mood.",
    photographer: "Kavia Studio",
    tags: ["Nature", "Water", "Calm"],
    metadata: { location: "Alpine Lake", camera: "KaviaCam X2", year: "2024" },
  },
  {
    id: "canyon",
    title: "Canyon",
    caption: "Layered stone textures—time etched into color.",
    photographer: "Kavia Studio",
    tags: ["Nature", "Desert", "Geology"],
    metadata: { location: "Canyon Rim", camera: "KaviaCam X1", lens: "35mm", year: "2022" },
  },
];

/**
 * Creates stable, deterministic image URLs using picsum.
 * We avoid any backend and keep the list static.
 */
function makePhotoUrl(seed, width, height) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`;
}

/**
 * Step 01.06 helpers: validate/normalize external URLs and create client-only items.
 * We keep it conservative (http/https only) to avoid "javascript:" and similar schemes.
 */
function normalizeHttpUrl(value) {
  try {
    const url = new URL(String(value).trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.toString();
  } catch {
    return null;
  }
}

function makeClientPhoto({ title, url, source }) {
  const id = `client:${Date.now()}:${Math.random().toString(16).slice(2)}`;
  const safeTitle = String(title || "User image").trim() || "User image";
  return {
    id,
    title: safeTitle,
    caption: source === "file" ? "Added from local file (client-only)." : "Added from URL (client-only).",
    photographer: "You",
    tags: ["User"],
    metadata: {
      source: source === "file" ? "local file (in-memory)" : "url",
      added: new Date().toLocaleString(),
    },
    thumbUrl: url,
    fullUrl: url,
    _clientOnly: true,
  };
}

const FAVORITES_STORAGE_KEY = "pg:favorites:v1";

/**
 * Parse favorites set from localStorage.
 * This must be resilient to malformed values and environments where storage is blocked.
 */
function readFavoritesFromStorage() {
  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.map((v) => String(v)));
  } catch {
    return new Set();
  }
}

function writeFavoritesToStorage(favoritesSet) {
  try {
    const arr = Array.from(favoritesSet);
    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // Ignore storage write errors (e.g., private mode restrictions).
  }
}

// PUBLIC_INTERFACE
function App() {
  /** Build initial gallery items once. */
  const seededPhotos = useMemo(() => {
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

  // Step 01.06 - Gallery list is now stateful so we can append client-only items.
  const [photos, setPhotos] = useState(() => seededPhotos);

  const [query, setQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState(() => new Set());
  const [activeIndex, setActiveIndex] = useState(null); // number | null

  // Step 01.05 - Favorites state
  const [favoriteIds, setFavoriteIds] = useState(() => readFavoritesFromStorage());
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Step 01.06 - Add image UI state
  const [addUrl, setAddUrl] = useState("");
  const [addTitle, setAddTitle] = useState("");
  const [addFile, setAddFile] = useState(null); // File | null
  const [addStatus, setAddStatus] = useState({ kind: "idle", message: "" }); // {kind:'idle'|'error'|'success', message:string}
  const clientObjectUrlsRef = useRef([]); // track object URLs so we can revoke on unmount

  // Keep localStorage in sync.
  useEffect(() => {
    writeFavoritesToStorage(favoriteIds);
  }, [favoriteIds]);

  // Cleanup any in-memory object URLs we created (local-file uploads).
  useEffect(() => {
    return () => {
      clientObjectUrlsRef.current.forEach((u) => URL.revokeObjectURL(u));
      clientObjectUrlsRef.current = [];
    };
  }, []);

  const availableTags = useMemo(() => {
    const set = new Set();
    photos.forEach((p) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((t) => set.add(String(t)));
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [photos]);

  const filteredPhotos = useMemo(() => {
    const q = query.trim().toLowerCase();
    const hasQuery = Boolean(q);
    const hasTagFilter = selectedTags.size > 0;
    const hasFavFilter = favoritesOnly;

    if (!hasQuery && !hasTagFilter && !hasFavFilter) return photos;

    return photos.filter((p) => {
      // Favorites match
      const matchesFavorites = !hasFavFilter ? true : favoriteIds.has(String(p.id));

      // Search match
      const tagText = Array.isArray(p.tags) ? p.tags.join(" ").toLowerCase() : "";
      const metadataText =
        p.metadata && typeof p.metadata === "object"
          ? Object.entries(p.metadata)
              .map(([k, v]) => `${k}:${String(v)}`)
              .join(" ")
              .toLowerCase()
          : "";

      const matchesQuery = !hasQuery
        ? true
        : [p.title, p.caption, p.photographer, p.id, tagText, metadataText]
            .filter(Boolean)
            .some((field) => String(field).toLowerCase().includes(q));

      // Tag match (OR across selected tags)
      const matchesTags = !hasTagFilter
        ? true
        : Array.isArray(p.tags) && p.tags.some((t) => selectedTags.has(String(t)));

      return matchesFavorites && matchesQuery && matchesTags;
    });
  }, [photos, query, selectedTags, favoritesOnly, favoriteIds]);

  const modalOpen = activeIndex !== null;

  // When filtering while modal open, keep modal stable or close if out of range.
  useEffect(() => {
    if (!modalOpen) return;
    if (activeIndex >= filteredPhotos.length) setActiveIndex(null);
  }, [filteredPhotos.length, modalOpen, activeIndex]);

  // Focus management for modal.
  const closeButtonRef = useRef(null);
  const lastActiveElementRef = useRef(null);

  // Keyboard shortcuts (modal only): Esc closes, arrows navigate.
  // Kept in a single effect so focus save/restore remains correct.
  useEffect(() => {
    if (!modalOpen) return;

    // Save focus *before* we move it into the dialog.
    lastActiveElementRef.current = document.activeElement;

    // Focus close button after open for accessibility.
    // setTimeout(0) avoids focusing before the element is in the DOM.
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);

    const isTypingContext = (target) => {
      if (!target || !(target instanceof HTMLElement)) return false;
      const tag = target.tagName?.toLowerCase();
      return (
        tag === "input" ||
        tag === "textarea" ||
        tag === "select" ||
        target.isContentEditable === true
      );
    };

    const onKeyDown = (e) => {
      // Avoid stealing arrow keys from inputs/textareas/contenteditable.
      // Esc should still close from anywhere (common modal behavior).
      const typing = isTypingContext(e.target);

      if (e.key === "Escape") {
        e.preventDefault();
        setActiveIndex(null);
        return;
      }

      if (typing) return;

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

    // Capture phase makes the shortcuts reliable even if inner elements stop propagation.
    document.addEventListener("keydown", onKeyDown, { capture: true });
    return () => {
      document.removeEventListener("keydown", onKeyDown, { capture: true });
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
  const toggleTag = (tag) => {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  };

  // PUBLIC_INTERFACE
  const clearTags = () => setSelectedTags(new Set());

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

  // PUBLIC_INTERFACE
  const toggleFavorite = (photoId) => {
    const id = String(photoId);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const favoritesCount = favoriteIds.size;

  // PUBLIC_INTERFACE
  const addImageToGallery = ({ source }) => {
    setAddStatus({ kind: "idle", message: "" });

    if (source === "url") {
      const normalized = normalizeHttpUrl(addUrl);
      if (!normalized) {
        setAddStatus({ kind: "error", message: "Please enter a valid http(s) image URL." });
        return;
      }

      const title = addTitle.trim() || "Image from URL";
      const item = makeClientPhoto({ title, url: normalized, source: "url" });

      // Prepend so it appears immediately at the top.
      setPhotos((prev) => [item, ...prev]);

      // Auto-select "User" tag so the user can immediately see what they added (and it matches filter options).
      setSelectedTags((prev) => {
        const next = new Set(prev);
        next.add("User");
        return next;
      });

      setAddUrl("");
      setAddTitle("");
      setAddFile(null);
      setAddStatus({ kind: "success", message: `Added "${item.title}" from URL (client-only).` });
      return;
    }

    if (source === "file") {
      if (!addFile) {
        setAddStatus({ kind: "error", message: "Please choose a local image file first." });
        return;
      }

      if (!addFile.type || !addFile.type.startsWith("image/")) {
        setAddStatus({ kind: "error", message: "That file does not look like an image. Please choose an image file." });
        return;
      }

      const objectUrl = URL.createObjectURL(addFile);
      clientObjectUrlsRef.current.push(objectUrl);

      const title = addTitle.trim() || addFile.name || "Local image";
      const item = makeClientPhoto({ title, url: objectUrl, source: "file" });

      setPhotos((prev) => [item, ...prev]);
      setSelectedTags((prev) => {
        const next = new Set(prev);
        next.add("User");
        return next;
      });

      setAddUrl("");
      setAddTitle("");
      setAddFile(null);
      setAddStatus({ kind: "success", message: `Added "${item.title}" from local file (client-only).` });
    }
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
        <section className="pg-toolbar" aria-label="Gallery filters and info">
          <div className="pg-toolbar__left">
            <div className="pg-pill">
              <span className="pg-pill__label">Showing</span>{" "}
              <strong className="pg-pill__value">{filteredPhotos.length}</strong>{" "}
              <span className="pg-pill__label">photos</span>
            </div>

            <div className="pg-pill" role="group" aria-label="Favorites filter">
              <span className="pg-pill__label">Favorites</span>
              <strong className="pg-pill__value">{favoritesCount}</strong>
              <button
                type="button"
                className={`pg-favtoggle ${favoritesOnly ? "pg-favtoggle--active" : ""}`}
                aria-pressed={favoritesOnly}
                onClick={() => setFavoritesOnly((v) => !v)}
                title={favoritesOnly ? "Show all photos" : "Show favorites only"}
              >
                <span className="pg-favtoggle__icon" aria-hidden="true">
                  ♥
                </span>
                <span className="pg-favtoggle__text">{favoritesOnly ? "Favorites" : "All"}</span>
              </button>
            </div>

            {/* Step 01.06 - Add image UI (client-only) */}
            <div className="pg-add" role="group" aria-label="Add image (client-only)">
              <div className="pg-add__row">
                <label className="pg-add__field">
                  <span className="pg-add__label">Title (optional)</span>
                  <input
                    className="pg-add__input"
                    value={addTitle}
                    onChange={(e) => setAddTitle(e.target.value)}
                    placeholder="e.g., My sunset photo"
                    aria-label="Image title"
                  />
                </label>

                <label className="pg-add__field">
                  <span className="pg-add__label">Image URL</span>
                  <input
                    className="pg-add__input"
                    value={addUrl}
                    onChange={(e) => setAddUrl(e.target.value)}
                    placeholder="https://example.com/image.jpg"
                    inputMode="url"
                    aria-label="Image URL"
                  />
                </label>

                <div className="pg-add__actions" aria-label="Add image actions">
                  <button
                    type="button"
                    className="pg-add__btn pg-add__btn--primary"
                    onClick={() => addImageToGallery({ source: "url" })}
                    disabled={!addUrl.trim()}
                    title="Add image from URL"
                  >
                    Add URL
                  </button>
                </div>
              </div>

              <div className="pg-add__row" style={{ marginTop: 10 }}>
                <label className="pg-add__field">
                  <span className="pg-add__label">Or upload a local file</span>
                  <input
                    className="pg-add__input"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
                      setAddFile(file);
                    }}
                    aria-label="Upload an image file"
                  />
                  <p className="pg-add__filehint">
                    Client-only: the file stays in-memory (object URL) and is not uploaded anywhere.
                  </p>
                </label>

                <div className="pg-add__actions">
                  <button
                    type="button"
                    className="pg-add__btn pg-add__btn--primary"
                    onClick={() => addImageToGallery({ source: "file" })}
                    disabled={!addFile}
                    title="Add image from local file"
                  >
                    Add File
                  </button>
                  <button
                    type="button"
                    className="pg-add__btn"
                    onClick={() => {
                      setAddUrl("");
                      setAddTitle("");
                      setAddFile(null);
                      setAddStatus({ kind: "idle", message: "" });
                    }}
                    title="Clear add-image inputs"
                  >
                    Clear
                  </button>
                </div>
              </div>

              {addStatus.kind !== "idle" ? (
                <p
                  className={`pg-add__status ${addStatus.kind === "error" ? "pg-add__status--error" : ""}`}
                  role={addStatus.kind === "error" ? "alert" : "status"}
                  aria-live="polite"
                >
                  {addStatus.message}
                </p>
              ) : null}
            </div>

            {availableTags.length > 0 ? (
              <div className="pg-filters" role="group" aria-label="Filter by tag">
                <div className="pg-filters__label">Tags</div>
                <div className="pg-filters__chips" aria-label="Tag filter chips">
                  {availableTags.map((tag) => {
                    const selected = selectedTags.has(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`pg-chip ${selected ? "pg-chip--active" : ""}`}
                        aria-pressed={selected}
                        onClick={() => toggleTag(tag)}
                        title={selected ? `Remove filter: ${tag}` : `Filter by: ${tag}`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>

                {selectedTags.size > 0 ? (
                  <button type="button" className="pg-linkbtn" onClick={clearTags}>
                    Clear tags
                  </button>
                ) : null}
              </div>
            ) : null}
          </div>

          <p className="pg-hint">
            Tip: Click a photo to open. Use <kbd>Esc</kbd> to close, <kbd>←</kbd>/<kbd>→</kbd> to navigate.
            {favoritesOnly ? (
              <>
                {" "}
                <span className="pg-hint__sep">·</span> Viewing: <span className="pg-hint__filters">Favorites</span>
              </>
            ) : null}
            {selectedTags.size > 0 ? (
              <>
                {" "}
                <span className="pg-hint__sep">·</span> Filters:{" "}
                <span className="pg-hint__filters">{Array.from(selectedTags).join(", ")}</span>
              </>
            ) : null}
          </p>
        </section>

        <section className="pg-grid" aria-label="Photo grid">
          {filteredPhotos.map((photo, idx) => {
            const metadataCount =
              photo.metadata && typeof photo.metadata === "object" ? Object.keys(photo.metadata).length : 0;
            const isFav = favoriteIds.has(String(photo.id));

            return (
              <button
                key={photo.id}
                type="button"
                className="pg-card"
                onClick={() => openModalAt(idx)}
                aria-label={`Open photo: ${photo.title}`}
              >
                <div className="pg-card__media">
                  <img className="pg-card__img" src={photo.thumbUrl} alt={photo.title} loading="lazy" />
                  <button
                    type="button"
                    className={`pg-heart ${isFav ? "pg-heart--active" : ""}`}
                    aria-pressed={isFav}
                    aria-label={isFav ? `Remove ${photo.title} from favorites` : `Add ${photo.title} to favorites`}
                    title={isFav ? "Unfavorite" : "Favorite"}
                    onClick={(e) => {
                      // Prevent opening modal when clicking heart.
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite(photo.id);
                    }}
                  >
                    <span className="pg-heart__icon" aria-hidden="true">
                      ♥
                    </span>
                  </button>
                </div>
                <div className="pg-card__meta">
                  <div className="pg-card__title">{photo.title}</div>
                  <div className="pg-card__sub">{photo.caption || photo.photographer}</div>
                  {metadataCount > 0 ? (
                    <div className="pg-card__sub" aria-label="Photo metadata available">
                      {metadataCount} detail{metadataCount === 1 ? "" : "s"}
                    </div>
                  ) : null}
                </div>
              </button>
            );
          })}
          {filteredPhotos.length === 0 ? (
            <div className="pg-empty" role="status" aria-live="polite">
              <h2 className="pg-empty__title">No results</h2>
              <p className="pg-empty__desc">
                {favoritesOnly ? "No favorites match your current filters." : "Try a different search term."}
              </p>
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
                {activePhoto?.caption ? <div className="pg-modal__sub">{activePhoto.caption}</div> : null}
              </div>

              <div className="pg-modal__actions">
                <button
                  type="button"
                  className={`pg-iconbtn ${favoriteIds.has(String(activePhoto?.id)) ? "pg-iconbtn--fav" : ""}`}
                  onClick={() => toggleFavorite(activePhoto?.id)}
                  aria-label={
                    favoriteIds.has(String(activePhoto?.id))
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                  title={favoriteIds.has(String(activePhoto?.id)) ? "Unfavorite" : "Favorite"}
                >
                  ♥
                </button>
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

            {activePhoto?.metadata && typeof activePhoto.metadata === "object" ? (
              <div className="pg-modal__meta" aria-label="Photo details">
                <dl className="pg-modal__metalist">
                  {Object.entries(activePhoto.metadata).map(([key, value]) => (
                    <div key={key} className="pg-modal__metarow">
                      <dt className="pg-modal__metakey">{key}</dt>
                      <dd className="pg-modal__metaval">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
