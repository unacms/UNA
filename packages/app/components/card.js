import { View } from 'app/design/view'

export default function (props) {
  let margin = ''
  if (props?.margin) margin = props.margin

  let rounded = ''
  if (props?.rounded) rounded = props.rounded

  return (
    <View className={
        props.addClassName + ' ' + margin + ' ' + rounded + ' shadow-sm overflow-hidden rounded-2xl bg-bgrcard dark:bg-bgrcard-d shadow-xs dark:shadow-xsd border border-white/80 dark:border-white/5  '
      }
    >
      {props.children}
    </View>
  )
}
