interface CreateScanArg {
  petId: string;
  mediaType: 'audio' | 'video' | 'image';
  file: any;
}

interface CreateScanRes {
  emotion: string;
  confidence: number;
  mediaUrl: string;
  petId: string;
  animalType: string;
  analysisMethod: string;
  topEmotions: {
    emotion: string;
    confidence: number;
  }[];
  aiDetectorType: string;
}

export interface ScanHistoryRes {
  confidence: number;
  petId: string;
  emotion: string;
  mediaUrl: string;
  timestamp: string;
  id: string;
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
