import { View } from 'app/design/view';
import {BlockByName} from 'app/components/block';
import {Tabs} from 'app/ui/molecules/tabs';
import Cover, {CoverSmall} from 'app/components/elements/cover';
import { processMenu, getURI } from 'app/lib/util'
import { Text, H1C } from 'app/design/typography';
import Unit from 'app/components/unit';

export default function PageLayout(props) {

    let header = <Cover data={props.data.cover_block}/>
    let smallHeader = <CoverSmall data={props.data.cover_block}/>

    let tabs=[];
    
    function getContent(data, block){
        let b = null;
        let blockName  = block.name;

        Object.keys(data?.elements).forEach(key => {
            Object.keys(data.elements[key]).forEach(key2 => {
                if (data.elements[key][key2].content){
                    Object.keys(data.elements[key][key2].content).forEach(key3 => {
                        if(data.elements[key][key2].source == blockName.toString())
                            b = data.elements[key][key2];
                    });
                }
            });
        });

        if (b?.content[0]?.type == 'browse')
            return {data: b.content[0].data, type:'browse'};
        else
            return {data: b, type:'block', block: block};
    }
    let inc = 0;
    
    processMenu(props.data.menu.object, props.data.menu.items).forEach(function (item) { 
        let i = { key: item.link, title: item.title, index: inc };
        inc++;
        let data = [];
        if (getURI(item.link) == props.data.uri){
            let content = []
            let endpoint = null;

            Object.keys(props.blocks).forEach(key => {
                let b = getContent(props.data, props.blocks[key]);
                if (b.type == 'browse'){
                    let d ={}
                    d.params = b.data.params;
                    d.request_url = b.data.request_url
                    d.finished = false
                    d.unit = b.data.unit;
                    endpoint = d
                    content = [...content , ...b.data.data]
                }
                else{
                    b.id= 'block-'+b.data.id;
                    b.type='block'
                    content.push(b);
                }
            });
            i.data = content;
            i.endpoint = endpoint;
        }
        else{
            i.data = [];
        }
        tabs.push(i);
    })

    return (<Tabs header={header} smallHeader={smallHeader} minHeaderHeight={100} isHideDefaultHeader={true} initRoutes={tabs}  />)
    
}
