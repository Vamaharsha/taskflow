import { useState, useEffect } from 'react'
import api from '../services/api'
import toast from 'react-hot-toast'

export default function Team() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchUsers = () => {
    api.get('/users').then(r => setUsers(r.data.data)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchUsers() }, [])

  const updateRole = async (userId, role) => {
    try { await api.put(`/users/${userId}/role`, { role }); toast.success('Role updated'); fetchUsers() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header"><div><h2>Team</h2><p>Manage workspace members and roles</p></div></div>
      {users.length > 0 ? (
        <div className="table-container">
          <table>
            <thead><tr><th>Member</th><th>Email</th><th>Role</th><th>Actions</th></tr></thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar" style={{ width: 28, height: 28, fontSize: '0.7rem' }}>{u.name?.[0]?.toUpperCase()}</div>
                      <span style={{ fontWeight: 500 }}>{u.name}</span>
                    </div>
                  </td>
                  <td style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{u.email}</td>
                  <td><span className={`badge badge-${u.role}`}>{u.role}</span></td>
                  <td>
                    <select className="form-select" style={{ width: 'auto', padding: '3px 8px', fontSize: '0.8rem' }} value={u.role} onChange={e => updateRole(u.id, e.target.value)}>
                      <option value="admin">Admin</option><option value="member">Member</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state"><h3>No members</h3></div>
      )}
    </div>
  )
}
