/* ══════════════════════════════════════════════════════════════════════════
   UI Store — Sidebar collapse state and theme preference
   ══════════════════════════════════════════════════════════════════════════ */

import { create } from 'zustand';

/**
 * Interface representing the state and actions for the UI.
 */
interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
}

/**
 * Zustand store for managing UI state.
 */
export const useUiStore = create<UiState>((set) => ({
  // Initial state for the sidebar collapse status
  sidebarCollapsed: false,
  
  /**
   * Toggles the collapsed state of the sidebar.
   */
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  
  // Initial state for the mobile menu visibility
  mobileMenuOpen: false,
  
  /**
   * Sets the visibility state of the mobile menu.
   * @param open - Boolean indicating whether the mobile menu should be open.
   */
  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));
