import { useEffect } from 'react';
import { Download } from './Icons';
import './PdfPreview.css';

/**
 * Inline viewer for a stored resume PDF.
 *
 * The browser renders the S3 object straight from its presigned URL, so the
 * file is never proxied through the app and no copy is held client-side.
 * Those URLs expire, so callers should fetch a fresh one each time they open
 * this rather than holding on to one from an earlier render.
 */
export function PdfPreview({
  url,
  title,
  onClose,
}: {
  url: string;
  title: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    // Stop the page behind the overlay scrolling with the wheel.
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose]);

  return (
    <div
      className="pdfv-backdrop"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="pdfv" role="dialog" aria-modal="true" aria-label={title}>
        <header className="pdfv-head">
          <h2>{title}</h2>
          <div className="pdfv-actions">
            <a className="btn btn-ghost" href={url} target="_blank" rel="noopener noreferrer">
              <Download size={15} /> Open in new tab
            </a>
            <button type="button" className="pdfv-close" onClick={onClose} aria-label="Close preview">
              ×
            </button>
          </div>
        </header>
        {/*
          <object> rather than <iframe>: when the browser has no inline PDF
          viewer it renders the fallback children instead of a blank box.
          Some embedded browsers and older mobile Safari treat application/pdf
          as a download, and that case should still offer a way through.
        */}
        <object className="pdfv-frame" data={url} type="application/pdf" aria-label={title}>
          <div className="pdfv-fallback">
            <p>This browser can’t display PDFs inline.</p>
            <a className="btn btn-primary" href={url} target="_blank" rel="noopener noreferrer">
              <Download size={15} /> Open the PDF
            </a>
          </div>
        </object>
        {/*
          Always offered, never detected: whether a cross-origin PDF actually
          painted cannot be read from script, and some browsers report a PDF
          plugin they do not really use — so the way out is always visible
          rather than shown only on a failure we cannot observe.
        */}
        <footer className="pdfv-foot">
          Not showing?{' '}
          <a href={url} target="_blank" rel="noopener noreferrer">
            Open it in a new tab
          </a>
          .
        </footer>
      </div>
    </div>
  );
}
