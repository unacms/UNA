import { View } from 'app/design/view'

export default function (props) {
  let margin = ''
  if (props?.margin) margin = props.margin

  let rounded = ''
  if (props?.rounded) rounded = props.rounded

  return (
    <View className={
        props.addClassName + ' bg-bgrcard dark:bg-bgrcard-d border border-bdrcard dark:border-bdrcard-d shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] ' + margin + ' ' + rounded + ' '
      }
    >
      {props.children}
    </View>
  )
}
