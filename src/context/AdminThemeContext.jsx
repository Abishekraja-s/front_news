import { useTheme } from './ThemeContext';

/**
 * Admin shell dark/light styling. Theme preference comes from the root ThemeProvider.
 */
export const AdminThemeProvider = ({ children }) => {
  const { isDark } = useTheme();
  return (
    <div className={`admin-shell min-h-full transition-colors duration-200 ${isDark ? 'dark' : ''}`}>
      {children}
    </div>
  );
};

export const useAdminTheme = () => useTheme();

export default null;
