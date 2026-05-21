import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { initials } from '@/lib/utils';
import { mediaUrl } from '@/api/client';
import type { ClubMedalCount } from '@/api/client';

// Medal config — tamaños base desktop + mobile
const MEDAL = {
  1: {
    emoji: '🥇',
    border: 'var(--gold)',
    color: 'var(--gold2)',
    shadowBase: [
      '0 0 0 6px rgba(240,165,0,0.06)',
      '0 0 30px rgba(240,165,0,0.25)',
      '0 0 60px rgba(240,165,0,0.12)',
    ],
    shadowPulse: [
      '0 0 0 10px rgba(240,165,0,0.10)',
      '0 0 45px rgba(240,165,0,0.45)',
      '0 0 80px rgba(240,165,0,0.18)',
    ],
    bg: 'radial-gradient(circle at 40% 35%, #2A2E42, #0D1020)',
    badgeBg: 'linear-gradient(135deg,#C8860A,#FFD060)',
    pedestalBorder: 'rgba(240,165,0,0.2)',
    pedestalBorderTop: 'rgba(240,165,0,0.45)',
    pedestalBg: 'linear-gradient(180deg, rgba(240,165,0,0.10) 0%, rgba(240,165,0,0.03) 100%)',
    avatarSize: 220, mAvatarSize: 130,
    fontSize: 42,    mFontSize: 30,
    pedestalH: 62,   mPedestalH: 40,
    pedestalW: 196,  mPedestalW: 110,
    pedNumColor: '#F0A500',
    pedNumGlow: '0 0 12px rgba(240,165,0,0.9), 0 0 28px rgba(240,165,0,0.5), 0 0 50px rgba(240,165,0,0.25)',
  },
  2: {
    emoji: '🥈',
    border: 'var(--silver)',
    color: 'var(--silver2)',
    shadowBase: [
      '0 0 0 7px rgba(139,172,196,0.07)',
      '0 0 36px rgba(139,172,196,0.30)',
      '0 0 70px rgba(139,172,196,0.14)',
    ],
    shadowPulse: [
      '0 0 0 12px rgba(139,172,196,0.16)',
      '0 0 55px rgba(139,172,196,0.55)',
      '0 0 95px rgba(139,172,196,0.26)',
    ],
    bg: 'radial-gradient(circle at 40% 35%, #1E2235, #0A0C18)',
    badgeBg: 'linear-gradient(135deg,#6A8FA8,#B8CFDF)',
    pedestalBorder: 'rgba(139,172,196,0.15)',
    pedestalBorderTop: 'rgba(139,172,196,0.3)',
    pedestalBg: 'linear-gradient(180deg, rgba(139,172,196,0.07) 0%, rgba(139,172,196,0.02) 100%)',
    avatarSize: 160, mAvatarSize: 110,
    fontSize: 34,    mFontSize: 24,
    pedestalH: 44,   mPedestalH: 36,
    pedestalW: 170,  mPedestalW: 110,
    pedNumColor: '#8BACC4',
    pedNumGlow: '0 0 10px rgba(139,172,196,0.9), 0 0 24px rgba(139,172,196,0.5), 0 0 44px rgba(139,172,196,0.2)',
  },
  3: {
    emoji: '🥉',
    border: 'var(--bronze)',
    color: 'var(--bronze2)',
    shadowBase: [
      '0 0 0 6px rgba(196,113,58,0.07)',
      '0 0 30px rgba(196,113,58,0.30)',
      '0 0 60px rgba(196,113,58,0.14)',
    ],
    shadowPulse: [
      '0 0 0 10px rgba(196,113,58,0.16)',
      '0 0 46px rgba(196,113,58,0.55)',
      '0 0 82px rgba(196,113,58,0.26)',
    ],
    bg: 'radial-gradient(circle at 40% 35%, #1E1A14, #0A0A08)',
    badgeBg: 'linear-gradient(135deg,#8A4A20,#C4713A)',
    pedestalBorder: 'rgba(196,113,58,0.15)',
    pedestalBorderTop: 'rgba(196,113,58,0.3)',
    pedestalBg: 'linear-gradient(180deg, rgba(196,113,58,0.07) 0%, rgba(196,113,58,0.02) 100%)',
    avatarSize: 140, mAvatarSize: 94,
    fontSize: 28,    mFontSize: 20,
    pedestalH: 34,   mPedestalH: 28,
    pedestalW: 148,  mPedestalW: 96,
    pedNumColor: '#C4713A',
    pedNumGlow: '0 0 10px rgba(196,113,58,0.9), 0 0 24px rgba(196,113,58,0.5), 0 0 44px rgba(196,113,58,0.2)',
  },
} as const;

type MedalRank = 1 | 2 | 3;

function PodiumItem({ club, rank, mobile }: { club: ClubMedalCount; rank: MedalRank; mobile: boolean }) {
  const m = MEDAL[rank];

  const avatarSize = mobile ? m.mAvatarSize : m.avatarSize;
  const fontSize   = mobile ? m.mFontSize   : m.fontSize;
  const pedestalH  = mobile ? m.mPedestalH  : m.pedestalH;
  const pedestalW  = mobile ? m.mPedestalW  : m.pedestalW;
  const badgeSize  = mobile ? 22 : 34;
  const badgeFont  = mobile ? 12 : 18;
  const borderW    = rank === 1 ? (mobile ? 3 : 4) : (mobile ? 2 : 3);

  const shadowBase  = m.shadowBase.join(', ');
  const shadowPulse = m.shadowPulse.join(', ');

  return (
    <motion.div
      className="flex flex-col items-center"
      style={{ position: 'relative', zIndex: 2 }}
      whileHover={mobile ? {} : { y: -10 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
    >
      {/* Avatar wrapper */}
      <div className="relative" style={{ display: 'inline-block', marginBottom: mobile ? 10 : 22 }}>
        <Link to={`/clubes/${club.clubId}`} style={{ display: 'block' }}>
          {/* Halo blink animado */}
          <motion.div
            className="absolute rounded-full pointer-events-none"
            style={{ inset: -borderW, borderRadius: '50%', boxShadow: shadowBase }}
            animate={{ boxShadow: [shadowBase, shadowPulse, shadowBase] }}
            transition={{
              duration: rank === 1 ? 2.4 : rank === 2 ? 2.9 : 3.4,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <div
            className="rounded-full flex items-center justify-center overflow-hidden"
            style={{
              width: avatarSize,
              height: avatarSize,
              fontSize,
              fontFamily: "'Clash Display', sans-serif",
              fontWeight: 700,
              background: m.bg,
              border: `${borderW}px solid ${m.border}`,
              color: m.color,
              position: 'relative',
            }}
          >
            {club.hasLogo ? (
              <img
                src={mediaUrl(`/api/clubs/${club.clubId}/logo`)}
                alt={club.clubName}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : (
              initials(club.clubName)
            )}
            <div
              className="absolute top-0 left-0 right-0 rounded-t-full pointer-events-none"
              style={{ height: '44%', background: 'linear-gradient(180deg, rgba(255,255,255,0.10) 0%, transparent 100%)', zIndex: 1 }}
            />
          </div>
        </Link>

        {/* Medal emoji badge — posición ajustada por emoji */}
        <div
          className="absolute rounded-full flex items-center justify-center"
          style={{
            width: badgeSize, height: badgeSize, fontSize: badgeFont,
            bottom: rank === 1 ? 8 : rank === 2 ? 6 : 7,
            right: rank === 1 ? 6 : rank === 2 ? 5 : 6,
            background: m.badgeBg,
            border: '2px solid var(--bg)',
            boxShadow: '0 2px 10px rgba(0,0,0,0.4)',
            zIndex: 3,
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {m.emoji}
        </div>
      </div>

      {/* Club info */}
      <div className="text-center">
        <Link
          to={`/clubes/${club.clubId}`}
          style={{
            display: 'block',
            fontFamily: "'Clash Display', sans-serif",
            fontWeight: 800,
            fontSize: mobile ? (rank === 1 ? 12 : 11) : (rank === 1 ? 18 : rank === 2 ? 15 : 14),
            color: m.color,
            letterSpacing: mobile ? '1.5px' : '2px',
            textDecoration: 'none',
            textTransform: 'uppercase',
            textShadow: `0 0 18px ${m.border}55`,
            marginBottom: mobile ? 2 : 4,
          }}
        >
          {club.clubName}
        </Link>
        <div style={{ fontSize: mobile ? 9 : 11, fontFamily: 'monospace', fontWeight: 700, letterSpacing: '1.5px', color: m.border, marginBottom: mobile ? 4 : 10 }}>
          {club.points} PTS
        </div>

        {/* Medal pips — desktop completos, mobile compactos */}
        {!mobile ? (
          <div className="flex justify-center gap-[5px] flex-wrap">
            {club.gold > 0 && (
              <span className="inline-flex items-center gap-[3px] font-mono font-bold text-[11px] px-2 py-[3px] rounded-md"
                style={{ background: 'rgba(240,165,0,0.10)', border: '1px solid rgba(240,165,0,0.20)', color: 'var(--gold)' }}>
                {club.gold} 🥇
              </span>
            )}
            {club.silver > 0 && (
              <span className="inline-flex items-center gap-[3px] font-mono font-bold text-[11px] px-2 py-[3px] rounded-md"
                style={{ background: 'rgba(139,172,196,0.08)', border: '1px solid rgba(139,172,196,0.18)', color: 'var(--silver2)' }}>
                {club.silver} 🥈
              </span>
            )}
            {club.bronze > 0 && (
              <span className="inline-flex items-center gap-[3px] font-mono font-bold text-[11px] px-2 py-[3px] rounded-md"
                style={{ background: 'rgba(196,113,58,0.08)', border: '1px solid rgba(196,113,58,0.18)', color: 'var(--bronze2)' }}>
                {club.bronze} 🥉
              </span>
            )}
          </div>
        ) : (
          <div className="flex justify-center gap-[3px]">
            {club.gold   > 0 && <span style={{ fontSize: 10, color: 'var(--gold)'    }}>{club.gold}🥇</span>}
            {club.silver > 0 && <span style={{ fontSize: 10, color: 'var(--silver2)' }}>{club.silver}🥈</span>}
            {club.bronze > 0 && <span style={{ fontSize: 10, color: 'var(--bronze2)' }}>{club.bronze}🥉</span>}
          </div>
        )}
      </div>

      {/* Pedestal */}
      <div style={{
        marginTop: mobile ? 8 : 18,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: pedestalW, height: pedestalH,
        background: m.pedestalBg,
        borderLeft: `1px solid ${m.pedestalBorder}`,
        borderRight: `1px solid ${m.pedestalBorder}`,
        borderTop: `1px solid ${m.pedestalBorderTop}`,
      }}>
        <span style={{
          fontFamily: "'Clash Display', sans-serif", fontWeight: 900,
          fontSize: mobile ? (rank === 1 ? 20 : rank === 2 ? 16 : 14) : (rank === 1 ? 34 : rank === 2 ? 26 : 22),
          letterSpacing: '-1px',
          color: m.pedNumColor,
          textShadow: m.pedNumGlow,
        }}>
          {rank}
        </span>
      </div>
    </motion.div>
  );
}

interface PodiumProps {
  clubs: ClubMedalCount[];
}

export default function Podium({ clubs }: PodiumProps) {
  const top = clubs.slice(0, 3);
  const [first, second, third] = top;
  const year = new Date().getFullYear();
  const prevYear = year - 1;

  return (
    <section className="px-5 md:px-[52px] py-12 md:py-[80px] overflow-hidden" style={{ position: 'relative' }}>
      {/* Decor blur (misma difuminado que el hero) */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 0 }}>
        {/* re-use same navy radial gradient */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse 55% 60% at 50% 48%, rgba(20,36,72,0.12) 0%, rgba(20,36,72,0.06) 45%, transparent 70%)'
        }} />
      </div>
      {/* Header */}
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-[10px] font-extrabold uppercase tracking-[3px] mb-[10px] flex items-center justify-center gap-2"
          style={{ color: 'var(--accent2)' }}>
          <span style={{ width: 22, height: 2, background: 'var(--accent)', borderRadius: 2, display: 'inline-block', flexShrink: 0 }} />
          Ranking actual
        </p>
        <h2 className="font-clash font-bold mb-[6px]"
          style={{ fontSize: 'clamp(22px,3vw,40px)', letterSpacing: '-1.5px', lineHeight: 1.05, color: 'var(--text)' }}>
          Top Clubes{' '}
          <span style={{ color: 'var(--gold)' }}>{prevYear}–{year}</span>
        </h2>
        <p className="text-[13px] mb-10 md:mb-[52px] max-w-[460px] mx-auto"
          style={{ color: 'var(--subtle)', lineHeight: 1.6 }}>
          Clasificación por medallería en eventos oficiales WA Standard e Indoor Standard.
        </p>
      </motion.div>

      {/* ── DESKTOP podium (≥ md) ── */}
      <div className="hidden md:block">
        <div className="flex items-end justify-center gap-7" style={{ position: 'relative', padding: '24px 0 0' }}>
          {/* Diana decorativa de fondo */}
          <div className="absolute pointer-events-none"
            style={{ top: -100, left: '50%', transform: 'translateX(-50%)', width: 680, height: 680, zIndex: 0, opacity: 0.07 }}>
            {[
              { s: '100%', border: '#D0D0D0' }, { s: '88%', border: '#E8E8E8' },
              { s: '76%',  border: '#1565C0' }, { s: '64%', border: '#1976D2' },
              { s: '52%',  border: '#C62828' }, { s: '40%', border: '#E53935' },
              { s: '28%',  border: '#F9A825' }, { s: '16%', border: '#FFD600', bg: 'rgba(255,214,0,0.12)' },
            ].map((r, i) => (
              <div key={i} className="absolute rounded-full"
                style={{
                  width: r.s, height: r.s, top: '50%', left: '50%',
                  transform: 'translate(-50%,-50%)',
                  border: `2px solid ${r.border}`,
                  background: (r as any).bg ?? 'transparent',
                }} />
            ))}
          </div>
          {second && <PodiumItem club={second} rank={2} mobile={false} />}
          {first  && <PodiumItem club={first}  rank={1} mobile={false} />}
          {third  && <PodiumItem club={third}  rank={3} mobile={false} />}
        </div>
        {/* Floor line */}
        <div style={{ height: 3, margin: '0 52px', borderRadius: 2,
          background: 'linear-gradient(90deg, transparent, rgba(240,165,0,0.2) 20%, rgba(240,165,0,0.4) 50%, rgba(240,165,0,0.2) 80%, transparent)' }} />
      </div>

      {/* ── MOBILE podium (< md) ── */}
      <div className="md:hidden px-2">
        {/* 1° centrado arriba */}
        {first && (
          <div className="flex justify-center mb-6">
            <PodiumItem club={first} rank={1} mobile={true} />
          </div>
        )}
        {/* 2° y 3° lado a lado, mejor espaciado */}
        <div className="flex justify-center items-end gap-3 px-4">
          {second && <div className="flex-1 max-w-[120px]"><PodiumItem club={second} rank={2} mobile={true} /></div>}
          {third  && <div className="flex-1 max-w-[120px]"><PodiumItem club={third}  rank={3} mobile={true} /></div>}
        </div>
        {/* Floor line mobile */}
        <div style={{ height: 2, margin: '16px auto 0', borderRadius: 2, width: '90%',
          background: 'linear-gradient(90deg, transparent, rgba(240,165,0,0.3) 40%, rgba(240,165,0,0.3) 60%, transparent)' }} />
      </div>

      {/* CTA */}
      <div className="flex justify-center mt-8 md:mt-11">
        <Link
          to="/medallero"
          className="inline-flex items-center gap-[10px] font-clash font-semibold text-[13px] md:text-[14px] transition-all duration-200 hover:-translate-y-[1px]"
          style={{
            background: 'var(--surface)',
            border: '1px solid rgba(255,255,255,0.12)',
            color: 'var(--text)',
            padding: '12px 28px',
            borderRadius: 12,
            letterSpacing: '0.2px',
            textDecoration: 'none',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(45,107,255,0.4)';
            e.currentTarget.style.color = 'var(--accent2)';
            e.currentTarget.style.background = 'rgba(45,107,255,0.05)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
            e.currentTarget.style.color = 'var(--text)';
            e.currentTarget.style.background = 'var(--surface)';
          }}
        >
          Ver Medallero Completo
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </Link>
      </div>
    </section>
  );
}
