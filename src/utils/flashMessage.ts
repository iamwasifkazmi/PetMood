import { showMessage } from 'react-native-flash-message';

export const showErrMsg = (msg: string) => {
  showMessage({
    type: 'danger',
    message: msg,
  });
};

export const showSuccessMsg = (msg: string) => {
  showMessage({
    type: 'success',
    message: msg,
  });
};


export const showInfoMsg = (msg: string) => {
  showMessage({
    type: 'info',
    message: msg,
  });
};


export const showWarningMsg = (msg: string) => {
  showMessage({
    type: 'warning',
    message: msg,
  });
};