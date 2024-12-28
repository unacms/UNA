import { View } from 'app/design/view'

export default function (props) {
  let margin = ''
  if (props?.margin) margin = props.margin

  let rounded = ''
  if (props?.rounded) rounded = props.rounded

  return (
    <View className={
        props.addClassName + ' bg-bgrcard dark:bg-bgrcard-d ' + margin + ' ' + rounded + ' overflow-hidden '
      }
    >
      {props.children}
    </View>
  )
}
