//import YouTube, { YouTubeProps } from 'react-youtube';

export default function Youtube({ videoId }) {
    //TODO square aspect ratio
    return <iframe width="100%"  src={"https://www.youtube.com/embed/" + videoId} title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>

}
