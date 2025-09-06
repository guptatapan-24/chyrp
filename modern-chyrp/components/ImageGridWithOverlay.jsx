"use client";
import { useState } from "react";
import ImageLightbox from "./ImageLightbox";

export default function ImageGridWithOverlay({ imageUrls }) {
  const maxVisible = 3;
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const visibleImages = imageUrls.slice(0, maxVisible);
  const extraCount = imageUrls.length - maxVisible;

  return (
    <>
      <div className="grid grid-cols-3 gap-2 cursor-pointer mb-4">
        {visibleImages.map((url, i) => {
          const showOverlay = i === maxVisible - 1 && extraCount > 0;
          return (
            <div
              key={i}
              className="relative rounded overflow-hidden"
              onClick={() => setLightboxIndex(i)}
            >
              <img
                src={url}
                alt=""
                className="w-full h-24 object-cover transition-transform duration-300 hover:scale-105"
              />
              {showOverlay && (
                <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center text-white text-2xl font-bold">
                  +{extraCount}
                </div>
              )}
            </div>
          );
        })}
      </div>
      <ImageLightbox
        imageUrls={imageUrls}
        open={lightboxIndex >= 0}
        index={lightboxIndex}
        close={() => setLightboxIndex(-1)}
      />
    </>
  );
}
