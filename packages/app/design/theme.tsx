import {
    DarkTheme,
    DefaultTheme,

} from "@react-navigation/native";

export const CustomLightTheme = {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: '#2563EB',
          barsBackground : '#FFFFFF',
          barsColor : '#4B5563',
          selectBackground: 'rgba(209, 213, 219, 0.5)',
          selectBackgroundActive: 'rgba(255, 255, 255, 1)'
        },
    };
    

export const CustomDarkTheme= {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: '#3B82F6',
          background : '#000000',
          barsBackground : '#111827',
          barsColor : '#D1D5DB',
          selectBackground: 'rgba(55, 65, 81, 0.5)',
          selectBackgroundActive: '#111827'
        },
    };
