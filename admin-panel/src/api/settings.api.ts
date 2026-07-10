import client from './client';

export interface LibrarySettings {
  fine_per_day: string;
  exempt_days: string;
}

export const settingsApi = {
  getSettings: async (): Promise<LibrarySettings> => {
    const { data } = await client.get('/admin/settings');
    return data.settings;
  },

  updateSettings: async (settings: Partial<LibrarySettings>): Promise<void> => {
    await client.put('/admin/settings', settings);
  }
};
