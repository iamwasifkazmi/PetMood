import { Theme as NavTheme } from '@react-navigation/native';

type FontStyle = {
  fontFamily: string;
  fontWeight:
    | 'normal'
    | 'bold'
    | '100'
    | '200'
    | '300'
    | '400'
    | '500'
    | '600'
    | '700'
    | '800'
    | '900';
};

type Shadow = {
  shadowColor: string;
  shadowOffset: {
    width: number;
    height: number;
  };
  shadowOpacity: number;
  shadowRadius: number;
  elevation: number;
  // for android dark mode
  borderWidth?: number;
  borderColor?: string;
};

type TextShadow = {
  textShadowColor: string;
  textShadowOffset: { width: number; height: number };
  textShadowRadius: number;
};

export type Theme = {
  dark: boolean;
  colors: NavTheme['colors'] & {
    invertText: string;
    primary: string;
    secondary: string;
    placeholder: string;
    caption: string;
    shadow_1x: Shadow;
    textShadow_1x: TextShadow;
    getShadow: (elevation: number) => Shadow;
    modalBackground: string;
    danger: string;
    greyLight: string;
    lightGreen: string;
    green: string;
    inputBorder: string;
    blueIndicator: string;
    pinkIndicator: string;
  };
  fonts: NavTheme['fonts'] & {
    extraBold: FontStyle;
    semiBold: FontStyle;
    light: FontStyle;
    extraLight: FontStyle;
    thin: FontStyle;
    ssRegular: FontStyle;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    padding: number;
  };
};

function getShadow(elevation: number, showBorder?: boolean): Shadow {
  const shadowOpacity = Math.min(0.1 + elevation * 0.03, 0.5); // Clamp to 0.5 max
  const shadowRadius = Math.round(0.5 + elevation * 0.8 * 100) / 100; // Rounded to 2 decimals
  const height = Math.floor(elevation * 0.5);

  return {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height,
    },
    shadowOpacity,
    shadowRadius,
    elevation,
    ...(showBorder && {
      borderColor: 'white',
      borderWidth: 1,
    }),
  };
}

export const lightTheme: Theme = {
  dark: false,
  colors: {
    textShadow_1x: {
      textShadowColor: '#000',
      textShadowOffset: { width: 0.5, height: 0.5 },
      textShadowRadius: 1,
    },

    primary: '#1C6971',
    caption: '#808B9A',
    inputBorder: '#CCCCCC',
    modalBackground: '#00000020',
    invertText: '#FFFFFF',
    secondary: '#DDE1F0',
    background: '#F7F8FB',
    text: '#0D1B2A',
    danger: '#ED1C24',
    card: '#FFFFFF',
    border: '#E6E6E6',
    notification: '',
    placeholder: '#A6A6A6',
    greyLight: '#ADB4D2',
    lightGreen: '#E8F7E8',
    blueIndicator: '#D1E6FF80',
    pinkIndicator: '#FFE1F280',
    green: '#18A614',
    shadow_1x: {
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.18,
      shadowRadius: 1.0,
      elevation: 1,
    },
    getShadow,
  },
  fonts: {
    heavy: { fontFamily: '', fontWeight: '900' },
    extraBold: { fontFamily: 'Poppins-ExtraBold', fontWeight: '800' },
    bold: { fontFamily: 'Poppins-Bold', fontWeight: '700' },
    semiBold: { fontFamily: 'Poppins-SemiBold', fontWeight: '600' },
    medium: { fontFamily: 'Poppins-Medium', fontWeight: '500' },
    regular: { fontFamily: 'Poppins-Regular', fontWeight: '400' },
    light: { fontFamily: 'Poppins-Light', fontWeight: '300' },
    extraLight: { fontFamily: 'Poppins-ExtraLight', fontWeight: '200' },
    thin: { fontFamily: '', fontWeight: '100' },
    ssRegular: { fontFamily: '', fontWeight: '400' },
  },
  spacing: {
    xs: 4, // extra small padding
    sm: 8, // small padding
    md: 16, // medium padding
    lg: 24, // large padding
    padding: 24, // large padding

    xl: 32, // extra large padding
  },
};
