import { memo } from "react";
import dynamic from 'next/dynamic';
import { DynamicFallback } from 'app/lib/dynamic-fallback';

// Each content unit is its own chunk (see lib/dynamic-fallback.js).
const UnitGroup = dynamic(() => import('./bx-groups'), { loading: DynamicFallback });
const UnitSpace = dynamic(() => import('./bx-spaces'), { loading: DynamicFallback });
const UnitAd = dynamic(() => import('./bx-ads'), { loading: DynamicFallback });
const UnitChannel = dynamic(() => import('./bx-channels'), { loading: DynamicFallback });
const UnitEvent = dynamic(() => import('./bx-events'), { loading: DynamicFallback });
const UnitForum = dynamic(() => import('./bx-forum'), { loading: DynamicFallback });
const UnitMarket = dynamic(() => import('./bx-market'), { loading: DynamicFallback });
const UnitOrg = dynamic(() => import('./bx-organizations'), { loading: DynamicFallback });
const UnitPerson = dynamic(() => import('./bx-persons'), { loading: DynamicFallback });
const UnitDefault = dynamic(() => import('./default'), { loading: DynamicFallback });
const UnitPosts = dynamic(() => import('./bx-posts'), { loading: DynamicFallback });
const UnitCourses = dynamic(() => import('./bx-courses'), { loading: DynamicFallback });
const UnitJob = dynamic(() => import('./bx-jobs'), { loading: DynamicFallback });
const UnitVideos = dynamic(() => import('./bx-videos'), { loading: DynamicFallback });
const UnitPoll = dynamic(() => import('./bx-polls'), { loading: DynamicFallback });
const UnitProject = dynamic(() => import('./bx-projects'), { loading: DynamicFallback });
const UnitTasksTimer = dynamic(() => import('./bx-tasks-timer'), { loading: DynamicFallback });
const UnitTasks = dynamic(() => import('./bx-tasks'), { loading: DynamicFallback });
const UnitAlbums = dynamic(() => import('./bx-albums'), { loading: DynamicFallback });
const UnitPrivate = dynamic(() => import('./private'), { loading: DynamicFallback });
export const componentsMapDefault = {
    'bx_groups': memo(UnitGroup),
    'bx_spaces': memo(UnitSpace),
    'bx_ads': memo(UnitAd),
    'bx_channels': memo(UnitChannel),
    'bx_events': memo(UnitEvent),
    'bx_forum': memo(UnitForum),
    'bx_market': memo(UnitMarket),
    'bx_organizations': memo(UnitOrg),
    'bx_persons': memo(UnitPerson),
    'bx_posts': memo(UnitPosts),
    'bx_courses': memo(UnitCourses),
    'bx_videos': memo(UnitVideos),
    'bx_jobs': memo(UnitJob),
    'bx_polls': memo(UnitPoll),
    'bx_projects': memo(UnitProject),
    'bx_tasks_timer': memo(UnitTasksTimer),
    'bx_tasks': memo(UnitTasks),
    'bx_albums': memo(UnitAlbums),
    'sys_private': memo(UnitPrivate),
    'default': memo(UnitDefault),

};
