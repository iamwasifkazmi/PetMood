interface CreatePetArg {
  name: string;
  gender: string;
  species: string;
  breed: string;
  dateOfBirth: string;
  photoUrl?:
    | string
    | {
        uri: string;
        type: string;
        name: string;
      };
}

interface createPetRes {
  name: string;
  gender: string;
  species: string;
  breed: string;
  dateOfBirth: string;
  id: string;
}

interface petHistoryArg {
  petId?: string;
  // Optional search term – backend will search across emotion, pet name, species & breed
  search?: string;
  // Optional date range filters (backend expects ISO date / datetime strings)
  startDate?: string;
  endDate?: string;
}

interface PetHistoryRes {
  createPetRes: createPetRes;
}

interface updatePetProfileArg {
  id: string;
  name?: string;
  gender?: string;
  species?: string;
  breed?: string;
  dateOfBirth?: string;
}
