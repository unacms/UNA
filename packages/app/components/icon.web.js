import * as Icona from "@phosphor-icons/react";

export function Icon(props) {
  let { icon, className, ...rest } = props
  const IconComponent = Icona[icon];

  if (!IconComponent) {
    // Return a default icon or null if the icon name is not found
    return null;
  }
  return  <IconComponent className={className} {...rest} />
}

