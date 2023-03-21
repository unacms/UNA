import {
    DarkTheme,
    DefaultTheme,

} from "@react-navigation/native";

export const CustomLightTheme = {
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          primary: 'rgb(255, 0, 255)',
          barsBackground : '#cccccc',
          barsColor : 'rgb(0, 0, 0)',
        },
    };
   

export const CustomDarkTheme= {
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          primary: 'rgb(255, 0, 255)',
          barsBackground : '#181b20',
          barsColor : 'rgb(255, 255, 255)',
        },
    };
