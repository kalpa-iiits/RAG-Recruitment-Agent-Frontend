import './Pagination.css';

type Props = {
  /** Zero-based, the way the offset is calculated from it. */
  page: number;
  pageSize: number;
  /** Rows across every page, as the server counted them. */
  total: number;
  onChange: (page: number) => void;
  /** Plural noun for the count line, e.g. "resumes". */
  noun?: string;
  /** Disables the controls while the page behind them is being refetched. */
  busy?: boolean;
};

/** How many numbered buttons show before the list collapses to an ellipsis. */
const WINDOW = 5;

/**
 * The page numbers to draw: every page while there are few, otherwise a
 * window around the current one with the first and last always reachable.
 * `null` marks a gap.
 */
function pageNumbers(page: number, pages: number): (number | null)[] {
  if (pages <= WINDOW + 2) return Array.from({ length: pages }, (_, i) => i);

  const half = Math.floor(WINDOW / 2);
  const start = Math.min(Math.max(page - half, 1), pages - WINDOW - 1);
  const window = Array.from({ length: WINDOW }, (_, i) => start + i);

  return [
    0,
    ...(window[0] > 1 ? [null] : []),
    ...window,
    ...(window[window.length - 1] < pages - 2 ? [null] : []),
    pages - 1,
  ];
}

/**
 * Pager for a server-paginated list.
 *
 * Renders nothing when everything fits on one page, so a short list looks
 * exactly as it did before pagination existed.
 */
export function Pagination({ page, pageSize, total, onChange, noun = 'items', busy }: Props) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) return null;

  const first = page * pageSize + 1;
  const last = Math.min(total, (page + 1) * pageSize);

  return (
    <nav className="pager" aria-label={`${noun} pagination`}>
      <p className="pager-count">
        Showing <strong>{first}–{last}</strong> of <strong>{total}</strong> {noun}
      </p>

      <div className="pager-controls">
        <button
          type="button"
          className="pager-step"
          onClick={() => onChange(page - 1)}
          disabled={busy || page === 0}
        >
          Previous
        </button>

        {pageNumbers(page, pages).map((number, index) =>
          number === null ? (
            <span key={`gap-${index}`} className="pager-gap" aria-hidden>…</span>
          ) : (
            <button
              key={number}
              type="button"
              className={`pager-page ${number === page ? 'is-current' : ''}`}
              onClick={() => onChange(number)}
              disabled={busy}
              aria-label={`Page ${number + 1}`}
              aria-current={number === page ? 'page' : undefined}
            >
              {number + 1}
            </button>
          ),
        )}

        <button
          type="button"
          className="pager-step"
          onClick={() => onChange(page + 1)}
          disabled={busy || page >= pages - 1}
        >
          Next
        </button>
      </div>
    </nav>
  );
}
