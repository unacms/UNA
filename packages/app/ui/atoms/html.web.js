import { appSetting, md5, absoluteApiUrl } from 'app/lib/util'
import { useColorScheme } from 'react-native'; 

export default function ElementHtml(props) {
    let data = props.data;
    let sClass = "u-vanilla-html " + props.className;
    const scheme = useColorScheme();
    window.addEventListener("message", function(event) {
       
        if (event.origin !== 'https://ci.una.io') // replace example.com with your iframe's origin
            return;
       
        let data = JSON.parse(event.data)

        const iframe = document.querySelector(`iframe[id="${data[0]}"]`);
        if (iframe) {
            iframe.style.height = `${data[1]}px`;
        }

    }, false);

    const regex = /<div class="bx-embed-link" source="(.*?)">[\s\S]*?<\/div>/g;
    if (data){
        data = data.replace(regex, function (match, capture) {
            // Customize the className based on the captured value

            let hash = md5(capture);
            return (
                '<iframe scrolling="no" id=' + hash + ' height=auto class="w-full max-w-xl h-28 mx-auto " src="' + absoluteApiUrl("embeds") + capture + '&theme=' + scheme + '&hash=' + hash + '"></iframe>'
            );
          });
          data = data.replace(/(((<[^\/(br)>]*>)+[ \n(<br\s*\/*>)]*(<\/[^>]+>)+)+)|<br>/g, '');
    }
   

    return (<div>
            <div className={sClass} dangerouslySetInnerHTML={{__html:data}} style={props.htmlStyles}/>
        </div>
    )
}
