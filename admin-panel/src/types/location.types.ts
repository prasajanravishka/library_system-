/* ══════════════════════════════════════════════════════════════════════════
   Location Entity Types
   ══════════════════════════════════════════════════════════════════════════ */

/**
 * Represents a Location entity.
 */
export interface Location {
  location_id: number;
  name: string;
  floor?: string | null;
  description?: string | null;
}
