import { memo } from "react";
import UnitGroup from './bx-groups';
import UnitSpace from './bx-spaces';
import UnitAd from './bx-ads';
import UnitChannel from './bx-channels';
import UnitEvent from './bx-events';
import UnitForum from './bx-forum';
import UnitMarket from './bx-market';
import UnitOrg from './bx-organizations';
import UnitPerson from './bx-persons';
import UnitDefault from './default';
import UnitPosts from './bx-posts';
import UnitCourses from './bx-courses';
import UnitJob from './bx-jobs';
import UnitVideos from './bx-videos';
import UnitPoll from './bx-polls';
import UnitProject from './bx-projects';
import UnitTasksTimer from './bx-tasks-timer';
import UnitTasks from './bx-tasks';
import UnitAlbums from './bx-albums';

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
    'default': memo(UnitDefault),
    
};

