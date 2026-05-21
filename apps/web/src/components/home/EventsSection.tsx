import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { formatEventDate } from '@/lib/utils';
import type { Event } from '@/api/client';

const SCOPE_TAG: Record<string, { label: string; bg: string; color: string }> = {
  NATIONAL_FEDERATION: {
    label: 'Nacional',
    bg: 'rgba(45,107,255,0.12)',
    color: 'var(--accent2)',
  },
  NATIONAL_INTERNATIONALIZED: {
    label: 'Internacional',
    bg: 'rgba(240,165,0,0.10)',
    color: 'var(--gold)',
  },
  INTERNATIONAL_NATIONAL_TEAM: {
    label: 'Selección',
    bg: 'rgba(52,199,89,0.10)',
    color: '#34C759',
  },
};

const LEVEL_TAG: Record<string, { label: string; bg: string; color: string }> = {
  WA_STANDARD:     { label: 'WA Standard',   bg: 'rgba(240,165,0,0.10)',    color: 'var(--gold)'    },
  INDOOR_STANDARD: { label: 'Indoor',         bg: 'rgba(45,107,255,0.10)',   color: 'var(--accent2)' },
  REDUCED:         { label: 'Reducido',        bg: 'rgba(139,172,196,0.08)', color: 'var(--silver)'  },
  DEVELOPMENT:     { label: 'Desarrollo',      bg: 'rgba(196,113,58,0.08)',  color: 'var(--bronze)'  },
};

function EventCard({ event }: { event: Event }) {
  const { day, month } = formatEventDate(event.startDate);
  const scopeTag  = SCOPE_TAG[event.eventScope];
  const levelTag  = LEVEL_TAG[event.technicalLevel];

  return (
    <motion.div
      whileHover={{ y: -3, boxShadow: '0 12px 40px rgba(0,0,0,0.25)' }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
    >
      <Link
        to={`/eventos/${event.id}`}
        className="flex rounded-2xl overflow-hidden no-underline transition-colors duration-200"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
        }}
      >
        {/* Date column */}
        <div
          className="flex flex-col items-center justify-center px-[14px] py-[18px] min-w-[58px] border-r"
          style={{
            background: 'var(--surface2)',
            borderRightColor: 'var(--border)',
          }}
        >
          <span className="font-clash font-bold text-[26px] leading-none" style={{ color: 'var(--text)' }}>
            {day}
          </span>
          <span
            className="text-[9px] font-extrabold uppercase tracking-[1px] mt-[3px]"
            style={{ color: 'var(--muted)' }}
          >
            {month}
          </span>
        </div>

        {/* Body */}
        <div className="flex-1 px-[18px] py-4">
          <p className="text-[13px] font-bold leading-[1.3] mb-[6px]" style={{ color: 'var(--text)' }}>
            {event.name}
          </p>
          <p className="text-[11px] mb-2 flex items-center gap-1" style={{ color: 'var(--muted)' }}>
            📍 {event.location}, {event.country}
          </p>
          <div className="flex flex-wrap gap-[5px]">
            {scopeTag && (
              <span
                className="text-[9px] font-extrabold uppercase tracking-[0.5px] px-2 py-[2px] rounded"
                style={{ background: scopeTag.bg, color: scopeTag.color }}
              >
                {scopeTag.label}
              </span>
            )}
            {levelTag && (
              <span
                className="text-[9px] font-extrabold uppercase tracking-[0.5px] px-2 py-[2px] rounded"
                style={{ background: levelTag.bg, color: levelTag.color }}
              >
                {levelTag.label}
              </span>
            )}
            {event.official && (
              <span
                className="text-[9px] font-extrabold uppercase tracking-[0.5px] px-2 py-[2px] rounded"
                style={{ background: 'rgba(52,199,89,0.10)', color: '#34C759' }}
              >
                Oficial 🏆
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

interface EventsSectionProps {
  events: Event[];
}

export default function EventsSection({ events }: EventsSectionProps) {
  return (
    <section className="px-5 md:px-[52px] py-12 md:py-[72px]">
      {/* Header */}
      <motion.div
        className="mb-10 text-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-[10px] font-extrabold uppercase tracking-[3px] mb-[10px] flex items-center justify-center gap-2" style={{ color: 'var(--accent2)' }}>
          <span style={{ width: 22, height: 2, background: 'var(--accent)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
          Calendario
        </p>
        <div className="flex items-center justify-center flex-wrap gap-4">
          <h2
            className="font-clash font-bold"
            style={{ fontSize: 'clamp(28px,3vw,44px)', color: 'var(--text)' }}
          >
            Eventos{' '}
            <span style={{ color: 'var(--gold)' }}>Recientes</span>
          </h2>
        </div>
        <Link
          to="/eventos"
          className="text-[13px] font-semibold no-underline hover:underline mt-2 inline-block"
          style={{ color: 'var(--accent2)' }}
        >
          Ver todos los eventos →
        </Link>
      </motion.div>

      {/* Grid — 2 columnas desktop, 1 mobile — CENTRADO */}
      {events.length === 0 ? (
        <p className="text-[14px]" style={{ color: 'var(--muted)' }}>No hay eventos disponibles.</p>
      ) : (
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {events.map((ev, i) => (
              <motion.div
                key={ev.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.06 }}
              >
                <EventCard event={ev} />
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
