import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Plus, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { format } from 'date-fns'

export default function Projects() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const isAdmin = user?.role === 'admin'
  const [projects, setProjects] = useState([])
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', color: '#3b82f6', type: 'software', deadline: '', status: 'Not Started', members: [] })

  const fetchData = async () => {
    try {
      const { data } = await api.get('/projects')
      setProjects(data.data)
      if (isAdmin) { const u = await api.get('/users'); setUsers(u.data.data) }
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true)
    try {
      await api.post('/projects', form)
      toast.success('Project created')
      setShowModal(false)
      setForm({ name: '', description: '', color: '#3b82f6', type: 'software', deadline: '', status: 'Not Started', members: [] })
      fetchData()
    } catch (err) { toast.error(err.response?.data?.message || 'Failed') }
    finally { setSaving(false) }
  }

  const toggleMember = (uid) => {
    setForm(p => ({ ...p, members: p.members.includes(uid) ? p.members.filter(i => i !== uid) : [...p.members, uid] }))
  }

  if (loading) return <div className="loading-page"><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div><h2>Projects</h2><p>{isAdmin ? 'All workspace projects' : 'Projects you belong to'}</p></div>
        {isAdmin && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={16} /> New project</button>}
      </div>

      {projects.length > 0 ? (
        <div className="projects-grid">
          {projects.map(p => (
            <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: 3, height: '100%', background: p.color, borderRadius: '8px 0 0 8px' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                <div className="project-name">{p.name}</div>
                <span className={`badge badge-${p.status === 'Done' ? 'done' : p.status === 'In Progress' ? 'in-progress' : 'todo'}`}>{p.status}</span>
              </div>
              <div className="project-desc">{p.description || 'No description'}</div>
              <div className="project-meta">
                <span>{p.members?.length || 0} members</span>
                {p.deadline && <span style={{ color: new Date(p.deadline) < new Date() && p.status !== 'Done' ? 'var(--danger)' : undefined }}>{format(new Date(p.deadline), 'MMM d, yyyy')}</span>}
                <span>{p.type}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <h3>No projects</h3>
          <p>{isAdmin ? 'Create your first project.' : 'You haven\'t been assigned to any projects yet.'}</p>
          {isAdmin && <button className="btn btn-primary" onClick={() => setShowModal(true)}>Create project</button>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h3>New project</h3><button className="btn-ghost" onClick={() => setShowModal(false)}><X size={18} /></button></div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="form-group"><label className="form-label">Type</label>
                    <select className="form-select" value={form.type} onChange={e => setForm({...form, type: e.target.value})}>
                      <option value="software">Software</option><option value="marketing">Marketing</option>
                      <option value="design">Design</option><option value="operations">Operations</option><option value="custom">Other</option>
                    </select>
                  </div>
                  <div className="form-group"><label className="form-label">Status</label>
                    <select className="form-select" value={form.status} onChange={e => setForm({...form, status: e.target.value})}>
                      <option value="Not Started">Not Started</option><option value="In Progress">In Progress</option><option value="Done">Done</option>
                    </select>
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Deadline</label><input type="date" className="form-input" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} /></div>
                <div className="form-group">
                  <label className="form-label">Team members</label>
                  <div style={{ maxHeight: 140, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6, padding: 8, background: 'var(--bg-base)' }}>
                    {users.filter(u => u.id !== user.id).map(u => (
                      <label key={u.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 4px', cursor: 'pointer', fontSize: '0.9rem' }}>
                        <input type="checkbox" checked={form.members.includes(u.id)} onChange={() => toggleMember(u.id)} />
                        {u.name} <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>{u.email}</span>
                      </label>
                    ))}
                    {users.filter(u => u.id !== user.id).length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No other users registered</span>}
                  </div>
                </div>
                <div className="form-group"><label className="form-label">Description</label><textarea className="form-textarea" value={form.description} onChange={e => setForm({...form, description: e.target.value})} /></div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? <Loader2 size={16} className="spinner" /> : 'Create'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
