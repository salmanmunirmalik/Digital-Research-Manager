/**
 * Re-export shared citation helpers for server code.
 */
export {
  parseBibtex,
  formatInText,
  formatBibliography,
  buildBibliography,
  normalizeDoi,
  insertAtCursor,
  type CitationRecord,
} from '../../../utils/citationFormat.js';
