import { componentsMap } from './elements/_map';
import { Text } from 'app/design/typography'

export default function (a) {
    const ElementType = componentsMap[a.type];
    if ('undefined' === typeof componentsMap[a.type])
        return <Text>Undefined element type({a.type}): {JSON.stringify(a)}</Text>;
    else{
        let el = <ElementType type={a.type} {...a} />
        return el;
    }
}
