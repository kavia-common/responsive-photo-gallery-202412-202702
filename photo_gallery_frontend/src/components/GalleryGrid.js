import React from "react";
import PropTypes from "prop-types";
import GalleryItem from "./GalleryItem";

/**
 * Renders a responsive masonry-like grid using CSS grid.
 */
export default function GalleryGrid({ images, onOpen }) {
  return (
    <section aria-label="Photo gallery">
      <div className="grid">
        {images.map((img, idx) => (
          <GalleryItem key={img.id} image={img} index={idx} onOpen={onOpen} />
        ))}
      </div>
    </section>
  );
}

GalleryGrid.propTypes = {
  images: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      alt: PropTypes.string.isRequired,
      src: PropTypes.string.isRequired
    })
  ).isRequired,
  onOpen: PropTypes.func.isRequired
};
