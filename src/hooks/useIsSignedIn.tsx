import { shallowEqual } from 'react-redux';
import { useAppSelector } from '../features/store';

const useIsSignedIn = () => {
  const { token } = useAppSelector(
    state => ({
      token: state.auth.token,
    }),
    shallowEqual,
  );
  console.log('token', token);
  const isSignedIn = !!token;

  return { isSignedIn, token };
};

export default useIsSignedIn;
