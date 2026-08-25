import FormComments from './comments';
import FormFeed from './feed';
import FormPost from './post';
import FormContent from './content';
import FormConfirmEmail from './confirm-email';
import Messenger from './messenger';
import FormBxPayment from './bx-payment';

export const componentsMapDefault = {
    sys_confirm_email: FormConfirmEmail,
    comment: FormComments,
    feed: FormFeed,
    feed_edit: FormFeed,
    bx_posts: FormPost,
    bx_ads: FormContent,
    bx_albums: FormContent,
    bx_tasks: FormContent,
    bx_tasks_entry_add: FormContent,
    bx_forum: FormPost,
    bx_messenger: Messenger,
    bx_payment: FormBxPayment,
    bx_payment_form_processed_add: FormBxPayment,
};