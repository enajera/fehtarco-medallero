import { useState } from 'react';
import { athletesApi, Athlete } from '@/api/client';

interface Props {
  athlete: Athlete;
  onUpdated: (updated: Athlete) => void;
}

const BOW_OPTIONS = [
  { value: 'RECURVE', label: 'Recurvo' },
  { value: 'COMPOUND', label: 'Compuesto' },
  { value: 'BAREBOW', label: 'Barebow' },
];

export default function AthletePrivatePanel({ athlete, onUpdated }: Props) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    email: athlete.email || '',
    phone: athlete.phone || '',
    bowType: athlete.bowType || 'RECURVE',
    drawWeightLbs: athlete.drawWeightLbs?.toString() || '',
    drawLengthIn: athlete.drawLengthIn?.toString() || '',
  });

  const handleChange = (field: string, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    setError('');
    setSaving(true);
    try {
      const res = await athletesApi.selfUpdate(athlete.id, {
        email: form.email || null,
        phone: form.phone || null,
        bowType: form.bowType,
        drawWeightLbs: form.drawWeightLbs ? parseFloat(form.drawWeightLbs) : null,
        drawLengthIn: form.drawLengthIn ? parseFloat(form.drawLengthIn) : null,
      });
      onUpdated(res.data.data);
      setSuccess('Cambios guardados');
      setEditing(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (e: any) {
      setError(e?.response?.data?.error?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid var(--border)',
    borderRadius: 8,
    padding: '8px 12px',
    color: 'var(--text)',
    fontSize: 14,
    fontFamily: 'Manrope, sans-serif',
    width: '100%',
    outline: 'none',
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 11,
    fontWeight: 600,
    color: 'var(--subtle)',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
    marginBottom: 4,
    display: 'block',
  };

  const readVal = (val: string | null | undefined, fallback = '—') =>
    val && val.trim() ? val : fallback;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Header del panel */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '0.04em' }}>
            Mi perfil privado
          </div>
          <div style={{ fontSize: 11, color: 'var(--subtle)', marginTop: 2 }}>
            Solo tú ves esta información
          </div>
        </div>
        {!editing ? (
          <button
            onClick={() => { setEditing(true); setError(''); setSuccess(''); }}
            style={{
              padding: '6px 16px', borderRadius: 8, border: '1px solid var(--border)',
              background: 'transparent', color: 'var(--text)', fontSize: 13,
              cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
            }}
          >
            Editar
          </button>
        ) : (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => { setEditing(false); setError(''); }}
              style={{
                padding: '6px 14px', borderRadius: 8, border: '1px solid var(--border)',
                background: 'transparent', color: 'var(--subtle)', fontSize: 13,
                cursor: 'pointer', fontFamily: 'Manrope, sans-serif',
              }}
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: '6px 16px', borderRadius: 8, border: 'none',
                background: 'var(--accent)', color: '#fff', fontSize: 13,
                cursor: saving ? 'wait' : 'pointer', fontFamily: 'Manrope, sans-serif',
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)',
          color: '#f87171', fontSize: 13,
        }}>
          {error}
        </div>
      )}
      {success && (
        <div style={{
          padding: '10px 14px', borderRadius: 8,
          background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)',
          color: '#4ade80', fontSize: 13,
        }}>
          {success}
        </div>
      )}

      {/* Datos personales */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Datos de contacto
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle}>Email</label>
            {editing ? (
              <input
                type="email"
                value={form.email}
                onChange={e => handleChange('email', e.target.value)}
                style={inputStyle}
                placeholder="tu@correo.com"
              />
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text)', padding: '8px 0' }}>{readVal(athlete.email)}</div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Teléfono</label>
            {editing ? (
              <input
                type="tel"
                value={form.phone}
                onChange={e => handleChange('phone', e.target.value)}
                style={inputStyle}
                placeholder="+504 9999-9999"
              />
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text)', padding: '8px 0' }}>{readVal(athlete.phone)}</div>
            )}
          </div>
        </div>
      </div>

      {/* Equipo */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Equipo actual
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <div>
            <label style={labelStyle}>Tipo de arco</label>
            {editing ? (
              <select
                value={form.bowType}
                onChange={e => handleChange('bowType', e.target.value)}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                {BOW_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text)', padding: '8px 0' }}>
                {BOW_OPTIONS.find(o => o.value === athlete.bowType)?.label || athlete.bowType}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Libraje (lbs)</label>
            {editing ? (
              <input
                type="number"
                step="0.5"
                min="10"
                max="80"
                value={form.drawWeightLbs}
                onChange={e => handleChange('drawWeightLbs', e.target.value)}
                style={inputStyle}
                placeholder="ej. 40"
              />
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text)', padding: '8px 0', fontFamily: 'Space Mono, monospace' }}>
                {athlete.drawWeightLbs ? `${athlete.drawWeightLbs} lbs` : '—'}
              </div>
            )}
          </div>
          <div>
            <label style={labelStyle}>Longitud de draw (in)</label>
            {editing ? (
              <input
                type="number"
                step="0.25"
                min="20"
                max="35"
                value={form.drawLengthIn}
                onChange={e => handleChange('drawLengthIn', e.target.value)}
                style={inputStyle}
                placeholder="ej. 28.5"
              />
            ) : (
              <div style={{ fontSize: 14, color: 'var(--text)', padding: '8px 0', fontFamily: 'Space Mono, monospace' }}>
                {athlete.drawLengthIn ? `${athlete.drawLengthIn}"` : '—'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Datos de solo lectura */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--subtle)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Datos del registro (solo admin puede editar)
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            {
              label: 'Fecha de nacimiento',
              value: athlete.birthDate
                ? new Date(athlete.birthDate).toLocaleDateString('es-HN', { day: '2-digit', month: 'long', year: 'numeric' })
                : '—',
            },
            { label: 'Tipo de sangre', value: readVal(athlete.bloodType) },
            { label: 'Contacto de emergencia', value: readVal(athlete.emergencyContactName) },
            { label: 'Tel. emergencia', value: readVal(athlete.emergencyContactPhone) },
          ].map(({ label, value }) => (
            <div key={label}>
              <label style={labelStyle}>{label}</label>
              <div style={{ fontSize: 13, color: 'var(--subtle)', padding: '4px 0' }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
