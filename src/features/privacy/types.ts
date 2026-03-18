export type AiProviderKey = 'nyckel' | 'assemblyai';

export interface AiConsent {
  granted: boolean;
  providers: AiProviderKey[];
  grantedAt: string | null;
  revokedAt: string | null;
}

export interface AiProviderDisclosure {
  providerName: string;
  dataSent: string[];
  purpose: string;
}

export type AiDisclosureMap = Partial<Record<AiProviderKey, AiProviderDisclosure>>;

export interface GetAiConsentRes {
  consent: AiConsent;
  disclosure: AiDisclosureMap;
}

export interface SetAiConsentArg {
  granted: boolean;
  providers: AiProviderKey[];
}

export interface SetAiConsentRes {
  success: boolean;
  consent: AiConsent;
}

