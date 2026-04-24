import { createContext } from 'react';

const ThemeContext = createContext({
  theme: 'light',
  isDarkMode: false,
  toggleTheme: () => {},
});

export default ThemeContext;
