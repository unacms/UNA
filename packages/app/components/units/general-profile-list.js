import { componentsMap } from "app/components/units/profile-list/_map";

export default function Unit(props) {
    const data = props.data;
    const module = !!data?.module ? data.module : props.module
    const Component = componentsMap[module];
    const DefaultComponent = componentsMap["default"];
    return Component ? (
        <Component {...props} />
    ) : (
        <DefaultComponent {...props} />
    );
}