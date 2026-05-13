import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { LayoutDashboard, CheckCircle, Clock, AlertTriangle, Users, Folder, Activity } from 'lucide-react'
import { format } from 'date-fns'

export default function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.get('/dashboard')
      .then(res => setData(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="loading-page"><div className="spinner" /></div>
  if (!data) return <div className="empty-state"><h3>Failed to load dashboard</h3></div>

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Welcome back, {user?.name?.split(' ')[0]}</h2>
          <p>Here's what's happening in your workspace today.</p>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div className="stat-icon" style={{ background: 'var(--bg-elevated)', color: 'var(--text-primary)' }}><Folder size={24} /></div>
            <div>
              <div className="stat-value">{data.stats.projectCount}</div>
              <div className="stat-label">Total Projects</div>
            </div>
          </div>
        </div>

        {isAdmin && (
          <>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div className="stat-icon" style={{ background: 'rgba(75, 123, 237, 0.1)', color: 'var(--info)' }}><Activity size={24} /></div>
                <div>
                  <div className="stat-value">{data.stats.projectsInProgress}</div>
                  <div className="stat-label">Active Projects</div>
                </div>
              </div>
            </div>
            <div className="stat-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                <div className="stat-icon" style={{ background: 'rgba(46, 159, 107, 0.1)', color: 'var(--success)' }}><CheckCircle size={24} /></div>
                <div>
                  <div className="stat-value">{data.stats.projectsDone}</div>
                  <div className="stat-label">Completed Projects</div>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="stat-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div className="stat-icon" style={{ background: 'rgba(226, 78, 78, 0.1)', color: 'var(--danger)' }}><AlertTriangle size={24} /></div>
            <div>
              <div className="stat-value">{data.stats.overdue}</div>
              <div className="stat-label">Overdue Tasks</div>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        {/* Left Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {isAdmin && data.recentActivity && data.recentActivity.length > 0 && (
            <div className="card">
              <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Recent Projects Activity</h3>
              <div className="task-list">
                {data.recentActivity.map(project => (
                  <div key={project.id} className="task-card" onClick={() => navigate(`/projects/${project.id}`)}>
                    <div className="task-card-header">
                      <span className="task-title">{project.name}</span>
                      <span className={`badge badge-${project.status === 'Done' ? 'done' : project.status === 'In Progress' ? 'in-progress' : 'todo'}`}>{project.status}</span>
                    </div>
                    <div className="task-meta">
                      <span>Updated {format(new Date(project.updatedAt), 'MMM d, h:mm a')}</span>
                      <span style={{ textTransform: 'capitalize' }}>• {project.type}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Your Overdue Tasks</h3>
            {data.overdueTasks?.length > 0 ? (
              <div className="task-list">
                {data.overdueTasks.map(task => (
                  <div key={task.id} className="task-card" style={{ borderLeft: '3px solid var(--danger)' }}>
                    <div className="task-card-header">
                      <span className="task-title">{task.title}</span>
                      <span className="badge badge-overdue">Overdue</span>
                    </div>
                    <div className="task-meta">
                      <span style={{ color: 'var(--danger)' }}>Due {format(new Date(task.dueDate), 'MMM d')}</span>
                      {task.project && <span>• {task.project.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px 12px' }}>
                <p>No overdue tasks! You're all caught up.</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div className="card">
            <h3 style={{ fontSize: '1.1rem', marginBottom: 16 }}>Recent Tasks</h3>
            {data.recentTasks?.length > 0 ? (
              <div className="task-list">
                {data.recentTasks.map(task => (
                  <div key={task.id} className="task-card">
                    <div className="task-card-header">
                      <span className="task-title">{task.title}</span>
                      <span className={`badge badge-${task.status}`}>{task.status}</span>
                    </div>
                    <div className="task-meta">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.project && <span>• {task.project.name}</span>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '24px 12px' }}>
                <p>No recent tasks found.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
