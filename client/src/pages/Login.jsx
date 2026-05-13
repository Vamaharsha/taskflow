import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Loader2 } from 'lucide-react'

export default function Auth() {
  const { login, signup } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  const [isLogin, setIsLogin] = useState(location.pathname !== '/signup')
  const [role, setRole] = useState('member')
  const [form, setForm] = useState({ email: '', password: '', confirmPassword: '' })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setIsLogin(location.pathname !== '/signup')
    setErrors({})
  }, [location.pathname])

  const toggleMode = () => {
    setErrors({})
    setForm({ email: '', password: '', confirmPassword: '' })
    navigate(isLogin ? '/signup' : '/login', { replace: true })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})

    if (!isLogin && form.password !== form.confirmPassword) {
      return setErrors({ confirmPassword: 'Passwords do not match' })
    }

    setLoading(true)
    try {
      if (isLogin) {
        await login(form.email, form.password)
      } else {
        await signup(form.email.split('@')[0], form.email, form.password, role)
      }
    } catch (err) {
      const msg = err.response?.data?.message?.toLowerCase() || ''
      if (!isLogin && (msg.includes('exists') || msg.includes('unique'))) {
        setErrors({ email: 'An account with this email already exists' })
      } else if (isLogin && (msg.includes('invalid') || msg.includes('incorrect') || msg.includes('found'))) {
        setErrors({ password: 'Incorrect password' })
      } else {
        setErrors({ password: err.response?.data?.message || 'Authentication failed' })
      }
    } finally {
      setLoading(false)
    }
  }

  const clearField = (field) => {
    setErrors(prev => { const n = {...prev}; delete n[field]; return n })
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-tabs">
          <button type="button" className={`auth-tab ${isLogin ? 'active' : ''}`} onClick={() => isLogin || toggleMode()}>Login</button>
          <button type="button" className={`auth-tab ${!isLogin ? 'active' : ''}`} onClick={() => !isLogin || toggleMode()}>Sign Up</button>
        </div>

        <div className="auth-header">
          <h1>{isLogin ? 'Sign in' : 'Create account'}</h1>
          <p>{isLogin ? 'Enter your credentials to continue' : 'Set up your TaskFlow workspace'}</p>
        </div>

        {!isLogin && (
          <div className="role-toggle">
            <button type="button" className={`role-btn ${role === 'admin' ? 'active' : ''}`} onClick={() => setRole('admin')}>
              <div className="role-pill" />
              <span className="role-label">Admin</span>
            </button>
            <button type="button" className={`role-btn ${role === 'member' ? 'active' : ''}`} onClick={() => setRole('member')}>
              <div className="role-pill" />
              <span className="role-label">Member</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className={`form-input ${errors.email ? 'input-error' : ''}`} placeholder="you@company.com" value={form.email} onChange={e => { setForm({...form, email: e.target.value}); clearField('email') }} required />
            {errors.email && <span className="inline-error">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input type="password" className={`form-input ${errors.password ? 'input-error' : ''}`} placeholder="••••••••" value={form.password} onChange={e => { setForm({...form, password: e.target.value}); clearField('password') }} required minLength={6} />
            {errors.password && <span className="inline-error">{errors.password}</span>}
          </div>

          {!isLogin && (
            <div className="form-group">
              <label className="form-label">Confirm Password</label>
              <input type="password" className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`} placeholder="••••••••" value={form.confirmPassword} onChange={e => { setForm({...form, confirmPassword: e.target.value}); clearField('confirmPassword') }} required minLength={6} />
              {errors.confirmPassword && <span className="inline-error">{errors.confirmPassword}</span>}
            </div>
          )}

          <button type="submit" className="btn btn-primary btn-auth" disabled={loading}>
            {loading ? <Loader2 size={16} className="spinner" /> : (isLogin ? 'Sign in' : 'Create account')}
          </button>
        </form>
      </div>
    </div>
  )
}
