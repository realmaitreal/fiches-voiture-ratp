// Système d'encodage TM pour les fiches voitures
// Format: VERSION + LIGNE + TERMINUS + DEPOT + REGULATION + PARAMS + CHECKSUM

interface TMData {
  version: string;
  lineNumber: string;
  terminus1: string;
  terminus2: string;
  depotCode: string;
  regulationPoints1to2: RegulationPoint[];
  regulationPoints2to1: RegulationPoint[];
  totalTime1to2: number;
  totalTime2to1: number;
  lastRegToTerminus1to2: number;
  lastRegToTerminus2to1: number;
  hautLePied1: HautLePied;
  hautLePied2: HautLePied;
  firstDeparture: string;
  lastReturn: string;
  frequency: number;
  minPauseTime: number;
}

class TMEncoder {
  private static readonly VERSION = '1';

  // Encode un nombre en base36
  private static encodeNumber(num: number, minLength: number = 1): string {
    return num.toString(36).toUpperCase().padStart(minLength, '0');
  }

  // Encode un texte en base36 (3 chars max)
  private static encodeText(text: string): string {
    if (text.length > 3) text = text.substring(0, 3);
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i);
      if (charCode >= 48 && charCode <= 57) { // 0-9
        result += text[i];
      } else if (charCode >= 65 && charCode <= 90) { // A-Z
        result += text[i];
      } else if (charCode >= 97 && charCode <= 122) { // a-z
        result += text[i].toUpperCase();
      }
    }
    return result.padEnd(3, '0');
  }

  // Encode une liste de points de régulation
  private static encodeRegulationPoints(points: RegulationPoint[]): string {
    let result = this.encodeNumber(points.length, 1);
    for (const point of points) {
      result += this.encodeText(point.name);
      result += this.encodeNumber(point.time, 2);
    }
    return result;
  }

  // Encode un temps HH:MM en minutes depuis minuit
  private static encodeTime(timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    return this.encodeNumber(totalMinutes, 3);
  }

  // Calcule un checksum simple
  private static calculateChecksum(data: string): string {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data.charCodeAt(i) * (i + 1);
    }
    return this.encodeNumber(sum % 1296, 2); // 36^2 = 1296
  }

  // Encode toutes les données en TM
  public static encode(data: TMData): string {
    let tm = this.VERSION;
    
    // Ligne (2 chars)
    tm += this.encodeText(data.lineNumber).substring(0, 2);
    
    // Terminus (3 chars chacun)
    tm += this.encodeText(data.terminus1);
    tm += this.encodeText(data.terminus2);
    
    // Dépôt (3 chars)
    tm += this.encodeText(data.depotCode);
    
    // Régulation 1→2
    tm += this.encodeRegulationPoints(data.regulationPoints1to2);
    
    // Régulation 2→1
    tm += this.encodeRegulationPoints(data.regulationPoints2to1);
    
    // Temps totaux et derniers segments (2 chars chacun)
    tm += this.encodeNumber(data.totalTime1to2, 2);
    tm += this.encodeNumber(data.totalTime2to1, 2);
    tm += this.encodeNumber(data.lastRegToTerminus1to2, 2);
    tm += this.encodeNumber(data.lastRegToTerminus2to1, 2);
    
    // Haut-le-pied (2 chars chacun)
    tm += this.encodeNumber(data.hautLePied1.toTerminus, 2);
    tm += this.encodeNumber(data.hautLePied1.fromTerminus, 2);
    tm += this.encodeNumber(data.hautLePied2.toTerminus, 2);
    tm += this.encodeNumber(data.hautLePied2.fromTerminus, 2);
    
    // Paramètres de génération
    tm += this.encodeTime(data.firstDeparture);
    tm += this.encodeTime(data.lastReturn);
    tm += this.encodeNumber(data.frequency, 2);
    tm += this.encodeNumber(data.minPauseTime, 2);
    
    // Checksum
    tm += this.calculateChecksum(tm);
    
    return tm;
  }

  // Décode un TM (version simplifiée pour validation frontend)
  public static validate(tm: string): boolean {
    if (tm.length < 10) return false;
    
    const checksum = tm.slice(-2);
    const data = tm.slice(0, -2);
    const calculatedChecksum = this.calculateChecksum(data);
    
    return checksum === calculatedChecksum;
  }

  // Génère un TM à partir des paramètres de l'application
  public static generateFromState(state: {
    lineNumber: string;
    terminus1: string;
    terminus2: string;
    depotCode: string;
    regulationPoints1to2: RegulationPoint[];
    regulationPoints2to1: RegulationPoint[];
    totalTime1to2: number;
    totalTime2to1: number;
    lastRegToTerminus1to2: number;
    lastRegToTerminus2to1: number;
    hautLePied1: HautLePied;
    hautLePied2: HautLePied;
    firstDeparture: string;
    lastReturn: string;
    frequency: number;
    minPauseTime: number;
  }): string {
    const tmData: TMData = {
      version: this.VERSION,
      ...state
    };
    
    return this.encode(tmData);
  }
}

// Fonction pour copier le TM dans le presse-papiers
export const copyTMToClipboard = async (tm: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(tm);
    return true;
  } catch (err) {
    console.error('Erreur lors de la copie:', err);
    // Fallback pour les navigateurs plus anciens
    const textArea = document.createElement('textarea');
    textArea.value = tm;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
    return true;
  }
};

export { TMEncoder };

// Types pour l'intégration avec React
export interface RegulationPoint {
  name: string;
  time: number;
}

export interface HautLePied {
  toTerminus: number;
  fromTerminus: number;
}