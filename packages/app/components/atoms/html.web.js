
export default function ElementHtml(props) {
    return <div className="u-vanilla-html" dangerouslySetInnerHTML={{__html:props.data}} />
}
