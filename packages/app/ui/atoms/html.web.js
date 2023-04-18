
export default function ElementHtml(props) {
    let data = props.data;
    let sClass = "u-vanilla-html " + props.className;

    const regex = /<div class="bx-embed-link" source="(.*?)">[\s\S]*?<\/div>/g;
    if (data)
        data = data.replace(regex, '<iframe width=100% height=auto class="aspect-video" src="https://ci.una.io/test3/oembed.php?html=1&a=get_link&l=$1"></iframe>');
    
    return (<div>
            <div className={sClass} dangerouslySetInnerHTML={{__html:data}} styles={props.htmlStyles}/>
        </div>
    )
}
