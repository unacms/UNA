import { View } from 'app/design/view'

export default function (props) {
    let margin = ''
    let border = ' border-none '
    if (props?.margin) margin = props.margin

    if (props?.border) border = props.border

    let rounded = 'rounded-2xl'
    if (props?.rounded) rounded = props.rounded

    return (
        <View
            className={
                props.addClassName +
                ' ' +
                margin +
                ' ' +
                rounded +
                ' ' +
                border +
                '  shadow group overflow-hidden bg-bgrcard dark:bg-bgrcard-d '
            }
        >
            {props.children}
        </View>
    )
}
