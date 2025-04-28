import { View } from 'app/design/view'

export default function (props) {
  let margin = ''
  if (props?.margin) margin = props.margin

  let rounded = ''
  if (props?.rounded) rounded = props.rounded

  return (
    <View className={
        props.addClassName + ' bg-bgrcard dark:bg-bgrcard-d border border-bdr dark:border-bdr-d shadow-[0_0_4px_0_rgba(0,0,0,0.04)] ' + margin + ' ' + rounded + ' '
      }
    >
      {props.children}
    </View>
  )
}
