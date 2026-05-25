import { shallowEqual } from 'react-redux';
import { useAppSelector } from '../features/store';

const useIsSignedIn = () => {
  const { token, refreshToken } = useAppSelector(
    state => ({
      token: state.auth.token,
      refreshToken: state.auth.refreshToken,
    }),
    shallowEqual,
  );
  const isSignedIn = Boolean(token || refreshToken);

  return { isSignedIn, token };
};

export default useIsSignedIn;
