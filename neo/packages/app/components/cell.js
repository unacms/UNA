import Block from './block';

export default function Cell (props) {
    let blocks = props.blocks;
    return blocks ? blocks.map(block => {

        if (!block?.content)
            return null;

        if (block.hidden == true)
            return null;
        else{
            return (
                <Block key={block.id} uri={props.uri} url={props.url} block={block} />
            );
        }
    }) : null;
}
