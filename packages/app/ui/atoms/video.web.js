

export default function ElementVideo(props) {

    return (
        <video  className="w-full h-full" controls> <source src={props.src.toString()}  type="video/mp4"/></video>
    )
}
