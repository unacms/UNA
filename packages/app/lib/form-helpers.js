import { componentsMap } from 'app/components/form-fields/_map';
import { Text } from 'app/design/typography'
import { appSetting } from 'app/lib/util'
import Link from 'app/ui/atoms/link'

export function getFormFieldByData(inputData, handleSubmit, format, externalProps){
   
    if (!inputData)
        return <></>;

    const InputType = componentsMap[String(inputData.type)];

    if (!InputType) 
        return <Text>Unsupported field type: {inputData.type}</Text>
    return <InputType key={inputData.name} {...inputData} format = {format} handleSubmit = {handleSubmit} {...externalProps}/>;

}

export function inputByKey(array, value) {
    return array.find(obj => obj['key'] === value);
}


export function replaceLinks(htmlString) {
    const linkRegex = /<a href="(.*?)".*?>(.*?)<\/a>/g;
    const parts = htmlString.split(linkRegex);
  
    return parts.map((part, index) => {
      if (index % 3 === 0) {
        // This part is not a link
        return <Text key={index}>{part}</Text>;
      } else if (index % 3 === 1) {
        // This part is a link URL
        const linkText = parts[index + 1];
        part = part.replace(appSetting('urls', 'root'), '/');
        return <Link key={index} href={part}>{linkText}</Link>;
      }
      // Skip link text parts because they're handled in the link URL parts
      return null;
    }).filter(Boolean);
  }