import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Plus, Trash2, Edit2, X, Loader2, ArrowLeft } from 'lucide-react'
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
      if (isAdmin) { const u = await api.get('/users'); setUsers(u.data.data) }
    } catch (err) {
      if (err.response?.status === 404) navigate('/projects')
      else console.error(err)
    }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [id])

  const createTask = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/tasks', { ...taskForm, project: id, assignedTo: taskForm.assignedTo || undefined, dueDate: taskForm.dueDate || undefined })
      setShowTaskModal(false)
      setTaskForm({ title: '', description: '', priority: 'medium', assignedTo: '', dueDate: '' })
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to create task') }
    finally { setSaving(false) }
  }

  const updateTaskStatus = async (taskId, status) => {
    try { await api.put(`/tasks/${taskId}`, { status }); fetchData() }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
  }

  const deleteTask = async (taskId) => {
    if (!confirm('Delete this task?')) return
    try { await api.delete(`/tasks/${taskId}`); fetchData() }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  const updateProjectStatus = async (s) => {
    try { await api.put(`/projects/${id}`, { status: s }); fetchData() }
    catch (err) { toast.error('Failed to update status') }
  }

  const openEditModal = () => {
    setEditForm({
      name: project.name, description: project.description,
      type: project.type || 'custom', status: project.status || 'Not Started',
      deadline: project.deadline ? new Date(project.deadline).toISOString().split('T')[0] : '',
      members: project.members.map(m => m.user?.id || m.userId)
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try { await api.put(`/projects/${id}`, editForm); setShowEditModal(false); fetchData() }
    catch (err) { toast.error(err.response?.data?.message || 'Update failed') }
    finally { setSaving(false) }
  }

  const toggleEditMember = (uid) => {
    setEditForm(p => ({ ...p, members: p.members.includes(uid) ? p.members.filter(m => m !== uid) : [...p.members, uid] }))
  }

  const deleteProject = async () => {
    if (!confirm('Delete this project and all tasks?')) return
    try { await api.delete(`/projects/${id}`); navigate('/projects') }
    catch (err) { toast.error(err.response?.data?.message || 'Delete failed') }
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>
  if (!project) return <div className="empty-state"><h3>Project not found</h3></div>

  const columns = [
    { key: 'todo', label: 'Not Started' },
    { key: 'in-progress', label: 'In Progress' },
    { key: 'done', label: 'Done' },
  ]

  return (
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="btn-ghost" onClick={() => navigate('/projects')} style={{ padding: 4 }}><ArrowLeft size={18} /></button>
          <div>
            <h2>{project.name}</h2>
            <div className="task-meta" style={{ marginTop: 4 }}>
              <span>{project.type}</span>
              {project.deadline && <span>· Due {format(new Date(project.deadline), 'MMM d, yyyy')}</span>}
              <span>· {project.members?.length} members</span>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {isAdmin ? (
            <select className="form-select" style={{ width: 'auto', padding: '6px 10px', fontSize: '0.85rem' }} value={project.status || 'Not Started'} onChange={e => updateProjectStatus(e.target.value)}>
              <option value="Not Started">Not Started</option><option value="In Progress">In Progress</option><option value="Done">Done</option>
            </select>
          ) : (
            <span className={`badge badge-${project.status === 'Done' ? 'done' : project.status === 'In Progress' ? 'in-progress' : 'todo'}`}>{project.status}</span>
          )}
          {isAdmin && (
            <>
              <button className="btn btn-secondary" onClick={openEditModal}><Edit2 size={14} /> Edit</button>
              <button className="btn btn-primary" onClick={() => setShowTaskModal(true)}><Plus size={14} /> Task</button>
              <button className="btn btn-danger btn-sm" onClick={deleteProject}><Trash2 size={14} /></button>
            </>
          )}
        </div>
      </div>

      {project.description && <p style={{ color: 'var(--text-secondary)', marginBottom: 20, fontSize: '0.95rem' }}>{project.description}</p>}

      {/* Team */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
        {project.members?.map(m => (
          <div key={m.user?.id || m.id} style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--bg-raised)', padding: '4px 10px', borderRadius: 4, fontSize: '0.85rem', border: '1px solid var(--border)' }}>
            <div className="user-avatar" style={{ width: 20, height: 20, fontSize: '0.6rem', borderRadius: 4 }}>{m.user?.name?.[0]?.toUpperCase() || '?'}</div>
            {m.user?.name || 'Unknown'}
            <span className={`badge badge-${m.role}`} style={{ marginLeft: 2, padding: '1px 5px', fontSize: '0.6rem' }}>{m.role}</span>
          </div>
        ))}
      </div>

      {/* Kanban */}
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
                      {isAdmin && <button className="btn-ghost" style={{ padding: 2 }} onClick={() => deleteTask(task.id)}><Trash2 size={13} /></button>}
                    </div>
                    {task.description && <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '6px 0 10px' }}>{task.description}</p>}
                    <div className="task-meta" style={{ marginBottom: task.status !== 'done' ? 10 : 0 }}>
                      <span className={`badge badge-${task.priority}`}>{task.priority}</span>
                      {task.assignedTo && <span>{task.assignedTo.name}</span>}
                      {task.dueDate && <span style={{ color: new Date(task.dueDate) < new Date() && task.status !== 'done' ? 'var(--danger)' : undefined }}>{format(new Date(task.dueDate), 'MMM d')}</span>}
                    </div>
                    {task.status !== 'done' && (
                      <select className="form-select" style={{ padding: '4px 8px', fontSize: '0.8rem' }} value={task.status} onChange={e => updateTaskStatus(task.id, e.target.value)}>
                        <option value="todo">Not Started</option><option value="in-progress">In Progress</option><option value="done">Done</option>
                      </select>
                    )}
                  </div>
                ))}
                {colTasks.length === 0 && <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: '0.85rem' }}>No tasks</div>}
              </div>
            </div>
          )
        })}
      </div>

      {/* New Task Modal */}
      {showTaskModal && (
        <div className="modal-overlay" onClick={() => setShowTaskModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>New task</h3><button className="btn-ghost" onClick={() => setShowTaskModal(false)}><X size={18} /></button></div>
            <form onSubmit={createTask}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Title</label><input className="form-input" value={taskForm.title} onChange={e => setTaskForm({...taskForm, title: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={taskForm.description} onChange={e => setTaskForm({...taskForm, description: e.target.value})} /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">Priority</label>
                    <select className="form-select" value={taskForm.priority} onChange={e => setTaskForm({...taskForm, priority: e.target.value})}>
                      <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Due date</label><input type="date" className="form-input" value={taskForm.dueDate} onChange={e => setTaskForm({...taskForm, dueDate: e.target.value})} /></div>
                </div>
                <div className="form-group"><label className="form-label">Assign to</label>
                  <select className="form-select" value={taskForm.assignedTo} onChange={e => setTaskForm({...taskForm, assignedTo: e.target.value})}>
                    <option value="">Unassigned</option>
                    {project.members?.map(m => <option key={m.user?.id} value={m.user?.id}>{m.user?.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowTaskModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={14} className="spinner" /> : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Project Modal */}
      {showEditModal && editForm && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>Edit project</h3><button className="btn-ghost" onClick={() => setShowEditModal(false)}><X size={18} /></button></div>
            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">Type</label>
                    <select className="form-select" value={editForm.type} onChange={e => setEditForm({...editForm, type: e.target.value})}>
                      <option value="software">Software</option><option value="marketing">Marketing</option>
                      <option value="design">Design</option><option value="operations">Operations</option><option value="custom">Other</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Status</label>
                    <select className="form-select" value={editForm.status} onChange={e => setEditForm({...editForm, status: e.target.value})}>
                      <option value="Not Started">Not Started</option><option value="In Progress">In Progress</option><option value="Done">Done</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Deadline</label><input type="date" className="form-input" value={editForm.deadline} onChange={e => setEditForm({...editForm, deadline: e.target.value})} /></div>
                <div className="form-group">
                  <label className="form-label">Team members</label>
                  <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: 8, background: 'var(--bg-base)' }}>
                    {users.filter(u => u.id !== user.id).map(u => (
                      <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={editForm.members.includes(u.id)} onChange={() => toggleEditMember(u.id)} />
                        {u.name} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</span>
                      </label>
                    ))}
                    {users.filter(u => u.id !== user.id).length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No other users</span>}
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={14} className="spinner" /> : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
