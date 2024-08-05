

export default function ElementVideo({src, controls}) {

    return (
        <video className="w-full h-full" controls={controls}> <source src={src.toString()} type="video/mp4"/></video>
    )
}
