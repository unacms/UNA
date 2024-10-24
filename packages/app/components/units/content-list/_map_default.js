import { memo } from "react";
import UnitGroup from './bx_groups';
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
import UnitVideos from './bx_videos';
export const componentsMapDefault = {
    'bx_groups': memo(UnitGroup),
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
    'default': memo(UnitDefault),
    
};

