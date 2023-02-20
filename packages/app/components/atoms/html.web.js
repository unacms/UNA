
export default function ElementHtml(props) {
    let sClass = "u-vanilla-html " + props.className;
    
    return <div className={sClass} dangerouslySetInnerHTML={{__html:props.data}} styles={props.htmlStyles}/>
}
