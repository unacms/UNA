import dynamic from 'next/dynamic';
import { DynamicFallback } from 'app/lib/dynamic-fallback';

// Each form is its own chunk: fetched when a page renders it, and preloaded
// in the HTML when it was rendered during SSR (see lib/dynamic-fallback.js).
const FormComments = dynamic(() => import('./comments'), { loading: DynamicFallback });
const FormFeed = dynamic(() => import('./feed'), { loading: DynamicFallback });
const FormPost = dynamic(() => import('./post'), { loading: DynamicFallback });
const FormContent = dynamic(() => import('./content'), { loading: DynamicFallback });
const FormConfirmEmail = dynamic(() => import('./confirm-email'), { loading: DynamicFallback });
const Messenger = dynamic(() => import('./messenger'), { loading: DynamicFallback });
const FormBxPayment = dynamic(() => import('./bx-payment'), { loading: DynamicFallback });

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
