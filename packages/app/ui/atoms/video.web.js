export default function ElementVideo({src, controls, cover, autoplay, muted, poster, video_embed}) {
    if (!src) return null;
    return (
        <video {...(poster ? { poster: poster } : {})} className={cover? 'background-video' : ''} controls={controls} autoPlay={autoplay} muted={muted}>
            <source src={src.toString()} type="video/mp4"/>
        </video>
    )
}
