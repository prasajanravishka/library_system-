/* ══════════════════════════════════════════════════════════════════════════
   Location Entity Types
   ══════════════════════════════════════════════════════════════════════════ */

export interface Location {
  location_id: number;
  name: string;
  floor?: string | null;
  description?: string | null;
}
