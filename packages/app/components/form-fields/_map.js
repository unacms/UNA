import Captcha from './captcha';
import Custom from './custom';
import Hidden from './hidden';
import Password from './password';
import Submit from './submit';
import Switcher from './switcher';
import TextField from './text';
import Editor from './editor';
import Select from './select';
import Files from './files';
import Location from './location';
import Datetime from './datetime';
import Selector from './selector';
import BlockHeader from './block_header';
import BlockEnd from './block_end';
import Suggestion from './suggestion';
import InitialMembers from './initial_members';
import Labels from './labels';
import InputSet from './input_set';
import LocationRadius from './location_radius';
import DoubleRange from './doublerange';
import CheckboxSet from './checkbox_set';
import Visibility from './visibility';
import Stars from './stars';
import MultiField from './multi_field';
import Embed from './embed';
import Polls from './polls';
import StripeConnect from './stripe_connect';
import List from './list';

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
    phone: TextField,
    value: TextField,
    price: TextField,
    textarea: Editor,
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
