import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { userService } from '../services/articleService';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import AdminPageHeader from './AdminPageHeader';
import DataTable from './DataTable';

const Users = () => {
  const { hasRole, user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'REPORTER', status: 'active' });

  const fetchUsers = () =>
    userService.getAll().then(({ data }) => setUsers(data.data || []));

  useEffect(() => {
    Promise.all([
      userService.getAll(),
      userService.getRoles(),
    ]).then(([usersRes, rolesRes]) => {
      setUsers(usersRes.data.data || []);
      setRoles(rolesRes.data.data || []);
    }).finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await userService.create(form);
      toast.success('User created');
      setShowForm(false);
      setForm({ name: '', email: '', password: '', role: 'REPORTER', status: 'active' });
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
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
      await fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeletingId(null);
    }
  };

  const columns = useMemo(() => [
    { key: 'name', header: 'Name', sortable: true, render: (row) => <span className="font-medium text-slate-900">{row.name}</span> },
    { key: 'email', header: 'Email', sortable: true, render: (row) => <span className="text-slate-600">{row.email}</span> },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (row) => (
        <span className="text-xs bg-brand-50 text-brand-700 px-2.5 py-0.5 rounded-full font-medium whitespace-nowrap">
          {row.role.replace(/_/g, ' ')}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => (
        <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium capitalize ${row.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-600'}`}>
          {row.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="data-table-actions">
          <button
            type="button"
            disabled={deletingId === row._id || String(currentUser?._id) === String(row._id)}
            onClick={() => handleDelete(row)}
            className="data-table-action data-table-action-delete disabled:opacity-50"
          >
            {deletingId === row._id ? 'Deleting…' : 'Delete'}
          </button>
        </div>
      ),
    },
  ], [currentUser?._id, deletingId]);

  return (
    <div>
      <AdminPageHeader
        title="Users"
        subtitle="Manage admin accounts and roles"
        actionLabel={showForm ? undefined : '+ Add User'}
        onAction={() => setShowForm(true)}
      >
        {hasRole('SUPER_ADMIN') && (
          <Link to="/admin/role-permissions" className="btn-secondary text-sm py-2.5 px-4 w-full sm:w-auto">
            Role Permissions
          </Link>
        )}
      </AdminPageHeader>

      {showForm && (
        <form onSubmit={handleSubmit} className="admin-card mb-6">
          <h2 className="font-semibold text-slate-900 mb-4">New User</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <input placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="admin-input" />
            <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required className="admin-input" />
            <input type="password" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required className="admin-input" />
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="admin-input">
              {roles.map((r) => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-4">
            <button type="submit" className="btn-primary text-sm">Save</button>
            <button type="button" onClick={() => setShowForm(false)} className="btn-secondary text-sm">Cancel</button>
          </div>
        </form>
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
