import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import DecorBlur from '../DecorBlur';

const HERO_IMG =
  'https://images.unsplash.com/photo-1569517282132-25d22f4573e6?w=1800&q=85';

const RINGS = [
  { pct: 100, color: '#F0F0F0' },
  { pct: 91,  color: '#E8E8E8' },
  { pct: 82,  color: '#222222' },
  { pct: 73,  color: '#1A1A1A' },
  { pct: 64,  color: '#4AADE8' },
  { pct: 55,  color: '#5BBDED' },
  { pct: 46,  color: '#E8302A' },
  { pct: 37,  color: '#EF3F3A' },
  { pct: 27,  color: '#F5C800' },
  { pct: 14,  color: '#FFDD00' },
];

function TargetDeco({ size = 220 }: { size?: number }) {
  return (
    <div style={{ width: size, height: size, position: 'relative', opacity: 0.30, flexShrink: 0 }}>
      {RINGS.map((ring, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            borderRadius: '50%',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: `${ring.pct}%`,
            height: `${ring.pct}%`,
            background: ring.color,
          }}
        />
      ))}
    </div>
  );
}

function BadgeDot() {
  return (
    <motion.span
      className="inline-block w-[5px] h-[5px] rounded-full shrink-0"
      style={{ background: 'var(--accent)', marginLeft: 2 }}
      animate={{ opacity: [0.8, 0.25, 0.8] }}
      transition={{ duration: 2.2, repeat: Infinity }}
    />
  );
}

/* Spring suave con ligero overshoot */
const ease = [0.16, 1, 0.3, 1] as const;

/* Blur + slide up — efecto "emerge" premium */
const fadeUp = {
  hidden:  { opacity: 0, y: 26, filter: 'blur(10px)' },
  visible: { opacity: 1, y: 0,  filter: 'blur(0px)'  },
};

export default function Hero() {
  return (
    <section
      className="relative overflow-hidden flex items-center -mt-[62px]"
      style={{ height: '100vh', minHeight: 680, maxHeight: 960, paddingTop: 62, scrollMarginTop: 0 }}
    >
      {/* 1 — Background photo */}
      <motion.div
        className="absolute inset-0 bg-cover"
        style={{
          backgroundImage: `url('${HERO_IMG}')`,
          backgroundPosition: 'center 25%',
          filter: 'brightness(0.22) saturate(0.7)',
        }}
        animate={{ scale: [1.04, 1.10] }}
        transition={{ duration: 22, repeat: Infinity, repeatType: 'reverse', ease: 'linear' }}
      />

      {/* 2 — Gradient overlays */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg,transparent 0%,transparent 30%,rgba(7,9,15,0.55) 58%,rgba(7,9,15,0.92) 80%,rgba(7,9,15,1) 100%)',
          zIndex: 1,
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(105deg,rgba(7,9,15,0.92) 0%,rgba(7,9,15,0.55) 42%,rgba(7,9,15,0.10) 65%,transparent 78%)',
          zIndex: 1,
        }}
      />
      {/* Halo centrado — usa componente reutilizable */}
      <DecorBlur color="20,36,72" intensity={0.75} />

      {/* 3 — Centered layout */}
      <div
        className="relative z-10 w-full px-5 md:px-[52px] flex flex-col items-center text-center gap-0"
        style={{ marginTop: 0 }}
      >
        {/* Diana — sobre el título, centrada — visible en mobile pero más pequeña */}
        <motion.div
          className="flex items-center justify-center mb-[-3px] md:mb-[-3px]"
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.3, delay: 0.1, ease }}
        >
          {/* Tamaño 140px en mobile, 220px en desktop */}
          <div className="md:hidden">
            <TargetDeco size={140} />
          </div>
          <div className="hidden md:block">
            <TargetDeco size={220} />
          </div>
        </motion.div>

        {/* Text content */}
        <motion.div
          className="flex flex-col items-center"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.13 } } }}
        >
          {/* Badge */}
       {/*    <motion.div
            variants={fadeUp}
            transition={{ duration: 0.65, ease }}
            className="inline-flex items-center gap-[10px] mb-[14px] px-4 py-[7px] rounded-full"
            style={{
              background: 'rgba(13,16,28,0.72)',
              border: '1px solid rgba(255,255,255,0.10)',
              backdropFilter: 'blur(14px)',
            }}
          >
            <span className="text-[15px] leading-none">🇭🇳</span>
            <BadgeDot />
            <span
              className="text-[11px] font-bold uppercase tracking-[1.4px]"
              style={{ color: 'rgba(255,255,255,0.58)' }}
            >
              Federación Hondureña de Tiro con Arco
            </span>
          </motion.div> */}

          {/* Title */}
          <motion.h1
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.10 } } }}
            className="font-clash font-bold mb-3"
            style={{ fontSize: 'clamp(54px,7.8vw,100px)', lineHeight: 0.93, letterSpacing: '-3px' }}
          >
            <motion.span
              variants={fadeUp}
              transition={{ duration: 0.85, ease }}
              className="block"
              style={{ color: 'var(--text)', opacity: 0.94 }}
            >
              Federación
            </motion.span>
            <motion.span
              variants={fadeUp}
              transition={{ duration: 0.85, ease }}
              className="block"
              style={{
                background: 'linear-gradient(130deg,#F0A500 0%,#FFD060 50%,#FFE898 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                filter: 'drop-shadow(0 0 48px rgba(240,165,0,0.32))',
              }}
            >
              Hondureña
            </motion.span>
            <motion.span
              variants={fadeUp}
              transition={{ duration: 0.85, ease }}
              className="block font-normal"
              style={{ color: '#4F85FF' }}
            >
              Tiro con Arco
            </motion.span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={fadeUp}
            transition={{ duration: 0.6, ease }}
            className="text-[15px] leading-[1.75] mb-[24px]"
            style={{ color: 'rgba(237,240,255,0.44)', maxWidth: 480 }}
          >
            Historial oficial de atletas, clubes y competencias.<br />
            El registro definitivo del tiro con arco hondureño.
          </motion.p>

          {/* Actions */}
          <motion.div
            variants={fadeUp}
            transition={{ duration: 0.6, ease }}
            className="flex items-center justify-center gap-2 md:gap-3 flex-wrap"
          >
            <Link
              to="/medallero"
              className="inline-flex items-center gap-[6px] font-clash font-semibold text-[12px] md:text-[14px] transition-all duration-200 hover:-translate-y-[2px]"
              style={{
                background: 'var(--accent)',
                color: '#ffffff',
                textDecoration: 'none',
                padding: '11px 20px',
                borderRadius: 9,
                boxShadow: '0 4px 28px rgba(45,107,255,0.45)',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = '#4F85FF')}
              onMouseLeave={e => (e.currentTarget.style.background = 'var(--accent)')}
            >
            ★ Ver Medallero
            </Link>
            <Link
              to="/atletas"
              className="inline-flex items-center gap-[6px] font-clash font-semibold text-[12px] md:text-[14px] transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.14)',
                color: 'rgba(255,255,255,0.80)',
                textDecoration: 'none',
                padding: '11px 20px',
                borderRadius: 9,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.13)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
            >
              Buscar Atletas
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* 4 — Scroll indicator */}
      <motion.div
        className="absolute bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center gap-[6px] z-10"
        animate={{ y: [0, 7, 0], opacity: [0.3, 0.15, 0.3] }}
        transition={{ duration: 2.2, repeat: Infinity }}
      >
        <span
          className="text-[9px] font-extrabold uppercase tracking-[2.5px]"
          style={{ color: 'var(--subtle)' }}
        >
          Scroll
        </span>
        <svg width="16" height="25" viewBox="0 0 16 20" fill="none">
          <rect x="1" y="1" width="14" height="18" rx="7" stroke="#3D4666" strokeWidth="1.5"/>
          <rect x="6.5" y="4" width="3" height="5" rx="1.5" fill="#3D4666"/>
        </svg>
      </motion.div>
    </section>
  );
}
