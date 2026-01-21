import React, { useEffect, useRef } from "react";
import PropTypes from "prop-types";

/**
 * Modal image viewer.
 * Accessibility notes:
 * - Uses role="dialog" and aria-modal="true"
 * - Closes on Escape
 * - Traps focus loosely by focusing the close button on open (simple approach for beginner app)
 */
export default function ImageModal({
  isOpen,
  image,
  onClose,
  onPrev,
  onNext,
  currentIndex,
  totalCount
}) {
  const closeBtnRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    // Prevent background scrolling while modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Focus close button for keyboard users.
    setTimeout(() => {
      closeBtnRef.current?.focus();
    }, 0);

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen, onClose, onPrev, onNext]);

  if (!isOpen || !image) return null;

  const indexLabel =
    typeof currentIndex === "number" ? `${currentIndex + 1} / ${totalCount}` : "";

  const onBackdropMouseDown = (e) => {
    // Close when clicking outside the dialog panel.
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div className="modalBackdrop" role="presentation" onMouseDown={onBackdropMouseDown}>
      <div
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-label="Image viewer"
      >
        <div className="modalTopbar">
          <div className="modalMeta">
            <span className="modalIndex">{indexLabel}</span>
            <span className="modalAlt" title={image.alt}>
              {image.alt}
            </span>
          </div>

          <button
            ref={closeBtnRef}
            type="button"
            className="iconBtn"
            onClick={onClose}
            aria-label="Close modal"
            title="Close (Esc)"
          >
            ✕
          </button>
        </div>

        <div className="modalBody">
          <button
            type="button"
            className="navBtn navLeft"
            onClick={onPrev}
            aria-label="Previous image (Left arrow)"
            title="Previous (←)"
          >
            ‹
          </button>

          <figure className="modalFigure">
            <img className="modalImg" src={image.src} alt={image.alt} />
            <figcaption className="srOnly">{image.alt}</figcaption>
          </figure>

          <button
            type="button"
            className="navBtn navRight"
            onClick={onNext}
            aria-label="Next image (Right arrow)"
            title="Next (→)"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}

ImageModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  image: PropTypes.shape({
    id: PropTypes.string,
    alt: PropTypes.string,
    src: PropTypes.string
  }),
  onClose: PropTypes.func.isRequired,
  onPrev: PropTypes.func.isRequired,
  onNext: PropTypes.func.isRequired,
  currentIndex: PropTypes.number,
  totalCount: PropTypes.number.isRequired
};

ImageModal.defaultProps = {
  image: null,
  currentIndex: null
};
