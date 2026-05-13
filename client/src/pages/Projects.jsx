import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { Plus, FolderKanban, Users, X, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Projects() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', color: '#6366f1' })
  const [saving, setSaving] = useState(false)

  const fetchProjects = () => {
    api.get('/projects').then(res => setProjects(res.data.data)).catch(console.error).finally(() => setLoading(false))
  }

  useEffect(() => { fetchProjects() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/projects', form)
      toast.success('Project created!')
      setShowModal(false)
      setForm({ name: '', description: '', color: '#6366f1' })
      fetchProjects()
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project')
    } finally {
      setSaving(false)
    }
  }

  const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#3b82f6', '#06b6d4']

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><div className="spinner" /></div>

  return (
    <div>
      <div className="page-header">
        <div><h2>Projects</h2><p>Manage your team projects</p></div>
        {user?.role === 'admin' && (
          <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> New Project</button>
        )}
      </div>

      {projects.length > 0 ? (
        <div className="projects-grid">
          {projects.map(p => (
            <div key={p.id} className="project-card" onClick={() => navigate(`/projects/${p.id}`)} style={{ '--card-color': p.color }}>
              <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: p.color }} />
              <div className="project-name">{p.name}</div>
              <div className="project-desc">{p.description || 'No description'}</div>
              <div className="project-meta">
                <span><Users size={14} /> {p.members?.length || 0} members</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card empty-state">
          <FolderKanban size={48} />
          <h3>No projects yet</h3>
          <p>Create your first project to get started</p>
          {user?.role === 'admin' && <button className="btn btn-primary" onClick={() => setShowModal(true)}><Plus size={18} /> Create Project</button>}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>New Project</h3>
              <button className="btn-ghost" onClick={() => setShowModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Project Name</label>
                  <input className="form-input" placeholder="My Awesome Project" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">Description</label>
                  <textarea className="form-textarea" placeholder="What is this project about?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Color</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {colors.map(c => (
                      <button type="button" key={c} onClick={() => setForm({...form, color: c})}
                        style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: form.color === c ? '3px solid white' : '3px solid transparent', cursor: 'pointer', transition: 'transform 150ms' }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <Loader2 size={16} className="spinner" /> : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
