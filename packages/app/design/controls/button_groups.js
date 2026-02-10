import { View, Row } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import { Fragment } from 'react';

const BtnClsSize = appSetting('theme', 'button_sizes');
const BtnCls = appSetting('theme', 'button_styles');

export function ButtonsGroup({
    size = 'base',
    children
}) {
    return (
        <Row className={`${BtnCls.group?.container} ${BtnClsSize[size]?.rounded}`}>
            {children?.map((child, i) => (
                <Fragment key={`btngr-${i}`}>
                    {child}
                    {i < children.length - 1 && <View className={`${BtnCls.group?.separator}`} />}
                </Fragment>
            ))}
        </Row>
    )
}