import Block from './block';

export default function Cell ({blocks}) {
    return blocks ? blocks.map(block => {
        if (!block?.content)
            return null;
        
        return (
                <Block key={block.id} block={block} />
        );
    }) : null;
}
