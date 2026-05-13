import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const fetchTasks = () => {
    const p = new URLSearchParams()
    if (statusFilter) p.append('status', statusFilter)
    if (priorityFilter) p.append('priority', priorityFilter)
    api.get(`/tasks?${p}`).then(r => setTasks(r.data.data)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchTasks() }, [statusFilter, priorityFilter])

  const updateStatus = async (taskId, status) => {
    try { await api.put(`/tasks/${taskId}`, { status }); fetchTasks() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div><h2>Tasks</h2><p>{user?.role === 'admin' ? 'All tasks across projects' : 'Tasks assigned to you'}</p></div>
      </div>

      <div className="filters-bar">
        <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          <option value="todo">Not Started</option><option value="in-progress">In Progress</option><option value="done">Done</option>
        </select>
        <select className="form-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          <option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option>
        </select>
      </div>

      {tasks.length > 0 ? (
        <div className="table-container">
          <table>
            <thead><tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Assigned</th><th>Due</th><th>Actions</th></tr></thead>
            <tbody>
              {tasks.map(t => {
                const overdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
                return (
                  <tr key={t.id}>
                    <td style={{ fontWeight: 500 }}>{t.title}</td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 6, height: 6, borderRadius: 2, background: t.project?.color || 'var(--accent)' }} />{t.project?.name}</span></td>
                    <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                    <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{t.assignedTo?.name || '—'}</td>
                    <td>
                      {t.dueDate ? (
                        <span style={{ color: overdue ? 'var(--danger)' : 'var(--text-secondary)', fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                          {format(new Date(t.dueDate), 'MMM d')}
                          {overdue && <span className="badge badge-overdue" style={{ marginLeft: 6 }}>Late</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {t.status !== 'done' ? (
                        <select className="form-select" style={{ width: 'auto', padding: '3px 8px', fontSize: '0.8rem' }} value={t.status} onChange={e => updateStatus(t.id, e.target.value)}>
                          <option value="todo">Not Started</option><option value="in-progress">In Progress</option><option value="done">Done</option>
                        </select>
                      ) : <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--success)' }}>DONE</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state"><h3>No tasks found</h3><p>Tasks appear here when created and assigned</p></div>
      )}
    </div>
  )
}
