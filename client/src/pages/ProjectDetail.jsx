import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Plus, Trash2, UserPlus, X, Loader2, ArrowLeft, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showMemberModal, setShowMemberModal] = useState(false)
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' })
  const [memberEmail, setMemberEmail] = useState('')
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([api.get(`/projects/${id}`), api.get(`/tasks?project=${id}`)])
      setProject(pRes.data.data)
      setTasks(tRes.data.data)
    } catch (err) { 
      console.error('Project load error:', err)
      toast.error(err.response?.data?.message || 'Failed to load project') 
    }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [id])

  const createTask = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/tasks', { ...taskForm, project: id, assignedTo: taskForm.assignedTo || undefined, dueDate: taskForm.dueDate || undefined })
      toast.success('Task created!')
      setShowTaskModal(false)
      setTaskForm({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' })
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const addMember = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post(`/projects/${id}/members`, { email: memberEmail })
      toast.success('Member added!')
      setShowMemberModal(false); setMemberEmail('')
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const updateTaskStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status })
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
  }

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try { 
      await api.delete(`/tasks/${taskId}`); 
      toast.success('Task deleted'); 
      fetchData() 
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to delete task') 
    }
  }

  const deleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return
    try { 
      await api.delete(`/projects/${id}`); 
      toast.success('Project deleted'); 
      navigate('/projects') 
    } catch (err) { 
      toast.error(err.response?.data?.message || 'Failed to delete project') 
    }
  }

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>

  const columns = [
    { key: 'todo', label: 'To Do', color: 'var(--gray-400)' },
    { key: 'in-progress', label: 'In Progress', color: 'var(--info)' },
    { key: 'done', label: 'Done', color: 'var(--success)' },
  ]

  return (
    <div>
      <div className="page-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/projects')}><ArrowLeft size={20} /></button>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 12, height: 12, borderRadius: '50%', background: project.color, display: 'inline-block' }} />
              {project.name}
            </h2>
            <p>{project.description}</p>
          </div>
        </div>
        {isAdmin && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-secondary" onClick={() => setShowMemberModal(true)}><UserPlus size={16} /> Add Member</button>
            <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}><Plus size={16} /> New Task</button>
            <button className="btn btn-danger btn-sm" onClick={deleteProject}><Trash2 size={16} /></button>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="card" style={{ marginBottom: 24, padding: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500 }}>Team:</span>
          {project.members?.map(m => (
            <div key={m.user?.id || m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 20, fontSize: '0.8rem' }}>
              <div className="user-avatar" style={{ width: 22, height: 22, fontSize: '0.6rem' }}>{m.user?.name?.[0] || '?'}</div>
              {m.user?.name || 'Unknown'}
              <span className={`badge badge-${m.role}`} style={{ marginLeft: 4 }}>{m.role}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Board */}
      <div className="kanban-board">
        {columns.map(col => {
          const colTasks = tasks.filter(t => t.status === col.key)
          return (
            <div key={col.key} className="kanban-column">
              <div className="kanban-column-header">
                <div className="kanban-column-title">
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: col.color }} />
                  {col.label}
                </div>
                <span className="kanban-count">{colTasks.length}</span>
              </div>
              <div className="task-list">
                {colTasks.map(task => (
                  <div key={task.id} className="task-card">
                    <div className="task-card-header">
                      <span className="task-title">{task.title}</span>
                      {isAdmin && <button className="btn-ghost" style={{ padding: 4 }} onClick={() => deleteTask(task.id)}><Trash2 size={14} /></button>}
                    </div>
                    {task.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: 8 }}>{task.description}</p>}
                    <div className="task-meta">
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.assignedTo && <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{task.assignedTo.name}</span>}
                      {task.dueDate && (
                        <span style={{ fontSize: '0.75rem', color: new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'var(--danger)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Calendar size={12} /> {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                    {task.status !== 'done' && (
                      <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                        {task.status === 'todo' && <button className="btn btn-secondary btn-sm" onClick={() => updateTaskStatus(task.id, 'in-progress')}>Start</button>}
                        {task.status === 'in-progress' && <button className="btn btn-secondary btn-sm" onClick={() => updateTaskStatus(task.id, 'done')}>Complete</button>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>New Task</h3><button className="btn-ghost" onClick={() => setShowTaskModal(false)}><X size={20} /></button></div>
            <form onSubmit={createTask}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Priority</label>
                  <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                    <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Assign To</label>
                  <select className="form-select" value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                    <option value="">Unassigned</option>
                    {project.members?.map(m => <option key={m.user?.id} value={m.user?.id}>{m.user?.name}</option>)}
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={16} className="spinner" /> : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Member Modal */}
      {showMemberModal && (
        <div className="modal-overlay" onClick={() => setShowMemberModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Add Team Member</h3><button className="btn-ghost" onClick={() => setShowMemberModal(false)}><X size={20} /></button></div>
            <form onSubmit={addMember}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Member Email</label><input type="email" className="form-input" placeholder="colleague@example.com" value={memberEmail} onChange={e => setMemberEmail(e.target.value)} required /></div>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>The user must have an account on TaskFlow</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowMemberModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={16} className="spinner" /> : 'Add Member'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
