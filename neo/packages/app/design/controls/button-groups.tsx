import { View, Row } from 'app/design/view'
import { appSetting } from 'app/lib/util'
import { Fragment, type ReactNode } from 'react';

const BtnClsSize = appSetting('theme', 'button_sizes');
const BtnCls = appSetting('theme', 'button_styles');

type ButtonsGroupProps = {
    /** Theme `button_sizes` key (for the group rounding). */
    size?: string
    children?: ReactNode[]
    [key: string]: unknown
}

export function ButtonsGroup({
    size = 'base',
    children
}: ButtonsGroupProps) {
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