import { View } from 'app/design/view'

export default function (props) {
  let margin = ''
  if (props?.margin) margin = props.margin

  let rounded = ''
  if (props?.rounded) rounded = props.rounded

  return (
    <View className={
        props.addClassName + ' bg-bgrcard dark:bg-bgrcard-d shadow-[0_2px_4px_0_rgba(0,0,0,0.05),0_0px_2px_0_rgba(0,0,0,0.1)] ' + margin + ' ' + rounded + ' '
      }
    >
      {props.children}
    </View>
  )
}
