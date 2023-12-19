import Captcha from './captcha';
import Custom from './custom';
import Hidden from './hidden';
import Password from './password';
import Submit from './submit';
import Switcher from './switcher';
import TextField from './text';
import Textarea from './textarea';
import Select from './select';
import Files from './files';
import Location from './location';
import Datetime from './dattime';
import BlockHeader from './block_header';
import Suggestion from './suggestion';
import Labels from './labels';
import InputSet from './input_set';
import LocationRadius from './location_radius';

export const componentsMapDefault = {
    input_set: InputSet,
    captcha: Captcha,
    custom: Custom,
    hidden: Hidden,
    password: Password,
    submit: Submit,
    switcher: Switcher,
    checkbox: Switcher,
    text: TextField,
    textarea: Textarea,
    select: Select,
    radio_set: Select,
    files: Files,
    location: Location,
    location_radius: LocationRadius,
    datetime: Datetime,
    datepicker: Datetime,
    suggestion: Suggestion,
    block_header: BlockHeader,
    labels: Labels
};
