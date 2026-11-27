import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../services/articleService';
import { useAuth } from '../context/AuthContext';
import { useAdminPermissions } from '../context/AdminPermissionsContext';
import toast from 'react-hot-toast';
import AdminPageHeader from './AdminPageHeader';
import DataTable from './DataTable';

const emptyForm = () => ({
  name: '',
  email: '',
  password: '',
  role: 'AUTHOR',
  status: 'active',
});

const BYLINE_ROLES = new Set(['AUTHOR', 'REPORTER', 'EDITOR']);

const Users = () => {
  const { hasRole, user: currentUser } = useAuth();
  const { canDo } = useAdminPermissions();
  const canCreate = canDo('users-create');
  const canEdit = canDo('users-edit');
  const canDelete = canDo('users-delete');
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [passwordUser, setPasswordUser] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ password: '', confirm: '' });
  const [passwordSaving, setPasswordSaving] = useState(false);

  const fetchUsers = () =>
    userService.getAll().then(({ data }) => setUsers(data.data || []));

  useEffect(() => {
    Promise.all([userService.getAll(), userService.getRoles()])
      .then(([usersRes, rolesRes]) => {
        setUsers(usersRes.data.data || []);
        setRoles(rolesRes.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const resetForm = () => {
    setShowForm(false);
    setEditId(null);
    setForm(emptyForm());
  };

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = useCallback((row) => {
    setEditId(row._id);
    setForm({
      name: row.name || '',
      email: row.email || '',
      password: '',
      role: row.role || 'REPORTER',
      status: row.status || 'active',
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const openPassword = useCallback((row) => {
    setPasswordUser(row);
    setPasswordForm({ password: '', confirm: '' });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editId) {
        await userService.update(editId, {
          name: form.name,
          email: form.email,
          role: form.role,
          status: form.status,
        });
        toast.success(
          BYLINE_ROLES.has(form.role)
            ? 'User updated and linked to article Author list'
            : 'User updated'
        );
      } else {
        const { data } = await userService.create(form);
        toast.success(data?.message || 'User created');
      }
      resetForm();
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordUser) return;
    if (passwordForm.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    if (passwordForm.password !== passwordForm.confirm) {
      toast.error('Passwords do not match');
      return;
    }
    setPasswordSaving(true);
    try {
      await userService.setPassword(passwordUser._id, passwordForm.password);
      toast.success(`Password updated for ${passwordUser.name}`);
      setPasswordUser(null);
      setPasswordForm({ password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Password update failed');
    } finally {
      setPasswordSaving(false);
    }
  };

  const handleDelete = async (row) => {
    if (String(currentUser?._id) === String(row._id)) {
      toast.error('You cannot delete your own account');
      return;
    }
    const ok = window.confirm(
      `Delete ${row.name} (${row.email})?\nThis also removes their matrimony profile or seller products.`
    );
    if (!ok) return;
    setDeletingId(row._id);
    try {
      await userService.delete(row._id);
      toast.success('User deleted');
      if (editId === row._id) resetForm();
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const columns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Name',
        sortable: true,
        render: (row) => <span className="font-medium text-slate-900">{row.name}</span>,
      },
      {
        key: 'email',
        header: 'Email',
        sortable: true,
        render: (row) => <span className="text-slate-600">{row.email}</span>,
      },
      {
        key: 'role',
        header: 'Role',
        sortable: true,
        render: (row) => (
          <div className="space-y-1">
            <span className="text-xs bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap">
              {row.role.replace(/_/g, ' ')}
            </span>
            {row.role === 'AUTHOR' && row.authorProfile && (
              <p className="text-[11px] text-slate-500 truncate" title={row.authorProfile.slug}>
                Byline: {row.authorProfile.name}
              </p>
            )}
          </div>
        ),
      },
      {
        key: 'status',
        header: 'Status',
        sortable: true,
        render: (row) => (
          <span
            className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${
              row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'
            }`}
          >
            {row.status}
          </span>
        ),
      },
      {
        key: 'actions',
        header: 'Actions',
        render: (row) => {
          const isSelf = String(currentUser?._id) === String(row._id);
          return (
            <div className="data-table-actions flex flex-wrap gap-1.5">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => openEdit(row)}
                  className="data-table-action data-table-action-edit"
                >
                  Edit
                </button>
              )}
              {canEdit && (
                <button
                  type="button"
                  onClick={() => openPassword(row)}
                  className="text-xs font-medium px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                >
                  Change Password
                </button>
              )}
              {canDelete && (
                <button
                  type="button"
                  disabled={deletingId === row._id || isSelf}
                  onClick={() => handleDelete(row)}
                  className="data-table-action data-table-action-delete disabled:opacity-50"
                >
                  {deletingId === row._id ? 'Deleting…' : 'Delete'}
                </button>
              )}
            </div>
          );
        },
      },
    ],
    [currentUser?._id, deletingId, openEdit, openPassword, canEdit, canDelete]
  );

  return (
    <div>
      <AdminPageHeader
        title="Users"
        subtitle="Manage accounts — AUTHOR / REPORTER / EDITOR also appear in the article Author dropdown"
        actionLabel={!showForm && canCreate ? '+ Add User' : undefined}
        onAction={canCreate ? openCreate : undefined}
      >
        {hasRole('SUPER_ADMIN') && (
          <Link to="/admin/role-permissions" className="btn-secondary text-sm py-2.5 px-4 w-full sm:w-auto">
            Role Permissions
          </Link>
        )}
      </AdminPageHeader>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-card mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">
            {editId ? 'Edit User' : 'New User'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input
              placeholder="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              className="admin-input"
            />
            <input
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
              className="admin-input"
            />
            {!editId && (
              <input
                type="password"
                placeholder="Password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={6}
                className="admin-input"
              />
            )}
            <select
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              className="admin-input"
            >
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="admin-input"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          {BYLINE_ROLES.has(form.role) && (
            <p className="text-xs text-teal-800 bg-teal-50 border border-teal-100 rounded-lg px-3 py-2 mt-3">
              Roles <strong>AUTHOR</strong>, <strong>REPORTER</strong>, and <strong>EDITOR</strong> appear in the
              article <strong>Author</strong> dropdown using this name. Use AUTHOR for byline writers.
            </p>
          )}
          {editId && (
            <p className="text-xs text-slate-500 mt-3">
              To reset login credentials, use <strong>Change Password</strong> in the Actions column.
            </p>
          )}
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button type="submit" disabled={saving} className="btn-primary text-sm disabled:opacity-50">
              {saving ? 'Saving…' : editId ? 'Update User' : 'Save'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {passwordUser && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
          onClick={() => !passwordSaving && setPasswordUser(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Change password"
        >
          <form
            onSubmit={handlePasswordSubmit}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-xl w-full max-w-md p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              Change Password
            </h3>
            <p className="text-sm text-slate-500 mt-1">
              {passwordUser.name} · {passwordUser.email}
            </p>
            <div className="mt-4 space-y-3">
              <input
                type="password"
                placeholder="New password (min 6 characters)"
                value={passwordForm.password}
                onChange={(e) => setPasswordForm((p) => ({ ...p, password: e.target.value }))}
                required
                minLength={6}
                className="admin-input w-full"
                autoFocus
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={passwordForm.confirm}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirm: e.target.value }))}
                required
                minLength={6}
                className="admin-input w-full"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-2 mt-5">
              <button
                type="submit"
                disabled={passwordSaving}
                className="btn-primary text-sm disabled:opacity-50"
              >
                {passwordSaving ? 'Updating…' : 'Update Password'}
              </button>
              <button
                type="button"
                disabled={passwordSaving}
                onClick={() => setPasswordUser(null)}
                className="btn-secondary text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <DataTable
        columns={columns}
        data={users}
        loading={loading}
        searchPlaceholder="Search users..."
        searchKeys={['name', 'email', 'role', 'status']}
        emptyMessage="No users found"
      />
    </div>
  );
};

export default Users;
