import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { TrendingUp, User, Mail, Lock, DollarSign, AlertCircle } from 'lucide-react';

export default function Register() {
  const [form, setForm]       = useState({ name: '', email: '', password: '', capital: 20 });
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate     = useNavigate();

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(form.name, form.email, form.password, form.capital);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de l\'inscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.logo}>
          <TrendingUp size={32} color="#00d4aa" />
          <h1 style={styles.title}>Créer votre compte TPS</h1>
          <p style={styles.subtitle}>Commencez votre journey de trading</p>
        </div>

        {error && (
          <div style={styles.error}>
            <AlertCircle size={16} /><span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          {[
            { name: 'name',     label: 'Nom complet',    type: 'text',     icon: <User size={16} color="#666"/>,       placeholder: 'Trader Pro' },
            { name: 'email',    label: 'Email',           type: 'email',    icon: <Mail size={16} color="#666"/>,       placeholder: 'trader@example.com' },
            { name: 'password', label: 'Mot de passe',   type: 'password', icon: <Lock size={16} color="#666"/>,       placeholder: '••••••••' },
            { name: 'capital',  label: 'Capital de départ ($)', type: 'number', icon: <DollarSign size={16} color="#666"/>, placeholder: '20' },
          ].map(field => (
            <div key={field.name} style={styles.field}>
              <label style={styles.label}>{field.label}</label>
              <div style={styles.inputWrapper}>
                <span style={styles.inputIcon}>{field.icon}</span>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  style={styles.input}
                  required
                />
              </div>
            </div>
          ))}

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>
        </form>

        <p style={styles.link}>
          Déjà un compte ?{' '}
          <Link to="/login" style={styles.linkText}>Se connecter</Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 100%)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px',
  },
  card: {
    background: '#111827', border: '1px solid #1f2937',
    borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '420px',
  },
  logo: { textAlign: 'center', marginBottom: '32px' },
  title: { color: '#ffffff', fontSize: '20px', fontWeight: '700', margin: '12px 0 4px' },
  subtitle: { color: '#6b7280', fontSize: '14px', margin: 0 },
  error: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: '#1f0a0a', border: '1px solid #ef4444',
    color: '#ef4444', borderRadius: '8px', padding: '10px 14px',
    fontSize: '13px', marginBottom: '20px',
  },
  form: { display: 'flex', flexDirection: 'column', gap: '16px' },
  field: { display: 'flex', flexDirection: 'column', gap: '6px' },
  label: { color: '#9ca3af', fontSize: '13px', fontWeight: '500' },
  inputWrapper: { position: 'relative' },
  inputIcon: { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', display:'flex' },
  input: {
    width: '100%', background: '#1f2937', border: '1px solid #374151',
    borderRadius: '8px', padding: '10px 12px 10px 36px',
    color: '#ffffff', fontSize: '14px', outline: 'none', boxSizing: 'border-box',
  },
  button: {
    background: 'linear-gradient(135deg, #00d4aa, #00a8ff)',
    color: '#000', fontWeight: '700', fontSize: '14px',
    border: 'none', borderRadius: '8px', padding: '12px', cursor: 'pointer', marginTop: '8px',
  },
  link: { textAlign: 'center', color: '#6b7280', fontSize: '13px', marginTop: '20px' },
  linkText: { color: '#00d4aa', textDecoration: 'none', fontWeight: '600' },
};