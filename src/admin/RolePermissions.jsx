import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { userService } from '../services/articleService';
import AdminPageHeader from './AdminPageHeader';
import { ROLE_LABELS } from '../config/adminPages';

const DEFAULT_ACTION_LABELS = { create: 'Add', edit: 'Edit', delete: 'Delete' };

const RolePermissions = () => {
  const [loading, setLoading] = useState(true);
  const [savingRole, setSavingRole] = useState(null);
  const [pages, setPages] = useState([]);
  const [modules, setModules] = useState([]);
  const [actionLabels, setActionLabels] = useState(DEFAULT_ACTION_LABELS);
  const [roles, setRoles] = useState({});
  const [adminRoles, setAdminRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('EDITOR');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await userService.getPermissionConfig();
      setPages(data.data?.pages || []);
      setModules(data.data?.modules || []);
      setActionLabels(data.data?.actionLabels || DEFAULT_ACTION_LABELS);
      setRoles(data.data?.roles || {});
      const assignable = (data.data?.adminRoles || []).filter((r) => r !== 'SUPER_ADMIN');
      setAdminRoles(assignable);
      setSelectedRole((prev) => (assignable.includes(prev) ? prev : assignable[0] || 'EDITOR'));
    } catch {
      toast.error('Failed to load role permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const rolePages = roles[selectedRole] || [];
  const enabledCount = rolePages.length;
  const totalCount = pages.length || modules.reduce((n, m) => n + 1 + (m.actions?.length || 0), 0);

  const moduleRows = useMemo(() => {
    if (modules.length) return modules;
    // Fallback from flat pages if API is old
    const map = new Map();
    for (const p of pages) {
      const mod = p.module || p.key.replace(/-(create|edit|delete)$/, '');
      if (!map.has(mod)) {
        map.set(mod, {
          key: mod,
          label: p.label?.split(' — ')[0] || mod,
          actions: [],
        });
      }
      if (p.action && p.action !== 'view') {
        map.get(mod).actions.push(p.action);
      }
    }
    return Array.from(map.values());
  }, [modules, pages]);

  const setRolePages = (nextList) => {
    setRoles((prev) => ({ ...prev, [selectedRole]: nextList }));
  };

  const hasKey = (key) => rolePages.includes(key);

  const toggleKey = (key) => {
    const next = hasKey(key) ? rolePages.filter((k) => k !== key) : [...rolePages, key];
    setRolePages(next);
  };

  const toggleModuleView = (mod) => {
    const keys = [mod.key, ...(mod.actions || []).map((a) => `${mod.key}-${a}`)];
    const viewOn = hasKey(mod.key);
    if (viewOn) {
      setRolePages(rolePages.filter((k) => !keys.includes(k)));
    } else {
      setRolePages(Array.from(new Set([...rolePages, mod.key])));
    }
  };

  const selectAll = () => {
    const all = modules.length
      ? modules.flatMap((m) => [m.key, ...(m.actions || []).map((a) => `${m.key}-${a}`)])
      : pages.map((p) => p.key);
    setRolePages(all);
  };

  const clearAll = () => setRolePages(['dashboard']);

  const handleSave = async () => {
    setSavingRole(selectedRole);
    try {
      await userService.updateRolePermissions(selectedRole, rolePages);
      toast.success(`${ROLE_LABELS[selectedRole] || selectedRole} permissions saved`);
      await load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSavingRole(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-slate-500">Loading permissions…</p>;
  }

  return (
    <div>
      <AdminPageHeader
        title="Role Permissions"
        subtitle="View / Add / Edit / Delete for every admin module"
      >
        <Link to="/admin/users" className="btn-secondary text-sm py-2.5 px-4 w-full sm:w-auto">
          ← Back to Users
        </Link>
      </AdminPageHeader>

      <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600 mb-6 space-y-1">
        <p>
          <strong>Super Admin</strong> always has full access. Tick <strong>View</strong> for sidebar access,
          plus <strong>Add / Edit / Delete</strong> for actions on that module.
        </p>
        <p>
          Any role (Editor, Reporter, Seller, Matrimony, …) can receive all options via <strong>Enable all</strong>.
        </p>
      </div>

      <div className="admin-card mb-6">
        <label className="block text-sm font-medium text-slate-700 mb-2">Select role</label>
        <div className="flex flex-wrap gap-2">
          {adminRoles.map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setSelectedRole(role)}
              className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
                selectedRole === role ? 'admin-tab admin-tab-active' : 'admin-tab'
              }`}
            >
              {ROLE_LABELS[role] || role.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="admin-card">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h2 className="font-semibold text-slate-900">
              Pages for {ROLE_LABELS[selectedRole] || selectedRole}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {enabledCount} of {totalCount} permission keys enabled
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={selectAll} className="btn-secondary text-xs py-1.5 px-3">
              Enable all
            </button>
            <button type="button" onClick={clearAll} className="btn-secondary text-xs py-1.5 px-3">
              Dashboard only
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={savingRole === selectedRole}
              className="btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
            >
              {savingRole === selectedRole ? 'Saving…' : 'Save permissions'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {moduleRows.map((mod) => {
            const viewOn = hasKey(mod.key);
            const actions = mod.actions || [];
            return (
              <div
                key={mod.key}
                className={`rounded-xl border px-4 py-3 ${
                  viewOn ? 'border-emerald-200 bg-emerald-50/40' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{mod.label}</p>
                    <p className="text-[10px] text-slate-400 font-mono">{mod.key}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                    <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={viewOn}
                        onChange={() => toggleModuleView(mod)}
                        className="rounded border-slate-300 h-4 w-4"
                      />
                      View
                    </label>
                    {actions.map((action) => {
                      const key = `${mod.key}-${action}`;
                      return (
                        <label
                          key={key}
                          className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={hasKey(key)}
                            onChange={() => toggleKey(key)}
                            className="rounded border-slate-300 h-4 w-4"
                          />
                          {actionLabels[action] || action}
                        </label>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default RolePermissions;
