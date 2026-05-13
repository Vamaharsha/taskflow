import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

export default function Auth() {
  const { login, signup } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  
  const [isLogin, setIsLogin] = useState(location.pathname !== '/signup')
  const [role, setRole] = useState('member')
  
  const [form, setForm] = useState({ name: '', email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setIsLogin(location.pathname !== '/signup')
    setError('')
  }, [location.pathname])

  const toggleMode = () => {
    setError('')
    navigate(isLogin ? '/signup' : '/login', { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!isLogin && form.password !== form.confirmPassword) {
      return setError('Passwords do not match')
    }

    setLoading(true)
    try {
      if (isLogin) {
        await login(form.email, form.password)
        toast.success('Welcome back!')
      } else {
        await signup(form.name || form.email.split('@')[0], form.email, form.password, role)
        toast.success('Account created!')
      }
    } catch (err) {
      const msg = err.response?.data?.message?.toLowerCase() || ''
      if (!isLogin && msg.includes('exists')) {
        setError('This email is already registered')
      } else if (isLogin && (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('found'))) {
        setError('Incorrect password or email')
      } else {
        setError(err.response?.data?.message || 'Authentication failed')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        
        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => !isLogin && toggleMode()}>Log In</button>
          <button type="button" className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => isLogin && toggleMode()}>Sign Up</button>
        </div>

        <div className="auth-header">
          <h1>{isLogin ? 'Welcome back' : 'Create an account'}</h1>
          <p>{isLogin ? 'Sign in to your TaskFlow workspace' : 'Join TaskFlow to manage your projects'}</p>
        </div>

        {!isLogin && (
          <div className="role-toggle">
            <button type="button" className={`role-btn ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
              <div className="role-icon">👑</div>
              <div className="role-text">Admin</div>
            </button>
            <button type="button" className={`role-btn ${role === 'member' ? 'active' : ''}`} onClick={() => setRole('member')}>
              <div className="role-icon">👤</div>
              <div className="role-text">Member</div>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className={`form-input ${error.includes('email') || error.includes('Incorrect') ? 'input-error' : ''}`} placeholder="you@example.com" value={form.email} onChange={e => {setForm({...form, email: e.target.value}); setError('')}} required />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className={`form-input ${error.includes('password') || error.includes('match') || error.includes('Incorrect') ? 'input-error' : ''}`} placeholder="••••••••" value={form.password} onChange={e => {setForm({...form, password: e.target.value}); setError('')}} required minLength={6} />
            {error && <span className="inline-error">{error}</span>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className={`form-input ${error.includes('match') ? 'input-error' : ''}`} placeholder="••••••••" value={form.confirmPassword} onChange={e => {setForm({...form, confirmPassword: e.target.value}); setError('')}} required minLength={6} />
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-auth" disabled={loading}>
            {loading ? <Loader2 size={18} className="spinner" /> : (isLogin ? 'Sign In' : 'Create Account')}
          </button>
        </form>

      </div>
    </div>
  )
}
