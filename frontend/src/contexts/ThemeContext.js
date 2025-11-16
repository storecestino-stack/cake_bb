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

  // Helper function to convert HEX to HSL format for CSS variables
  const hexToHSL = (hex) => {
    // Remove the hash if present
    hex = hex.replace(/^#/, '');
    
    // Parse the hex values
    const r = parseInt(hex.substring(0, 2), 16) / 255;
    const g = parseInt(hex.substring(2, 4), 16) / 255;
    const b = parseInt(hex.substring(4, 6), 16) / 255;
    
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    
    if (max === min) {
      h = s = 0; // achromatic
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    
    h = Math.round(h * 360);
    s = Math.round(s * 100);
    l = Math.round(l * 100);
    
    return `${h} ${s}% ${l}%`;
  };

  const applyCustomColors = (colors) => {
    const root = document.documentElement;
    
    // Apply custom colors as CSS variables in HSL format
    if (colors.background) {
      root.style.setProperty('--custom-background', hexToHSL(colors.background));
    }
    if (colors.foreground) {
      root.style.setProperty('--custom-foreground', hexToHSL(colors.foreground));
    }
    if (colors.border) {
      root.style.setProperty('--custom-border', hexToHSL(colors.border));
    }
    if (colors.primary) {
      root.style.setProperty('--custom-primary', hexToHSL(colors.primary));
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