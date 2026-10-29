// Props shared by youtube.tsx (native) and youtube.web.tsx.

export type YoutubeProps = {
    /** 11-character YouTube video id (`getYouTubeVideoId`). */
    videoId: string;
    /** Web: `small` caps the width (`max-w-xs`). */
    size?: string;
};
