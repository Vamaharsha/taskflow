import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { format } from 'date-fns'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(r => setData(r.data.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>
  if (!data) return <div className="empty-state"><h3>Failed to load dashboard</h3></div>

  const s = data.stats

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p>{isAdmin ? 'Workspace overview' : `Your assigned work`}</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-eyebrow">Projects</div>
          <div className="stat-value">{s.projectCount}</div>
          <div className="stat-label">Total</div>
        </div>
        {isAdmin && (
          <>
            <div className="stat-card">
              <div className="stat-eyebrow">Active</div>
              <div className="stat-value" style={{ color: 'var(--accent-text)' }}>{s.projectsInProgress}</div>
              <div className="stat-label">In progress</div>
            </div>
            <div className="stat-card">
              <div className="stat-eyebrow">Completed</div>
              <div className="stat-value" style={{ color: 'var(--success)' }}>{s.projectsDone}</div>
              <div className="stat-label">Done</div>
            </div>
          </>
        )}
        <div className="stat-card">
          <div className="stat-eyebrow">Tasks</div>
          <div className="stat-value">{s.totalTasks}</div>
          <div className="stat-label">{s.todo} todo · {s.inProgress} active · {s.done} done</div>
        </div>
        <div className="stat-card">
          <div className="stat-eyebrow">Overdue</div>
          <div className="stat-value" style={{ color: s.overdue > 0 ? 'var(--danger)' : 'var(--text-primary)' }}>{s.overdue}</div>
          <div className="stat-label">Past deadline</div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {isAdmin && data.recentActivity?.length > 0 && (
            <div className="card">
              <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: 16 }}>Recent activity</h3>
              <div className="task-list">
                {data.recentActivity.map(p => (
                  <div key={p.id} className="task-card" style={{ cursor: 'pointer' }} onClick={() => navigate(`/projects/${p.id}`)}>
                    <div className="task-card-header">
                      <span className="task-title">{p.name}</span>
                      <span className={`badge badge-${p.status === 'Done' ? 'done' : p.status === 'In Progress' ? 'in-progress' : 'todo'}`}>{p.status}</span>
                    </div>
                    <div className="task-meta">
                      <span>{format(new Date(p.updatedAt), 'MMM d, h:mm a')}</span>
                      <span style={{ textTransform: 'capitalize' }}>· {p.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: 16 }}>Overdue</h3>
            {data.overdueTasks?.length > 0 ? (
              <div className="task-list">
                {data.overdueTasks.map(t => (
                  <div key={t.id} className="task-card" style={{ borderLeftColor: 'var(--danger)' }}>
                    <div className="task-card-header">
                      <span className="task-title">{t.title}</span>
                      <span className="badge badge-overdue">Overdue</span>
                    </div>
                    <div className="task-meta">
                      <span style={{ color: 'var(--danger)' }}>Due {format(new Date(t.dueDate), 'MMM d')}</span>
                      {t.project && <span>· {t.project.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}><p>No overdue tasks</p></div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: 16 }}>Recent tasks</h3>
            {data.recentTasks?.length > 0 ? (
              <div className="task-list">
                {data.recentTasks.map(t => (
                  <div key={t.id} className="task-card">
                    <div className="task-card-header">
                      <span className="task-title">{t.title}</span>
                      <span className={`badge badge-${t.status}`}>{t.status}</span>
                    </div>
                    <div className="task-meta">
                      <span className={`badge badge-${t.priority}`}>{t.priority}</span>
                      {t.project && <span>· {t.project.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '20px 0' }}><p>No recent tasks</p></div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
