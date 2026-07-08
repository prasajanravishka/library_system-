/* ══════════════════════════════════════════════════════════════════════════
   Locations API — Location management operations
   ══════════════════════════════════════════════════════════════════════════ */

import client from './client';
import type { Location } from '../types/location.types';

/**
 * Locations API methods
 * Manages physical locations (e.g. shelves, sections) within the library.
 */
export const locationsApi = {
  /** 
   * Retrieves all library locations.
   * GET /api/locations — All locations 
   * 
   * @returns A promise resolving to an array of Location objects
   */
  getAll: async (): Promise<Location[]> => {
    // Fetch the list of locations from the server
    const { data } = await client.get<{ status: string; locations: Location[] }>('/locations');
    // Extract and return the locations array
    return data.locations;
  },

  /** 
   * Creates a new physical location in the library system.
   * POST /api/admin/locations — Create a new location 
   * 
   * @param locationData - The data for the new location (Partial<Location>)
   * @returns A promise resolving to the created Location object
   */
  create: async (locationData: Partial<Location>): Promise<Location> => {
    // Send post request with new location details
    const { data } = await client.post<{ status: string; location: Location }>('/admin/locations', locationData);
    // Return the newly created location
    return data.location;
  },

  /** 
   * Updates an existing library location.
   * PUT /api/admin/locations/{id} — Update an existing location 
   * 
   * @param locationId - The unique identifier of the location to update
   * @param locationData - The updated fields for the location
   * @returns A promise resolving to the updated Location object
   */
  update: async (locationId: number, locationData: Partial<Location>): Promise<Location> => {
    // Send put request to update the location with the provided data
    const { data } = await client.put<{ status: string; location: Location }>(
      `/admin/locations/${locationId}`,
      locationData
    );
    // Return the modified location object
    return data.location;
  },

  /** 
   * Deletes a library location.
   * DELETE /api/admin/locations/{id} — Delete a location 
   * 
   * @param locationId - The unique identifier of the location to delete
   * @returns A promise that resolves when the location is successfully deleted
   */
  delete: async (locationId: number): Promise<void> => {
    // Send delete request for the specific location ID
    await client.delete(`/admin/locations/${locationId}`);
  },
};
