import { Text } from 'app/design/typography'
import Html from '../../ui/atoms/html';

export default function BlockContentString(props) {

    const aAllowTypes = ['html', 'raw'];

    //if (!props.data?.length || !aAllowTypes.includes(props.type))
    //    return null;

    return (
        <Html data={props.data} />
    );
// <section className="grid gap-4" dangerouslySetInnerHTML={{__html:props.data}} />
}
