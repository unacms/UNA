import { useWindowDimensions, useColorScheme, SafeAreaView, View} from 'react-native'
import RenderHtml from 'react-native-render-html'
import { colors } from 'app/design/tailwind/theme'
import { mergeDeep } from '../../lib/util';
import { Text, H1 ,TextLink} from 'app/design/typography'
import { removeElement, isTag } from 'domutils';


function onElement(element) {
    if (element.parent.children[0] === 'p') {
        element.parent.children[0] = {class: 'firstP'}
    }
    if (element.parent.children[element.parent.children.length-1] === 'p') {
        element.parent.children[element.parent.children.length-1].attribs = {class: 'lastP'}
    }
}

const domVisitors = {
  onElement: onElement
};

export default function ElementHtml(props) {
    let { width } = useWindowDimensions();
    
    const theme = useColorScheme();
    let tagsStyles = {
        body: {
            whiteSpace: 'normal',
            color: '#374151',
            fontSize: 18,
            lineHeight: 28,
            margin: 0,
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
    
    const classesStyles = {
        firstP: {
            marginTop: 0,
        },
        lastP:{
            marginBottom: 0, 
        }
    }

    
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

    return (
        <View className="w-full">
            <RenderHtml
          contentWidth={width}
          tagsStyles={tagsStyles}
        classesStyles={classesStyles} 
          source={{html: props.data}}
          domVisitors={domVisitors}
        />
        </View>
    );
}
