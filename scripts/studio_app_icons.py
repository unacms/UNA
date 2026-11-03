"""
Studio app icons from an animated icon set: copies each animated SVG over the Studio icon it replaces and makes it safe to put in
the page (studio/js/app_icons.js inlines an icon on hover so its animation can play).

An inline SVG's <style> is global and the page's CSS reaches into the SVG, so each file is made self-contained:
- every class inside the drawing gets the bx-ai- prefix, in the markup and in the file's own style (the set uses short names such
  as ring, inner, outer and spin; template/css/common.css, for one, spins any `svg .outer` forever);
- every id ends with the icon's key, like the rest of the set (the page may hold several icons).
The root keeps its `icon v-<key>` classes: the file's style plays the animation on `.icon:hover` and `.tile:hover .icon`.

Usage: python3 scripts/studio_app_icons.py <repo root> <set's animated folder>   (e.g. ~/Pictures/app-icons/simple/animated)
"""
import re
import sys
from pathlib import Path

ROOT = Path(sys.argv[1])
SOURCE = Path(sys.argv[2]).expanduser()
PREFIX = 'bx-ai-'

# set name => Studio icon, relative to studio/template/images/
ICONS = {
    # system apps
    'agents': 'icons/wi-agents.svg',
    'api': 'icons/wi-api.svg',
    'activity': 'icons/wi-audit.svg',
    'badges': 'icons/wi-badges.svg',
    'forms': 'icons/wi-bld-forms.svg',
    'navigation': 'icons/wi-bld-navigation.svg',
    'pages': 'icons/wi-bld-pages.svg',
    'permissions': 'icons/wi-bld-permissions.svg',
    'roles': 'icons/wi-bld-roles.svg',
    'dashboard': 'icons/wi-dashboard.svg',
    'designer': 'icons/wi-designer.svg',
    'una': 'icons/wi-home.svg',
    'polyglot': 'icons/wi-polyglot.svg',
    'settings': 'icons/wi-settings.svg',
    'storage': 'icons/wi-storages.svg',
    'extensions': 'icons/wi-store.svg',
    # modules, named after the module (BxDolStudioTemplate::_getModuleIcon)
    'accounts': 'modules/bx_accounts.svg',
    'paidlevels': 'modules/bx_acl.svg',
    'ads': 'modules/bx_ads.svg',
    'albums': 'modules/bx_albums.svg',
    'analytics': 'modules/bx_analytics.svg',
    'antispam': 'modules/bx_antispam.svg',
    'attendant': 'modules/bx_attendant.svg',
    'channels': 'modules/bx_channels.svg',
    'charts': 'modules/bx_charts.svg',
    'classes': 'modules/bx_classes.svg',
    'contact': 'modules/bx_contact.svg',
    'conversations': 'modules/bx_convos.svg',
    'courses': 'modules/bx_courses.svg',
    'credits': 'modules/bx_credits.svg',
    'developer': 'modules/bx_developer.svg',
    'donations': 'modules/bx_donations.svg',
    'events': 'modules/bx_events.svg',
    'files': 'modules/bx_files.svg',
    'discussions': 'modules/bx_forum.svg',
    'glossary': 'modules/bx_glossary.svg',
    'groups': 'modules/bx_groups.svg',
    'market': 'modules/bx_market.svg',
    'massmailer': 'modules/bx_massmailer.svg',
    'messenger': 'modules/bx_messenger.svg',
    'notifications': 'modules/bx_notifications.svg',
    'organizations': 'modules/bx_organizations.svg',
    'payments': 'modules/bx_payment.svg',
    'profile': 'modules/bx_persons.svg',
    'photos': 'modules/bx_photos.svg',
    'polls': 'modules/bx_polls.svg',
    'posts': 'modules/bx_posts.svg',
    'profiler': 'modules/bx_profiler.svg',
    'projects': 'modules/bx_projects.svg',
    'quotes': 'modules/bx_quoteofday.svg',
    'reputation': 'modules/bx_reputation.svg',
    'smtpmailer': 'modules/bx_smtp.svg',
    'spaces': 'modules/bx_spaces.svg',
    'streams': 'modules/bx_stream.svg',
    'tasks': 'modules/bx_tasks.svg',
    'timeline': 'modules/bx_timeline.svg',
    'video': 'modules/bx_videos.svg',
    'wiki': 'modules/bx_wiki.svg',
}


def own(svg: str) -> str:
    key = re.match(r'<svg class="icon v-([\w-]+)"', svg)
    if not key:
        raise SystemExit('not an animated icon: no class="icon v-<key>" on the root')
    key = key.group(1)

    # ids: suffix the ones that lack the key, with their references
    for sId in set(re.findall(r'\sid="([^"]+)"', svg)):
        if not sId.endswith('-' + key):
            svg = re.sub(r'(id="|#)' + re.escape(sId) + r'(?=["\')])', r'\g<1>' + sId + '-' + key, svg)

    # classes: every name below the root, in class attributes and in the style's selectors
    names = set()
    for attr in re.findall(r'(?<!<svg )class="([^"]+)"', svg):
        names.update(n for n in attr.split() if not n.startswith(PREFIX))
    names.discard('icon')
    names = {n for n in names if not n.startswith('v-')}

    def classes(m):
        return 'class="' + ' '.join(PREFIX + n if n in names else n for n in m.group(1).split()) + '"'
    head, rest = svg.split('>', 1)  # the root's own classes stay
    rest = re.sub(r'class="([^"]+)"', classes, rest)

    def style(m):
        return re.sub(r'\.(' + '|'.join(sorted(map(re.escape, names), key=len, reverse=True)) + r')(?![\w-])', '.' + PREFIX + r'\1', m.group(0))
    if names:
        rest = re.sub(r'<style>.*?</style>', style, rest, flags=re.S)

    return head + '>' + rest


def main() -> None:
    for name, target in ICONS.items():
        src = SOURCE / f'{name}.svg'
        if not src.exists():
            raise SystemExit(f'{src} is missing')
        (ROOT / 'studio/template/images' / target).write_text(own(src.read_text()))
    print(f'wrote {len(ICONS)} icons')


if __name__ == '__main__':
    main()
