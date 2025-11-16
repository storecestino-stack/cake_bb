import { createContext, useContext, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children, user, setUser }) {
  const theme = user?.theme || 'system';
  const customColors = user?.customColors;

  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', theme);

    // Apply custom colors when theme is 'custom'
    if (theme === 'custom' && customColors) {
      applyCustomColors(customColors);
    } else {
      // Remove custom color overrides if not using custom theme
      removeCustomColors();
    }
  }, [theme, customColors]);

  const applyCustomColors = (colors) => {
    const root = document.documentElement;
    
    // Apply custom colors as CSS variables
    if (colors.background) {
      root.style.setProperty('--custom-background', colors.background);
    }
    if (colors.foreground) {
      root.style.setProperty('--custom-foreground', colors.foreground);
    }
    if (colors.border) {
      root.style.setProperty('--custom-border', colors.border);
    }
    if (colors.primary) {
      root.style.setProperty('--custom-primary', colors.primary);
    }
  };

  const removeCustomColors = () => {
    const root = document.documentElement;
    root.style.removeProperty('--custom-background');
    root.style.removeProperty('--custom-foreground');
    root.style.removeProperty('--custom-border');
    root.style.removeProperty('--custom-primary');
  };

  const updateTheme = async (newTheme) => {
    if (setUser && user) {
      setUser({ ...user, theme: newTheme });
    }
  };

  return (
    <ThemeContext.Provider value={{ theme, updateTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);