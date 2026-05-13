import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { CheckSquare, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'

export default function Tasks() {
  const { user } = useAuth()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  const fetchTasks = () => {
    const params = new URLSearchParams()
    if (statusFilter) params.append('status', statusFilter)
    if (priorityFilter) params.append('priority', priorityFilter)
    api.get(`/tasks?${params}`).then(res => setTasks(res.data.data)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchTasks() }, [statusFilter, priorityFilter])

  const updateStatus = async (taskId, status) => {
    try { await api.put(`/tasks/${taskId}`, { status }); fetchTasks() }
    catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div><h2>Tasks</h2><p>{user?.role === 'admin' ? 'All tasks across projects' : 'Tasks assigned to you'}</p></div>
      </div>

      <div className="filters-bar">
        <select className="form-select" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="todo">To Do</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <select className="form-select" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
          <option value="">All Priorities</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {tasks.length > 0 ? (
        <div className="table-container">
          <table>
            <thead>
              <tr><th>Task</th><th>Project</th><th>Status</th><th>Priority</th><th>Assigned To</th><th>Due Date</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {tasks.map(t => {
                const overdue = t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'done'
                return (
                  <tr key={t._id}>
                    <td style={{ fontWeight: 500 }}>{t.title}</td>
                    <td><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: t.project?.color || '#6366f1' }} />{t.project?.name}</span></td>
                    <td><span className={`badge badge-${t.status}`}>{t.status}</span></td>
                    <td><span className={`badge badge-${t.priority}`}>{t.priority}</span></td>
                    <td>{t.assignedTo?.name || '—'}</td>
                    <td>
                      {t.dueDate ? (
                        <span style={{ color: overdue ? 'var(--danger)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Calendar size={14} /> {format(new Date(t.dueDate), 'MMM d, yyyy')}
                          {overdue && <span className="badge badge-overdue" style={{ marginLeft: 4 }}>Overdue</span>}
                        </span>
                      ) : '—'}
                    </td>
                    <td>
                      {t.status !== 'done' && (
                        <select className="form-select" style={{ width: 'auto', padding: '4px 8px', fontSize: '0.8rem' }} value={t.status} onChange={e => updateStatus(t._id, e.target.value)}>
                          <option value="todo">To Do</option>
                          <option value="in-progress">In Progress</option>
                          <option value="done">Done</option>
                        </select>
                      )}
                      {t.status === 'done' && <span style={{ color: 'var(--success)', fontSize: '0.8rem' }}>✓ Complete</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="card empty-state">
          <CheckSquare size={48} />
          <h3>No tasks found</h3>
          <p>Tasks will appear here when they're created and assigned</p>
        </div>
      )}
    </div>
  )
}
