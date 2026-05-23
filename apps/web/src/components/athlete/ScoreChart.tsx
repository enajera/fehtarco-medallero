import { useState, useMemo } from 'react';
import type { AthleteHistoryEntry } from '@/api/client';

interface Props {
  history: AthleteHistoryEntry[];
}

// Extrae la distancia/modalidad del categoryName
// Ej: "RECURVE M Senior - WA 70m" → "WA 70m"
function extractModality(categoryName: string): string {
  const parts = categoryName.split(' - ');
  return parts.length > 1 ? parts[parts.length - 1] : categoryName;
}

export default function ScoreChart({ history }: Props) {
  // Solo resultados de fase FINAL o QUALIFICATION con score válido
  const eligible = useMemo(() =>
    history
      .filter(h => h.score > 0 && (h.phase === 'FINAL' || h.phase === 'QUALIFICATION'))
      .map(h => ({ ...h, modality: extractModality(h.categoryName) }))
      .sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()),
    [history]
  );

  const modalities = useMemo(() => {
    const set = new Set(eligible.map(h => h.modality));
    return Array.from(set).sort();
  }, [eligible]);

  const [selectedModality, setSelectedModality] = useState<string>('');

  // Al cambiar eligible actualiza selección si la actual ya no existe
  const activeModality = modalities.includes(selectedModality)
    ? selectedModality
    : modalities[0] || '';

  const points = useMemo(() =>
    eligible.filter(h => h.modality === activeModality),
    [eligible, activeModality]
  );

  if (eligible.length < 2) return null;

  // SVG dimensions
  const W = 600;
  const H = 200;
  const PAD = { top: 16, right: 16, bottom: 40, left: 48 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  const scores = points.map(p => p.score);
  const minScore = Math.max(0, Math.min(...scores) - 20);
  const maxScore = Math.max(...scores) + 20;

  const toX = (i: number) => (points.length < 2 ? chartW / 2 : (i / (points.length - 1)) * chartW);
  const toY = (s: number) => chartH - ((s - minScore) / (maxScore - minScore)) * chartH;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i)} ${toY(p.score)}`).join(' ');
  const areaD = points.length > 1
    ? `${pathD} L ${toX(points.length - 1)} ${chartH} L ${toX(0)} ${chartH} Z`
    : '';

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('es-HN', { month: 'short', year: '2-digit' });
  };

  const medalColor = (medal: string | null) => {
    if (medal === 'GOLD') return 'var(--gold)';
    if (medal === 'SILVER') return 'var(--silver)';
    if (medal === 'BRONZE') return 'var(--bronze)';
    return 'var(--accent)';
  };

  return (
    <div style={{ marginTop: 8 }}>
      {/* Filtro de modalidad */}
      {modalities.length > 1 && (
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {modalities.map(m => (
            <button
              key={m}
              onClick={() => setSelectedModality(m)}
              style={{
                padding: '4px 14px',
                borderRadius: 20,
                border: `1px solid ${m === activeModality ? 'var(--accent)' : 'var(--border)'}`,
                background: m === activeModality ? 'rgba(45,107,255,0.15)' : 'transparent',
                color: m === activeModality ? 'var(--accent)' : 'var(--subtle)',
                fontSize: 12,
                fontFamily: 'Manrope, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {m}
            </button>
          ))}
        </div>
      )}

      {points.length < 2 ? (
        <p style={{ color: 'var(--subtle)', fontSize: 13 }}>
          Se necesitan al menos 2 competencias en esta modalidad para mostrar la gráfica.
        </p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            style={{ width: '100%', maxWidth: W, display: 'block', fontFamily: 'Manrope, sans-serif' }}
          >
            <defs>
              <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
                <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.02" />
              </linearGradient>
            </defs>

            <g transform={`translate(${PAD.left},${PAD.top})`}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map(t => {
                const y = chartH * (1 - t);
                const val = Math.round(minScore + t * (maxScore - minScore));
                return (
                  <g key={t}>
                    <line x1={0} y1={y} x2={chartW} y2={y}
                      stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                    <text x={-6} y={y + 4} textAnchor="end"
                      fill="var(--subtle)" fontSize={10}>
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* Area fill */}
              {areaD && <path d={areaD} fill="url(#scoreGrad)" />}

              {/* Line */}
              <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" />

              {/* Data points */}
              {points.map((p, i) => (
                <g key={i}>
                  <circle
                    cx={toX(i)} cy={toY(p.score)} r={5}
                    fill={medalColor(p.medal)}
                    stroke="var(--surface)" strokeWidth={2}
                  />
                  {/* Score label on hover — usar title */}
                  <title>{p.eventName}: {p.score} pts{p.medal ? ` · ${p.medal}` : ''}</title>
                  {/* Click area */}
                  <circle cx={toX(i)} cy={toY(p.score)} r={10} fill="transparent" />

                  {/* X label */}
                  <text
                    x={toX(i)} y={chartH + 20}
                    textAnchor="middle" fill="var(--subtle)" fontSize={9}
                    transform={`rotate(-20, ${toX(i)}, ${chartH + 20})`}
                  >
                    {formatDate(p.eventDate)}
                  </text>
                </g>
              ))}
            </g>
          </svg>

          {/* Best score indicator */}
          <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Mejor score', value: Math.max(...scores) },
              { label: 'Promedio', value: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) },
              { label: 'Competencias', value: points.length },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Space Mono, monospace', fontSize: 18, fontWeight: 700, color: 'var(--accent)' }}>
                  {value}
                </div>
                <div style={{ fontSize: 11, color: 'var(--subtle)' }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
