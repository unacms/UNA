import CardDataContext from 'app/context/card'
import { componentsMap } from "app/components/units/profile-list/_map";

export default function Unit(props) {
    const data = props.data;
    const module = !!data?.module ? data.module : props.module
    const Component = componentsMap[module];
    const DefaultComponent = componentsMap["default"];
    const Result = Component ? (
        <Component {...props} />
    ) : (
        <DefaultComponent {...props} />
    );

    /*
     * TODO for Roman: Need to improve this. <CardDataContext> and <Card> cannot be in one object.
     */
    return module != 'bx_persons' && module != 'bx_organizations' ? Result : (
        <CardDataContext>{Result}</CardDataContext>
    );
}