import { componentsMap } from './elements/_map';

export default function Element(a) {

    const ElementType = componentsMap[a.type];
    if ('undefined' === typeof componentsMap[a.type])
        return <Text>Undefined element type({a.type}): {JSON.stringify(a)}</Text>;
    else{
        let el = <ElementType type={a.type} {...a} />
        return el;
    }
}
