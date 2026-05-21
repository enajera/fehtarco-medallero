import { useState, useEffect } from 'react';
import { Card, Table, Row, Col, Nav, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { medalsApi, ClubMedalCount } from '../api/client';
import Loading from '../components/Loading';

export default function MedalleroHistorico() {
  const [medalleros, setMedalleros] = useState<Record<number, ClubMedalCount[]>>({});
  const [availableYears, setAvailableYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedClub, setExpandedClub] = useState<number | null>(null);

  useEffect(() => {
    const fetchAvailableYears = async () => {
      try {
        const response = await medalsApi.getAvailableYears();
        const years = response.data.data;
        setAvailableYears(years);
        if (years.length > 0) {
          setSelectedYear(years[0]);
        }
      } catch (err) {
        console.error('Error fetching available years:', err);
        setError('No se pudieron cargar los años disponibles');
      } finally {
        setLoading(false);
      }
    };

    fetchAvailableYears();
  }, []);

  useEffect(() => {
    if (!selectedYear) return;

    const fetchMedallero = async () => {
      try {
        const response = await medalsApi.getClubMedallero({ year: selectedYear });
        setMedalleros((prev) => ({
          ...prev,
          [selectedYear]: response.data.data,
        }));
      } catch (err) {
        console.error('Error fetching medallero for year', selectedYear, ':', err);
      }
    };

    if (!medalleros[selectedYear]) {
      fetchMedallero();
    }
  }, [selectedYear, medalleros]);

  if (loading) return <Loading />;

  const currentMedallero = selectedYear ? medalleros[selectedYear] || [] : [];

  const totalMedals = currentMedallero.reduce(
    (acc, club) => ({
      gold: acc.gold + club.gold,
      silver: acc.silver + club.silver,
      bronze: acc.bronze + club.bronze,
    }),
    { gold: 0, silver: 0, bronze: 0 }
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>📚 Medallero Histórico Nacional de Clubes</h1>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {availableYears.length === 0 ? (
        <Card>
          <Card.Body className="text-center py-5">
            <p className="text-muted mb-0">No hay datos históricos disponibles</p>
          </Card.Body>
        </Card>
      ) : (
        <>
          {/* Year Selector Tabs */}
          <Card className="mb-4">
            <Card.Body className="p-3">
              <Nav
                variant="tabs"
                activeKey={selectedYear || undefined}
                onSelect={(eventKey) => setSelectedYear(eventKey ? Number(eventKey) : null)}
                className="flex-nowrap"
                style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}
              >
                {availableYears.map((year) => (
                  <Nav.Item key={year} style={{ minWidth: 'auto' }}>
                    <Nav.Link eventKey={year} className="px-3">
                      {year}
                    </Nav.Link>
                  </Nav.Item>
                ))}
              </Nav>
            </Card.Body>
          </Card>

          {/* Summary Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center bg-warning bg-opacity-25">
                <Card.Body>
                  <h3 className="mb-0">🥇 {totalMedals.gold}</h3>
                  <small className="text-muted">Oros</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center bg-secondary bg-opacity-25">
                <Card.Body>
                  <h3 className="mb-0">🥈 {totalMedals.silver}</h3>
                  <small className="text-muted">Platas</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center" style={{ backgroundColor: 'rgba(205, 127, 50, 0.25)' }}>
                <Card.Body>
                  <h3 className="mb-0">🥉 {totalMedals.bronze}</h3>
                  <small className="text-muted">Bronces</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h3 className="mb-0">{currentMedallero.length}</h3>
                  <small className="text-muted">Clubes con Medallas</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Medallero Table */}
          <Card>
            <Card.Body className="p-0">
              {currentMedallero.length > 0 ? (
                <Table responsive hover className="mb-0 table-medals">
                  <thead>
                    <tr>
                      <th style={{ width: '60px' }}>Pos.</th>
                      <th>Club</th>
                      <th className="text-center" style={{ width: '80px' }}>🥇</th>
                      <th className="text-center" style={{ width: '80px' }}>🥈</th>
                      <th className="text-center" style={{ width: '80px' }}>🥉</th>
                      <th className="text-center" style={{ width: '80px' }}>Total</th>
                      <th className="text-center" style={{ width: '80px' }}>Puntos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentMedallero.map((club, index) => (
                      <>
                        <tr key={club.clubId}>
                          <td>
                            {index === 0 && '🥇'}
                            {index === 1 && '🥈'}
                            {index === 2 && '🥉'}
                            {index > 2 && index + 1}
                          </td>
                          <td>
                            <Link to={`/clubes/${club.clubId}`} className="fw-bold">
                              {club.clubName}
                            </Link>
                            <div>
                              <button className="btn btn-link btn-sm p-0 ms-2" onClick={() => setExpandedClub(expandedClub === club.clubId ? null : club.clubId)}>
                                {expandedClub === club.clubId ? 'Ocultar detalles' : 'Ver detalles'}
                              </button>
                            </div>
                          </td>
                          <td className="text-center">
                            <span className="medal-badge gold">{club.gold}</span>
                          </td>
                          <td className="text-center">
                            <span className="medal-badge silver">{club.silver}</span>
                          </td>
                          <td className="text-center">
                            <span className="medal-badge bronze">{club.bronze}</span>
                          </td>
                          <td className="text-center fw-bold">{club.total}</td>
                          <td className="text-center text-muted">{club.points}</td>
                        </tr>
                        {expandedClub === club.clubId && (
                          <tr key={`${club.clubId}-details`}>
                            <td colSpan={7} className="bg-light">
                              {club.contributions && club.contributions.length > 0 ? (
                                <Table size="sm" className="mb-0">
                                  <thead>
                                    <tr>
                                      <th>Evento</th>
                                      <th>Fecha</th>
                                      <th>Atleta</th>
                                      <th>Medalla</th>
                                      <th>Fase</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {club.contributions.map((c, i) => (
                                      <tr key={i}>
                                        <td>{c.eventName || `#${c.eventId}`}</td>
                                        <td>{c.eventDate ? new Date(c.eventDate).toLocaleDateString() : ''}</td>
                                        <td>{c.athleteName}</td>
                                        <td>{c.medal}</td>
                                        <td>{c.phaseName}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </Table>
                              ) : (
                                <div className="text-muted">No hay detalles de contribuciones para este club.</div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </Table>
              ) : (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No hay medallas registradas para {selectedYear}</p>
                </div>
              )}
            </Card.Body>
          </Card>

          {/* Info Note */}
          <small className="text-muted d-block mt-3">
            * Solo se incluyen eventos oficiales con nivel técnico WA_STANDARD o INDOOR_STANDARD.
            <br />
            * Los puntos se calculan considerando la distancia y el tipo de arco.
          </small>
        </>
      )}
    </>
  );
}
