import React, { useMemo, useState } from "react";
import GalleryGrid from "./components/GalleryGrid";
import ImageModal from "./components/ImageModal";

/**
 * Simple set of gallery images.
 * Uses stable external URLs to avoid needing a backend or local asset pipeline.
 */
const DEFAULT_IMAGES = [
  {
    id: "img-1",
    alt: "Forest road",
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80"
  },
  {
    id: "img-2",
    alt: "Mountain lake",
    src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80"
  },
  {
    id: "img-3",
    alt: "Desert dunes",
    src: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1600&q=80"
  },
  {
    id: "img-4",
    alt: "City skyline at night",
    src: "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&w=1600&q=80"
  },
  {
    id: "img-5",
    alt: "Ocean waves",
    src: "https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1600&q=80"
  },
  {
    id: "img-6",
    alt: "Snowy peak",
    src: "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1600&q=80"
  },
  {
    id: "img-7",
    alt: "Autumn leaves",
    src: "https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?auto=format&fit=crop&w=1600&q=80"
  },
  {
    id: "img-8",
    alt: "Calm river",
    src: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1600&q=80"
  },
  {
    id: "img-9",
    alt: "Sandstone canyon",
    src: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1600&q=80"
  },
  {
    id: "img-10",
    alt: "Sunrise over hills",
    src: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80"
  },
  {
    id: "img-11",
    alt: "Coastal cliffs",
    src: "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80"
  },
  {
    id: "img-12",
    alt: "Starry night sky",
    src: "https://images.unsplash.com/photo-1444703686981-a3abbc4d4fe3?auto=format&fit=crop&w=1600&q=80"
  }
];

function getInitialImageIndexFromHash(images) {
  // Allow deep-linking like: /#img-3
  const hash = (window.location.hash || "").replace("#", "").trim();
  if (!hash) return null;
  const idx = images.findIndex((img) => img.id === hash);
  return idx >= 0 ? idx : null;
}

export default function App() {
  const images = useMemo(() => DEFAULT_IMAGES, []);
  const [activeIndex, setActiveIndex] = useState(() =>
    getInitialImageIndexFromHash(images)
  );

  const activeImage = activeIndex === null ? null : images[activeIndex];

  const onOpen = (index) => {
    setActiveIndex(index);
    // Keep hash in sync to make modal shareable/bookmarkable.
    window.location.hash = images[index].id;
  };

  const onClose = () => {
    setActiveIndex(null);
    // Clear hash without forcing scroll jump.
    history.replaceState(null, "", window.location.pathname + window.location.search);
  };

  const onPrev = () => {
    setActiveIndex((prev) => {
      if (prev === null) return prev;
      const next = (prev - 1 + images.length) % images.length;
      window.location.hash = images[next].id;
      return next;
    });
  };

  const onNext = () => {
    setActiveIndex((prev) => {
      if (prev === null) return prev;
      const next = (prev + 1) % images.length;
      window.location.hash = images[next].id;
      return next;
    });
  };

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <div className="brandMark" aria-hidden="true" />
          <div>
            <h1 className="title">Photo Gallery</h1>
            <p className="subtitle">Responsive grid • Click to view • Keyboard-friendly</p>
          </div>
        </div>
      </header>

      <main className="container">
        <GalleryGrid images={images} onOpen={onOpen} />
      </main>

      <ImageModal
        isOpen={activeIndex !== null}
        image={activeImage}
        onClose={onClose}
        onPrev={onPrev}
        onNext={onNext}
        currentIndex={activeIndex}
        totalCount={images.length}
      />

      <footer className="footer">
        <span>Tip: Use Esc to close. Arrow keys navigate in modal.</span>
      </footer>
    </div>
  );
}
