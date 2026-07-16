import { memo } from "react";
import UnitGroup from './bx_groups';
import UnitSpace from './bx_spaces';
import UnitAd from './bx_ads';
import UnitChannel from './bx_channels';
import UnitEvent from './bx_events';
import UnitForum from './bx_forum';
import UnitMarket from './bx_market';
import UnitOrg from './bx_organizations';
import UnitPerson from './bx_persons';
import UnitDefault from './default';
import UnitPosts from './bx_posts';
import UnitCourses from './bx_courses';
import UnitJob from './bx_jobs';
import UnitVideos from './bx_videos';
import UnitPoll from './bx_polls';
import UnitProject from './bx_projects';
import UnitTasksTimer from './bx_tasks_timer';
import UnitTasks from './bx_tasks';
import UnitAlbums from './bx_albums';

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

