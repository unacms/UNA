import { getComponent } from 'app/components/registry';
import { Text } from 'app/design/typography'
import { useMemo } from "react";

const FallbackComponent = (props) => (
    <Text>
        Undefined element type ({props.type}): {JSON.stringify(props)}
    </Text>
);

export default function (a) {
    const ElementType = useMemo(
        () => getComponent('element', String(a.type)) || FallbackComponent,
        [a.type]
    );

    return <ElementType type={a.type} {...a} />
}
