export interface CreateScanArg {
  petId: string;
  mediaType: 'audio' | 'video' | 'image';
  file: any;
}

export interface CreateScanRes {
  emotion: string;
  confidence: number;
  mediaUrl: string;
  petId: string;
  /** Detected species/type from AI (e.g. dog, cat) */
  animalType?: string;
  /** How the scan was analyzed (e.g. image, audio) */
  analysisMethod?: string;
  /** Which AI provider ran detection */
  aiDetectorType?: string;
  /** Optional care / action tip from the API */
  recommended?: string;
  topEmotions: {
    emotion: string;
    confidence: number;
  }[];
  pet?: {
    species?: string;
    name?: string;
    breed?: string;
    dateOfBirth?: string;
    gender?: string;
    id?: string;
    image?: string;
    photoUrl?: string;
  };
}

export interface ScanHistoryRes {
  confidence: number;
  petId: string;
  emotion: string;
  mediaUrl: string;
  timestamp: string;
  id: string;
  animalType?: string;
  analysisMethod?: string;
  aiDetectorType?: string;
  recommended?: string;
  pet: {
    species: string;
    name: string;
    breed: string;
    dateOfBirth: string;
    gender: string;
    id: string;
    image?: string;
    photoUrl?: string;
  };
}

export interface DeletePetHistoryArg {
  id: string;
}
