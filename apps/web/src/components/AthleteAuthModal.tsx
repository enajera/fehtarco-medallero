import { useState } from 'react';
import { authApi, Athlete } from '../api/client';
import { formatError } from '../utils/errors';

interface Props {
  athlete: Athlete;
  onSuccess: () => void;
}

type View = 'register' | 'login';

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--text)',
  fontSize: 14,
  fontFamily: 'Manrope, sans-serif',
  outline: 'none',
  boxSizing: 'border-box',
};

export default function AthleteAuthModal({ athlete, onSuccess }: Props) {
  // Si ya tiene cuenta → login, si no → registro
  const defaultView: View = athlete.userId ? 'login' : 'register';
  const [view, setView] = useState<View>(defaultView);

  const [email, setEmail] = useState(athlete.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const emailLocked = !!athlete.email; // solo editable si el atleta no tiene email en BD

  const resetForm = () => {
    setPassword('');
    setConfirmPassword('');
    setError('');
  };

  const switchView = (v: View) => {
    setView(v);
    resetForm();
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Ingresa tu correo electrónico'); return; }
    if (password.length < 8) { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    if (password !== confirmPassword) { setError('Las contraseñas no coinciden'); return; }
    try {
      setLoading(true);
      const res = await authApi.registerAthlete(
        athlete.id,
        password,
        emailLocked ? undefined : email  // solo enviar email si el atleta no lo tiene
      );
      localStorage.setItem('token', res.data.data.token);
      onSuccess();
    } catch (err: any) {
      setError(formatError(err) || 'Error al crear la cuenta');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim()) { setError('Ingresa tu correo electrónico'); return; }
    try {
      setLoading(true);
      const res = await authApi.login(email, password);
      localStorage.setItem('token', res.data.data.token);
      onSuccess();
    } catch (err: any) {
      setError(formatError(err) || 'Correo o contraseña incorrectos');
    } finally {
      setLoading(false);
    }
  };

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px 0',
    border: 'none',
    borderBottom: `2px solid ${active ? 'var(--accent)' : 'transparent'}`,
    background: 'transparent',
    color: active ? 'var(--accent)' : 'var(--subtle)',
    fontFamily: 'Manrope, sans-serif',
    fontWeight: active ? 700 : 500,
    fontSize: 13,
    cursor: 'pointer',
    transition: 'all 0.15s',
    letterSpacing: '0.03em',
  });

  return (
    <div style={{
      background: 'var(--surface)',
      border: '1px solid var(--border)',
      borderRadius: 16,
      padding: 24,
      maxWidth: 440,
      margin: '24px auto',
    }}>
      {/* Avatar + nombre */}
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          background: 'rgba(45,107,255,0.15)',
          border: '2px solid rgba(45,107,255,0.3)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 10px',
          fontSize: 18, fontWeight: 700, color: 'var(--accent)',
          fontFamily: 'Clash Display, sans-serif',
        }}>
          {athlete.firstName[0]}{athlete.lastName[0]}
        </div>
        <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>
          {athlete.firstName} {athlete.lastName}
        </div>
        <div style={{ fontSize: 12, color: 'var(--subtle)', marginTop: 3 }}>
          Accede a tu perfil de atleta
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 20 }}>
        <button style={tabStyle(view === 'register')} onClick={() => switchView('register')}>
          Crear cuenta
        </button>
        <button style={tabStyle(view === 'login')} onClick={() => switchView('login')}>
          Iniciar sesión
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 8, marginBottom: 16,
          background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
          color: '#f87171', fontSize: 13,
        }}>
          {error}
        </div>
      )}

      <form onSubmit={view === 'register' ? handleRegister : handleLogin}>
        {/* Email */}
        <div style={{ marginBottom: 14 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--subtle)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Correo electrónico
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={emailLocked}
              placeholder="tu@correo.com"
              style={{
                ...inputStyle,
                opacity: emailLocked ? 0.6 : 1,
                paddingRight: emailLocked ? 36 : 14,
              }}
              required
            />
            {emailLocked && (
              <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 14, opacity: 0.5 }}>
                🔒
              </span>
            )}
          </div>
          {emailLocked && (
            <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 4 }}>
              Email registrado por la federación
            </div>
          )}
        </div>

        {/* Password */}
        <div style={{ marginBottom: view === 'register' ? 14 : 20 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--subtle)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Contraseña {view === 'register' && <span style={{ fontWeight: 400, textTransform: 'none' }}>(mín. 8 caracteres)</span>}
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type={showPass ? 'text' : 'password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ ...inputStyle, paddingRight: 40 }}
              required
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, opacity: 0.5, padding: 0 }}
            >
              {showPass ? '🙈' : '👁'}
            </button>
          </div>
        </div>

        {/* Confirm password (solo en registro) */}
        {view === 'register' && (
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--subtle)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Confirmar contraseña
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                style={{
                  ...inputStyle,
                  paddingRight: 40,
                  borderColor: confirmPassword && confirmPassword !== password ? 'rgba(220,38,38,0.5)' : 'var(--border)',
                }}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 15, opacity: 0.5, padding: 0 }}
              >
                {showConfirm ? '🙈' : '👁'}
              </button>
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            padding: '12px 0',
            borderRadius: 10,
            border: 'none',
            background: 'var(--accent)',
            color: '#fff',
            fontSize: 14,
            fontWeight: 700,
            fontFamily: 'Manrope, sans-serif',
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.75 : 1,
            transition: 'opacity 0.15s',
          }}
        >
          {loading
            ? (view === 'register' ? 'Creando cuenta…' : 'Ingresando…')
            : (view === 'register' ? 'Crear mi cuenta' : 'Entrar')
          }
        </button>
      </form>

      {/* Toggle hint */}
      <div style={{ textAlign: 'center', marginTop: 16, fontSize: 12, color: 'var(--subtle)' }}>
        {view === 'register' ? (
          <>¿Ya tienes cuenta?{' '}
            <button onClick={() => switchView('login')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'Manrope, sans-serif' }}>
              Inicia sesión
            </button>
          </>
        ) : (
          <>¿Primera vez?{' '}
            <button onClick={() => switchView('register')} style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 12, padding: 0, fontFamily: 'Manrope, sans-serif' }}>
              Crea tu cuenta
            </button>
          </>
        )}
      </div>
    </div>
  );
}
