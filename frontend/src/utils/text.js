// Text utilities

// Attempt to repair mojibake where UTF-8 bytes were interpreted as Latin-1
export const normalizeVietnameseName = (input) => {
  if (!input || typeof input !== 'string') return input;
  // Heuristic: if we see common mojibake chars, try to re-decode
  if (/[ÃÂáºá»]/.test(input)) {
    try {
      // Latin-1 -> bytes -> UTF-8
      const bytes = new Uint8Array(Array.from(input, (c) => c.charCodeAt(0)));
      const decoded = new TextDecoder('utf-8').decode(bytes);
      if (decoded && decoded !== input) return decoded;
    } catch (_) {}
    try {
      // Fallback older approach
      // eslint-disable-next-line no-undef
      const decoded = decodeURIComponent(escape(input));
      if (decoded && decoded !== input) return decoded;
    } catch (_) {}
  }
  return input;
};


