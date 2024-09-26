import { memo } from "react";
import Likes from './likes';    // optimized
import Stars from './stars';    // optimized
import Reactions from './reactions';    // optimized
import Scores from './scores';  // optimized
import Comments from './comments';  // optimized
import Features from './features';  // optimized
import Reports from './reports';    // optimized
import Reposts from './reposts';    // optimized
import Shares from './shares';  // optimized
import Connections from './connections';    // optimized
import Recommendation from './recommendations'; // optimized

export const componentsMapDefault = {
    likes: memo(Likes),
    stars: memo(Stars),
    reactions: memo(Reactions),
    scores: memo(Scores),
    comments: memo(Comments),
    features:memo(Features),
    reports: memo(Reports),
    reposts: memo(Reposts),
    shares: memo(Shares),
    connections: memo(Connections),
    recommendation: memo(Recommendation),
};

