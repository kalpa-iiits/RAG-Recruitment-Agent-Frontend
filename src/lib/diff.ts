/** Line-level diff for the rewrite's before/after view. */
export type DiffLine = { type: 'same' | 'add' | 'remove'; text: string };

function split(text: string): string[] {
  return text.replace(/\r\n/g, '\n').split('\n');
}

/**
 * Classic LCS line diff. Resumes run to a few hundred lines, so the O(n*m)
 * table is cheap; anything larger falls back to a plain replace-all.
 */
export function diffLines(before: string, after: string): DiffLine[] {
  const a = split(before);
  const b = split(after);

  if (a.length * b.length > 4_000_000) {
    return [
      ...a.map((text) => ({ type: 'remove' as const, text })),
      ...b.map((text) => ({ type: 'add' as const, text })),
    ];
  }

  const table: number[][] = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      table[i][j] =
        a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      out.push({ type: 'same', text: a[i] });
      i++;
      j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      out.push({ type: 'remove', text: a[i] });
      i++;
    } else {
      out.push({ type: 'add', text: b[j] });
      j++;
    }
  }
  while (i < a.length) out.push({ type: 'remove', text: a[i++] });
  while (j < b.length) out.push({ type: 'add', text: b[j++] });

  return out;
}

export function diffStats(lines: DiffLine[]) {
  return {
    added: lines.filter((l) => l.type === 'add' && l.text.trim()).length,
    removed: lines.filter((l) => l.type === 'remove' && l.text.trim()).length,
    unchanged: lines.filter((l) => l.type === 'same' && l.text.trim()).length,
  };
}

/** Saves text to the user's machine — no backend download endpoint needed. */
export function downloadText(filename: string, text: string) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}
