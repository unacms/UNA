import { View } from 'app/design/view'
import Svg, { Circle, Path, Line, Polyline, Polygon } from 'react-native-svg';
import { StyleSheet } from 'react-native';
export function Icon(props) {
    
    let {icon, ...rest} = props; 
    let data = {};
    
    switch (icon) {
        case 'discover':
            data = <Svg {...rest} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10"></Circle><Polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"></Polygon></Svg>
            break;

        case 'about':
            data = <Svg {...rest} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Circle cx="12" cy="12" r="10"></Circle><Line x1="12" y1="16" x2="12" y2="12"></Line><Line x1="12" y1="8" x2="12.01" y2="8"></Line></Svg>
            break;
            
        case 'home':
            data = <Svg {...rest} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></Path><Polyline points="9 22 9 12 15 12 15 22"></Polyline></Svg>
            break;
            
        case 'contact':
            data =  <Svg {...rest} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><Line x1="22" y1="2" x2="11" y2="13"></Line><Polygon points="22 2 15 22 11 13 2 9 22 2"></Polygon></Svg>
            break;
    }
    
    return (<View {...rest}>{data}</View>);
}
