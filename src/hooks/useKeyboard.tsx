import {useEffect, useState} from 'react';
import {Keyboard, KeyboardEvent} from 'react-native';

const useKeyboard = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<KeyboardEvent>();

  useEffect(() => {
    const showSubscription = Keyboard.addListener('keyboardWillShow', event => {
      setIsOpen(true);
      setData(event);
    });
    const hideSubscription = Keyboard.addListener('keyboardWillHide', event => {
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
