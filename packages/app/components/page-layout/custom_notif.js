import {BlackBox} from 'app/ui/molecules/blackbox';

export default function PageLayout(props) {
    return (  <BlockByName data={props.data} name={props.blocks.browse} />)
}
