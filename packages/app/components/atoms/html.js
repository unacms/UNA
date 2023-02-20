import { useWindowDimensions, useColorScheme } from 'react-native'
import RenderHtml from 'react-native-render-html'
import { colors } from 'app/design/tailwind/theme'
import { mergeDeep } from '../../lib/util';

function onElement(element) {
  console.log(element);
}

const domVisitors = {
  onElement: onElement
};

export default function ElementHtml(props) {
    let { width } = useWindowDimensions();
    
    if (props.subWidth)
        width = width - props.subWidth;
    
    
    const theme = useColorScheme();
    let tagsStyles = {
        body: {
            whiteSpace: 'normal',
            color: '#374151',
            fontSize: 18,
            lineHeight: 28,
            width: width
        },
        a: {
            color: 'red'
        },
        h1:{
            color: '#111827'
        },
        h2:{
            color: '#111827'
        },
        h3:{
            color: '#111827'
        },
        h4:{
            color: '#111827'
        }
    };
    
    if(theme == 'dark'){
        let tagsStylesC = {
            body: {
                color: '#d1d5db',
            },
            a: {
                color: 'green'
            },
            h1:{
                color: '#f3f4f6'
            },
            h2:{
                color: '#f3f4f6'
            },
            h3:{
                color: '#f3f4f6'
            },
            h4:{
                color: '#f3f4f6'
            }
        };
        tagsStyles = mergeDeep(tagsStyles, tagsStylesC); 
    }

    if (props.htmlStyles)
        tagsStyles = mergeDeep(tagsStyles, props.htmlStyles);
width=50;
    return (
        <RenderHtml
          contentWidth={width}
          tagsStyles={tagsStyles}
          source={{html: props.data}}
          //domVisitors={domVisitors}
        />
    );
}
