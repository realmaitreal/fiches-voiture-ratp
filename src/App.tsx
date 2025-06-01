import React, { useState } from 'react';
import { ChevronRight, Plus, Trash2, Download } from 'lucide-react';
import './App.css';

// TypeScript interfaces
interface RegulationPoint {
  name: string;
  time: number;
}

interface HautLePied {
  toTerminus: number;
  fromTerminus: number;
}

interface SchedulePoint {
  point: string;
  time: number;
  formatted: string;
  terminus?: string;
}

interface HautLePiedOut {
  agent: number;
  from: string;
  to: string;
  time: number;
}

interface HautLePiedIn {
  agent: number;
  at: number;
  to: string;
  time: number;
}

interface Trip {
  tripNumber: number;
  outbound: SchedulePoint[];
  inbound: SchedulePoint[];
}

interface Schedule {
  vehicleNumber: number;
  trips: Trip[];
  hautLePiedOut: HautLePiedOut | null;
  hautLePiedIn: HautLePiedIn | null;
}

const BusScheduleGenerator: React.FC = () => {
  const [lineNumber, setLineNumber] = useState<string>('73');
  const [terminus1, setTerminus1] = useState<string>('MO');
  const [terminus2, setTerminus2] = useState<string>('CG');
  const [depotCode, setDepotCode] = useState<string>('CHA');
  
  const [regulationPoints1to2, setRegulationPoints1to2] = useState<RegulationPoint[]>([
    { name: 'RPC', time: 9 },
    { name: 'ET1', time: 12 },
    { name: 'PN', time: 5 },
    { name: 'GAA', time: 8 }
  ]);
  
  const [regulationPoints2to1, setRegulationPoints2to1] = useState<RegulationPoint[]>([
    { name: 'GAA', time: 7 },
    { name: 'PN', time: 11 },
    { name: 'ET2', time: 14 },
    { name: 'RPC', time: 8 }
  ]);
  
  const [totalTime1to2, setTotalTime1to2] = useState<number>(34);
  const [totalTime2to1, setTotalTime2to1] = useState<number>(32);
  
  const [lastRegToTerminus1to2, setLastRegToTerminus1to2] = useState<number>(5);
  const [lastRegToTerminus2to1, setLastRegToTerminus2to1] = useState<number>(4);
  
  const [hautLePied1, setHautLePied1] = useState<HautLePied>({ toTerminus: 15, fromTerminus: 17 });
  const [hautLePied2, setHautLePied2] = useState<HautLePied>({ toTerminus: 12, fromTerminus: 14 });
  
  const [firstDeparture, setFirstDeparture] = useState<string>('06:00');
  const [lastReturn, setLastReturn] = useState<string>('20:30');
  const [frequency, setFrequency] = useState<number>(20);
  
  const [schedules, setSchedules] = useState<Schedule[]>([]);

  const parseTime = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const formatTimeForSchedule = (minutes: number, prevHour: number | null = null): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (prevHour !== null && hours !== prevHour) {
      return `${hours}${mins.toString().padStart(2, '0')}`;
    }
    return mins.toString().padStart(2, '0');
  };

  const generateSchedules = (): void => {
    const firstDepMin = parseTime(firstDeparture);
    const lastRetMin = parseTime(lastReturn);
    
    // Calcul des temps de trajet réels
    const travelTime1to2 = regulationPoints1to2.reduce((sum, point) => sum + point.time, 0) + lastRegToTerminus1to2;
    const travelTime2to1 = regulationPoints2to1.reduce((sum, point) => sum + point.time, 0) + lastRegToTerminus2to1;
    
    // Pour respecter la fréquence, le temps total d'un aller-retour doit être un multiple de la fréquence
    const totalTravelTime = travelTime1to2 + travelTime2to1;
    const cycleTime = Math.ceil(totalTravelTime / frequency) * frequency;
    
    // Calcul des battements pour égaliser les temps
    const totalBattementTime = cycleTime - totalTravelTime;
    const battement1to2 = Math.floor(totalBattementTime / 2);
    const battement2to1 = totalBattementTime - battement1to2;
    
    // Calcul du nombre minimum de voitures nécessaires
    const minVehicles = Math.ceil(cycleTime / frequency);
    
    console.log(`Temps de trajet ${terminus1}→${terminus2}: ${travelTime1to2}min`);
    console.log(`Battement à ${terminus2}: ${battement1to2}min`);
    console.log(`Temps de trajet ${terminus2}→${terminus1}: ${travelTime2to1}min`);
    console.log(`Battement à ${terminus1}: ${battement2to1}min`);
    console.log(`Cycle complet: ${cycleTime}min`);
    console.log(`${minVehicles} véhicules nécessaires pour une fréquence de ${frequency}min`);
    
    const scheduleList: Schedule[] = [];
    
    // Générer les horaires pour chaque véhicule
    for (let vehicleId = 0; vehicleId < minVehicles; vehicleId++) {
      const vehicleSchedule: Schedule = {
        vehicleNumber: vehicleId + 1,
        trips: [],
        hautLePiedOut: null,
        hautLePiedIn: null
      };
      
      // Décalage initial pour chaque véhicule selon la fréquence
      let currentTime = firstDepMin + (vehicleId * frequency);
      let tripNumber = 1;
      
      // Continuer tant qu'on peut faire un cycle complet
      while (currentTime + cycleTime <= lastRetMin) {
        const trip: Trip = {
          tripNumber: tripNumber,
          outbound: [],
          inbound: []
        };
        
        // Haut-le-pied sortie (premier tour seulement)
        if (tripNumber === 1) {
          const hautLePiedTime = hautLePied1.toTerminus; // Toujours partir de terminus1
          const depotDepartureTime = currentTime - hautLePiedTime;
          vehicleSchedule.hautLePiedOut = {
            agent: vehicleId + 20,
            from: depotCode,
            to: terminus1,
            time: depotDepartureTime
          };
        }
        
        // ===== TRAJET ALLER (terminus1 → terminus2) =====
        let time = currentTime;
        let prevHour = Math.floor(time / 60);
        
        // HD (Heure de Départ)
        trip.outbound.push({
          point: 'HD',
          time: time,
          formatted: `${Math.floor(time / 60)}${(time % 60).toString().padStart(2, '0')}`
        });
        
        // Points de régulation aller
        regulationPoints1to2.forEach(point => {
          time += point.time;
          const hour = Math.floor(time / 60);
          trip.outbound.push({
            point: point.name,
            time: time,
            formatted: formatTimeForSchedule(time, prevHour)
          });
          prevHour = hour;
        });
        
        // Arrivée aller
        time += lastRegToTerminus1to2;
        const arrivalTime = time;
        trip.outbound.push({
          point: 'ARR',
          terminus: terminus2,
          time: arrivalTime,
          formatted: formatTimeForSchedule(arrivalTime, prevHour)
        });
        
        // ===== TRAJET RETOUR (terminus2 → terminus1) =====
        time = arrivalTime + battement1to2;
        prevHour = Math.floor(time / 60);
        
        // HD retour
        trip.inbound.push({
          point: 'HD',
          time: time,
          formatted: `${Math.floor(time / 60)}${(time % 60).toString().padStart(2, '0')}`
        });
        
        // Points de régulation retour
        regulationPoints2to1.forEach(point => {
          time += point.time;
          const hour = Math.floor(time / 60);
          trip.inbound.push({
            point: point.name,
            time: time,
            formatted: formatTimeForSchedule(time, prevHour)
          });
          prevHour = hour;
        });
        
        // Arrivée retour
        time += lastRegToTerminus2to1;
        const returnArrivalTime = time;
        trip.inbound.push({
          point: 'ARR',
          terminus: terminus1,
          time: returnArrivalTime,
          formatted: formatTimeForSchedule(returnArrivalTime, prevHour)
        });
        
        vehicleSchedule.trips.push(trip);
        
        // Préparer le prochain tour (après battement à terminus1)
        currentTime = returnArrivalTime + battement2to1;
        tripNumber++;
      }
      
      // Haut-le-pied retour (dernier tour)
      if (vehicleSchedule.trips.length > 0) {
        const lastTrip = vehicleSchedule.trips[vehicleSchedule.trips.length - 1];
        const lastArrival = lastTrip.inbound[lastTrip.inbound.length - 1].time;
        const hautLePiedReturnTime = hautLePied1.fromTerminus;
        const depotArrivalTime = lastArrival + hautLePiedReturnTime;
        vehicleSchedule.hautLePiedIn = {
          agent: vehicleId + 21,
          at: lastArrival,
          to: depotCode,
          time: depotArrivalTime
        };
      }
      
      console.log(`Véhicule ${vehicleId + 1}: ${vehicleSchedule.trips.length} tours`);
      if (vehicleSchedule.trips.length > 0) {
        scheduleList.push(vehicleSchedule);
      }
    }
    
    setSchedules(scheduleList);
  };

  const addRegulationPoint = (
    setter: React.Dispatch<React.SetStateAction<RegulationPoint[]>>, 
    points: RegulationPoint[]
  ): void => {
    setter([...points, { name: '', time: 5 }]);
  };

  const removeRegulationPoint = (
    setter: React.Dispatch<React.SetStateAction<RegulationPoint[]>>, 
    points: RegulationPoint[], 
    index: number
  ): void => {
    setter(points.filter((_, i) => i !== index));
  };

  const updateRegulationPoint = (
    setter: React.Dispatch<React.SetStateAction<RegulationPoint[]>>, 
    points: RegulationPoint[], 
    index: number, 
    field: keyof RegulationPoint, 
    value: string | number
  ): void => {
    const newPoints = [...points];
    newPoints[index] = {
      ...newPoints[index],
      [field]: field === 'time' ? (typeof value === 'number' ? value : parseInt(value) || 0) : value
    };
    setter(newPoints);
  };

  interface ScheduleSheetProps {
    schedule: Schedule;
    terminus1: string;
    terminus2: string;
    lineNumber: string;
  }

  const ScheduleSheet: React.FC<ScheduleSheetProps> = ({ schedule, terminus1, terminus2, lineNumber }) => {
    // Vérification de sécurité
    if (!schedule.trips || schedule.trips.length === 0) {
      return <div>Erreur: Aucun trajet trouvé pour ce véhicule</div>;
    }
    
    // Déterminer le nombre maximum de points de régulation pour dimensionner les colonnes
    const maxRegPoints = Math.max(
      ...schedule.trips.map(trip => Math.max(
        (trip.outbound?.length || 2) - 2,
        (trip.inbound?.length || 2) - 2
      ))
    );
    
    return (
      <div className="schedule-sheet">
        {/* En-tête */}
        <div className="schedule-header">
          <div className="schedule-header-left">
            <span className="line-number">Ligne: {lineNumber}</span>
            <span className="tm-code">TM: 073LAV0215 du</span>
          </div>
          <div className="vehicle-number">Voiture: {schedule.vehicleNumber.toString().padStart(3, '0')}</div>
        </div>
        
        {/* Haut-le-pied sortie */}
        {schedule.hautLePiedOut && (
          <div className="haut-le-pied-out">
            AGENT {schedule.hautLePiedOut.agent} SORT de {schedule.hautLePiedOut.from} vers {schedule.hautLePiedOut.to} à {Math.floor(schedule.hautLePiedOut.time / 60)}{(schedule.hautLePiedOut.time % 60).toString().padStart(2, '0')}
          </div>
        )}
        
        {/* Tableau principal */}
        <table className="schedule-table">
          <thead>
            <tr>
              <th>TER DEP</th>
              <th className="hd-column">HD</th>
              <th colSpan={maxRegPoints}>RÉGULATION</th>
              <th colSpan={2}>TER ARR</th>
              <th>TER DEP</th>
              <th className="hd-column">HD</th>
              <th colSpan={maxRegPoints}>RÉGULATION</th>
              <th colSpan={2}>TER ARR</th>
            </tr>
            <tr>
              <th>TER</th>
              <th></th>
              {Array.from({length: maxRegPoints}, (_, i) => {
                const firstTrip = schedule.trips?.[0];
                const point = firstTrip?.outbound?.[i + 1];
                return <th key={i} className="regulation-point">{point?.point || ''}</th>;
              })}
              <th></th>
              <th></th>
              <th>TER</th>
              <th></th>
              {Array.from({length: maxRegPoints}, (_, i) => {
                const firstTrip = schedule.trips?.[0];
                const point = firstTrip?.inbound?.[i + 1];
                return <th key={i} className="regulation-point">{point?.point || ''}</th>;
              })}
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
          {schedule.trips.map((trip, tripIndex) => {
            return (
              <React.Fragment key={tripIndex}>
                {/* Aller */}
                <tr>
                  <td>{terminus1}</td>
                  <td className="time-cell hd-time">
                    {trip.outbound?.[0]?.formatted || ''}
                  </td>
                  {Array.from({length: maxRegPoints}, (_, i) => {
                    const point = trip.outbound?.[i + 1];
                    return (
                      <td key={i} className={`time-cell regulation-time ${i % 2 === 0 ? 'regulation-gray' : ''}`}>
                        {point && point.point !== 'ARR' ? point.formatted : ''}
                      </td>
                    );
                  })}
                  <td>{terminus2}</td>
                  <td className="time-cell arrival-time">
                    {trip.outbound?.[trip.outbound.length - 1]?.formatted || ''}
                  </td>
                    <td></td>
                    <td></td>
                    {Array.from({length: maxRegPoints}, (_, i) => (
                      <td key={i} className={i % 2 === 0 ? 'regulation-gray' : ''}></td>
                    ))}
                    <td></td>
                    <td></td>
                </tr>
                
                {/* Retour */}
                <tr>
                  <td></td>
                  <td></td>
                  {Array.from({length: maxRegPoints}, (_, i) => (
                    <td key={i} className={i % 2 === 0 ? 'regulation-gray' : ''}></td>
                  ))}
                  <td></td>
                  <td></td>
                  <td>{terminus2}</td>
                  <td className="time-cell hd-time">
                    {trip.inbound?.[0]?.formatted || ''}
                  </td>
                  {Array.from({length: maxRegPoints}, (_, i) => {
                    const point = trip.inbound?.[i + 1];
                    return (
                      <td key={i} className={`time-cell regulation-time ${i % 2 === 0 ? 'regulation-gray' : ''}`}>
                        {point && point.point !== 'ARR' ? point.formatted : ''}
                      </td>
                    );
                  })}
                  <td>{terminus1}</td>
                  <td className="time-cell arrival-time">
                    {trip.inbound?.[trip.inbound.length - 1]?.formatted || ''}
                  </td>
                </tr>
              </React.Fragment>
            );
          })}
          </tbody>
        </table>
        
        {/* Haut-le-pied retour */}
        {schedule.hautLePiedIn && (
          <div className="haut-le-pied-in">
            AGENT {schedule.hautLePiedIn.agent} à {Math.floor(schedule.hautLePiedIn.at / 60)}{(schedule.hautLePiedIn.at % 60).toString().padStart(2, '0')} RENTRE à {schedule.hautLePiedIn.to} à {Math.floor(schedule.hautLePiedIn.time / 60)}{(schedule.hautLePiedIn.time % 60).toString().padStart(2, '0')}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="app-container">
      <div className="max-width-container">
        <h1 className="main-title">Générateur de Fiches Voitures</h1>
        
        <div className="config-section">
          <h2 className="section-title">Configuration de la ligne</h2>
          
          <div className="input-grid">
            <div className="input-group">
              <label>Numéro de ligne</label>
              <input
                type="text"
                value={lineNumber}
                onChange={(e) => setLineNumber(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label>Terminus 1</label>
              <input
                type="text"
                value={terminus1}
                onChange={(e) => setTerminus1(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label>Terminus 2</label>
              <input
                type="text"
                value={terminus2}
                onChange={(e) => setTerminus2(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label>Code dépôt</label>
              <input
                type="text"
                value={depotCode}
                onChange={(e) => setDepotCode(e.target.value)}
                className="input-field"
              />
            </div>
          </div>
          
          <div className="regulation-grid">
            <div className="regulation-section">
              <h3 className="regulation-title">{terminus1} → {terminus2}</h3>
              <div className="regulation-points">
                {regulationPoints1to2.map((point, index) => (
                  <div key={index} className="regulation-point-row">
                    <input
                      type="text"
                      placeholder="Point"
                      value={point.name}
                      onChange={(e) => updateRegulationPoint(setRegulationPoints1to2, regulationPoints1to2, index, 'name', e.target.value)}
                      className="input-field point-input"
                    />
                    <input
                      type="number"
                      placeholder="Minutes"
                      value={point.time}
                      onChange={(e) => updateRegulationPoint(setRegulationPoints1to2, regulationPoints1to2, index, 'time', e.target.value)}
                      className="input-field time-input"
                    />
                    <button
                      onClick={() => removeRegulationPoint(setRegulationPoints1to2, regulationPoints1to2, index)}
                      className="remove-btn"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addRegulationPoint(setRegulationPoints1to2, regulationPoints1to2)}
                  className="add-btn"
                >
                  <Plus size={20} /> Ajouter un point
                </button>
                <div className="total-time">
                  <label>Temps total (minutes)</label>
                  <input
                    type="number"
                    value={totalTime1to2}
                    onChange={(e) => setTotalTime1to2(parseInt(e.target.value) || 0)}
                    className="input-field time-input"
                  />
                </div>
                <div className="total-time">
                  <label>Dernier point → {terminus2} (min)</label>
                  <input
                    type="number"
                    value={lastRegToTerminus1to2}
                    onChange={(e) => setLastRegToTerminus1to2(parseInt(e.target.value) || 0)}
                    className="input-field time-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="regulation-section">
              <h3 className="regulation-title">{terminus2} → {terminus1}</h3>
              <div className="regulation-points">
                {regulationPoints2to1.map((point, index) => (
                  <div key={index} className="regulation-point-row">
                    <input
                      type="text"
                      placeholder="Point"
                      value={point.name}
                      onChange={(e) => updateRegulationPoint(setRegulationPoints2to1, regulationPoints2to1, index, 'name', e.target.value)}
                      className="input-field point-input"
                    />
                    <input
                      type="number"
                      placeholder="Minutes"
                      value={point.time}
                      onChange={(e) => updateRegulationPoint(setRegulationPoints2to1, regulationPoints2to1, index, 'time', e.target.value)}
                      className="input-field time-input"
                    />
                    <button
                      onClick={() => removeRegulationPoint(setRegulationPoints2to1, regulationPoints2to1, index)}
                      className="remove-btn"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => addRegulationPoint(setRegulationPoints2to1, regulationPoints2to1)}
                  className="add-btn"
                >
                  <Plus size={20} /> Ajouter un point
                </button>
                <div className="total-time">
                  <label>Temps total (minutes)</label>
                  <input
                    type="number"
                    value={totalTime2to1}
                    onChange={(e) => setTotalTime2to1(parseInt(e.target.value) || 0)}
                    className="input-field time-input"
                  />
                </div>
                <div className="total-time">
                  <label>Dernier point → {terminus1} (min)</label>
                  <input
                    type="number"
                    value={lastRegToTerminus2to1}
                    onChange={(e) => setLastRegToTerminus2to1(parseInt(e.target.value) || 0)}
                    className="input-field time-input"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="haut-le-pied-grid">
            <div className="haut-le-pied-section">
              <h3 className="haut-le-pied-title">Haut-le-pied {terminus1}</h3>
              <div className="haut-le-pied-inputs">
                <div className="haut-le-pied-input">
                  <label>Dépôt → {terminus1} (min)</label>
                  <input
                    type="number"
                    value={hautLePied1.toTerminus}
                    onChange={(e) => setHautLePied1({...hautLePied1, toTerminus: parseInt(e.target.value) || 0})}
                    className="input-field time-input"
                  />
                </div>
                <div className="haut-le-pied-input">
                  <label>{terminus1} → Dépôt (min)</label>
                  <input
                    type="number"
                    value={hautLePied1.fromTerminus}
                    onChange={(e) => setHautLePied1({...hautLePied1, fromTerminus: parseInt(e.target.value) || 0})}
                    className="input-field time-input"
                  />
                </div>
              </div>
            </div>
            
            <div className="haut-le-pied-section">
              <h3 className="haut-le-pied-title">Haut-le-pied {terminus2}</h3>
              <div className="haut-le-pied-inputs">
                <div className="haut-le-pied-input">
                  <label>Dépôt → {terminus2} (min)</label>
                  <input
                    type="number"
                    value={hautLePied2.toTerminus}
                    onChange={(e) => setHautLePied2({...hautLePied2, toTerminus: parseInt(e.target.value) || 0})}
                    className="input-field time-input"
                  />
                </div>
                <div className="haut-le-pied-input">
                  <label>{terminus2} → Dépôt (min)</label>
                  <input
                    type="number"
                    value={hautLePied2.fromTerminus}
                    onChange={(e) => setHautLePied2({...hautLePied2, fromTerminus: parseInt(e.target.value) || 0})}
                    className="input-field time-input"
                  />
                </div>
              </div>
            </div>
          </div>
          
          <div className="generation-params">
            <div className="input-group">
              <label>Premier départ</label>
              <input
                type="time"
                value={firstDeparture}
                onChange={(e) => setFirstDeparture(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label>Dernier retour</label>
              <input
                type="time"
                value={lastReturn}
                onChange={(e) => setLastReturn(e.target.value)}
                className="input-field"
              />
            </div>
            <div className="input-group">
              <label>Fréquence (minutes)</label>
              <input
                type="number"
                value={frequency}
                onChange={(e) => setFrequency(parseInt(e.target.value) || 10)}
                className="input-field"
              />
            </div>
          </div>
          
          <button
            onClick={generateSchedules}
            className="generate-btn"
          >
            <ChevronRight size={20} /> Générer les fiches
          </button>
        </div>
        
        {schedules.length > 0 && (
          <div className="results-section">
            <div className="results-header">
              <h2 className="section-title">Fiches générées ({schedules.length} voitures)</h2>
              <button
                onClick={() => window.print()}
                className="print-btn"
              >
                <Download size={20} /> Imprimer
              </button>
            </div>
            
            <div className="schedules-container">
              {schedules.map((schedule, index) => (
                <ScheduleSheet 
                  key={index} 
                  schedule={schedule} 
                  terminus1={terminus1}
                  terminus2={terminus2}
                  lineNumber={lineNumber}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BusScheduleGenerator;