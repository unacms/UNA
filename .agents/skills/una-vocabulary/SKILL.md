---
name: una-vocabulary
description: The words and style UNA uses in English strings that members and admins see (People, Sign in, Sign up, Members, Chats, Memberships, sentence case, "0 = no limit"), and the legacy internal names (bx_, Dol, BoonEx-era abbreviations) that stay as they are. Use when writing or changing an English language string, a menu, page or option caption, an email subject, or a page URI, or when tempted to rename a bx_ identifier.
---

# UNA vocabulary

These rules apply to English strings: module, page, block and menu titles, option captions, form errors and email subjects. Russian and other translations follow their own language's conventions. A display name never changes an internal ID: `bx_persons` stays `bx_persons` when its title says "People".

## Words

| Concept | Use | Not |
|---|---|---|
| The Persons module and its profiles | **People**; one **person** or **profile** | Persons |
| Entering and leaving an account | **Sign in**, **Sign out** (verbs and button labels) | Log in, Login, Log out, Logout |
| Creating an account | **Sign up** | Join, Register |
| Becoming part of a group, event, space or course | **Join** | Sign up |
| People in a group, event, space or organization | **Members** | Fans |
| A group, event, space or other container, shown to members | Its type: **group**, **event**, **space**, **course**; **community** when the string can't know the type | context |
| The Timeline module | **Timeline**; its pages may say **feed** ("Hot feed") | |
| Messenger's conversations | **Chats** | Talks |
| The Convos module | **Private messages** | Convos, Conversations |
| Paid Levels (ACL) module | **Memberships** | Paid Levels, ACL |
| Mass Mailer module | **Email campaigns** | Mass mailer |
| Email | **email** | e-mail, E-Mail |

"Context" is fine in Studio text for site admins, in code and in language keys.

## Style

- **Sentence case** for titles, menu items, buttons and captions: "Add photo", "Edit album", "Start conversation". Proper names and product names keep their capitals: "Share on Facebook", "Google Connect".
- **Required fields:** "Title is required." Never "is essential" or "Mandatory".
- **"Please"** takes no comma: "Please fill in this field."
- **"cannot"**, one word.
- **Zero and units in option captions:** "Maximum results (0 = no limit)", "Session length, minutes". Not "(0 - no limit)", "(in min)", "(0 for unlimited)".
- **"Maximum"**, not "Max number of". Count things by what they are: "Maximum files per message", not "Max files number to send".
- **Verb + noun** for actions: "Allow following without joining", "Approve new posts automatically". Not "Allow to …", "Enable possibility to …", "Auto approve a post after creation".
- No full stop at the end of titles, buttons, captions or email subjects. Sentences in messages end with one.
- Plain English for errors: say what went wrong and how to fix it.

## Names that stay as they are

These are stored in every site's database, in members' content, in signed URLs, in shipped app builds or in Market modules. Do not rename them, and do not add new names in their style either:

- module names and table prefixes: `bx_persons`, `bx_posts_posts`;
- object names: storage, transcoder, comments, votes, menus, pages and forms;
- option names (`getParam`) and alert units;
- language keys, including prefixes such as `_bx_orgs_`, `_bx_cnv_`, `_bx_ntfs_`;
- PHP classes `BxDol*`, `BxBase*`, `BxTempl*` and module class prefixes;
- `bx_*` functions, `BX_*` constants and `defined('BX_DOL')`;
- `bx-*` CSS classes and `--bx-*` variables, `<bx_if>` and other template tags;
- `modules/boonex/`, and session cookies (`memberSession` …).

The abbreviations are legacy and fixed: `cmts` comments, `ntfs` notifications, `std` Studio, `pgt` Polyglot, `acl` access levels, `dol` from Dolphin; Messenger's `jot` is a message and `lot` a conversation.

## Changing existing wording

1. Edit the string in the language's install file (`modules/boonex/english/data/langs/system/en.xml` or the module's `install/langs/en.xml`).
2. Add a `string_upd` migration (see `migrations/README.md`): `migrations/` for system strings, the module's `migrations/` folder for module strings.
3. When the meaning changes, update the Russian string too, in `modules/boonex/russian/migrations/` with `category` set to the module's language category.
4. A page URI changes through `sys_seo_uri_rewrites`, so the old URI keeps working. Never edit `sys_objects_page.uri`.
5. Search `tests/` and `neo/` for the old text before you change it.

New keys go through the `language-keys` skill.
