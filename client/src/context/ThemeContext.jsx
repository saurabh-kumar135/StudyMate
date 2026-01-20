import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const themeVersion = localStorage.getItem('studymate-theme-version');
    if (themeVersion !== '2.0') {
      localStorage.setItem('studymate-theme', 'light');
      localStorage.setItem('studymate-theme-version', '2.0');
      return 'light';
    }
    const savedTheme = localStorage.getItem('studymate-theme');
    return savedTheme || 'light';
  });

  useEffect(() => {
    // Apply theme class to document root
    document.documentElement.setAttribute('data-theme', theme);
    // Save theme preference
    localStorage.setItem('studymate-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
