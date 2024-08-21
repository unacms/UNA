import { View } from 'app/design/view'

export default function (props) {
  let margin = ''
  if (props?.margin) margin = props.margin

  let rounded = ''
  if (props?.rounded) rounded = props.rounded

  return (
    <View className={
        props.addClassName + ' ' + margin + ' ' + rounded + ' shadow overflow-hidden rounded-2xl bg-bgrcard dark:bg-bgrcard-d  '
      }
    >
      {props.children}
    </View>
  )
}
