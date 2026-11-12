import { t, tn } from '../../lib/i18n';
import { Avatar } from '../avatar';
import type { HashtagSuggestion, ProfileSuggestion } from './suggestions';

export type SuggestionItem = { kind: 'profile'; profile: ProfileSuggestion } | { kind: 'tag'; tag: HashtagSuggestion };

/**
 * People or hashtags for the `@` or `#` being typed: a listbox the text box points to
 * (aria-controls, aria-activedescendant), so focus stays in the text while the arrows move
 * through it. A click picks one; the pointer never takes focus from the text.
 */
export function SuggestionList({ id, items, active, char, onPick, onHover, position }: { id: string; items: SuggestionItem[]; active: number; char: '@' | '#'; onPick: (item: SuggestionItem) => void; onHover: (i: number) => void; position: { left: number; top: number } | null }) {
    return (
        <ul id={id} className="rich-suggestions" role="listbox" aria-label={char === '@' ? t('People to mention') : t('Hashtags')} style={position ? { left: position.left, top: position.top } : undefined}>
            {items.map((item, i) => (
                <li
                    key={item.kind === 'profile' ? `p${item.profile.id}` : `t${item.tag.tag}`}
                    id={`${id}-opt-${i}`}
                    role="option"
                    aria-selected={i === active}
                    className="rich-suggestion"
                    onMouseDown={(e) => e.preventDefault()}
                    onMouseEnter={() => onHover(i)}
                    onClick={() => onPick(item)}
                    // focus stays in the text, whose keys move through the list and pick; this is
                    // for assistive technology that sends the key to the option itself
                    onKeyDown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        onPick(item);
                    }}
                >
                    {item.kind === 'profile' ? (
                        <>
                            <Avatar profile={item.profile} size={24} />
                            <span className="rich-suggestion-name">{item.profile.display_name}</span>
                            {item.profile.handle ? <span className="rich-suggestion-meta">@{item.profile.handle}</span> : null}
                        </>
                    ) : (
                        <>
                            <span className="rich-suggestion-name">#{item.tag.tag}</span>
                            {item.tag.count ? <span className="rich-suggestion-meta">{tn(item.tag.count, '{{count}} posts', '{{count}} posts')}</span> : null}
                        </>
                    )}
                </li>
            ))}
        </ul>
    );
}
