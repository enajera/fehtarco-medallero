import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DecorBlur from '../DecorBlur';
import { mediaUrl } from '@/api/client';
import type { AthleteRankEntry } from '@/api/client';

const RANK_COLORS = {
  1: { border: 'rgba(240,165,0,0.4)',    bg: 'rgba(240,165,0,0.055)',  color: 'var(--gold2)',   lborder: 'var(--gold)'   },
  2: { border: 'rgba(139,172,196,0.35)', bg: 'transparent',            color: 'var(--silver2)', lborder: 'var(--silver)' },
  3: { border: 'rgba(196,113,58,0.35)',  bg: 'transparent',            color: 'var(--bronze2)', lborder: 'var(--bronze)' },
} as const;

const CATEGORIES: Array<{
  bowType: string;
  gender: string;
  label: string;
  genderLabel: string;
  dot: string;
  glow: string;
}> = [
  { bowType: 'RECURVE',  gender: 'MALE',   label: 'Recurvo',   genderLabel: 'Masculino', dot: '#4F85FF', glow: 'rgba(79,133,255,0.35)' },
  { bowType: 'RECURVE',  gender: 'FEMALE',  label: 'Recurvo',   genderLabel: 'Femenino',  dot: '#FF6FCF', glow: 'rgba(255,111,207,0.35)' },
  { bowType: 'COMPOUND', gender: 'MALE',   label: 'Compuesto', genderLabel: 'Masculino', dot: '#F0A500', glow: 'rgba(240,165,0,0.35)'   },
  { bowType: 'COMPOUND', gender: 'FEMALE',  label: 'Compuesto', genderLabel: 'Femenino',  dot: '#FFB347', glow: 'rgba(255,179,71,0.35)'  },
  { bowType: 'BAREBOW',  gender: 'MALE',   label: 'Barebow',   genderLabel: 'Masculino', dot: '#E09060', glow: 'rgba(224,144,96,0.35)'  },
  { bowType: 'BAREBOW',  gender: 'FEMALE',  label: 'Barebow',   genderLabel: 'Femenino',  dot: '#98D9A0', glow: 'rgba(152,217,160,0.35)' },
];

function initials(first: string, last: string) {
  return `${first[0] ?? ''}${last[0] ?? ''}`.toUpperCase();
}

function AthleteRow({ athlete, rank }: { athlete: AthleteRankEntry; rank: 1 | 2 | 3 }) {
  const c = RANK_COLORS[rank];
  const name = `${athlete.firstName} ${athlete.lastName}`;
  
  // Scale sizes based on rank: 1 > 2 > 3 — MUCHO MÁS GRANDE
  const avatarSize = rank === 1 ? 80 : rank === 2 ? 80 : 80;
  const fontSize = rank === 1 ? 20 : rank === 2 ? 20 : 20;
  const nameSize = rank === 1 ? 18 : rank === 2 ? 18 : 18;
  const rankFontSize = rank === 1 ? 20 : rank === 2 ? 20 : 20;
  const clubSize = rank === 1 ? 13 : rank === 2 ? 12 : 11;
  const scoreSize = rank === 1 ? 14 : rank === 2 ? 13 : 12;

  return (
    <Link
      to={`/atletas/${athlete.athleteId}`}
      className="flex items-center gap-[18px] px-[26px] py-[20px] border-b no-underline
                 transition-colors duration-[120ms] cursor-pointer group"
      style={{
        borderBottomColor: 'var(--border)',
        background: rank === 1 ? `linear-gradient(90deg, ${c.bg}, transparent)` : undefined,
        borderLeft: `4px solid ${c.lborder}`,
        textDecoration: 'none',
      }}
    >
      {/* Rank number */}
      <span className="font-mono font-bold w-8 text-center shrink-0" style={{ fontSize: rankFontSize, color: c.color }}>
        {rank}
      </span>

      {/* Avatar */}
      <div
        className="relative shrink-0 rounded-full flex items-center justify-center overflow-hidden"
        style={{ 
          width: avatarSize,
          height: avatarSize,
          fontSize,
          background: 'var(--surface3)', 
          border: `3px solid ${c.border}`, 
          color: c.color,
          flexShrink: 0
        }}
      >
        {athlete.hasPhoto ? (
          <img
            src={mediaUrl(`/api/athletes/${athlete.athleteId}/photo`)}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        ) : (
          <span className="font-clash font-bold">
            {initials(athlete.firstName, athlete.lastName)}
          </span>
        )}
        {/* Honduras flag mini - small circle */}
        <span className="absolute -bottom-1 -right-1 rounded-full overflow-hidden" style={{ width: 18, height: 18, border: '2px solid var(--bg)' }}>
          <div className="w-full h-full flex flex-col">
            <span className="flex-1 bg-[#002D9C]" />
            <span className="flex-1 bg-white" />
            <span className="flex-1 bg-[#002D9C]" />
          </div>
        </span>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold leading-none mb-[6px] truncate" style={{ fontSize: nameSize, color: 'var(--text)' }}>
          {name}
        </p>
        <p className="truncate" style={{ fontSize: clubSize, color: 'var(--muted)' }}>
          {athlete.clubName ?? 'Independiente'}
        </p>
      </div>

      {/* Medal pips mini */}
      <div className="flex items-center gap-2 shrink-0">
        {athlete.gold > 0   && <span className="font-mono text-[13px] font-bold" style={{ color: 'var(--gold)'   }}>{athlete.gold}🥇</span>}
        {athlete.silver > 0 && <span className="font-mono text-[13px] font-bold" style={{ color: 'var(--silver)' }}>{athlete.silver}🥈</span>}
        {athlete.bronze > 0 && <span className="font-mono text-[13px] font-bold" style={{ color: 'var(--bronze)' }}>{athlete.bronze}🥉</span>}
      </div>
    </Link>
  );
}

function RankingColumn({ cat, athletes }: { cat: (typeof CATEGORIES)[number]; athletes: AthleteRankEntry[] }) {
  const top = athletes.slice(0, 3);

  return (
    <motion.div
      className="rounded-xl overflow-hidden"
      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
    >
      {/* Column header */}
      <div className="flex items-center justify-between px-[22px] py-[16px] border-b relative" style={{ borderBottomColor: 'var(--border)', background: `linear-gradient(90deg, ${cat.dot}08, transparent)` }}>
        <div className="flex items-center gap-3">
          <span className="w-3 h-3 rounded-full shrink-0" style={{ background: cat.dot, boxShadow: `0 0 8px ${cat.glow}` }} />
          <div>
            <p className="text-[14px] font-clash font-bold leading-none mb-1" style={{ color: 'var(--text)', letterSpacing: '-0.5px' }}>
              {cat.label}
            </p>
            <p className="text-[11px] font-semibold uppercase tracking-[1px]" style={{ color: cat.dot }}>
              {cat.genderLabel}
            </p>
          </div>
        </div>
        <Link
          to={`/atletas?bowType=${cat.bowType}&gender=${cat.gender}`}
          className="text-[11px] font-semibold no-underline shrink-0 px-3 py-1 rounded-full transition-all duration-200"
          style={{ color: cat.dot, background: `${cat.dot}12`, border: `1px solid ${cat.dot}30`, textDecoration: 'none' }}
          onMouseEnter={(e) => { (e.target as HTMLElement).style.background = `${cat.dot}25`; }}
          onMouseLeave={(e) => { (e.target as HTMLElement).style.background = `${cat.dot}12`; }}
        >
          Ver todos →
        </Link>
      </div>

      {/* Rows */}
      <div>
        {top.length === 0 ? (
          <p className="text-center py-6 text-[12px]" style={{ color: 'var(--muted)' }}>Sin datos</p>
        ) : (
          top.map((a, i) => (
            <AthleteRow key={a.athleteId} athlete={a} rank={(i + 1) as 1 | 2 | 3} />
          ))
        )}
      </div>
    </motion.div>
  );
}

interface RankingGridProps {
  athletes: AthleteRankEntry[];
}

export default function RankingGrid({ athletes }: RankingGridProps) {
  const hasAnyData = athletes.length > 0;

  return (
    <section className="relative px-5 md:px-[52px] py-[72px]">
      {/* Decorative blur effect */}
      <DecorBlur color="20,36,72" intensity={0.45} />

      {/* Header */}
      <motion.div
        className="relative z-10 mb-10 text-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-[10px] font-extrabold uppercase tracking-[3px] mb-[10px] flex items-center justify-center gap-2" style={{ color: 'var(--accent2)' }}>
          <span style={{ width: 22, height: 2, background: 'var(--accent)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
          Ranking nacional
        </p>
        <h2 className="font-clash font-bold" style={{ fontSize: 'clamp(28px,3vw,44px)', letterSpacing: '-1.5px', color: 'var(--text)' }}>
          Top Atletas{' '}
          <span style={{ color: 'var(--gold)' }}>Honduras</span>
        </h2>
        <p className="text-[13px] mt-[6px] max-w-[460px] mx-auto" style={{ color: 'var(--subtle)', lineHeight: 1.6 }}>
          Mejores tres atletas por disciplina y género en la temporada oficial.
        </p>
      </motion.div>

      {/* Empty state */}
      {!hasAnyData ? (
        <motion.div
          className="relative z-10 flex flex-col items-center justify-center py-16 gap-3"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <span style={{ fontSize: 40, opacity: 0.3 }}>🏹</span>
          <p className="text-[14px]" style={{ color: 'var(--muted)' }}>
            Sin resultados registrados para esta temporada
          </p>
        </motion.div>
      ) : (
        /* Grid wrapper — centrado con máximo ancho, como el Podium */
        <div className="relative z-10 max-w-6xl mx-auto">
          {/* Grid — 2 cols desktop, 1 mobile — NO mostrar categorías vacías */}
          <div className="grid gap-8 grid-cols-1 lg:grid-cols-2">
            {CATEGORIES.map((cat) => {
              // Filtrar atletas: solo con club, EXCEPTO barebow (que puede ser sin club)
              const filtered = athletes.filter((a) => {
                const matchesCategory = a.bowType === cat.bowType && a.gender === cat.gender;
                if (!matchesCategory) return false;
                
                // Si es barebow, incluir incluso sin club
                if (cat.bowType === 'BAREBOW') return true;
                
                // Para otros, solo incluir si tienen club
                return a.clubName !== null;
              });
              
              // NO mostrar si no hay datos
              if (filtered.length === 0) return null;
              
              return (
                <RankingColumn key={`${cat.bowType}-${cat.gender}`} cat={cat} athletes={filtered} />
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
