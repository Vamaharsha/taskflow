import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Plus, Trash2, Edit2, X, Loader2, ArrowLeft, Calendar } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function ProjectDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  
  const [project, setProject] = useState(null)
  const [tasks, setTasks] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
  const [taskForm, setTaskForm] = useState({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' })
  const [editForm, setEditForm] = useState(null)
  const [saving, setSaving] = useState(false)

  const fetchData = async () => {
    try {
      const [pRes, tRes] = await Promise.all([api.get(`/projects/${id}`), api.get(`/tasks?project=${id}`)])
      setProject(pRes.data.data)
      setTasks(tRes.data.data)
      if (isAdmin) {
        const uRes = await api.get('/users')
        setUsers(uRes.data.data)
      }
    } catch (err) {
      console.error('Project load error:', err)
      toast.error(err.response?.data?.message || 'Failed to load project') 
    }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [id])

  const createTask = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/tasks', { ...taskForm, project: id, assignedTo: taskForm.assignedTo || undefined, dueDate: taskForm.dueDate || undefined })
      toast.success('Task created!')
      setShowTaskModal(false)
      setTaskForm({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' })
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const updateTaskStatus = async (taskId, status) => {
    try {
      await api.put(`/tasks/${taskId}`, { status })
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update task') }
  }

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try { 
      await api.delete(`/tasks/${taskId}`)
      toast.success('Task deleted')
      fetchData() 
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete task') }
  }

  const updateProjectStatus = async (newStatus) => {
    try {
      await api.put(`/projects/${id}`, { status: newStatus })
      toast.success('Project status updated')
      fetchData()
    } catch (err) { toast.error('Failed to update project status') }
  }

  const openEditModal = () => {
    setEditForm({
      name: project.name,
      description: project.description,
      type: project.type || 'custom',
      status: project.status || 'Not Started',
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
      members: project.members.map(m => m.user?.id || m.userId)
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/projects/${id}`, editForm)
      toast.success('Project updated!')
      setShowEditModal(false)
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
    finally { setSaving(false) }
  }

  const toggleEditMember = (userId) => {
    setEditForm(prev => {
      const isSelected = prev.members.includes(userId)
      if (isSelected) return { ...prev, members: prev.members.filter(m => m !== userId) }
      return { ...prev, members: [...prev.members, userId] }
    })
  }

  const deleteProject = async () => {
    if (!confirm('Delete this project and all its tasks?')) return
    try { 
      await api.delete(`/projects/${id}`)
      toast.success('Project deleted')
      navigate('/projects') 
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to delete project') }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>

  const columns = [
    { key: 'todo', label: 'To Do' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'done', label: 'Done' },
  ]

  return (
    <div>
      <div className="page-header" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn btn-ghost" onClick={() => navigate('/projects')} style={{ padding: 4 }}><ArrowLeft size={20} /></button>
          <div>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: project.color }} />
              {project.name}
            </h2>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginTop: 4, fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              <span style={{ textTransform: 'capitalize' }}>{project.type}</span>
              {project.deadline && <span><Calendar size={12} style={{ marginRight: 4 }} />{format(new Date(project.deadline), 'MMM d, yyyy')}</span>}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isAdmin ? (
            <select className="form-select" style={{ width: 'auto', padding: '6px 12px' }} value={project.status || 'Not Started'} onChange={e => updateProjectStatus(e.target.value)}>
              <option value="Not Started">Not Started</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          ) : (
            <span className={`badge badge-${project.status === 'Done' ? 'done' : 'in-progress'}`}>{project.status}</span>
          )}
          {isAdmin && (
            <>
              <button className="btn btn-secondary" onClick={openEditModal}><Edit2 size={16} /> Edit Project</button>
              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}><Plus size={16} /> New Task</button>
              <button className="btn btn-danger btn-sm" onClick={deleteProject}><Trash2 size={16} /></button>
            </>
          )}
        </div>
      </div>

      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>{project.description}</p>

      {/* Members */}
      <div className="card" style={{ marginBottom: 24, padding: '16px 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>Team ({project.members?.length})</span>
          {project.members?.map(m => (
            <div key={m.user?.id || m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-elevated)', padding: '4px 10px', borderRadius: 20, fontSize: '0.85rem', border: '1px solid var(--border-color)' }}>
              <div className="user-avatar" style={{ width: 20, height: 20, fontSize: '0.6rem' }}>{m.user?.name?.[0]?.toUpperCase() || '?'}</div>
              {m.user?.name || 'Unknown'}
              {m.role === 'admin' && <span style={{ color: 'var(--warning)', fontSize: '0.7rem' }}>👑</span>}
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
                <div className="kanban-column-title">{col.label}</div>
                <span className="kanban-count">{colTasks.length}</span>
              </div>
              <div className="task-list">
                {colTasks.map(task => (
                  <div key={task.id} className="task-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <span className="task-title">{task.title}</span>
                      {isAdmin && <button className="btn-ghost" style={{ padding: 2, color: 'var(--text-muted)' }} onClick={() => deleteTask(task.id)}><Trash2 size={14} /></button>}
                    </div>
                    {task.description && <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: 12 }}>{task.description}</p>}
                    <div className="task-meta" style={{ marginBottom: 12 }}>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.assignedTo && <span>👤 {task.assignedTo.name}</span>}
                      {task.dueDate && (
                        <span style={{ color: new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'var(--danger)' : 'var(--text-muted)' }}>
                          <Calendar size={12} /> {format(new Date(task.dueDate), 'MMM d')}
                        </span>
                      )}
                    </div>
                    {task.status !== 'done' && (
                      <div style={{ display: 'flex', gap: 6 }}>
                        {task.status === 'todo' && <button className="btn btn-secondary btn-sm" style={{ width: '100%' }} onClick={() => updateTaskStatus(task.id, 'in-progress')}>Start Task</button>}
                        {task.status === 'in-progress' && <button className="btn btn-primary btn-sm" style={{ width: '100%' }} onClick={() => updateTaskStatus(task.id, 'done')}>Mark Complete</button>}
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
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group"><label className="form-label">Priority</label>
                    <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Due Date</label><input type="date" className="form-input" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} /></div>
                </div>
                <div className="form-group"><label className="form-label">Assign To</label>
                  <select className="form-select" value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                    <option value="">Unassigned</option>
                    {project.members?.map(m => <option key={m.user?.id} value={m.user?.id}>{m.user?.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={16} className="spinner" /> : 'Create Task'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editForm && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Edit Project</h3><button className="btn-ghost" onClick={() => setShowEditModal(false)}><X size={20} /></button></div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select className="form-select" value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})}>
                      <option value="software">Software</option><option value="marketing">Marketing</option>
                      <option value="design">Design</option><option value="operations">Operations</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                      <option value="Not Started">Not Started</option><option value="In Progress">In Progress</option>
                      <option value="Done">Done</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Deadline</label>
                  <input type="date" className="form-input" value={editForm.deadline} onChange={e => setEditForm({...editForm, deadline: e.target.value})} />
                </div>

                <div className="form-group">
                  <label className="form-label">Team Members</label>
                  <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 4, padding: 8, background: 'var(--bg-input)' }}>
                    {users.filter(u => u.id !== user.id).map(u => (
                      <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, cursor: 'pointer' }}>
                        <input type="checkbox" checked={editForm.members.includes(u.id)} onChange={() => toggleEditMember(u.id)} />
                        {u.name} <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>({u.email})</span>
                      </label>
                    ))}
                    {users.length <= 1 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No other users available</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={16} className="spinner" /> : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
