import CardDataContext from 'app/context/card'
import { useMemo } from 'react';
 import { getComponent } from 'app/components/registry';
 
export default function Unit(props) {
    const data = props.data;
    const module = !!data?.module ? data.module : props.module

    const Component = useMemo(() =>  getComponent('profile-list', props.unit) || getComponent('profile-list', 'default'), [module]);
    const Result = <Component {...props} /> 

    /*
     * TODO for Roman: Need to improve this. <CardDataContext> and <Card> cannot be in one object.
     */
    return module != 'bx_persons' && module != 'bx_organizations' ? Result : (
        <CardDataContext>{Result}</CardDataContext>
    );
}