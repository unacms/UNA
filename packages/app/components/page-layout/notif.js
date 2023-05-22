import {BlockByName} from 'app/components/block';

export default function PageLayout(props) {
    return (  <BlockByName data={props.data} name={props.blocks.browse} />)
}
