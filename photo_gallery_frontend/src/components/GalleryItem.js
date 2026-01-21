import React from "react";
import PropTypes from "prop-types";

export default function GalleryItem({ image, index, onOpen }) {
  return (
    <button
      type="button"
      className="tile"
      onClick={() => onOpen(index)}
      aria-label={`Open image: ${image.alt}`}
    >
      <img className="tileImg" src={image.src} alt={image.alt} loading="lazy" />
      <span className="tileOverlay" aria-hidden="true">
        <span className="tileLabel">View</span>
      </span>
    </button>
  );
}

GalleryItem.propTypes = {
  image: PropTypes.shape({
    id: PropTypes.string.isRequired,
    alt: PropTypes.string.isRequired,
    src: PropTypes.string.isRequired
  }).isRequired,
  index: PropTypes.number.isRequired,
  onOpen: PropTypes.func.isRequired
};
