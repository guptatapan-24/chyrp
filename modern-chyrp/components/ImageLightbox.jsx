"use client";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

export default function ImageLightbox({ imageUrls, open, index, close }) {
  const slides = imageUrls.map((src) => ({ src }));

  return (
    <Lightbox
      open={open}
      close={close}
      slides={slides}
      index={index}
      carousel={{ finite: true }} // disables infinite loop
    />
  );
}
