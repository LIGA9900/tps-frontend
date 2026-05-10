import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, Mail, Lock, AlertCircle } from 'lucide-react';

export default function Login() {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login }    = useAuth();
  const navigate     = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError('Email ou mot de passe incorrect');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logo}>
          <TrendingUp size={32} color="#00d4aa" />
          <h1 style={styles.title}>Trading Performance System</h1>
          <p style={styles.subtitle}>Connectez-vous à votre compte</p>
        </div>

        {/* Erreur */}
        {error && (
          <div style={styles.error}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {/* Formulaire */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <div style={styles.inputWrapper}>
              <Mail size={16} color="#666" style={styles.inputIcon} />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="trader@example.com"
                style={styles.input}
                required
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Mot de passe</label>
            <div style={styles.inputWrapper}>
              <Lock size={16} color="#666" style={styles.inputIcon} />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                style={styles.input}
                required
              />
            </div>
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={styles.link}>
          Pas de compte ?{' '}
          <Link to="/register" style={styles.linkText}>Créer un compte</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
  },
  card: {
    background: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '16px',
    padding: '40px',
    width: '100%',
    maxWidth: '420px',
  },
  logo: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    color: '#ffffff',
    fontSize: '20px',
    fontWeight: '700',
    margin: '12px 0 4px',
  },
  subtitle: {
    color: '#6b7280',
    fontSize: '14px',
    margin: 0,
  },
  error: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    background: '#1f0a0a',
    border: '1px solid #ef4444',
    color: '#ef4444',
    borderRadius: '8px',
    padding: '10px 14px',
    fontSize: '13px',
    marginBottom: '20px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#9ca3af', fontSize: '13px', fontWeight: '500' },
  inputWrapper: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' },
  input: {
    width: '100%',
    background: '#1f2937',
    border: '1px solid #374151',
    borderRadius: '8px',
    padding: '10px 12px 10px 36px',
    color: '#ffffff',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
  },
  button: {
    background: 'linear-gradient(135deg, #00d4aa, #00a8ff)',
    color: '#000',
    fontWeight: '700',
    fontSize: '14px',
    border: 'none',
    borderRadius: '8px',
    padding: '12px',
    cursor: 'pointer',
    marginTop: '8px',
  },
  link: { textAlign: 'center', color: '#6b7280', fontSize: '13px', marginTop: '20px' },
  linkText: { color: '#00d4aa', textDecoration: 'none', fontWeight: '600' },
};