import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from './AuthContext';
import { userService } from '../services/articleService';
import { ADMIN_PAGES, pathToPageKey } from '../config/adminPages';

const AdminPermissionsContext = createContext(null);

export const AdminPermissionsProvider = ({ children }) => {
  const { user } = useAuth();
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setPages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    userService
      .getMyPermissions()
      .then(({ data }) => setPages(data.data?.pages || []))
      .catch(() => setPages([]))
      .finally(() => setLoading(false));
  }, [user]);

  const isSuperAdmin = user?.role === 'SUPER_ADMIN';

  const canAccessPage = (pageKey) => {
    if (!pageKey) return true;
    if (isSuperAdmin) return true;
    return pages.includes(pageKey);
  };

  /**
   * Action check: articles-edit, categories-delete, users-create, …
   * Backward compatible: if only legacy view key exists and no *-edit keys were
   * ever assigned for that module, view grants edit/create/delete.
   */
  const canDo = (actionKey) => {
    if (!actionKey) return true;
    if (isSuperAdmin) return true;
    if (pages.includes(actionKey)) return true;

    // AUTHOR always may create/edit articles (submit-for-review workflow)
    if (
      user?.role === 'AUTHOR' &&
      (actionKey === 'articles-create' || actionKey === 'articles-edit')
    ) {
      return true;
    }

    const m = String(actionKey).match(/^(.*)-(create|edit|delete)$/);
    if (!m) return false;
    const moduleKey = m[1];
    const hasGranular = pages.some((k) => k.startsWith(`${moduleKey}-`));
    if (!hasGranular && pages.includes(moduleKey)) return true;
    return false;
  };

  const canAccessPath = (pathname) => {
    const key = pathToPageKey(pathname);
    if (!key) return true;
    if (canAccessPage(key)) return true;
    // Opening edit/create routes: allow if action granted
    if (key.endsWith('-create') || key.endsWith('-edit')) return canDo(key);
    // Fallback: module view
    const moduleKey = key.replace(/-(create|edit|delete)$/, '');
    return canAccessPage(moduleKey);
  };

  const firstAllowedPath = useMemo(() => {
    if (isSuperAdmin) return '/admin';
    for (const item of ADMIN_PAGES) {
      if (pages.includes(item.key) || canDo(item.key)) return item.path;
    }
    return '/admin';
  }, [isSuperAdmin, pages]);

  return (
    <AdminPermissionsContext.Provider
      value={{
        pages,
        loading,
        canAccessPage,
        canAccessPath,
        canDo,
        firstAllowedPath,
        isSuperAdmin,
        refreshPermissions: async () => {
          const { data } = await userService.getMyPermissions();
          setPages(data.data?.pages || []);
        },
      }}
    >
      {children}
    </AdminPermissionsContext.Provider>
  );
};

export const useAdminPermissions = () => {
  const ctx = useContext(AdminPermissionsContext);
  if (!ctx) {
    throw new Error('useAdminPermissions must be used within AdminPermissionsProvider');
  }
  return ctx;
};
