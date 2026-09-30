/**
 * Unpaywall — legitimate OA PDF location lookup.
 */

import axios from 'axios';
import { normalizeDoi } from './types.js';

export type UnpaywallResult = {
  doi: string;
  isOa: boolean;
  oaStatus?: string | null;
  pdfUrl?: string | null;
  hostType?: string | null;
};

export class UnpaywallProvider {
  async lookup(doi: string): Promise<UnpaywallResult | null> {
    const cleaned = normalizeDoi(doi);
    const email = process.env.UNPAYWALL_EMAIL || process.env.OPENALEX_MAILTO;
    if (!cleaned || !email) return null;
    try {
      const { data } = await axios.get(`https://api.unpaywall.org/v2/${encodeURIComponent(cleaned)}`, {
        params: { email },
        timeout: 12000,
      });
      const best = data.best_oa_location;
      return {
        doi: cleaned,
        isOa: Boolean(data.is_oa),
        oaStatus: data.oa_status || null,
        pdfUrl: best?.url_for_pdf || best?.url || null,
        hostType: best?.host_type || null,
      };
    } catch {
      return null;
    }
  }
}

export const unpaywallProvider = new UnpaywallProvider();
