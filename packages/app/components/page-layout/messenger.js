import { BlockByName, DataByName } from 'app/components/block';

export default function PageLayout({ data , blocks: { main } }) {
    return <BlockByName data={ data } name={ main } fullWidth={ true } />;
}