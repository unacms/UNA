import dynamic from 'next/dynamic';
import { DynamicFallback } from 'app/lib/dynamic-fallback';

// Each field type is its own chunk: fetched when a form renders it, and
// preloaded in the HTML when it was rendered during SSR (see lib/dynamic-fallback.js).
// Heavy ones (markdown editor, files, location, Stripe, phone codes, sliders)
// no longer reach pages without such a field.
const Captcha = dynamic(() => import('./captcha'), { loading: DynamicFallback });
const Custom = dynamic(() => import('./custom'), { loading: DynamicFallback });
const Hidden = dynamic(() => import('./hidden'), { loading: DynamicFallback });
const Password = dynamic(() => import('./password'), { loading: DynamicFallback });
const Submit = dynamic(() => import('./submit'), { loading: DynamicFallback });
const Switcher = dynamic(() => import('./switcher'), { loading: DynamicFallback });
const TextField = dynamic(() => import('./text'), { loading: DynamicFallback });
const Value = dynamic(() => import('./value'), { loading: DynamicFallback });
const Phone = dynamic(() => import('./phone'), { loading: DynamicFallback });
const TextTranslatable = dynamic(() => import('./text-translatable'), { loading: DynamicFallback });
const MarkdownTranslatable = dynamic(() => import('./markdown-translatable'), { loading: DynamicFallback });
const Editor = dynamic(() => import('./editor'), { loading: DynamicFallback });
const EditorMarkdown = dynamic(() => import('./editor-markdown'), { loading: DynamicFallback });
const Select = dynamic(() => import('./select'), { loading: DynamicFallback });
const Files = dynamic(() => import('./files'), { loading: DynamicFallback });
const Location = dynamic(() => import('./location'), { loading: DynamicFallback });
const Datetime = dynamic(() => import('./datetime'), { loading: DynamicFallback });
const Selector = dynamic(() => import('./selector'), { loading: DynamicFallback });
const BlockHeader = dynamic(() => import('./block-header'), { loading: DynamicFallback });
const BlockEnd = dynamic(() => import('./block-end'), { loading: DynamicFallback });
const Suggestion = dynamic(() => import('./suggestion'), { loading: DynamicFallback });
const InitialMembers = dynamic(() => import('./initial-members'), { loading: DynamicFallback });
const Labels = dynamic(() => import('./labels'), { loading: DynamicFallback });
const InputSet = dynamic(() => import('./input-set'), { loading: DynamicFallback });
const LocationRadius = dynamic(() => import('./location-radius'), { loading: DynamicFallback });
const DoubleRange = dynamic(() => import('./doublerange'), { loading: DynamicFallback });
const CheckboxSet = dynamic(() => import('./checkbox-set'), { loading: DynamicFallback });
const Visibility = dynamic(() => import('./visibility'), { loading: DynamicFallback });
const Stars = dynamic(() => import('./stars'), { loading: DynamicFallback });
const MultiField = dynamic(() => import('./multi-field'), { loading: DynamicFallback });
const Embed = dynamic(() => import('./embed'), { loading: DynamicFallback });
const Polls = dynamic(() => import('./polls'), { loading: DynamicFallback });
const StripeConnect = dynamic(() => import('./stripe-connect'), { loading: DynamicFallback });
const List = dynamic(() => import('./list'), { loading: DynamicFallback });
const Price = dynamic(() => import('./price'), { loading: DynamicFallback });

export const componentsMapDefault = {
    input_set: InputSet,
    stripe_connect: StripeConnect,
    visibility: Visibility,
    multi_field: MultiField,
    embed: Embed,
    editor: Editor,
    polls: Polls,
    initial_members: InitialMembers,
    captcha: Captcha,
    custom: Custom,
    mood: Stars,
    hidden: Hidden,
    password: Password,
    submit: Submit,
    button: Submit,
    switcher: Switcher,
    checkbox: Switcher,
    text: TextField,
    text_translatable: TextTranslatable,
    markdown_translatable: MarkdownTranslatable,
    phone: Phone,
    value: Value,
    price: Price,
    textarea: Editor,
    textarea_markdown: EditorMarkdown,
    markdown: EditorMarkdown,
    select: Select,
    select_multiple: Selector,
    radio_set: Select,
    files: Files,
    location: Location,
    selector: Selector,
    location_radius: LocationRadius,
    datetime: Datetime,
    datepicker: Datetime,
    suggestion: Suggestion,
    block_header: BlockHeader,
    block_end: BlockEnd,
    labels: Labels,
    doublerange: DoubleRange,
    checkbox_set: CheckboxSet,
    list: List
};
