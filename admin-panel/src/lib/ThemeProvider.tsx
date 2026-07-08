import React, { createContext, useContext, useEffect, useState } from 'react';

/**
 * Defines the possible theme types.
 */
type Theme = 'dark' | 'light';

/**
 * Interface for the Theme Context.
 */
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

// Create the Theme Context with an initially undefined value
const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/**
 * ThemeProvider component to manage and provide the application theme.
 * @param children - The child components to be wrapped by the provider.
 */
export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Initialize the theme state with 'dark' as the default
  const [theme, setTheme] = useState<Theme>('dark');

  // Effect to load the saved theme from localStorage on component mount
  useEffect(() => {
    // Attempt to retrieve the saved theme
    const savedTheme = localStorage.getItem('app-theme') as Theme | null;
    if (savedTheme) {
      // Update the theme state if a saved theme is found
      setTheme(savedTheme);
    }
  }, []);

  // Effect to apply the theme to the document and save it to localStorage whenever it changes
  useEffect(() => {
    if (theme === 'light') {
      // Apply the 'light' theme attribute to the document element
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      // Remove the 'light' theme attribute to revert to the default (dark) theme
      document.documentElement.removeAttribute('data-theme');
    }
    // Save the current theme to localStorage
    localStorage.setItem('app-theme', theme);
  }, [theme]);

  /**
   * Toggles the theme between 'dark' and 'light'.
   */
  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

/**
 * Custom hook to access the Theme Context.
 * @returns The current theme and the toggleTheme function.
 * @throws Error if used outside of a ThemeProvider.
 */
export const useTheme = () => {
  // Access the Theme Context
  const context = useContext(ThemeContext);
  // Ensure the hook is used within a ThemeProvider
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};
