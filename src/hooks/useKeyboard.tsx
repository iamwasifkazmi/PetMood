import {useEffect, useState} from 'react';
import {Keyboard, KeyboardEvent, Platform} from 'react-native';

const useKeyboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<KeyboardEvent>();

  useEffect(() => {
    const showEvent =
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent =
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSubscription = Keyboard.addListener(showEvent, event => {
      setIsOpen(true);
      setData(event);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, event => {
      setIsOpen(false);
      setData(event);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);
  return {
    isOpen,
    data,
  };
};

export default useKeyboard;
