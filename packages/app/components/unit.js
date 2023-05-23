import {componentsMap} from './units/_map';

export default function List(props) {
    const Component = componentsMap[props.unit];
    return <Component {...props} />;
}
