import { Text } from 'app/design/typography'

export default function BlockContentObjectDataObject({data}) {

    return (
        <Text>{data.content ? data.content : ''}BlockContentObjectDataObject</Text>
    );
// <section className="grid gap-4" dangerouslySetInnerHTML={{__html:data.content}} />
}
