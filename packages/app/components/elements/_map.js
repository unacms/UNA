import Form from './form';
import Msg from './msg';
import Login from './login';
import Redirect from './redirect';
import EntityText from './entity_text';
import EntityPoll from './entity_poll';
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
import ProfileContacts from './contacts';
import SimpleList from './simple_list';
import Membership from './membership';
import Lang from './lang';
import Menu from './menu';
import InviteInContext from './invite_in_context';
import CommentContent from './comment_content';
import NotificationsSettings from './notifications_settings';

export { elementLazyLoaders } from './_map.lazy';

/** Sync element registry — keep feed, forms, entity blocks, and other hot paths here. */
export const componentsMapDefault = {
    invite_in_context: InviteInContext,
    membership: Membership,
    comment_content: CommentContent,
    form: Form,
    msg: Msg,
    login: Login,
    redirect: Redirect,
    entity_text: EntityText,
    entity_poll: EntityPoll,
    entity_author: EntityAuthor,
    entity_actions: EntityActions,
    entity_attachments: EntityAttachments,
    entity_info: EntityInfo,
    entity_cover: EntityCover,
    profile_menu: ProfileMenu,
    profile_switcher: ProfileSwitcher,
    feed_item: FeedItem,
    notifications_settings: NotificationsSettings,
    dashboard_stat: DashboardStat,
    categories_list: CategoriesList,
    lang: Lang,
    raw: Lang,
    html: Lang,
    custom: Lang,
    get_block_contacts_messenger: ProfileContacts,
    simple_list: SimpleList,
    menu: Menu,
};
