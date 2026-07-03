/* ══════════════════════════════════════════════════════════════════════════
   Locations API — Location management operations
   ══════════════════════════════════════════════════════════════════════════ */

import client from './client';
import type { Location } from '../types/location.types';

export const locationsApi = {
  /** GET /api/locations — All locations */
  getAll: async (): Promise<Location[]> => {
    const { data } = await client.get<{ status: string; locations: Location[] }>('/locations');
    return data.locations;
  },

  /** POST /api/admin/locations — Create a new location */
  create: async (locationData: Partial<Location>): Promise<Location> => {
    const { data } = await client.post<{ status: string; location: Location }>('/admin/locations', locationData);
    return data.location;
  },

  /** PUT /api/admin/locations/{id} — Update an existing location */
  update: async (locationId: number, locationData: Partial<Location>): Promise<Location> => {
    const { data } = await client.put<{ status: string; location: Location }>(
      `/admin/locations/${locationId}`,
      locationData
    );
    return data.location;
  },

  /** DELETE /api/admin/locations/{id} — Delete a location */
  delete: async (locationId: number): Promise<void> => {
    await client.delete(`/admin/locations/${locationId}`);
  },
};
