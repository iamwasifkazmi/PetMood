// src/constants/petOptions.ts

export type PetOption = { label: string; value: string };

export const GENDER_OPTIONS: PetOption[] = [
  { label: 'Male', value: 'male' },
  { label: 'Female', value: 'female' },
];

export const SPECIES_OPTIONS: PetOption[] = [
  { label: 'Dog', value: 'dog' },
  { label: 'Cat', value: 'cat' },
];

export const DOG_BREED_OPTIONS: PetOption[] = [
  { label: 'French Bulldog', value: 'french_bulldog' },
  { label: 'Labrador Retriever', value: 'labrador_retriever' },
  { label: 'Golden Retriever', value: 'golden_retriever' },
  { label: 'German Shepherd', value: 'german_shepherd' },
  { label: 'Dachshund', value: 'dachshund' },
  { label: 'Poodle (all sizes)', value: 'poodle' },
  { label: 'Beagle', value: 'beagle' },
  { label: 'Rottweiler', value: 'rottweiler' },
  { label: 'Bulldog (English)', value: 'english_bulldog' },
  { label: 'Yorkshire Terrier', value: 'yorkshire_terrier' },
  { label: 'Chihuahua', value: 'chihuahua' },
  { label: 'Pembroke Welsh Corgi', value: 'pembroke_welsh_corgi' },
  { label: 'Australian Shepherd', value: 'australian_shepherd' },
  {
    label: 'Cavalier King Charles Spaniel',
    value: 'cavalier_king_charles_spaniel',
  },
  { label: 'Shih Tzu', value: 'shih_tzu' },
  { label: 'Boxer', value: 'boxer' },
  { label: 'Siberian Husky', value: 'siberian_husky' },
  { label: 'Doberman Pinscher', value: 'doberman_pinscher' },
  { label: 'Miniature Schnauzer', value: 'miniature_schnauzer' },
  { label: 'Pomeranian', value: 'pomeranian' },
  { label: 'Cane Corso', value: 'cane_corso' },
  { label: 'Bernese Mountain Dog', value: 'bernese_mountain_dog' },
  { label: 'Great Dane', value: 'great_dane' },
  { label: 'Border Collie', value: 'border_collie' },
  { label: 'Boston Terrier', value: 'boston_terrier' },
];

export const CAT_BREED_OPTIONS: PetOption[] = [
  { label: 'Maine Coon', value: 'maine_coon' },
  { label: 'Ragdoll', value: 'ragdoll' },
  { label: 'Persian', value: 'persian' },
  { label: 'Exotic Shorthair', value: 'exotic_shorthair' },
  { label: 'British Shorthair', value: 'british_shorthair' },
  { label: 'Devon Rex', value: 'devon_rex' },
  { label: 'Abyssinian', value: 'abyssinian' },
  {
    label: 'American Shorthair / Domestic Shorthair',
    value: 'american_shorthair',
  },
  { label: 'Scottish Fold', value: 'scottish_fold' },
  { label: 'Siamese', value: 'siamese' },
  { label: 'Sphynx', value: 'sphynx' },
  { label: 'Bengal', value: 'bengal' },
  { label: 'Russian Blue', value: 'russian_blue' },
  { label: 'Norwegian Forest Cat', value: 'norwegian_forest_cat' },
  { label: 'Siberian', value: 'siberian' },
];

/** @deprecated Use getBreedOptionsForSpecies instead */
export const BREED_OPTIONS: PetOption[] = [
  ...DOG_BREED_OPTIONS,
  ...CAT_BREED_OPTIONS,
];

function labelFromLegacyBreedValue(value: string): string {
  return value
    .split('_')
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/** Breed list for the selected species; keeps unknown saved breeds when editing. */
export function getBreedOptionsForSpecies(
  species: string | number,
  currentBreed?: string | number,
): PetOption[] {
  const normalized = String(species).toLowerCase();
  const base =
    normalized === 'cat'
      ? CAT_BREED_OPTIONS
      : normalized === 'dog'
        ? DOG_BREED_OPTIONS
        : [];

  const breedStr =
    currentBreed != null && String(currentBreed).trim() !== ''
      ? String(currentBreed)
      : '';

  if (
    breedStr &&
    !base.some(option => option.value === breedStr)
  ) {
    return [
      { label: labelFromLegacyBreedValue(breedStr), value: breedStr },
      ...base,
    ];
  }

  return base;
}

export const DOB_OPTIONS = [
  { label: '2023', value: '2023' },
  { label: '2022', value: '2022' },
  { label: '2021', value: '2021' },
  { label: '2020', value: '2020' },
];

export const LOCATION_OPTIONS = [
  { label: 'New York, United States', value: 'New York, United States' },
  { label: 'Washington, United States', value: 'female' },
  { label: 'Los Angeles, United States', value: 'Los Angeles, United States' },
  {
    label: 'San Francisco, United States',
    value: 'San Francisco, United States',
  },
];
