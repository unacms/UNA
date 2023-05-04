import { appSetting } from 'app/lib/util'

export default function ElementHtml(props) {
    let data = props.data;
    let sClass = "u-vanilla-html " + props.className;

    const regex = /<div class="bx-embed-link" source="(.*?)">[\s\S]*?<\/div>/g;
    if (data){
        data = data.replace(regex, function (match, capture) {
            // Customize the className based on the captured value
            let className = "aspect-video";
            if (capture.includes('twitter.com') ) {
                className = "aspect-square";
            }
          
            return (
              '<iframe scrolling="no" width=100% height=auto class="' + className + '" src="' + appSetting("urls", "embeds") + capture +'"></iframe>'
            );
          });
    }
     //   data = data.replace(regex, '<iframe width=100% height=auto class="aspect-video" src="' + appSetting('urls', 'embeds') + '$1"></iframe>');
    
    return (<div>
            <div className={sClass} dangerouslySetInnerHTML={{__html:data}} styles={props.htmlStyles}/>
        </div>
    )
}
