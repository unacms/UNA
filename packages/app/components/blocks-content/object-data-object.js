import { Text } from 'app/design/typography'

export default function BlockContentObjectDataObject({data}) {

    return (
        <Text>TODO: webview with autoresize {data.content}</Text>
    );
// <section className="grid gap-4" dangerouslySetInnerHTML={{__html:data.content}} />
}
