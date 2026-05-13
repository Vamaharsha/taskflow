import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { CheckSquare, Clock, AlertTriangle, FolderKanban, Users, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard').then(res => setData(res.data.data)).catch(console.error).finally(() => setLoading(false))
  }, [])

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>

  const s = data?.stats || {}

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Welcome back, {user?.name?.split(' ')[0]} 👋</h2>
          <p>Here's what's happening with your tasks today</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon purple"><CheckSquare size={24} /></div>
          <div><div className="stat-value">{s.totalTasks || 0}</div><div className="stat-label">Total Tasks</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon blue"><Clock size={24} /></div>
          <div><div className="stat-value">{s.inProgress || 0}</div><div className="stat-label">In Progress</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><TrendingUp size={24} /></div>
          <div><div className="stat-value">{s.done || 0}</div><div className="stat-label">Completed</div></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon red"><AlertTriangle size={24} /></div>
          <div><div className="stat-value">{s.overdue || 0}</div><div className="stat-label">Overdue</div></div>
        </div>
        {user?.role === 'admin' && (
          <>
            <div className="stat-card">
              <div className="stat-icon purple"><FolderKanban size={24} /></div>
              <div><div className="stat-value">{s.projectCount || 0}</div><div className="stat-label">Projects</div></div>
            </div>
            <div className="stat-card">
              <div className="stat-icon blue"><Users size={24} /></div>
              <div><div className="stat-value">{s.teamCount || 0}</div><div className="stat-label">Team Members</div></div>
            </div>
          </>
        )}
      </div>

      <div className="dashboard-grid">
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>⚠️ Overdue Tasks</h3>
          {data?.overdueTasks?.length > 0 ? (
            <div className="task-list">
              {data.overdueTasks.map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-card-header">
                    <span className="task-title">{task.title}</span>
                    <span className="badge badge-overdue">Overdue</span>
                  </div>
                  <div className="task-meta">
                    <span className="badge badge-high">{task.priority}</span>
                    {task.dueDate && <span style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>Due: {format(new Date(task.dueDate), 'MMM d')}</span>}
                    {task.project && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.project.name}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No overdue tasks 🎉</p></div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginBottom: 16 }}>🕐 Recent Tasks</h3>
          {data?.recentTasks?.length > 0 ? (
            <div className="task-list">
              {data.recentTasks.map(task => (
                <div key={task.id} className="task-card">
                  <div className="task-card-header">
                    <span className="task-title">{task.title}</span>
                    <span className={`badge badge-${task.status}`}>{task.status}</span>
                  </div>
                  <div className="task-meta">
                    <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                    {task.project && <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{task.project.name}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state"><p>No tasks yet. Create your first project!</p></div>
          )}
        </div>
      </div>

      {data?.priority && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ marginBottom: 16 }}>📊 Active Tasks by Priority</h3>
          <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
            {['high', 'medium', 'low'].map(p => (
              <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className={`badge badge-${p}`}>{p}</span>
                <span style={{ fontWeight: 600, fontSize: '1.1rem' }}>{data.priority[p]}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
