import { useState, useEffect } from 'react';
import { medalsApi, eventsApi } from '@/api/client';
import type { ClubMedalCount, AthleteRankEntry, Event } from '@/api/client';
import Hero from '@/components/home/Hero';
import Podium from '@/components/home/Podium';
import RankingGrid from '@/components/home/RankingGrid';
import EventsSection from '@/components/home/EventsSection';

export default function Home() {
  const [topClubs, setTopClubs]         = useState<ClubMedalCount[]>([]);
  const [athleteRanking, setAthleteRanking] = useState<AthleteRankEntry[]>([]);
  const [recentEvents, setRecentEvents] = useState<Event[]>([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    const year = new Date().getFullYear();
    Promise.all([
      medalsApi.getClubMedallero({ year }),
      medalsApi.getAthleteRanking({}), // Sin year — histórico completo
      eventsApi.getAll({ limit: 8 }),
    ])
      .then(([medRes, athRes, evRes]) => {
        setTopClubs(medRes.data.data);
        setAthleteRanking(athRes.data.data);
        setRecentEvents(evRes.data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg)' }}>
        <div
          className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
        />
      </div>
    );
  }

  return (
    <>
      <Hero />
      <Podium clubs={topClubs} />
      <RankingGrid athletes={athleteRanking} />
      <EventsSection events={recentEvents} />
    </>
  );
}
