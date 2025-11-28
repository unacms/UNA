import { getComponent } from 'app/components/registry';
import { Text } from 'app/design/typography'
import { useMemo } from "react";

const FallbackComponent = (props) => (
    <Text>
        Undefined element type ({a.content_type || a.type}): {JSON.stringify(props)}
    </Text>
);

export default function (a) {
    const ElementType = useMemo(
        () => getComponent('element', a.content_type || a.type) || FallbackComponent,
        [a.type, a.content_type]
    );

    return <ElementType type={a.type} {...a} />
}
