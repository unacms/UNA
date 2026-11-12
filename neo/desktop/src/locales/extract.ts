/**
 * Reads the app's source for the words it shows: every `t('...')` and `tn(count, '...', '...')`
 * of lib/i18n.ts, the labels of lib/commands.json, and the native side's `tr("...")` and
 * `trn(n, "...", "...")` (src-tauri/src/i18n.rs). locales.test.ts checks each language's
 * file against the result; from neo/desktop,
 *
 *     node src/locales/extract.ts ru
 *
 * prints what `ru.json` lacks, as JSON with the English as each value, ready to translate, and
 * (on stderr) the keys it has that nothing uses.
 *
 *     node src/locales/extract.ts --untranslated features/tasks
 *
 * lists English still written straight into what is drawn (`untranslatedIn`).
 */
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import ts from 'typescript';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');

export type Extracted = {
    /** key (the English, plus `_context` where one is given) → the English */
    plain: Map<string, string>;
    /** the singular English (the key) → the plural English */
    plural: Map<string, string>;
    /** calls the reader cannot follow: `file:line what` */
    problems: string[];
};

function sourceFiles(dir: string, out: string[] = []): string[] {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
        const path = join(dir, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== 'locales') sourceFiles(path, out);
        } else if (/\.tsx?$/.test(entry.name) && !/\.test\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
            out.push(path);
        }
    }
    return out;
}

function literal(node: ts.Node | undefined): string | null {
    return node && (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) ? node.text : null;
}

/** The names `t` and `tn` have in a file (`import { t as tr } from '.../i18n'`). */
function importedNames(file: ts.SourceFile): { t: Set<string>; tn: Set<string> } {
    const names = { t: new Set<string>(), tn: new Set<string>() };
    for (const statement of file.statements) {
        if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
        if (!/(^|\/)i18n$/.test(statement.moduleSpecifier.text)) continue;
        const bindings = statement.importClause?.namedBindings;
        if (!bindings || !ts.isNamedImports(bindings)) continue;
        for (const el of bindings.elements) {
            const imported = (el.propertyName ?? el.name).text;
            if (imported === 't') names.t.add(el.name.text);
            if (imported === 'tn') names.tn.add(el.name.text);
        }
    }
    return names;
}

/** `{ context: 'verb' }` in a call's variables: the context, null without one, undefined when it is not a literal. */
function contextOf(vars: ts.Expression | undefined): string | null | undefined {
    if (!vars) return null;
    if (!ts.isObjectLiteralExpression(vars)) return undefined;
    for (const prop of vars.properties) {
        if (ts.isSpreadAssignment(prop)) return undefined;
        const name = prop.name && (ts.isIdentifier(prop.name) || ts.isStringLiteral(prop.name)) ? prop.name.text : null;
        if (name !== 'context') continue;
        return ts.isPropertyAssignment(prop) ? (literal(prop.initializer) ?? undefined) : undefined;
    }
    return null;
}

export function extractFrom(path: string, text: string, into: Extracted): void {
    const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, path.endsWith('x') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
    const names = importedNames(file);
    if (!names.t.size && !names.tn.size) return;
    const where = (node: ts.Node) => `${relative(SRC, path)}:${file.getLineAndCharacterOfPosition(node.getStart()).line + 1}`;
    const visit = (node: ts.Node): void => {
        if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
            const name = node.expression.text;
            if (names.t.has(name)) {
                const english = literal(node.arguments[0]);
                const context = contextOf(node.arguments[1]);
                if (english === null) into.problems.push(`${where(node)} t() takes the English as a literal`);
                else if (context === undefined) into.problems.push(`${where(node)} t() takes its variables as an object literal, with a literal context`);
                else into.plain.set(context ? `${english}_${context}` : english, english);
            } else if (names.tn.has(name)) {
                const one = literal(node.arguments[1]);
                const other = literal(node.arguments[2]);
                if (one === null || other === null) into.problems.push(`${where(node)} tn() takes both English forms as literals`);
                else if (into.plural.has(one) && into.plural.get(one) !== other) into.problems.push(`${where(node)} tn('${one}') has another plural elsewhere`);
                else into.plural.set(one, other);
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(file);
}

const RUST_STRING = String.raw`"((?:[^"\\]|\\.)*)"`;
const RUST_TR = new RegExp(String.raw`\btr(?:_vars)?\(\s*` + RUST_STRING, 'g');
const RUST_TRN = new RegExp(String.raw`\btrn\(\s*[^,()]+(?:\([^()]*\))?[^,()]*,\s*` + RUST_STRING + String.raw`\s*,\s*` + RUST_STRING, 'g');
/** `tr(` or `trn(` followed by something else than a literal (the definitions and `tr_command` aside). */
const RUST_NOT_LITERAL = /\b(tr|tr_vars)\(\s*(?!")[^)\s]/g;

function rustText(literal: string): string {
    return literal.replace(/\\(.)/g, (_, c: string) => (c === 'n' ? '\n' : c === 't' ? '\t' : c));
}

/**
 * The native side's words (src-tauri/src/i18n.rs): `tr("...")`, `tr_vars("...", ...)` and
 * `trn(n, "...", "...")`. Test modules are left out: they follow the code in each file.
 */
export function extractFromRust(path: string, text: string, into: Extracted): void {
    if (path.endsWith('i18n.rs')) return;
    // comments are blanked, not removed, so line numbers hold
    const code = (text.split(/^#\[cfg\(test\)\]\s*\n\s*mod tests\b/m)[0] ?? '').replace(/^\s*\/\/.*$/gm, '');
    const where = (index: number) => `${relative(SRC, path)}:${code.slice(0, index).split('\n').length}`;
    for (const m of code.matchAll(RUST_TR)) {
        const english = rustText(m[1] ?? '');
        into.plain.set(english, english);
    }
    for (const m of code.matchAll(RUST_TRN)) {
        const one = rustText(m[1] ?? '');
        const other = rustText(m[2] ?? '');
        if (into.plural.has(one) && into.plural.get(one) !== other) into.problems.push(`${where(m.index)} trn("${one}") has another plural elsewhere`);
        else into.plural.set(one, other);
    }
    for (const m of code.matchAll(RUST_NOT_LITERAL)) into.problems.push(`${where(m.index)} ${m[1]}() takes the English as a literal`);
}

/** Everything the app says. */
export function extract(): Extracted {
    const into: Extracted = { plain: new Map(), plural: new Map(), problems: [] };
    for (const path of sourceFiles(SRC)) extractFrom(path, readFileSync(path, 'utf8'), into);
    const rust = join(SRC, '..', 'src-tauri', 'src');
    for (const name of readdirSync(rust)) if (name.endsWith('.rs')) extractFromRust(join(rust, name), readFileSync(join(rust, name), 'utf8'), into);
    // the commands' names and what they do: the palette, the shortcuts list and the native menu
    const commands = JSON.parse(readFileSync(join(SRC, 'lib', 'commands.json'), 'utf8')) as { commands: { label: string; help?: string }[] };
    for (const c of commands.commands) {
        into.plain.set(c.label, c.label);
        if (c.help) into.plain.set(c.help, c.help);
    }
    for (const key of into.plural.keys()) if (into.plain.has(key)) into.problems.push(`'${key}' is used with t() and with tn()`);
    return into;
}

/** Attributes whose value a person reads or hears. */
const SPOKEN = new Set(['aria-label', 'aria-description', 'aria-roledescription', 'aria-valuetext', 'aria-placeholder', 'title', 'placeholder', 'alt', 'label']);
const WORD = /\p{L}{2,}/u;

/**
 * English written straight into what is drawn, where `t()` should say it: text between tags,
 * and literals in the attributes people read or hear. `file:line text`. A line with the comment
 * `i18n-ok` is left alone (a name, a key cap, a unit).
 */
export function untranslatedIn(path: string, text: string): string[] {
    if (!path.endsWith('.tsx')) return [];
    const file = ts.createSourceFile(path, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    const lines = text.split('\n');
    const found: string[] = [];
    const report = (node: ts.Node, words: string) => {
        const line = file.getLineAndCharacterOfPosition(node.getStart()).line;
        if ((lines[line] ?? '').includes('i18n-ok') || (lines[line - 1] ?? '').includes('i18n-ok')) return;
        found.push(`${relative(SRC, path)}:${line + 1} ${words.trim().replace(/\s+/g, ' ').slice(0, 70)}`);
    };
    /** Literals an expression may come to: 'a', `a`, cond ? 'a' : b, a || 'b'. */
    const literals = (node: ts.Expression): ts.Node[] => {
        if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return [node];
        if (ts.isTemplateExpression(node)) return WORD.test(node.head.text + node.templateSpans.map((span) => span.literal.text).join('')) ? [node] : [];
        if (ts.isParenthesizedExpression(node)) return literals(node.expression);
        if (ts.isConditionalExpression(node)) return [...literals(node.whenTrue), ...literals(node.whenFalse)];
        if (ts.isBinaryExpression(node) && [ts.SyntaxKind.BarBarToken, ts.SyntaxKind.QuestionQuestionToken, ts.SyntaxKind.AmpersandAmpersandToken].includes(node.operatorToken.kind)) return [...literals(node.left), ...literals(node.right)];
        return [];
    };
    const check = (node: ts.Expression) => {
        for (const lit of literals(node)) {
            const words = ts.isTemplateExpression(lit) ? lit.getText() : (lit as ts.StringLiteral).text;
            if (WORD.test(words)) report(lit, words);
        }
    };
    const visit = (node: ts.Node): void => {
        if (ts.isJsxText(node) && WORD.test(node.text)) report(node, node.text);
        else if (ts.isJsxExpression(node) && node.expression && (ts.isJsxElement(node.parent) || ts.isJsxFragment(node.parent))) check(node.expression);
        else if (ts.isJsxAttribute(node) && ts.isIdentifier(node.name) && SPOKEN.has(node.name.text) && node.initializer) {
            if (ts.isStringLiteral(node.initializer)) check(node.initializer);
            else if (ts.isJsxExpression(node.initializer) && node.initializer.expression) check(node.initializer.expression);
        }
        ts.forEachChild(node, visit);
    };
    visit(file);
    return found;
}

/** Every such place in the app. */
export function untranslated(): string[] {
    return sourceFiles(SRC).flatMap((path) => untranslatedIn(path, readFileSync(path, 'utf8')));
}

/** The count forms a language has (`one`, `few`, `many`, `other` for Russian). */
export function pluralForms(language: string): string[] {
    return new Intl.PluralRules(language).resolvedOptions().pluralCategories;
}

/** The keys a language's file must have, each with the English it stands for. */
export function expectedKeys(extracted: Extracted, language: string): Map<string, string> {
    const keys = new Map(extracted.plain);
    for (const [one, other] of extracted.plural) for (const form of pluralForms(language)) keys.set(`${one}_${form}`, form === 'one' ? one : other);
    return keys;
}

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g;
const MARK = /<\/?([a-z][a-z0-9]*)>/g;

/** The order of a bare sort(): the same in every locale, so two texts' slots compare as lists. */
function byCodeUnit(a: string, b: string): number {
    return a < b ? -1 : a > b ? 1 : 0;
}

/**
 * The file of a language named on the command line: a language tag (`ru`, `pt-BR`) and nothing
 * else, so the name can't lead out of src/locales.
 */
export function localeFile(language: string): string {
    if (!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(language)) throw new Error(`not a language: ${language}`);
    const folder = resolve(SRC, 'locales');
    const file = resolve(folder, `${language}.json`);
    if (!file.startsWith(folder + sep) || dirname(file) !== folder) throw new Error(`not a language: ${language}`);
    return file;
}

/** What varies in a text: its `{{names}}` and its `<marks>`. */
export function slots(text: string): { vars: string[]; marks: string[] } {
    return {
        vars: [...new Set([...text.matchAll(PLACEHOLDER)].map((m) => m[1] ?? ''))].sort(byCodeUnit),
        marks: [...new Set([...text.matchAll(MARK)].map((m) => m[1] ?? ''))].sort(byCodeUnit),
    };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
    const language = process.argv[2];
    const extracted = extract();
    for (const p of extracted.problems) console.error(p);
    if (language === '--untranslated') {
        // node src/locales/extract.ts --untranslated [folder or file under src, e.g. features/tasks]
        const under = process.argv[3] ?? '';
        const found = untranslated().filter((line) => line.startsWith(under));
        for (const line of found) console.log(line);
        console.error(`${found.length} left`);
    } else if (!language) {
        console.log(JSON.stringify({ plain: extracted.plain.size, plural: extracted.plural.size, problems: extracted.problems.length }));
    } else {
        const have = JSON.parse(readFileSync(localeFile(language), 'utf8')) as Record<string, string>;
        const expected = expectedKeys(extracted, language);
        const missing: Record<string, string> = {};
        for (const [key, english] of expected) if (!(key in have)) missing[key] = english;
        for (const key of Object.keys(have)) if (!expected.has(key)) console.error(`unused: ${key}`);
        console.log(JSON.stringify(missing, null, 4));
    }
}
