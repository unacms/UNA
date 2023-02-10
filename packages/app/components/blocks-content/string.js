import { Text } from 'app/design/typography'

export default function BlockContentString(props) {

    const aAllowTypes = ['html', 'raw'];

    if (!props.data?.length || !aAllowTypes.includes(props.type))
        return null;

    return (
        <Text>TODO: webview with autoresize {props.data}</Text>
    );
// <section className="grid gap-4" dangerouslySetInnerHTML={{__html:props.data}} />
}
