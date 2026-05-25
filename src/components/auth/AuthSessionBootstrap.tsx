import { useEffect } from 'react';
import { bootstrapAuthSession } from '../../services/firebaseTokenService';

/** Refresh Firebase ID token after redux-persist rehydrate when a refresh token exists. */
export function AuthSessionBootstrap({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    void bootstrapAuthSession();
  }, []);

  return <>{children}</>;
}
