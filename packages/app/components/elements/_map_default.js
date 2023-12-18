import Browse from './browse';
import Form from './form';
import Msg from './msg';
import Login from './login';
import Redirect from './redirect';
import EntityText from './entity_text';
import EntityAttachments from './entity_attachments';
import EntityAuthor from './entity_author';
import EntityActions from './entity_actions';
import EntityInfo from './entity_info';
import EntityCover from './entity_cover';
import ProfileMenu from './profile_menu';
import CategoriesList from './categories_list';
import FeedItem from './feed_item';
import ProfileSwitcher from './profile_switcher';
import DashboardStat from './dashboard_stat';
import MessengerPage from './messenger';
import ProfileContacts from './contacts';
import SimpleList from './simple_list';
import Lang from './lang';
import Invite from './invite';
import Map from './map';
import Calendar from './calendar';
import Grid from './grid';
import Chart from './chart';

export const componentsMapDefault = {
    chart: Chart,
    browse: Browse,
    grid: Grid,
    invite: Invite,
    map: Map,
    calendar: Calendar,
    form: Form,
    msg: Msg,
    login: Login,
    redirect: Redirect,
    entity_text: EntityText,
    entity_author: EntityAuthor,
    entity_actions: EntityActions,
    entity_attachments: EntityAttachments,
    entity_info: EntityInfo,
    entity_cover: EntityCover,
    profile_menu: ProfileMenu,
    profile_switcher: ProfileSwitcher,
    feed_item: FeedItem,
    dashboard_stat: DashboardStat,
    categories_list: CategoriesList,
    lang: Lang,
    raw: Lang,
    html: Lang,
    custom: Lang,
    get_block_contacts_messenger: ProfileContacts,
    messenger_main_page: MessengerPage,
    simple_list: SimpleList
};


