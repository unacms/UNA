import * as Icona from "phosphor-react-native";

export function Icon(props) {
  let { icon, className, ...rest } = props
  const IconComponent = Icona[icon.charAt(0).toUpperCase() + icon.slice(1)];

  if (!IconComponent) {
    // Return a default icon or null if the icon name is not found
    return null;
  }
  return  <IconComponent width={props.width} height={props.height} color={props.color} />
}

