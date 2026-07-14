import client from './client';

export interface LibrarySettings {
  fine_per_day: string;
  exempt_days: string;
}

export interface LibraryVacation {
  range_id: number;
  start_date: string;
  end_date: string;
  description: string | null;
}

export const settingsApi = {
  getSettings: async (): Promise<LibrarySettings> => {
    const { data } = await client.get('/admin/settings');
    return data.settings;
  },

  updateSettings: async (settings: Partial<LibrarySettings>): Promise<void> => {
    await client.put('/admin/settings', settings);
  },

  getVacations: async (): Promise<LibraryVacation[]> => {
    const { data } = await client.get<{ status: string; vacations: LibraryVacation[] }>('/admin/vacations');
    return data.vacations;
  },

  addVacation: async (vacation: { start_date: string; end_date: string; description?: string }): Promise<void> => {
    await client.post('/admin/vacations', vacation);
  },

  deleteVacation: async (rangeId: number): Promise<void> => {
    await client.delete(`/admin/vacations/${rangeId}`);
  }
};
