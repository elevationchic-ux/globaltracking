import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { useI18n } from '../i18n/I18nContext.jsx'

export default function AuthButton() {
  const { user, logout, isAdmin } = useAuth()
  const { t } = useI18n()

  if (user) {
    return (
      <div className="auth-button-group">
        {isAdmin && (
          <Link to="/admin" className="auth-button admin-badge" title="Admin Panel">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </Link>
        )}
        <span className="auth-user-name" title={user.email}>{user.name}</span>
        <button onClick={logout} className="auth-button auth-logout" title={t('auth.logout')}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
          </svg>
        </button>
      </div>
    )
  }

  return (
    <div className="auth-button-group">
      <Link to="/login" className="auth-button auth-login-btn">
        {t('auth.login')}
      </Link>
      <Link to="/signup" className="auth-button auth-signup-btn">
        {t('auth.signup')}
      </Link>
    </div>
  )
}
