

export default function ElementVideo({src, controls, cover, autoplay, muted}) {


    return (
        <video className={cover? 'background-video' : ''} controls={controls} autoPlay={autoplay} muted={muted}> <source src={src.toString()} type="video/mp4"/></video>
    )
}
