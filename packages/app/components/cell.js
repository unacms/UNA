import Block from './block';
import { View, Row } from 'app/design/view'
import { A, H1, P, Text, TextLink } from 'app/design/typography'

export default function Cell ({blocks}) {
    return blocks ? blocks.map(block => {

       /* if (!block?.content)
            return null;
*/
        if (block.hidden == true)
            return null;
        else{
            return (
                <Block key={block.id} block={block} />
            );
        }
    }) : null;
}
