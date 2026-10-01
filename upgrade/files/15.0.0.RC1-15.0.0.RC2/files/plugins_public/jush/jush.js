// @generated from modules/*.js
/** JUSH - JavaScript Syntax Highlighter
* @link https://jush.sourceforge.io/
* @author Jakub Vrana, https://www.vrana.cz
* @copyright 2007 Jakub Vrana
* @license https://www.apache.org/licenses/LICENSE-2.0 Apache License, Version 2.0
*/

/* Limitations:
<style> and <script> supposes CDATA or HTML comments
unnecessary escaping (e.g. echo "\'" or ='&quot;') is removed
*/

// eslint-disable-next-line no-var -- var (not const) - consumers such as Adminer check window.jush
var jush = {
	create_links: true, // string for extra <a> parameters, e.g. 'target="_blank"'
	timeout: 1000, // milliseconds
	custom_links: { }, // { state: { url: regexp } }, for example { php : { 'doc/$&.html': /\b(getData|setData)\b/g } }
	api: { }, // { state: { function: description } }, for example { php: { array: 'Create an array' } }

	php: /<\?(?!xml)(?:php)?|<script\s+language\s*=\s*(?:"php"|'php'|php)\s*>/i, // asp_tags=0, short_open_tag=1
	num: /(?:0x[0-9a-f]+)|(?:\b[0-9]+\.?[0-9]*|\.[0-9]+)(?:e[+-]?[0-9]+)?/i,
	embedded: /^(att_js|att_css|att_http|css_js|js_write_code|js_http_code|php_php|php_sql|php_sqlite|php_pgsql|php_mssql|php_oracle|php_echo|php_phpini|php_http|php_mail)$/, // states embedding another language
	autocompleting: { sql: [ ] }, // autocompleter => states it completes in, filled by the modules; a language without a module can be added by the consumer

	regexps: undefined,
	subpatterns: { },

	/** Link stylesheet
	* @param {string} href
	* @param {string} [media]
	*/
	style: function (href, media) {
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		if (media) {
			link.media = media;
		}
		link.href = href;
		document.getElementsByTagName('head')[0].appendChild(link);
	},

	/** Highlight text
	* @param {string} language
	* @param {string} text
	* @return {string}
	*/
	highlight: function (language, text) {
		this.last_tag = '';
		this.last_class = '';
		return '<span class="jush">' + this.highlight_states([ language ], text.replace(/\r\n?/g, '\n'), !/^(htm|tag|xml|txt)$/.test(language))[0] + '</span>';
	},

	/** Highlight html
	* @param {string} language
	* @param {string} html
	* @return {string}
	*/
	highlight_html: function (language, html) {
		const original = html.replace(/<br(\s+[^>]*)?>/gi, '\n');
		let highlighted = jush.highlight(language, jush.html_entity_decode(original.replace(/<[^>]*>/g, '')));

		const inject = { };
		let pos = 0;
		let last_offset = 0;
		original.replace(/(&[^;]+;)|(?:<[^>]+>)+/g, (str, entity, offset) => {
			pos += (offset - last_offset) + (entity ? 1 : 0);
			if (!entity) {
				inject[pos] = str;
			}
			last_offset = offset + str.length;
		});

		pos = 0;
		highlighted = highlighted.replace(/([^&<]*)(?:(&[^;]+;)|(?:<[^>]+>)+|$)/g, (str, text, entity) => {
			for (let i = text.length; i >= 0; i--) {
				let tags = inject[pos + i];
				if (tags) {
					delete inject[pos + i];
					if (str[i] == '<') { // the closing tags go before the tags of the highlighted code, the rest after them to nest properly
						[, tags, inject[pos + i]] = /^((?:<\/[^>]+>)*)([\s\S]*)/.exec(tags);
					}
					str = str.slice(0, i) + tags + str.slice(i);
				}
			}
			pos += text.length + (entity ? 1 : 0);
			return str;
		});
		return highlighted;
	},

	/** Highlight text in tags
	* @param {string|HTMLElement[]} tag
	* @param {number} [tab_width=4] number of spaces for tab, 0 for tab itself
	*/
	highlight_tag: function (tag, tab_width = 4) {
		const pre = (typeof tag == 'string' ? [...document.getElementsByTagName(tag)] : tag);
		const tab = ' '.repeat(tab_width);
		let i = 0;
		const highlight = () => {
			const start = Date.now();
			while (i < pre.length) {
				const match = /(^|\s)(?:jush|language(?=-\S))($|\s|-(\S+))/.exec(pre[i].className); // https://www.w3.org/TR/html5/text-level-semantics.html#the-code-element
				if (match) {
					const language = match[3] ? match[3] : 'htm';
					pre[i].innerHTML = '<span class="jush"><span class="jush-' + language + '">' + jush.highlight_html(language, pre[i].innerHTML.replace(/\t/g, tab.length ? tab : '\t')) + '</span></span>'; // span - enable style for class="language-"
				}
				i++;
				if (jush.timeout && window.setTimeout && (Date.now() - start) > jush.timeout) {
					window.setTimeout(highlight, 100);
					break;
				}
			}
		};
		highlight();
	},

	link_manual: function (language, text) {
		const code = document.createElement('code');
		code.innerHTML = this.highlight(language, text);
		for (const a of code.getElementsByTagName('a')) {
			if (a.href) {
				return a.href;
			}
		}
		return '';
	},

	create_link: function (link, s, attrs) {
		return '<a'
			+ (this.create_links && link ? ' href="' + link + '" class="jush-help"' : '')
			+ (typeof this.create_links == 'string' ? ' ' + this.create_links.replace(/^\s+/, '') : '')
			+ (attrs || '')
			+ '>' + s + '</a>'
		;
	},

	keywords_links: function (state, s, next) {
		if (/^js(_write|_code)+$/.test(state)) {
			state = 'js';
		}
		if (/^(php_quo_var|php_php|php_sql|php_sqlite|php_pgsql|php_mssql|php_oracle|php_echo|php_phpini|php_http|php_mail)$/.test(state)) {
			state = 'php2';
		}
		if (state == 'sql_code' || state == 'pgsql_code') {
			state = state.slice(0, -5); // the body of a statement is linked as the language itself
		}
		if (this.links2 && this.links2[state]) {
			const url = this.urls[state];
			const links2 = this.links2[state];
			const link_key = this.link_key[state];
			const slug = this.slugs[state];
			s = s.replace(links2, function (str, match1) {
				for (let i=arguments.length - 4; i > 1; i--) {
					if (arguments[i]) {
						let key = url[i-1];
						let prefix = ''; // groups of the same path before the linked text, e.g. the dot in .at
						for (let j=i - 1; j > 1 && url[j-1] == url[i-1]; j--) {
							prefix = (arguments[j] || '') + prefix;
						}
						prefix = (match1 ? match1 : '') + prefix;
						if (link_key) {
							key = link_key(key, url, arguments[i]);
							if (key == '-') { // the other vendor doesn't know this phrase, it may still know its beginning
								const last_word = arguments[i].search(/\s+\S*$/);
								if (last_word < 0) {
									return str;
								}
								return prefix
									+ jush.keywords_links(state, arguments[i].substring(0, last_word))
									+ arguments[i].substring(last_word)
									+ (arguments[arguments.length - 3] ? arguments[arguments.length - 3] : '')
								;
							}
						}
						let link = (/^https?:/.test(key) || !key ? key : url[0].replace(/\$key/g, key));
						link = (slug ? link.replace(/\$1/g, slug(arguments[i], key, url)) : link.replace(/\$1/g, arguments[i]).replace(/\\/g, '-'));
						let title = '';
						if (jush.api[state]) {
							title = jush.api[state][(state == 'js' ? arguments[i] : arguments[i].toLowerCase())];
						}
						return prefix + jush.create_link(link, arguments[i], (title ? ' title="' + jush.htmlspecialchars_quo(title) + '"' : '')) + (arguments[arguments.length - 3] ? arguments[arguments.length - 3] : '');
					}
				}
			});
		}
		if (this.custom_links[state]) {
			if (Array.isArray(this.custom_links[state])) { // backwards compatibility
				const url = this.custom_links[state][0];
				const re = this.custom_links[state][1];
				this.custom_links[state] = {};
				this.custom_links[state][url] = re;
			}
			next = next || '';
			const append = this.htmlspecialchars(next || ''); // lookahead context, e.g. '"(' following a quoted routine name
			s += append;
			for (const url in this.custom_links[state]) {
				s = s.replace(this.custom_links[state][url], function (str) {
					const offset = arguments[arguments.length - 2];
					if (offset + str.length > s.length - append.length || /<[^>]*$/.test(s.slice(0, offset)) || /^[^<]*<\/a>/.test(s.slice(offset))) {
						return str; // don't create links inside tags or in the appended context
					}
					return '<a href="' + jush.htmlspecialchars_quo(url.replace('$&', encodeURIComponent(str))) + '" class="jush-custom">' + str + '</a>' // not create_link() - ignores create_links
				});
			}
			s = s.substring(0, s.length - append.length);
		}
		return s;
	},

	/** Count capturing subpatterns in a regular expression source
	* @param {string} source
	* @return {number}
	*/
	count_subpatterns: function (source) {
		let in_bra = false;
		let count = 0;
		source.replace(/\\.|\[|]|\((?!\?)/g, str => {
			if (str == (in_bra ? ']' : '[')) {
				in_bra = !in_bra;
			}
			if (str == '(' && !in_bra) { // ( is literal inside []
				count++;
			}
			return str;
		});
		return count;
	},

	build_regexp: function (key, tr1) {
		const re = [ ];
		const subpatterns = [ '' ];
		for (const k in tr1) {
			let in_bra = false;
			for (let i = this.count_subpatterns(tr1[k].source) + 1; i--; ) { // + 1 for the () wrapping the whole subpattern
				subpatterns.push(k);
			}
			const s = tr1[k].source.replace(/\\.|\[|]|([a-z])(?:-([a-z]))?/gi, (str, match1, match2) => {
				if (str == (in_bra ? ']' : '[')) {
					in_bra = !in_bra;
				}
				if (match1 && tr1[k].ignoreCase) {
					if (in_bra) {
						return str.toLowerCase() + str.toUpperCase();
					}
					return '[' + match1.toLowerCase() + match1.toUpperCase() + ']' + (match2 ? '-[' + match2.toLowerCase() + match2.toUpperCase() + ']' : '');
				}
				return str;
			});
			re.push('(' + s + ')');
		}
		this.subpatterns[key] = subpatterns;
		this.regexps[key] = new RegExp(re.join('|'), 'g');
	},

	build_links2: function (key, url, prefix, suffix, paths) {
		this.urls[key] = [url];
		const regexps = [];
		for (const path in paths) {
			for (let i = this.count_subpatterns(paths[path].source); i--; ) { // a path may capture a prefix before the linked text, e.g. the dot in .at
				this.urls[key].push(path);
			}
			regexps.push(paths[path].source);
		}
		this.links2[key] = new RegExp(prefix.source + '(?:' + regexps.join('|') + ')' + suffix.source, suffix.flags);
	},

	highlight_states: function (states, text, in_php, escape) {
		this.regexps = this.regexps || { };
		for (const key in this.tr) {
			if (this.regexps[key]) {
				this.regexps[key].lastIndex = 0;
			} else { // also a state of a module loaded after the first highlighting
				this.build_regexp(key, this.tr[key]);
			}
		}
		let state = states[states.length - 1];
		if (!Object.keys(this.tr[state] || {}).length) {
			return [ this.htmlspecialchars(text), states ];
		}
		const ret = [ ]; // return
		for (let i=1; i < states.length; i++) {
			ret.push('<span class="jush-' + states[i] + '">');
		}
		let match;
		let child_states = [ ];
		let s_states;
		let start = 0;
		while (start < text.length && (match = this.regexps[state].exec(text))) {
			if (states[0] != 'htm' && /^<\/(script|style)>$/i.test(match[0])) {
				continue;
			}
			let key;
			const m = [ ];
			for (let i = match.length; i--; ) {
				if (match[i] || !match[0].length) { // WScript returns empty string even for non matched subexpressions
					key = this.subpatterns[state][i];
					while (this.subpatterns[state][i - 1] == key) {
						i--;
					}
					while (this.subpatterns[state][i] == key) {
						m.push(match[i]);
						i++;
					}
					break;
				}
			}
			if (!key) {
				return [ 'regexp not found', [ ] ];
			}

			if (in_php && key == 'php') {
				continue;
			}
			//~ console.log(states + ' (' + key + '): ' + text.substring(start).replace(/\n/g, '\\n'));
			const out = (key.charAt(0) == '_');
			const division = match.index + (key == 'php_halt2' ? match[0].length : 0);
			let s = text.substring(start, division);

			// highlight children
			let prev_state = states[states.length - 2];
			if (/^(att_quo|att_apo|att_val)$/.test(state) && (/^(att_js|att_css|att_http)$/.test(prev_state) || /^\s*javascript:/i.test(s))) { // javascript: - easy but without own state //! should be checked only in %URI;
				child_states.unshift(prev_state == 'att_css' ? 'css_pro' : (prev_state == 'att_http' ? 'http' : 'js'));
				s_states = this.highlight_states(child_states, this.html_entity_decode(s), true, (state == 'att_apo' ? this.htmlspecialchars_apo : (state == 'att_quo' ? this.htmlspecialchars_quo : this.htmlspecialchars_quo_apo)));
			} else if (state == 'css_js' || state == 'cnf_http' || state == 'cnf_phpini' || state == 'sql_sqlset' || state == 'sqlite_sqliteset' || state == 'pgsql_pgsqlset' || state == 'pgsql_pgsqlext') {
				child_states.unshift(state.replace(/^[^_]+_/, ''));
				s_states = this.highlight_states(child_states, s, true);
			} else if (state == 'pgsql_eot2' && this.pgsql_body) {
				child_states = [ 'pgsql' ]; // the body is self-contained, do not carry states in or out
				s_states = this.highlight_states(child_states, s, true, escape);
			} else if ((state == 'php_quo' || state == 'php_apo') && /^(php_php|php_sql|php_sqlite|php_pgsql|php_mssql|php_oracle|php_phpini|php_http|php_mail)$/.test(prev_state)) {
				child_states.unshift(prev_state.slice(4));
				s_states = this.highlight_states(child_states, this.stripslashes(s), true, (state == 'php_apo' ? this.addslashes_apo : this.addslashes_quo));
			} else if (key == 'php_halt2') {
				child_states.unshift('htm');
				s_states = this.highlight_states(child_states, s, true);
			} else if ((state == 'apo' || state == 'quo') && prev_state == 'js_write_code') {
				child_states.unshift('htm');
				s_states = this.highlight_states(child_states, s, true);
			} else if ((state == 'apo' || state == 'quo') && prev_state == 'js_http_code') {
				child_states.unshift('http');
				s_states = this.highlight_states(child_states, s, true);
			} else if (((state == 'php_quo' || state == 'php_apo') && prev_state == 'php_echo') || (state == 'php_eot2' && states[states.length - 3] == 'php_echo')) {
				let i; // read after the loop
				for (i=states.length; i--; ) {
					prev_state = states[i];
					if (prev_state.substring(0, 3) != 'php' && prev_state != 'att_quo' && prev_state != 'att_apo' && prev_state != 'att_val') {
						break;
					}
					prev_state = '';
				}
				const f = (state == 'php_eot2' ? this.addslashes : (state == 'php_apo' ? this.addslashes_apo : this.addslashes_quo));
				s = this.stripslashes(s);
				if (/^(att_js|att_css|att_http)$/.test(prev_state)) {
					const g = (states[i+1] == 'att_quo' ? this.htmlspecialchars_quo : (states[i+1] == 'att_apo' ? this.htmlspecialchars_apo : this.htmlspecialchars_quo_apo));
					child_states.unshift(prev_state == 'att_js' ? 'js' : prev_state.slice(4));
					s_states = this.highlight_states(child_states, this.html_entity_decode(s), true, string => f(g(string)));
				} else if (prev_state && child_states) {
					child_states.unshift(prev_state);
					s_states = this.highlight_states(child_states, s, true, f);
				} else {
					s = this.htmlspecialchars(s);
					s_states = [ (escape ? escape(s) : s), (!out || !this.embedded.test(state) ? child_states : [ ]) ];
				}
			} else {
				s = this.htmlspecialchars(s);
				s_states = [ (escape ? escape(s) : s), (!out || !this.embedded.test(state) ? child_states : [ ]) ]; // reset child states when leaving construct
			}
			s = s_states[0];
			child_states = s_states[1];
			s = this.keywords_links(state, s, text.slice(match.index, match.index + 2)); // 2 - lookahead for closing quote plus parenthesis
			ret.push(s);

			s = text.substring(division, match.index + match[0].length);
			// a keyword can leave the state (e.g. DO in MySQL) - link it instead of printing it as an operator
			const keyword = (out && /\w/.test(s) ? this.keywords_links(state, this.htmlspecialchars(escape ? escape(s) : s)) : '');
			s = (/<a/.test(keyword) ? keyword : (m.length < 3 ? (s ? '<span class="jush-op">' + this.htmlspecialchars(escape ? escape(s) : s) + '</span>' : '') : (m[1] ? '<span class="jush-op">' + this.htmlspecialchars(escape ? escape(m[1]) : m[1]) + '</span>' : '') + this.htmlspecialchars(escape ? escape(m[2]) : m[2]) + (m[3] ? '<span class="jush-op">' + this.htmlspecialchars(escape ? escape(m[3]) : m[3]) + '</span>' : '')));
			if (!out) {
				if (this.links && this.links[key] && m[2]) {
					if (/^tag/.test(key)) {
						this.last_tag = m[2].toLowerCase();
					}
					let link = m[2].toLowerCase();
					let k_link = '';
					for (const k in this.links[key]) {
						const m2 = this.links[key][k].exec(m[2]);
						if (m2) {
							if (m2[1]) {
								link = (key == 'js_http' ? m2[1] : m2[1].toLowerCase().replace(/\\/g, '-')); // \ is PHP namespace
							}
							k_link = k;
							if (key != 'att') {
								break;
							}
						}
					}
					if (key == 'php_met') {
						this.last_class = (k_link && !/^(self|parent|static|dir)$/i.test(link) ? link : '');
					}
					if (k_link) {
						s = (m[1] ? '<span class="jush-op">' + this.htmlspecialchars(escape ? escape(m[1]) : m[1]) + '</span>' : '');
						s += this.create_link(
							(/^https?:/.test(k_link) ? k_link : this.urls[key].replace(/\$key/, k_link))
								.replace(/\$val/, (/^https?:/.test(k_link) ? link.toLowerCase() : link))
								.replace(/\$tag/, this.last_tag),
							this.htmlspecialchars(escape ? escape(m[2]) : m[2])); //! use jush.api
						s += (m[3] ? '<span class="jush-op">' + this.htmlspecialchars(escape ? escape(m[3]) : m[3]) + '</span>' : '');
					}
				}
				ret.push('<span class="jush-' + key + '">', s);
				states.push(key);
				if (state == 'php_eot') {
					this.tr.php_eot2._2 = new RegExp('(\n)(' + match[2] + ')(?=;?\n)');
					this.build_regexp('php_eot2', (match[3] == "'" ? { _2: this.tr.php_eot2._2 } : this.tr.php_eot2));
				} else if (state == 'pgsql_eot') {
					this.tr.pgsql_eot2._2 = new RegExp('\\$' + match[0].replace(/\$/, '\\$') + '|$');
					this.build_regexp('pgsql_eot2', this.tr.pgsql_eot2);
					this.pgsql_body = /\b(?:AS|DO)\s*\$$/i.test(text.substring(0, match.index)); // function body, not a string literal
				}
			} else {
				if (state == 'php_met' && this.last_class) {
					const title = (jush.api['php2'] ? jush.api['php2'][(this.last_class + '::' + s).toLowerCase()] : '');
					s = this.create_link(this.urls[state].replace(/\$key/, this.last_class) + '.' + s.toLowerCase().replace(/^__/, ''), s, (title ? ' title="' + this.htmlspecialchars_quo(title) + '"' : ''));
				}
				ret.push(s);
				for (let i = +key.slice(1); i--; ) {
					if (states.length > 1) { // the span of states[0] is created by the caller
						ret.push('</span>');
					}
					states.pop();
				}
			}
			start = match.index + match[0].length;
			if (!states.length) { // out of states
				break;
			}
			state = states[states.length - 1];
			this.regexps[state].lastIndex = start;
		}
		ret.push(this.keywords_links(state, this.htmlspecialchars(text.substring(start))));
		for (let i=1; i < states.length; i++) {
			ret.push('</span>');
		}
		states.shift();
		return [ ret.join(''), states ];
	},

	/** Replace <&> by HTML entities
	* @param {string} string
	* @return {string}
	*/
	htmlspecialchars: function (string) {
		return string.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
	},

	htmlspecialchars_quo: function (string) {
		return jush.htmlspecialchars(string).replace(/"/g, '&quot;'); // jush - this.htmlspecialchars_quo is passed as reference
	},

	htmlspecialchars_apo: function (string) {
		return jush.htmlspecialchars(string).replace(/'/g, '&#39;');
	},

	htmlspecialchars_quo_apo: function (string) {
		return jush.htmlspecialchars_quo(string).replace(/'/g, '&#39;');
	},

	/** Decode HTML entities
	* @param {string} string
	* @return {string}
	*/
	html_entity_decode: function (string) {
		return string.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&nbsp;/g, '\u00A0').replace(/&#(?:([0-9]+)|x([0-9a-f]+));/gi, (str, p1, p2) => { //! named entities
			return String.fromCharCode(p1 ? p1 : parseInt(p2, 16));
		}).replace(/&amp;/g, '&');
	},

	/** Add backslash before backslash
	* @param {string} string
	* @return {string}
	*/
	addslashes: function (string) {
		return string.replace(/\\/g, '\\$&');
	},

	addslashes_apo: function (string) {
		return string.replace(/[\\']/g, '\\$&');
	},

	addslashes_quo: function (string) {
		return string.replace(/[\\"]/g, '\\$&');
	},

	/** Remove backslash before \"'
	* @param {string} string
	* @return {string}
	*/
	stripslashes: function (string) {
		return string.replace(/\\([\\"'])/g, '$1');
	}
};



jush.tr = { // transitions - key: go inside this state, _2: go outside 2 levels (number alone is put to the beginning in Chrome)
	// regular expressions matching empty string could be used only in the last key
	quo: { php: jush.php, esc: /\\/, _1: /"/ },
	apo: { php: jush.php, esc: /\\/, _1: /'/ },
	com: { php: jush.php, _1: /\*\// },
	com_nest: { com_nest: /\/\*/, _1: /\*\// },
	php: { _1: /\?>/ }, // overwritten by jush-php.js
	esc: { _1: /./ }, //! php_quo allows [0-7]{1,3} and x[0-9A-Fa-f]{1,2}
	one: { _1: /(?=\n)/ },
	num: { _1: /()/ },

	sql_apo: { esc: /\\/, _0: /''/, _1: /'/ },
	sql_quo: { esc: /\\/, _0: /""/, _1: /"/ },
	sql_var: { _1: /(?=[^_.$a-zA-Z0-9])/ },
	sqlite_apo: { _0: /''/, _1: /'/ },
	sqlite_quo: { _0: /""/, _1: /"/ },
	bac: { _1: /`/ },
	bra: { _1: /]/ }
};

// string: $key stands for key in jush.links, $val stands for found string
// array: [0] is base, other elements correspond to () in jush.links2, $key stands for text of selected element, $1 stands for found string
jush.urls = { };
jush.links = { };
jush.links2 = { }; // first and last () is used as delimiter
jush.slugs = { }; // { state: function (name, key, url) } returning the $1 replacement in doc links; default keeps name with \ replaced by -
jush.link_key = { }; // { state: function (key, url, name) } resolving the matched key in jush.urls; '-' means no link



/** Get callback for autocompletition
* @param {string} esc escaped empty identifier, e.g. `` for MySQL or [] for MS SQL
* @param {Object<string, Array<string>>} tablesColumns keys are table names, values are lists of columns
* @param {Array<string>} [statements] statements offered at the beginning of a query, all by default
* @return {Function} see autocomplete()
*/
jush.autocompleteSql = function (esc, tablesColumns, statements) {
	const mysql = (esc == '``'); // the escaping is the only hint about the database

	/**
	* key: regular expression; ' ' will be expanded to '\\s+', '\\w' to esc[0]+'?\\w'+esc[1]+'?', '$' will be appended
	* value: list of autocomplete words; '?' means to not use the word if it's already in the current query
	*/
	const keywordsDefault = {
		'^': statements || ['SELECT', 'INSERT INTO', 'UPDATE', 'DELETE FROM', 'TRUNCATE', 'EXPLAIN'],
		'^EXPLAIN ': ['SELECT'],
		'^INSERT ': (mysql ? ['IGNORE'] : []),
		'^INSERT [^]+\\) ': ['?VALUES'].concat(mysql ? ['ON DUPLICATE KEY UPDATE'] : []),
		'^UPDATE \\w+ ': ['SET'],
		'^UPDATE \\w+ SET [^]+ ': ['?WHERE'],
		'^DELETE FROM \\w+ ': ['WHERE'],
		' JOIN \\w+(( AS)? (?!(ON|USING|AS) )\\w+)? ': ['ON', 'USING'],
		'\\bSELECT ': ['*', 'DISTINCT'],
		'\\bSELECT [^]*[^,] ': ['?FROM'],
		'\\bSELECT (?![^]* (WHERE|GROUP BY|HAVING|ORDER BY|LIMIT) )[^]+ FROM [^]+ ': ['INNER JOIN', 'LEFT JOIN', '?WHERE'],
		'\\bSELECT (?![^]* (HAVING|ORDER BY|LIMIT|OFFSET) )[^]+ FROM [^]+ ': ['?GROUP BY'],
		'\\bSELECT (?![^]* (ORDER BY|LIMIT|OFFSET) )[^]+ FROM [^]+ ': ['?HAVING'],
		'\\bSELECT (?![^]* (LIMIT|OFFSET) )[^]+ FROM [^]+ ': ['?ORDER BY'], // this matches prefixes without LIMIT|OFFSET and offers ORDER BY if it's not already used in prefix or suffix
		'\\bSELECT (?![^]* (OFFSET) )[^]+ FROM [^]+ ': (esc != '[]' ? ['?LIMIT', '?OFFSET'] : []), // MS SQL uses TOP
		' ORDER BY (?![^]* (LIMIT|OFFSET) )[^]+ ': ['DESC'],
	};

	// strings and comments must be found in a single pass, otherwise a delimiter inside the other construct would be honored
	const literals = new RegExp(
		'\'(?:[^\']|\'\')*\'?' // string, possibly unterminated
		+ '|/\\*[^]*?(?:\\*/|$)' // block comment
		+ '|(?:^|\\s)--' + (mysql ? ' ' : '') + '[^\\n]*' // line comment
		+ (mysql ? '|#[^\\n]*' : '') // # is a comment only in MySQL
	, 'g');

	let forceEscape = false;

	/** Replace a string by a placeholder and a comment by whitespace
	* @param {string} literal
	* @return {string}
	*/
	function replaceLiteral(literal) {
		return (literal[0] == '\'' ? '0' : ' ');
	}

	/** Get list of strings for autocompletion
	* @param {string} state
	* @param {string} before
	* @param {string} after
	* @return {Object<string, number>} keys are words, values are offsets
	*/
	function autocomplete(state, before, after) {
		// the other states are comments, strings or another language, e.g. a JavaScript routine body
		if (jush.autocompleting.sql.indexOf(state) < 0) {
			return {};
		}
		before = before
			.replace(literals, replaceLiteral)
			.replace(/[^]*;/, '') // strip previous query
			.replace(/^\s+/, '')
		;
		after = after
			.replace(literals, replaceLiteral)
			.replace(/;[^]*/, '') // strip next query
		;
		const query = before + after;
		const allTables = Object.keys(tablesColumns);
		const usedTables = findTables(query); // tables used by the current query
		const uniqueColumns = {};
		for (const alias in usedTables) {
			for (const column of tablesColumns[usedTables[alias]]) {
				uniqueColumns[column] = 0;
			}
		}
		const columns = Object.keys(uniqueColumns);
		if (columns.length > 50) {
			columns.length = 0;
		}
		if (Object.keys(usedTables).length > 1) {
			for (const alias in usedTables) {
				columns.push(alias + '.');
			}
		}

		const preferred = {
			'\\b(FROM|INTO|^UPDATE|JOIN|^TRUNCATE) ': allTables, // all tables including the current ones (self-join)
			'\\b(^INSERT|USING) [^(]*\\(([^)]+, )?': columns, // offer columns right after '(' or after ','
			'\\b(?!(IN|VALUES)\\()[a-z_]\\w*\\(([^)]+, )?': columns, // function call; IN() and VALUES() contain values
			'(^UPDATE [^]+ SET| DUPLICATE KEY UPDATE| BY) ([^]+, )?': columns,
			' (WHERE|HAVING|AND|OR|ON|=) (\\(\\s*)*': columns, // the condition can be parenthesized
		};
		keywordsDefault['\\bSELECT( DISTINCT)? (?![^]* FROM )([^]+, )?'] = columns; // this is not in preferred because we prefer '*'

		const context = before.replace(escRe('[\\w`]+$'), ''); // in 'UPDATE tab.`co', context is 'UPDATE tab.'
		before = before.replace(escRe('[^]*[^\\w`]'), ''); // in 'UPDATE tab.`co', before is '`co'

		const thisColumns = []; // columns in the current table ('table.')
		const match = context.match(escRe('`?(\\w+)`?\\.$'));
		if (match) {
			let table = match[1];
			if (!tablesColumns[table]) {
				table = usedTables[table];
			}
			if (tablesColumns[table]) {
				thisColumns.push(...tablesColumns[table]);
				preferred['\\.'] = thisColumns;
			}
		}

		forceEscape = query.includes(esc[0]) && !/^\w/.test(before); // if there's any ` in the query, use ` everywhere unless the user starts typing letters
		allTables.forEach(addEsc);
		columns.forEach(addEsc);
		thisColumns.forEach(addEsc);

		const ac = {};
		for (const keywords of [preferred, keywordsDefault]) {
			for (const re in keywords) {
				if (context.match(escRe(re.replace(/ /g, '\\s+').replace(/\\w\+/g, '`?\\w+`?') + '$', 'i'))) {
					for (let keyword of keywords[re]) {
						if (keyword[0] == '?') {
							keyword = keyword.substring(1);
							if (query.match(new RegExp('\\s+' + keyword.replace(/ /g, '\\s+') + '\\s+', 'i'))) {
								continue;
							}
						}
						if (keyword.length > before.length && keyword.toUpperCase().startsWith(before.toUpperCase())) {
							const isCol = (keywords[re] == columns || keywords[re] == thisColumns);
							ac[keyword + (isCol ? '' : ' ')] = before.length;
						}
					}
				}
			}
		}

		return ac;
	}

	function addEsc(val, key, array) {
		if (forceEscape || !/^[a-z_]\w*\.?$/i.test(val)) {
			array[key] = esc[0] + val.replace(/\.?$/, esc[1] + '$&');
		}
	}

	/** Change odd ` to esc[0], even to esc[1] */
	function escRe(re, flags) {
		let i = 0;
		return new RegExp(re.replace(/`/g, () => (esc[0] == '[' ? '\\' : '') + esc[i++ % 2]), flags);
	}

	/** @return {Object<string, string>} key is alias, value is actual table */
	function findTables(query) {
		const re = escRe('\\b(FROM|JOIN|INTO|UPDATE)\\s+(\\w+|`.+?`)((\\s+AS)?\\s+((?!(LEFT|INNER|JOIN|ON|USING|WHERE|GROUP|HAVING|ORDER|LIMIT)\\b)\\w+|`.+?`))?', 'gi'); //! handle `abc``def`
		const result = {};
		let match;
		while ((match = re.exec(query))) {
			const table = match[2].replace(escRe('^`|`$', 'g'), '');
			const alias = (match[5] ? match[5].replace(escRe('^`|`$', 'g'), '') : table);
			if (tablesColumns[table]) {
				result[alias] = table;
			}
		}
		if (!Object.keys(result).length) {
			for (const table in tablesColumns) {
				result[table] = table;
			}
		}
		return result;
	}

	// we open the autocomplete on word character, space, '(', '.' and '`'; textarea also triggers it on Backspace and Ctrl+Space
	autocomplete.openBy = escRe('^[\\w`(. ]$'); //! ignore . in 1.23

	return autocomplete;
};



jush.tr.clickhouse = { sql_apo: /'/, sqlite_quo: /"/, bac: /`/, one: /--/, com: /\/\*/, num: jush.num };

jush.autocompleting.sql.push('clickhouse', 'sqlite_quo', 'bac'); // sqlite_quo and bac are quoted identifiers

jush.slugs.clickhouse = name => name.toLowerCase(); // the pages of the functions are lowercase

jush.link_key.clickhouse = (key, url, name) => { // the type names are case sensitive, the same name in lowercase is the function building the value
	const functions = {
		'data-types/array': 'functions/array-functions',
		'data-types/map': 'functions/tuple-map-functions',
		'data-types/tuple': 'functions/tuple-functions',
	};
	return (functions[key] && name == name.toLowerCase() ? functions[key] : key);
};

jush.build_links2('clickhouse', 'https://clickhouse.com/docs/sql-reference/$key', /(\b)/, /(\b)/gi, {
	'statements/select': /(SELECT)/,
	'statements/select/with': /(WITH)/,
	'statements/select/distinct': /(DISTINCT)/,
	'statements/select/from': /(FROM|FINAL)/,
	'statements/select/array-join': /((?:LEFT\s+)?ARRAY\s+JOIN)/, // must be before JOIN
	'statements/select/join': /((?:(?:GLOBAL|INNER|LEFT|RIGHT|FULL|CROSS|OUTER|ANY|ALL|ASOF|SEMI|ANTI|PASTE)\s+)*JOIN|ON|USING)/,
	'statements/select/prewhere': /(PREWHERE)/,
	'statements/select/where': /(WHERE)/,
	'statements/select/group-by': /(GROUP\s+BY|ROLLUP|CUBE|TOTALS)/,
	'statements/select/having': /(HAVING)/,
	'statements/select/order-by': /(ORDER\s+BY|ASC|DESC|NULLS|FILL|INTERPOLATE)/,
	'statements/select/limit': /(LIMIT|OFFSET)/,
	'statements/select/union': /(UNION|INTERSECT|EXCEPT)/,
	'statements/select/sample': /(SAMPLE)/,
	'statements/select/into-outfile': /(INTO\s+OUTFILE)/, // must be before FORMAT
	'statements/select/format': /(FORMAT)/,
	'statements/insert-into': /(INSERT\s+INTO|VALUES)/,
	'statements/create/table': /(CREATE(?:\s+OR\s+REPLACE)?(?:\s+TEMPORARY)?\s+TABLE)/,
	'statements/create/view': /(CREATE(?:\s+OR\s+REPLACE)?(?:\s+MATERIALIZED|\s+LIVE|\s+WINDOW)?\s+VIEW)/,
	'statements/create/database': /(CREATE\s+DATABASE)/,
	'statements/alter': /(ALTER\s+TABLE)/,
	'statements/drop': /(DROP)/,
	'statements/rename': /(RENAME)/,
	'statements/truncate': /(TRUNCATE)/,
	'statements/optimize': /(OPTIMIZE|DEDUPLICATE)/,
	'statements/describe-table': /(DESCRIBE)/, // DESC is linked to ORDER BY
	'statements/show': /(SHOW)/,
	'statements/system': /(SYSTEM)/,
	'statements/set': /(SET)/,
	'statements/use': /(USE)/,
	'statements/explain': /(EXPLAIN)/,
	'statements/attach': /(ATTACH)/,
	'statements/detach': /(DETACH)/,
	'statements/kill': /(KILL)/,
	'statements/check-table': /(CHECK\s+TABLE)/,
	'statements/grant': /(GRANT)/,
	'statements/revoke': /(REVOKE)/,
	'https://clickhouse.com/docs/engines/table-engines': /(ENGINE)/, // the engines are outside the SQL reference
	'data-types/int-uint': /(U?Int(?:8|16|32|64|128|256))/,
	'data-types/float': /(Float(?:32|64)|BFloat16)/,
	'data-types/decimal': /(Decimal(?:32|64|128|256)?)/,
	'data-types/fixedstring': /(FixedString)/,
	'data-types/string': /(String)/,
	'data-types/date32': /(Date32)/,
	'data-types/datetime64': /(DateTime64)/,
	'data-types/datetime': /(DateTime)/,
	'data-types/date': /(Date)/,
	'data-types/time64': /(Time64)/,
	'data-types/time': /(Time)/,
	'data-types/enum': /(Enum(?:8|16)?)/,
	'data-types/array': /(Array)/,
	'data-types/tuple': /(Tuple)/,
	'data-types/map': /(Map)/,
	'data-types/nullable': /(Nullable)/,
	'data-types/lowcardinality': /(LowCardinality)/,
	'data-types/uuid': /(UUID)/,
	'data-types/json': /(JSON)/,
	'data-types/boolean': /(Bool)/,
	'data-types/ipv4': /(IPv4)/,
	'data-types/ipv6': /(IPv6)/,
	'data-types/geo#$1': /(MultiLineString|MultiPolygon|MultiPoint|LineString|Polygon|Point|Ring)/, // the longer names must be first
	'data-types/nested-data-structures/nested': /(Nested)/,
	'data-types/simpleaggregatefunction': /(SimpleAggregateFunction)/, // must be before AggregateFunction
	'data-types/aggregatefunction': /(AggregateFunction)/,
	'data-types/variant': /(Variant)/,
	'data-types/dynamic': /(Dynamic)/,
	'aggregate-functions/reference/$1': /(count|sum|avg|min|max|any|uniqExact|uniq|groupArray|argMin|argMax|quantile|median|topK)(?=\s*\(|$)/,
	'functions/type-conversion-functions': /(CAST|toString|toInt(?:8|16|32|64)|toUInt(?:8|16|32|64)|toFloat(?:32|64)|toDecimal(?:32|64)|toDate|toDateTime|toTypeName)(?=\s*\(|$)/,
	'functions/date-time-functions': /(now|today|yesterday|toYear|toMonth|toDayOfMonth|toHour|toMinute|toSecond|toStartOf\w+|dateDiff|formatDateTime)(?=\s*\(|$)/,
	'functions/string-functions': /(lower|upper|length|empty|notEmpty|concat|substring|reverse|trimLeft|trimRight|trimBoth|repeat|leftPad|rightPad)(?=\s*\(|$)/,
	'functions/string-search-functions': /(position|match|multiSearchAny|extract)(?=\s*\(|$)/,
	'functions/math-functions': /(abs|exp|log|log2|log10|sqrt|cbrt|pow|power)(?=\s*\(|$)/,
	'functions/rounding-functions': /(round|floor|ceil|ceiling|trunc|truncate)(?=\s*\(|$)/,
	'functions/conditional-functions': /(if|multiIf)(?=\s*\(|$)/,
	'functions/array-functions': /(arrayJoin|arrayMap|arrayFilter|arraySum|arrayElement|indexOf|has)(?=\s*\(|$)/,
	'functions/json-functions': /(JSONExtract\w*|JSONHas|JSONLength|visitParamExtract\w*)(?=\s*\(|$)/,
	'functions/hash-functions': /(cityHash64|sipHash64|halfMD5|MD5|SHA256)(?=\s*\(|$)/,
	'functions/uuid-functions': /(generateUUIDv4|toUUID)(?=\s*\(|$)/,
	'functions/other-functions': /(hostName|version|uptime|currentDatabase|ignore)(?=\s*\(|$)/,
	'operators': /(AND|OR|NOT|IN|BETWEEN|LIKE|ILIKE|IS|CASE|WHEN|THEN|ELSE|END|INTERVAL)/,
	'': /(AS|GLOBAL|SETTINGS|DEFAULT|MATERIALIZED|ALIAS|EPHEMERAL|CODEC|TTL|PRIMARY\s+KEY|PARTITION\s+BY|SAMPLE\s+BY|CLUSTER|IF\s+NOT\s+EXISTS|IF\s+EXISTS|COLUMN|INDEX|DATABASE|TABLE|VIEW|TO|NULL|TRUE|FALSE)/,
}); // collisions: extract, length, min, max, round, trunc



jush.tr.cnf = { quo_one: /"/, one: /#/, cnf_http: /((?:^|\n)\s*)(RequestHeader|Header|CacheIgnoreHeaders)([ \t]+|$)/i, cnf_php: /((?:^|\n)\s*)(PHPIniDir)([ \t]+|$)/i, cnf_phpini: /((?:^|\n)\s*)(php_value|php_flag|php_admin_value|php_admin_flag)([ \t]+|$)/i };
jush.tr.quo_one = { esc: /\\/, _1: /"|(?=\n)/ };
jush.tr.cnf_http = { apo: /'/, quo: /"/, _1: /(?=\n)/ };
jush.tr.cnf_php = { _1: /()/ };
jush.tr.cnf_phpini = { cnf_phpini_val: /[ \t]/ };
jush.tr.cnf_phpini_val = { apo: /'/, quo: /"/, _2: /(?=\n)/ };

jush.urls.cnf_http = 'https://httpd.apache.org/docs/current/mod/$key.html#$val';
jush.urls.cnf_php = 'https://www.php.net/$key';
jush.urls.cnf_phpini = 'https://www.php.net/configuration.changes#$key';

jush.slugs.cnf = name => name.toLowerCase();

jush.links.cnf_http = { 'mod_cache': /CacheIgnoreHeaders/i, 'mod_headers': /.+/ };
jush.links.cnf_php = { 'configuration.file': /.+/ };
jush.links.cnf_phpini = { 'configuration.changes.apache': /.+/ };

jush.build_links2('cnf', 'https://httpd.apache.org/docs/current/mod/$key.html#$1', /((?:^|\n)\s*(?:&lt;)?)/, /(\b)/gi, {
	'beos': /(MaxRequestsPerThread)/,
	'core': /(AcceptFilter|AcceptPathInfo|AccessFileName|AddDefaultCharset|AddOutputFilterByType|AllowEncodedSlashes|AllowOverride|AuthName|AuthType|CGIMapExtension|ContentDigest|DefaultType|Directory|DirectoryMatch|DocumentRoot|EnableMMAP|EnableSendfile|ErrorDocument|ErrorLog|FileETag|Files|FilesMatch|ForceType|HostnameLookups|IfDefine|IfModule|Include|KeepAlive|KeepAliveTimeout|Limit|LimitExcept|LimitInternalRecursion|LimitRequestBody|LimitRequestFields|LimitRequestFieldSize|LimitRequestLine|LimitXMLRequestBody|Location|LocationMatch|LogLevel|MaxKeepAliveRequests|NameVirtualHost|Options|Require|RLimitCPU|RLimitMEM|RLimitNPROC|Satisfy|ScriptInterpreterSource|ServerAdmin|ServerAlias|ServerName|ServerPath|ServerRoot|ServerSignature|ServerTokens|SetHandler|SetInputFilter|SetOutputFilter|TimeOut|TraceEnable|UseCanonicalName|UseCanonicalPhysicalPort|VirtualHost)/,
	'mod_actions': /(Action|Script)/,
	'mod_alias': /(Alias|AliasMatch|Redirect|RedirectMatch|RedirectPermanent|RedirectTemp|ScriptAlias|ScriptAliasMatch)/,
	'mod_auth_basic': /(AuthBasicAuthoritative|AuthBasicProvider)/,
	'mod_auth_digest': /(AuthDigestAlgorithm|AuthDigestDomain|AuthDigestNcCheck|AuthDigestNonceFormat|AuthDigestNonceLifetime|AuthDigestProvider|AuthDigestQop|AuthDigestShmemSize)/,
	'mod_authn_alias': /(AuthnProviderAlias)/,
	'mod_authn_anon': /(Anonymous|Anonymous_LogEmail|Anonymous_MustGiveEmail|Anonymous_NoUserID|Anonymous_VerifyEmail)/,
	'mod_authn_dbd': /(AuthDBDUserPWQuery|AuthDBDUserRealmQuery)/,
	'mod_authn_dbm': /(AuthDBMType|AuthDBMUserFile)/,
	'mod_authn_default': /(AuthDefaultAuthoritative)/,
	'mod_authn_file': /(AuthUserFile)/,
	'mod_authnz_ldap': /(AuthLDAPBindDN|AuthLDAPBindPassword|AuthLDAPCharsetConfig|AuthLDAPCompareDNOnServer|AuthLDAPDereferenceAliases|AuthLDAPGroupAttribute|AuthLDAPGroupAttributeIsDN|AuthLDAPRemoteUserAttribute|AuthLDAPRemoteUserIsDN|AuthLDAPUrl|AuthzLDAPAuthoritative)/,
	'mod_authz_dbm': /(AuthDBMGroupFile|AuthzDBMAuthoritative|AuthzDBMType)/,
	'mod_authz_default': /(AuthzDefaultAuthoritative)/,
	'mod_authz_groupfile': /(AuthGroupFile|AuthzGroupFileAuthoritative)/,
	'mod_authz_host': /(Allow|Deny|Order)/,
	'mod_authz_owner': /(AuthzOwnerAuthoritative)/,
	'mod_authz_user': /(AuthzUserAuthoritative)/,
	'mod_autoindex': /(AddAlt|AddAltByEncoding|AddAltByType|AddDescription|AddIcon|AddIconByEncoding|AddIconByType|DefaultIcon|HeaderName|IndexHeadInsert|IndexIgnore|IndexOptions|IndexOrderDefault|IndexStyleSheet|ReadmeName)/,
	'mod_cache': /(CacheDefaultExpire|CacheDisable|CacheEnable|CacheIgnoreCacheControl|CacheIgnoreNoLastMod|CacheIgnoreQueryString|CacheLastModifiedFactor|CacheMaxExpire|CacheStoreNoStore|CacheStorePrivate)/,
	'mod_cern_meta': /(MetaDir|MetaFiles|MetaSuffix)/,
	'mod_cgi': /(ScriptLog|ScriptLogBuffer|ScriptLogLength)/,
	'mod_cgid': /(ScriptSock)/,
	'mod_dav': /(Dav|DavDepthInfinity|DavMinTimeout)/,
	'mod_dav_fs': /(DavLockDB)/,
	'mod_dav_lock': /(DavGenericLockDB)/,
	'mod_dbd': /(DBDExptime|DBDKeep|DBDMax|DBDMin|DBDParams|DBDPersist|DBDPrepareSQL|DBDriver)/,
	'mod_deflate': /(DeflateBufferSize|DeflateCompressionLevel|DeflateFilterNote|DeflateMemLevel|DeflateWindowSize)/,
	'mod_dir': /(DirectoryIndex|DirectorySlash)/,
	'mod_disk_cache': /(CacheDirLength|CacheDirLevels|CacheMaxFileSize|CacheMinFileSize|CacheRoot)/,
	'mod_dumpio': /(DumpIOInput|DumpIOLogLevel|DumpIOOutput)/,
	'mod_echo': /(ProtocolEcho)/,
	'mod_env': /(PassEnv|SetEnv|UnsetEnv)/,
	'mod_example': /(Example)/,
	'mod_expires': /(ExpiresActive|ExpiresByType|ExpiresDefault)/,
	'mod_ext_filter': /(ExtFilterDefine|ExtFilterOptions)/,
	'mod_file_cache': /(CacheFile|MMapFile)/,
	'mod_filter': /(FilterChain|FilterDeclare|FilterProtocol|FilterProvider|FilterTrace)/,
	'mod_charset_lite': /(CharsetDefault|CharsetOptions|CharsetSourceEnc)/,
	'mod_ident': /(IdentityCheck|IdentityCheckTimeout)/,
	'mod_imagemap': /(ImapBase|ImapDefault|ImapMenu)/,
	'mod_include': /(SSIEnableAccess|SSIEndTag|SSIErrorMsg|SSIStartTag|SSITimeFormat|SSIUndefinedEcho|XBitHack)/,
	'mod_info': /(AddModuleInfo)/,
	'mod_isapi': /(ISAPIAppendLogToErrors|ISAPIAppendLogToQuery|ISAPICacheFile|ISAPIFakeAsync|ISAPILogNotSupported|ISAPIReadAheadBuffer)/,
	'mod_ldap': /(LDAPCacheEntries|LDAPCacheTTL|LDAPConnectionTimeout|LDAPOpCacheEntries|LDAPOpCacheTTL|LDAPSharedCacheFile|LDAPSharedCacheSize|LDAPTrustedClientCert|LDAPTrustedGlobalCert|LDAPTrustedMode|LDAPVerifyServerCert)/,
	'mod_log_config': /(BufferedLogs|CookieLog|CustomLog|LogFormat|TransferLog)/,
	'mod_log_forensic': /(ForensicLog)/,
	'mod_mem_cache': /(MCacheMaxObjectCount|MCacheMaxObjectSize|MCacheMaxStreamingBuffer|MCacheMinObjectSize|MCacheRemovalAlgorithm|MCacheSize)/,
	'mod_mime': /(AddCharset|AddEncoding|AddHandler|AddInputFilter|AddLanguage|AddOutputFilter|AddType|DefaultLanguage|ModMimeUsePathInfo|MultiviewsMatch|RemoveCharset|RemoveEncoding|RemoveHandler|RemoveInputFilter|RemoveLanguage|RemoveOutputFilter|RemoveType|TypesConfig)/,
	'mod_mime_magic': /(MimeMagicFile)/,
	'mod_negotiation': /(CacheNegotiatedDocs|ForceLanguagePriority|LanguagePriority)/,
	'mod_nw_ssl': /(NWSSLTrustedCerts|NWSSLUpgradeable|SecureListen)/,
	'mod_proxy': /(AllowCONNECT|BalancerMember|NoProxy|Proxy|ProxyBadHeader|ProxyBlock|ProxyDomain|ProxyErrorOverride|ProxyFtpDirCharset|ProxyIOBufferSize|ProxyMatch|ProxyMaxForwards|ProxyPass|ProxyPassInterpolateEnv|ProxyPassMatch|ProxyPassReverse|ProxyPassReverseCookieDomain|ProxyPassReverseCookiePath|ProxyPreserveHost|ProxyReceiveBufferSize|ProxyRemote|ProxyRemoteMatch|ProxyRequests|ProxySet|ProxyStatus|ProxyTimeout|ProxyVia)/,
	'mod_rewrite': /(RewriteBase|RewriteCond|RewriteEngine|RewriteLock|RewriteLog|RewriteLogLevel|RewriteMap|RewriteOptions|RewriteRule)/,
	'mod_setenvif': /(BrowserMatch|BrowserMatchNoCase|SetEnvIf|SetEnvIfNoCase)/,
	'mod_so': /(LoadFile|LoadModule)/,
	'mod_speling': /(CheckCaseOnly|CheckSpelling)/,
	'mod_ssl': /(SSLCACertificateFile|SSLCACertificatePath|SSLCADNRequestFile|SSLCADNRequestPath|SSLCARevocationFile|SSLCARevocationPath|SSLCertificateChainFile|SSLCertificateFile|SSLCertificateKeyFile|SSLCipherSuite|SSLCryptoDevice|SSLEngine|SSLHonorCipherOrder|SSLMutex|SSLOptions|SSLPassPhraseDialog|SSLProtocol|SSLProxyCACertificateFile|SSLProxyCACertificatePath|SSLProxyCARevocationFile|SSLProxyCARevocationPath|SSLProxyCipherSuite|SSLProxyEngine|SSLProxyMachineCertificateFile|SSLProxyMachineCertificatePath|SSLProxyProtocol|SSLProxyVerify|SSLProxyVerifyDepth|SSLRandomSeed|SSLRequire|SSLRequireSSL|SSLSessionCache|SSLSessionCacheTimeout|SSLUserName|SSLVerifyClient|SSLVerifyDepth)/,
	'mod_status': /(ExtendedStatus|SeeRequestTail)/,
	'mod_substitute': /(Substitute)/,
	'mod_suexec': /(SuexecUserGroup)/,
	'mod_userdir': /(UserDir)/,
	'mod_usertrack': /(CookieDomain|CookieExpires|CookieName|CookieStyle|CookieTracking)/,
	'mod_version': /(IfVersion)/,
	'mod_vhost_alias': /(VirtualDocumentRoot|VirtualDocumentRootIP|VirtualScriptAlias|VirtualScriptAliasIP)/,
	'mpm_common': /(AcceptMutex|ChrootDir|CoreDumpDirectory|EnableExceptionHook|GracefulShutdownTimeout|Group|Listen|ListenBackLog|LockFile|MaxClients|MaxMemFree|MaxRequestsPerChild|MaxSpareThreads|MinSpareThreads|PidFile|ReceiveBufferSize|ScoreBoardFile|SendBufferSize|ServerLimit|StartServers|StartThreads|ThreadLimit|ThreadsPerChild|ThreadStackSize|User)/,
	'mpm_netware': /(MaxThreads)/,
	'mpm_winnt': /(Win32DisableAcceptEx)/,
	'prefork': /(MaxSpareServers|MinSpareServers)/,
});



jush.tr.css = { php: jush.php, quo: /"/, apo: /'/, com: /\/\*/, css_at: /(@)([^;\s{]+)/, css_pro: /\{/, _2: /(<)(\/style)(>)/i };
jush.tr.css_at = { php: jush.php, quo: /"/, apo: /'/, com: /\/\*/, css_at2: /\{/, _1: /;/ };
jush.tr.css_at2 = { php: jush.php, quo: /"/, apo: /'/, com: /\/\*/, css_at: /@/, css_pro: /\{/, _2: /}/ };
jush.tr.css_pro = { php: jush.php, com: /\/\*/, css_val: /(\s*)([-\w]+)(\s*:|$)/, _1: /}/ }; //! misses e.g. margin/*-left*/:
jush.tr.css_val = { php: jush.php, quo: /"/, apo: /'/, css_js: /expression\s*\(/i, com: /\/\*/, clr: /#/, num: /[-+]?[0-9]*\.?[0-9]+(?:em|ex|px|in|cm|mm|pt|pc|%)?/, _2: /}/, _1: /;|$/ };
jush.tr.css_js = { php: jush.php, css_js: /\(/, _1: /\)/ };
jush.tr.clr = { _1: /(?=[^a-fA-F0-9])/ };

jush.urls.css_at = 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/$key';
jush.urls.css_val = 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/$key';

jush.links.css_at = {
	'@$val': /^(charset|color-profile|container|counter-style|custom-media|document|font-face|font-feature-values|font-palette-values|function|import|keyframes|layer|media|namespace|page|position-try|property|scope|starting-style|supports|view-transition)$/i
};
jush.links.css_val = {
	'$val': /^(-moz-float-edge|-moz-force-broken-image-icon|-moz-orient|-moz-user-focus|-moz-user-input|-webkit-border-before|-webkit-box-reflect|-webkit-mask-box-image|-webkit-mask-composite|-webkit-mask-position-x|-webkit-mask-position-y|-webkit-mask-repeat-x|-webkit-mask-repeat-y|-webkit-tap-highlight-color|-webkit-text-fill-color|-webkit-text-security|-webkit-text-stroke|-webkit-text-stroke-color|-webkit-text-stroke-width|-webkit-touch-callout|accent-color|align-content|align-items|align-self|alignment-baseline|all|anchor-name|anchor-scope|animation|animation-composition|animation-delay|animation-direction|animation-duration|animation-fill-mode|animation-iteration-count|animation-name|animation-play-state|animation-range|animation-range-end|animation-range-start|animation-timeline|animation-timing-function|appearance|aspect-ratio|backdrop-filter|backface-visibility|background|background-attachment|background-blend-mode|background-clip|background-color|background-image|background-origin|background-position|background-position-x|background-position-y|background-repeat|background-repeat-x|background-repeat-y|background-size|baseline-shift|baseline-source|block-size|border|border-block|border-block-color|border-block-end|border-block-end-color|border-block-end-style|border-block-end-width|border-block-start|border-block-start-color|border-block-start-style|border-block-start-width|border-block-style|border-block-width|border-bottom|border-bottom-color|border-bottom-left-radius|border-bottom-right-radius|border-bottom-style|border-bottom-width|border-collapse|border-color|border-end-end-radius|border-end-start-radius|border-image|border-image-outset|border-image-repeat|border-image-slice|border-image-source|border-image-width|border-inline|border-inline-color|border-inline-end|border-inline-end-color|border-inline-end-style|border-inline-end-width|border-inline-start|border-inline-start-color|border-inline-start-style|border-inline-start-width|border-inline-style|border-inline-width|border-left|border-left-color|border-left-style|border-left-width|border-radius|border-right|border-right-color|border-right-style|border-right-width|border-shape|border-spacing|border-start-end-radius|border-start-start-radius|border-style|border-top|border-top-color|border-top-left-radius|border-top-right-radius|border-top-style|border-top-width|border-width|bottom|box-align|box-decoration-break|box-direction|box-flex|box-flex-group|box-lines|box-ordinal-group|box-orient|box-pack|box-shadow|box-sizing|break-after|break-before|break-inside|caption-side|caret|caret-animation|caret-color|caret-shape|clear|clip|clip-path|clip-rule|color|color-interpolation|color-interpolation-filters|color-scheme|column-count|column-fill|column-gap|column-height|column-rule|column-rule-break|column-rule-color|column-rule-inset-cap-end|column-rule-style|column-rule-visibility-items|column-rule-width|column-span|column-width|column-wrap|columns|contain|contain-intrinsic-block-size|contain-intrinsic-height|contain-intrinsic-inline-size|contain-intrinsic-size|contain-intrinsic-width|container|container-name|container-type|content|content-visibility|corner-block-end-shape|corner-block-start-shape|corner-bottom-left-shape|corner-bottom-right-shape|corner-bottom-shape|corner-end-end-shape|corner-end-start-shape|corner-inline-end-shape|corner-inline-start-shape|corner-left-shape|corner-right-shape|corner-shape|corner-start-end-shape|corner-start-start-shape|corner-top-left-shape|corner-top-right-shape|corner-top-shape|counter-increment|counter-reset|counter-set|cursor|cx|cy|d|direction|display|dominant-baseline|dynamic-range-limit|empty-cells|field-sizing|fill|fill-opacity|fill-rule|filter|flex|flex-basis|flex-direction|flex-flow|flex-grow|flex-line-count|flex-shrink|flex-wrap|float|flood-color|flood-opacity|font|font-family|font-feature-settings|font-kerning|font-language-override|font-optical-sizing|font-palette|font-size|font-size-adjust|font-smooth|font-stretch|font-style|font-synthesis|font-synthesis-position|font-synthesis-small-caps|font-synthesis-style|font-synthesis-weight|font-variant|font-variant-alternates|font-variant-caps|font-variant-east-asian|font-variant-emoji|font-variant-ligatures|font-variant-numeric|font-variant-position|font-variation-settings|font-weight|font-width|forced-color-adjust|frame-sizing|gap|grid|grid-area|grid-auto-columns|grid-auto-flow|grid-auto-rows|grid-column|grid-column-end|grid-column-start|grid-row|grid-row-end|grid-row-start|grid-template|grid-template-areas|grid-template-columns|grid-template-rows|hanging-punctuation|height|hyphenate-character|hyphenate-limit-chars|hyphens|image-orientation|image-rendering|image-resolution|initial-letter|inline-size|inset|inset-block|inset-block-end|inset-block-start|inset-inline|inset-inline-end|inset-inline-start|interactivity|interest-delay|interest-delay-end|interest-delay-start|interpolate-size|isolation|justify-content|justify-items|justify-self|left|letter-spacing|lighting-color|line-break|line-clamp|line-height|line-height-step|link-parameters|list-style|list-style-image|list-style-position|list-style-type|margin|margin-block|margin-block-end|margin-block-start|margin-bottom|margin-inline|margin-inline-end|margin-inline-start|margin-left|margin-right|margin-top|margin-trim|marker|marker-end|marker-mid|marker-start|mask|mask-border|mask-border-mode|mask-border-outset|mask-border-repeat|mask-border-slice|mask-border-source|mask-border-width|mask-clip|mask-composite|mask-image|mask-mode|mask-origin|mask-position|mask-repeat|mask-size|mask-type|math-depth|math-shift|math-style|max-block-size|max-height|max-inline-size|max-width|min-block-size|min-height|min-inline-size|min-width|mix-blend-mode|object-fit|object-position|object-view-box|offset|offset-anchor|offset-distance|offset-path|offset-position|offset-rotate|opacity|order|orphans|outline|outline-color|outline-offset|outline-style|outline-width|overflow|overflow-anchor|overflow-block|overflow-clip-margin|overflow-inline|overflow-wrap|overflow-x|overflow-y|overlay|overscroll-behavior|overscroll-behavior-block|overscroll-behavior-inline|overscroll-behavior-x|overscroll-behavior-y|padding|padding-block|padding-block-end|padding-block-start|padding-bottom|padding-inline|padding-inline-end|padding-inline-start|padding-left|padding-right|padding-top|page|page-break-after|page-break-before|page-break-inside|paint-order|path-length|perspective|perspective-origin|place-content|place-items|place-self|pointer-events|position|position-anchor|position-area|position-try|position-try-fallbacks|position-try-order|position-visibility|print-color-adjust|quotes|r|reading-flow|reading-order|resize|right|rotate|row-gap|row-rule|row-rule-break|row-rule-color|row-rule-style|row-rule-visibility-items|row-rule-width|ruby-align|ruby-overhang|ruby-position|rule|rule-break|rule-color|rule-style|rule-visibility-items|rule-width|rx|ry|scale|scroll-behavior|scroll-initial-target|scroll-margin|scroll-margin-block|scroll-margin-block-end|scroll-margin-block-start|scroll-margin-bottom|scroll-margin-inline|scroll-margin-inline-end|scroll-margin-inline-start|scroll-margin-left|scroll-margin-right|scroll-margin-top|scroll-marker-group|scroll-padding|scroll-padding-block|scroll-padding-block-end|scroll-padding-block-start|scroll-padding-bottom|scroll-padding-inline|scroll-padding-inline-end|scroll-padding-inline-start|scroll-padding-left|scroll-padding-right|scroll-padding-top|scroll-snap-align|scroll-snap-stop|scroll-snap-type|scroll-target-group|scroll-timeline|scroll-timeline-axis|scroll-timeline-name|scrollbar-color|scrollbar-gutter|scrollbar-width|shape-image-threshold|shape-margin|shape-outside|shape-rendering|speak-as|stop-color|stop-opacity|stroke|stroke-dasharray|stroke-dashoffset|stroke-linecap|stroke-linejoin|stroke-miterlimit|stroke-opacity|stroke-width|tab-size|table-layout|text-align|text-align-last|text-anchor|text-autospace|text-box|text-box-edge|text-box-trim|text-combine-upright|text-decoration|text-decoration-color|text-decoration-inset|text-decoration-line|text-decoration-skip|text-decoration-skip-ink|text-decoration-style|text-decoration-thickness|text-emphasis|text-emphasis-color|text-emphasis-position|text-emphasis-style|text-indent|text-justify|text-orientation|text-overflow|text-rendering|text-shadow|text-size-adjust|text-spacing-trim|text-transform|text-underline-offset|text-underline-position|text-wrap|text-wrap-mode|text-wrap-style|timeline-scope|top|touch-action|transform|transform-box|transform-origin|transform-style|transition|transition-behavior|transition-delay|transition-duration|transition-property|transition-timing-function|translate|unicode-bidi|user-modify|user-select|vector-effect|vertical-align|view-timeline|view-timeline-axis|view-timeline-inset|view-timeline-name|view-transition-class|view-transition-name|view-transition-scope|visibility|white-space|white-space-collapse|widows|width|will-change|word-break|word-spacing|writing-mode|x|y|z-index|zoom)$/i
};

jush.build_links2('css', 'https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Selectors/$key', /(:)/, /((?![-\w]))/gi, {
	':$1': /(-moz-broken|-moz-drag-over|-moz-first-node|-moz-handler-blocked|-moz-handler-crashed|-moz-handler-disabled|-moz-last-node|-moz-loading|-moz-only-whitespace|-moz-submit-invalid|-moz-suppressed|-moz-user-disabled|-moz-window-inactive|active|active-view-transition|active-view-transition-type|any-link|autofill|blank|buffering|checked|current|default|defined|dir|disabled|empty|enabled|first|first-child|first-of-type|focus|focus-visible|focus-within|fullscreen|future|has|has-slotted|heading|host|host-context|hover|in-range|indeterminate|interest-source|interest-target|invalid|is|lang|last-child|last-of-type|left|link|local-link|modal|muted|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|only-child|only-of-type|open|optional|out-of-range|past|paused|picture-in-picture|placeholder-shown|playing|popover-open|read-only|read-write|required|right|root|scope|seeking|stalled|state|target|target-after|target-before|target-current|user-invalid|user-valid|valid|visited|volume-locked|where|xr-overlay)/,
	'::$1': /(:)(-moz-color-swatch|-moz-focus-inner|-moz-list-bullet|-moz-list-number|-moz-meter-bar|-moz-progress-bar|-moz-range-progress|-moz-range-thumb|-moz-range-track|-webkit-inner-spin-button|-webkit-meter-bar|-webkit-meter-even-less-good-value|-webkit-meter-inner-element|-webkit-meter-optimum-value|-webkit-meter-suboptimum-value|-webkit-progress-bar|-webkit-progress-inner-element|-webkit-progress-value|-webkit-scrollbar|-webkit-search-cancel-button|-webkit-search-results-button|-webkit-slider-runnable-track|-webkit-slider-thumb|after|backdrop|before|checkmark|column|cue|details-content|file-selector-button|first-letter|first-line|grammar-error|highlight|marker|part|picker|picker-icon|placeholder|scroll-button|scroll-marker|scroll-marker-group|search-text|selection|slotted|spelling-error|target-text|view-transition|view-transition-group|view-transition-image-pair|view-transition-new|view-transition-old)/,
});



jush.tr.elastic = { json: /:(?= )/ }; // Adminer prints the queries as "<path>: <JSON>"

jush.build_links2('elastic', 'https://www.elastic.co/docs/api/doc/elasticsearch/operation/operation-$key', /(\b)/, /(\b)/g, {
	'https://www.elastic.co/docs/api/doc/elasticsearch/': /(GET|POST|PUT|DELETE|HEAD)/, // no page explains the methods, the reference prints them by every operation
	'search': /(_search)/,
	'count': /(_count)/,
	'index': /(_doc)/,
	'update': /(_update)/,
	'indices-put-mapping': /(_mapping)/,
	'indices-update-aliases': /(_aliases)/, // must be before _alias
	'indices-get-alias': /(_alias)/,
	'indices-stats': /(_stats)/,
	// the field types are documented outside the API reference
	'https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/number': /(long|integer|short|byte|double|float|half_float|scaled_float)/,
	'https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/boolean': /(boolean)/,
	'https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/date': /(date)/,
	'https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/text': /(text)/,
	'https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/keyword': /(keyword)/,
	'https://www.elastic.co/docs/reference/elasticsearch/mapping-reference/binary': /(binary)/,
});



jush.tr.firebird = { sqlite_apo: /'/, sqlite_quo: /"/, one: /--/, com: /\/\*/, num: jush.num };

jush.autocompleting.sql.push('firebird', 'sqlite_quo'); // sqlite_quo is a quoted identifier

jush.slugs.firebird = name => name.toLowerCase().replace(/_/g, '-'); // the anchors of the functions use dashes

// the whole language reference is a single page, the keys are its anchors
jush.build_links2('firebird', 'https://firebirdsql.org/file/documentation/html/en/refdocs/fblangref50/firebird-50-language-reference.html$key', /(\b)/, /(\b)/gi, {
	'#fblangref50-dml-select': /(SELECT)/,
	'#fblangref50-dml-select-first-skip': /(FIRST|SKIP)/,
	'#fblangref50-dml-select-from': /(FROM)/,
	'#fblangref50-dml-select-joins': /((?:(?:NATURAL|INNER|CROSS|LEFT|RIGHT|FULL|OUTER)\s+)*JOIN|ON|USING)/,
	'#fblangref50-dml-select-where': /(WHERE)/,
	'#fblangref50-dml-select-groupby': /(GROUP\s+BY|HAVING)/,
	'#fblangref50-dml-select-window': /(WINDOW|OVER|PARTITION\s+BY)/,
	'#fblangref50-dml-select-plan': /(PLAN)/,
	'#fblangref50-dml-select-union': /(UNION)/,
	'#fblangref50-dml-select-orderby': /(ORDER\s+BY|ASC(?:ENDING)?|DESC(?:ENDING)?|NULLS)/,
	'#fblangref50-dml-select-rows': /(ROWS)/,
	'#fblangref50-dml-select-offsetfetch': /(OFFSET|FETCH)/,
	'#fblangref50-dml-with-lock': /(WITH\s+LOCK)/, // must be before WITH
	'#fblangref50-dml-select-cte': /(WITH)/,
	'#fblangref50-dml-insert': /(INSERT)/,
	'#fblangref50-dml-insert-returning': /(RETURNING)/,
	'#fblangref50-dml-update-or-insert': /(UPDATE\s+OR\s+INSERT)/, // must be before UPDATE
	'#fblangref50-dml-update': /(UPDATE)/,
	'#fblangref50-dml-delete': /(DELETE)/,
	'#fblangref50-dml-merge': /(MERGE|MATCHED)/,
	'#fblangref50-dml-execblock': /(EXECUTE\s+BLOCK)/,
	'#fblangref50-dml-execproc': /(EXECUTE\s+PROCEDURE)/,
	'#fblangref50-ddl-tbl-create': /(CREATE(?:\s+GLOBAL\s+TEMPORARY)?\s+TABLE)/,
	'#fblangref50-ddl-tbl-alter': /(ALTER\s+TABLE)/,
	'#fblangref50-ddl-tbl-drop': /(DROP\s+TABLE)/,
	'#fblangref50-ddl-idx-create': /(CREATE(?:\s+UNIQUE)?(?:\s+ASC(?:ENDING)?|\s+DESC(?:ENDING)?)?\s+INDEX)/,
	'#fblangref50-ddl-idx-dropidx': /(DROP\s+INDEX)/,
	'#fblangref50-ddl-view-create': /(CREATE\s+VIEW)/,
	'#fblangref50-ddl-view-drop': /(DROP\s+VIEW)/,
	'#fblangref50-ddl-proc-create': /(CREATE\s+PROCEDURE)/,
	'#fblangref50-ddl-proc-drop': /(DROP\s+PROCEDURE)/,
	'#fblangref50-ddl-func-create': /(CREATE\s+FUNCTION)/,
	'#fblangref50-ddl-func-drop': /(DROP\s+FUNCTION)/,
	'#fblangref50-ddl-trgr-create': /(CREATE\s+TRIGGER)/,
	'#fblangref50-ddl-trgr-drop': /(DROP\s+TRIGGER)/,
	'#fblangref50-ddl-sequence-create': /(CREATE\s+(?:SEQUENCE|GENERATOR))/,
	'#fblangref50-ddl-sequence-drop': /(DROP\s+(?:SEQUENCE|GENERATOR))/,
	'#fblangref50-ddl-domn-create': /(CREATE\s+DOMAIN)/,
	'#fblangref50-ddl-db-create': /(CREATE\s+DATABASE)/,
	'#fblangref50-ddl-comment-create': /(COMMENT\s+ON)/,
	'#fblangref50-transacs-settransac': /(SET\s+TRANSACTION)/,
	'#fblangref50-transacs-commit': /(COMMIT)/,
	'#fblangref50-transacs-rollback': /(ROLLBACK)/,
	'#fblangref50-transacs-savepoint': /(SAVEPOINT)/,
	'#fblangref50-security-grant': /(GRANT)/,
	'#fblangref50-security-revoke': /(REVOKE)/,
	'#fblangref50-datatypes-inttypes': /(SMALLINT|INTEGER|INT128|BIGINT|INT)/,
	'#fblangref50-datatypes-floattypes': /(DOUBLE\s+PRECISION|DECFLOAT|FLOAT|REAL)/,
	'#fblangref50-datatypes-fixedtypes': /(NUMERIC|DECIMAL)/,
	'#fblangref50-datatypes-datetime': /(TIMESTAMP|DATE|TIME)/,
	'#fblangref50-datatypes-chartypes': /(CHARACTER\s+VARYING|CHARACTER|VARCHAR|NCHAR|CHAR)/,
	'#fblangref50-datatypes-boolean': /(BOOLEAN)/,
	'#fblangref50-datatypes-bnrytypes': /(BLOB)/,
	'#fblangref50-functions-datetime': /(CURRENT_DATE|CURRENT_TIME(?:STAMP)?|LOCALTIME(?:STAMP)?)/, // these have anchors in another namespace
	'#fblangref50-scalarfuncs-ceil': /(CEILING|CEIL)/,
	'#fblangref50-scalarfuncs-char-length': /(CHARACTER_LENGTH|CHAR_LENGTH)/,
	'#fblangref50-scalarfuncs-firstday': /(FIRST_DAY)/,
	'#fblangref50-scalarfuncs-lastday': /(LAST_DAY)/,
	'#fblangref50-scalarfuncs-$1': /(ABS|ACOSH|ACOS|ASINH|ASIN|ATAN2|ATANH|ATAN|COSH|COS|COT|EXP|FLOOR|LN|LOG10|LOG|MOD|PI|POWER|RAND|ROUND|SIGN|SINH|SIN|SQRT|TANH|TAN|TRUNC|ASCII_CHAR|ASCII_VAL|BIT_LENGTH|BLOB_APPEND|OCTET_LENGTH|LEFT|LOWER|LPAD|OVERLAY|POSITION|REPLACE|REVERSE|RIGHT|RPAD|SUBSTRING|TRIM|UNICODE_CHAR|UNICODE_VAL|UPPER|HASH|DATEADD|DATEDIFF|EXTRACT|BIN_AND|BIN_NOT|BIN_OR|BIN_SHL|BIN_SHR|BIN_XOR|CHAR_TO_UUID|GEN_UUID|UUID_TO_CHAR|GEN_ID|CAST|COALESCE|DECODE|IIF|MAXVALUE|MINVALUE|NULLIF)(?=\s*\(|$)/,
	'#fblangref50-aggfuncs-$1': /(AVG|COUNT|LIST|MAX|MIN|SUM)(?=\s*\(|$)/,
	'': /(AND|OR|NOT|IN|LIKE|CONTAINING|STARTING\s+WITH|SIMILAR\s+TO|BETWEEN|IS|EXISTS|SINGULAR|SOME|ANY|ALL|DISTINCT|CASE|WHEN|THEN|ELSE|END|AS|INTO|VALUES|SET|DEFAULT|PRIMARY\s+KEY|FOREIGN\s+KEY|REFERENCES|UNIQUE|CHECK|CONSTRAINT|COMPUTED\s+BY|COLLATE|GENERATED|IDENTITY|NULL|TRUE|FALSE|UNKNOWN)/,
}); // collisions: CHARACTER VARYING and CHAR_LENGTH with the CHAR type, MAX and MIN with MAXVALUE and MINVALUE



jush.tr.htm = { php: jush.php, tag_css: /(<)(style)\b/i, tag_js: /(<)(script)\b/i, htm_com: /<!--/, tag: /(<)(\/?[-\w]+)/, ent: /&/ };
jush.tr.htm_com = { php: jush.php, _1: /-->/ };
jush.tr.ent = { php: jush.php, _1: /[;\s]/ };
jush.tr.tag = { php: jush.php, att_css: /(\s*)(style)(\s*=\s*|$)/i, att_js: /(\s*)(on[-\w]+)(\s*=\s*|$)/i, att_http: /(\s*)(http-equiv)(\s*=\s*|$)/i, att: /(\s*)([-\w]+)()/, _1: />/ };
jush.tr.tag_css = { php: jush.php, att: /(\s*)([-\w]+)()/, css: />/ };
jush.tr.tag_js = { php: jush.php, att: /(\s*)([-\w]+)()/, js: />/ };
jush.tr.att = { php: jush.php, att_quo: /\s*=\s*"/, att_apo: /\s*=\s*'/, att_val: /\s*=\s*/, _1: /()/ };
jush.tr.att_css = { php: jush.php, att_quo: /"/, att_apo: /'/, att_val: /\s*/ };
jush.tr.att_js = { php: jush.php, att_quo: /"/, att_apo: /'/, att_val: /\s*/ };
jush.tr.att_http = { php: jush.php, att_quo: /"/, att_apo: /'/, att_val: /\s*/ };
jush.tr.att_quo = { php: jush.php, _2: /"/ };
jush.tr.att_apo = { php: jush.php, _2: /'/ };
jush.tr.att_val = { php: jush.php, _2: /(?=>|\s)/ };
jush.tr.xml = { php: jush.php, htm_com: /<!--/, xml_tag: /(<)(\/?[-\w:]+)/, ent: /&/ };
jush.tr.xml_tag = { php: jush.php, xml_att: /(\s*)([-\w:]+)()/, _1: />/ };
jush.tr.xml_att = { php: jush.php, att_quo: /\s*=\s*"/, att_apo: /\s*=\s*'/, _1: /()/ };

jush.urls.tag = 'https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/$key';
jush.urls.tag_css = jush.urls.tag;
jush.urls.tag_js = jush.urls.tag;
jush.urls.att = jush.urls.tag;
jush.urls.att_css = jush.urls.tag;
jush.urls.att_js = 'https://developer.mozilla.org/en-US/docs/Web/API/$key/$val_event';
jush.urls.att_http = jush.urls.tag;

jush.links.tag = {
	'Elements/Heading_Elements': /^(h[1-6])$/i,
	'Elements/$val': /^(a|abbr|acronym|address|area|article|aside|audio|b|base|bdi|bdo|big|blockquote|body|br|button|canvas|caption|center|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dialog|dir|div|dl|dt|em|embed|fencedframe|fieldset|figcaption|figure|font|footer|form|frame|frameset|geolocation|head|header|hgroup|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|marquee|menu|meta|meter|nav|nobr|noembed|noframes|noscript|object|ol|optgroup|option|output|p|param|picture|plaintext|pre|progress|q|rb|rp|rt|rtc|ruby|s|samp|script|search|section|select|selectedcontent|slot|small|source|span|strike|strong|style|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video|wbr|xmp)$/i
};
jush.links.tag_css = { 'Elements/$val': /^(style)$/i };
jush.links.tag_js = { 'Elements/$val': /^(script)$/i };
jush.links.att_css = { 'Global_attributes/$val': /^(style)$/i };
jush.links.att_js = {
	'Element': /on(blur|click|contextmenu|dblclick|focus|input|keydown|keypress|keyup|mousedown|mouseenter|mouseleave|mousemove|mouseout|mouseover|mouseup|mousewheel|scroll)$/i,
	'HTMLElement': /on(change|drag|dragend|dragenter|dragleave|dragover|dragstart|drop|error|load|toggle)$/i,
	'HTMLFormElement': /on(reset|submit)$/i,
	'HTMLInputElement': /on(cancel|invalid|select)$/i,
	'HTMLMediaElement': /on(canplay|canplaythrough|durationchange|emptied|ended|loadeddata|loadedmetadata|pause|play|playing|ratechange|seeked|seeking|stalled|suspend|timeupdate|volumechange|waiting)$/i,
	'Window': /on(resize)$/i,
};
jush.links.att_http = { 'Elements/meta#$val': /^(http-equiv)$/i };
jush.links.att = {
	'Global_attributes/$val': /^(accesskey|anchor|autocapitalize|autocorrect|autofocus|class|contenteditable|dir|draggable|enterkeyhint|exportparts|headingoffset|headingreset|hidden|id|inert|inputmode|is|itemid|itemprop|itemref|itemscope|itemtype|lang|nonce|part|popover|slot|spellcheck|style|tabindex|title|translate|virtualkeyboardpolicy|writingsuggestions)$/i,
	'Global_attributes/data-_star_': /^(data-.*)$/i,
	'Elements/$tag#$val': /^(abbr|accept|accept-charset|action|align|alink|allow|allowfullscreen|allowpaymentrequest|alpha|alt|archive|as|async|attributionsrc|autocomplete|autolocate|autoplay|axis|background|behavior|bgcolor|blocking|border|bottommargin|browsingtopics|capture|cellpadding|cellspacing|char|charoff|charset|checked|cite|classid|clear|closedby|codebase|codetype|color|colorspace|cols|colspan|command|commandfor|compact|content|controls|controlslist|coords|credentialless|crossorigin|csp|data|datetime|declare|decoding|default|defer|direction|dirname|disabled|disablepictureinpicture|disableremoteplayback|download|elementtiming|enctype|face|fetchpriority|for|form|formaction|formenctype|formmethod|formnovalidate|formtarget|frame|frameborder|headers|height|high|href|hreflang|hspace|http-equiv|imagesizes|imagesrcset|incremental|integrity|interestfor|ismap|kind|label|language|leftmargin|link|list|loading|longdesc|loop|low|marginheight|marginwidth|max|maxlength|media|method|min|minlength|moz-opaque|multiple|muted|name|nomodule|noresize|noshade|novalidate|onafterprint|onbeforeprint|onbeforeunload|onblur|onerror|onfocus|onhashchange|onlanguagechange|onload|onmessage|onmessageerror|onoffline|ononline|onpagehide|onpagereveal|onpageshow|onpageswap|onpopstate|onrejectionhandled|onresize|onstorage|onunhandledrejection|onunload|open|optimum|orient|pattern|ping|placeholder|playsinline|popovertarget|popovertargetaction|poster|preload|privateToken|profile|readonly|referrerpolicy|rel|required|results|rev|reversed|rightmargin|rows|rowspan|rules|sandbox|scope|scrollamount|scrolldelay|scrolling|selected|shadowrootclonable|shadowrootcustomelementregistry|shadowrootdelegatesfocus|shadowrootmode|shadowrootreferencetarget|shadowrootserializable|shadowrootslotassignment|shape|size|sizes|span|src|srcdoc|srclang|srcset|standby|start|step|summary|switch|target|text|topmargin|truespeed|type|usemap|valign|value|valuetype|version|vlink|vspace|watch|webkitdirectory|width|wrap|xmlns)$/i
};



jush.tr.http = { _0: /$/ };

jush.slugs.http = name => name.replace(/^(\d{3})\b.*/, '$1'); // status code links use only the number

jush.build_links2('http', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/$key', /(^(?:HTTP\/[0-9.]+\s+)?)/, /(:|$|(?= ))/gim, {
	'Status/$1': /(\d{3}\b.*)/,
	'Methods/$1': /(CONNECT|DELETE|GET|HEAD|OPTIONS|PATCH|POST|PUT|TRACE)/,
	'Headers/$1': /(Accept|Accept-CH|Accept-Encoding|Accept-Language|Accept-Patch|Accept-Post|Accept-Ranges|Access-Control-Allow-Credentials|Access-Control-Allow-Headers|Access-Control-Allow-Methods|Access-Control-Allow-Origin|Access-Control-Expose-Headers|Access-Control-Max-Age|Access-Control-Request-Headers|Access-Control-Request-Method|Activate-Storage-Access|Age|Allow|Alt-Svc|Alt-Used|Attribution-Reporting-Eligible|Attribution-Reporting-Register-Source|Attribution-Reporting-Register-Trigger|Authorization|Available-Dictionary|Cache-Control|Clear-Site-Data|Connection|Content-DPR|Content-Digest|Content-Disposition|Content-Encoding|Content-Language|Content-Length|Content-Location|Content-Range|Content-Security-Policy|Content-Security-Policy-Report-Only|Content-Type|Cookie|Critical-CH|Cross-Origin-Embedder-Policy|Cross-Origin-Embedder-Policy-Report-Only|Cross-Origin-Opener-Policy|Cross-Origin-Resource-Policy|DNT|DPR|Date|Device-Memory|Dictionary-ID|Downlink|ECT|ETag|Early-Data|Expect|Expect-CT|Expires|Forwarded|From|Host|Idempotency-Key|If-Match|If-Modified-Since|If-None-Match|If-Range|If-Unmodified-Since|Integrity-Policy|Integrity-Policy-Report-Only|Keep-Alive|Last-Modified|Link|Location|Max-Forwards|NEL|No-Vary-Search|Observe-Browsing-Topics|Origin|Origin-Agent-Cluster|Permissions-Policy|Permissions-Policy-Report-Only|Pragma|Prefer|Preference-Applied|Priority|Proxy-Authenticate|Proxy-Authorization|RTT|Range|Referer|Referrer-Policy|Refresh|Report-To|Reporting-Endpoints|Repr-Digest|Retry-After|Save-Data|Sec-Browsing-Topics|Sec-CH-DPR|Sec-CH-Device-Memory|Sec-CH-Prefers-Color-Scheme|Sec-CH-Prefers-Reduced-Motion|Sec-CH-Prefers-Reduced-Transparency|Sec-CH-UA|Sec-CH-UA-Arch|Sec-CH-UA-Bitness|Sec-CH-UA-Form-Factors|Sec-CH-UA-Full-Version|Sec-CH-UA-Full-Version-List|Sec-CH-UA-Mobile|Sec-CH-UA-Model|Sec-CH-UA-Platform|Sec-CH-UA-Platform-Version|Sec-CH-UA-WoW64|Sec-CH-Viewport-Height|Sec-CH-Viewport-Width|Sec-CH-Width|Sec-Fetch-Dest|Sec-Fetch-Mode|Sec-Fetch-Site|Sec-Fetch-Storage-Access|Sec-Fetch-User|Sec-GPC|Sec-Private-State-Token|Sec-Private-State-Token-Crypto-Version|Sec-Private-State-Token-Lifetime|Sec-Purpose|Sec-Redemption-Record|Sec-Speculation-Tags|Sec-WebSocket-Accept|Sec-WebSocket-Extensions|Sec-WebSocket-Key|Sec-WebSocket-Protocol|Sec-WebSocket-Version|Server|Server-Timing|Service-Worker|Service-Worker-Allowed|Service-Worker-Navigation-Preload|Set-Cookie|Set-Login|SourceMap|Speculation-Rules|Strict-Transport-Security|Supports-Loading-Mode|TE|Timing-Allow-Origin|Tk|Trailer|Transfer-Encoding|Upgrade|Upgrade-Insecure-Requests|Use-As-Dictionary|User-Agent|Vary|Via|Viewport-Width|WWW-Authenticate|Want-Content-Digest|Want-Repr-Digest|Warning|Width|X-Content-Type-Options|X-DNS-Prefetch-Control|X-Forwarded-For|X-Forwarded-Host|X-Forwarded-Proto|X-Frame-Options|X-Permitted-Cross-Domain-Policies|X-Powered-By|X-Robots-Tag|X-XSS-Protection)/,
});



jush.tr.igdb = { quo: /"/ };

jush.build_links2('igdb', 'https://api-docs.igdb.com/#$key', /(\b)/, /(\b)/gi, {
	'endpoints': /(POST|GET|DELETE)/,
	'$1': /(fields|exclude)/,
	'filters': /(where)/,
	'sorting': /(sort)/,
	'search-1': /(search)/,
	'pagination': /(limit|offset)/,
	'multi-query': /(query)/,
});



jush.tr.js = { php: jush.php, js_reg: /\s*\/(?![/*])/, js_obj: /\s*\{/, _1: /}/, js_code: /()/ };
jush.tr.js_code = { php: jush.php, quo: /"/, apo: /'/, js_bac: /`/, js_one: /\/\//, js_doc: /\/\*\*/, com: /\/\*/, num: jush.num, js_write: /(\b)(write(?:ln)?)(\()/, js_http: /(\.)(setRequestHeader|getResponseHeader)(\()/, js: /\{/, _3: /(<)(\/script)(>)/i, _2: /}/, _1: /[^.\])}$\w\s]/ };
jush.tr.js_write = { php: jush.php, js_reg: /\s*\/(?![/*])/, js_write_code: /()/ };
jush.tr.js_http = { php: jush.php, js_reg: /\s*\/(?![/*])/, js_http_code: /()/ };
jush.tr.js_write_code = { php: jush.php, quo: /"/, apo: /'/, js_bac: /`/, js_one: /\/\//, com: /\/\*/, num: jush.num, js_write: /\(/, _2: /\)/, _1: /[^\])}$\w\s]/ };
jush.tr.js_http_code = { php: jush.php, quo: /"/, apo: /'/, js_bac: /`/, js_one: /\/\//, com: /\/\*/, num: jush.num, js_http: /\(/, _2: /\)/, _1: /[^\])}$\w\s]/ };
jush.tr.js_one = { php: jush.php, _1: /\n/, _3: /(<)(\/script)(>)/i };
jush.tr.js_reg = { php: jush.php, esc: /\\/, js_reg_bra: /\[/, _1: /\/[a-z]*/i }; //! highlight regexp
jush.tr.js_reg_bra = { php: jush.php, esc: /\\/, _1: /]/ };
jush.tr.js_doc = { _1: /\*\// };
jush.tr.js_arr = { php: jush.php, quo: /"/, apo: /'/, js_bac: /`/, js_one: /\/\//, com: /\/\*/, num: jush.num, js_arr: /\[/, js_obj: /\{/, _1: /]/ };
jush.tr.js_obj = { php: jush.php, js_one: /\s*\/\//, com: /\s*\/\*/, js_val: /:/, _1: /\s*}/, js_key: /()/ };
jush.tr.js_val = { php: jush.php, quo: /"/, apo: /'/, js_bac: /`/, js_one: /\/\//, com: /\/\*/, num: jush.num, js_arr: /\[/, js_obj: /\{/, _1: /,|(?=})/ };
jush.tr.js_key = { php: jush.php, quo: /"/, apo: /'/, js_bac: /`/, js_one: /\/\//, com: /\/\*/, num: jush.num, _1: /(?=[:}])/ };
jush.tr.js_bac = { php: jush.php, esc: /\\/, js: /\$\{/, _1: /`/ };

jush.urls.js_write = 'https://developer.mozilla.org/en-US/docs/Web/API/$key/$val';
jush.urls.js_http = 'https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/$val';

jush.links.js_write = { 'Document': /^(write|writeln)$/ };
jush.links.js_http = { 'method': /^(setRequestHeader|getResponseHeader)$/ };

jush.slugs.js = (name, key) => (/_event$/.test(key) ? name.replace(/^on/, '') : name.replace(/\./g, '/')); // an event handler is documented on the page of its event, e.g. onclick in click_event
jush.slugs.js_doc = name => name.replace(/^@/, '');

// (\.) must be first so that e.g. .name is still looked up from the top; (?=\.) is for a dot not preceded by a word character, e.g. [].at
jush.build_links2('js', 'https://developer.mozilla.org/en-US/docs/$key', /(\.|\b|(?=\.))/, /(\b)/g, {
	'Web/JavaScript/Reference/Global_Objects/$1': /(ArrayBuffer\.isView|Array\.from|Array\.fromAsync|Array\.isArray|Array\.of|Atomics\.add|Atomics\.and|Atomics\.compareExchange|Atomics\.exchange|Atomics\.isLockFree|Atomics\.load|Atomics\.notify|Atomics\.or|Atomics\.pause|Atomics\.store|Atomics\.sub|Atomics\.wait|Atomics\.waitAsync|Atomics\.xor|BigInt\.asIntN|BigInt\.asUintN|Date\.UTC|Date\.now|Date\.parse|Error\.captureStackTrace|Error\.isError|Error\.stackTraceLimit|Intl\.getCanonicalLocales|Intl\.supportedValuesOf|Iterator\.concat|Iterator\.from|Iterator\.zip|Iterator\.zipKeyed|JSON\.isRawJSON|JSON\.parse|JSON\.rawJSON|JSON\.stringify|Map\.groupBy|Math\.E|Math\.LN10|Math\.LN2|Math\.LOG10E|Math\.LOG2E|Math\.PI|Math\.SQRT1_2|Math\.SQRT2|Math\.abs|Math\.acos|Math\.acosh|Math\.asin|Math\.asinh|Math\.atan|Math\.atan2|Math\.atanh|Math\.cbrt|Math\.ceil|Math\.clz32|Math\.cos|Math\.cosh|Math\.exp|Math\.expm1|Math\.f16round|Math\.floor|Math\.fround|Math\.hypot|Math\.imul|Math\.log|Math\.log10|Math\.log1p|Math\.log2|Math\.max|Math\.min|Math\.pow|Math\.random|Math\.round|Math\.sign|Math\.sin|Math\.sinh|Math\.sqrt|Math\.sumPrecise|Math\.tan|Math\.tanh|Math\.trunc|Number\.EPSILON|Number\.MAX_SAFE_INTEGER|Number\.MAX_VALUE|Number\.MIN_SAFE_INTEGER|Number\.MIN_VALUE|Number\.NEGATIVE_INFINITY|Number\.NaN|Number\.POSITIVE_INFINITY|Number\.isFinite|Number\.isInteger|Number\.isNaN|Number\.isSafeInteger|Number\.parseFloat|Number\.parseInt|Object\.assign|Object\.create|Object\.defineProperties|Object\.defineProperty|Object\.entries|Object\.freeze|Object\.fromEntries|Object\.getOwnPropertyDescriptor|Object\.getOwnPropertyDescriptors|Object\.getOwnPropertyNames|Object\.getOwnPropertySymbols|Object\.getPrototypeOf|Object\.groupBy|Object\.hasOwn|Object\.is|Object\.isExtensible|Object\.isFrozen|Object\.isSealed|Object\.keys|Object\.preventExtensions|Object\.seal|Object\.setPrototypeOf|Object\.values|Promise\.all|Promise\.allKeyed|Promise\.allSettled|Promise\.allSettledKeyed|Promise\.any|Promise\.race|Promise\.reject|Promise\.resolve|Promise\.try|Promise\.withResolvers|Proxy\.revocable|Reflect\.apply|Reflect\.construct|Reflect\.defineProperty|Reflect\.deleteProperty|Reflect\.get|Reflect\.getOwnPropertyDescriptor|Reflect\.getPrototypeOf|Reflect\.has|Reflect\.isExtensible|Reflect\.ownKeys|Reflect\.preventExtensions|Reflect\.set|Reflect\.setPrototypeOf|RegExp\.escape|RegExp\.input|RegExp\.lastMatch|RegExp\.lastParen|RegExp\.leftContext|RegExp\.n|RegExp\.rightContext|String\.fromCharCode|String\.fromCodePoint|String\.raw|Symbol\.asyncDispose|Symbol\.asyncIterator|Symbol\.dispose|Symbol\.for|Symbol\.hasInstance|Symbol\.isConcatSpreadable|Symbol\.iterator|Symbol\.keyFor|Symbol\.match|Symbol\.matchAll|Symbol\.replace|Symbol\.search|Symbol\.species|Symbol\.split|Symbol\.toPrimitive|Symbol\.toStringTag|Symbol\.unscopables|TypedArray\.BYTES_PER_ELEMENT|TypedArray\.from|TypedArray\.of|Uint8Array\.fromBase64|Uint8Array\.fromHex|AbstractModuleSource|AggregateError|Array|ArrayBuffer|AsyncDisposableStack|AsyncFunction|AsyncGenerator|AsyncGeneratorFunction|AsyncIterator|Atomics|BigInt|BigInt64Array|BigUint64Array|Boolean|DataView|Date|DisposableStack|Error|EvalError|FinalizationRegistry|Float16Array|Float32Array|Float64Array|Function|Generator|GeneratorFunction|Infinity|Int16Array|Int32Array|Int8Array|InternalError|Intl|Iterator|JSON|Map|Math|NaN|Number|Object|Promise|Proxy|RangeError|ReferenceError|Reflect|RegExp|Set|SharedArrayBuffer|String|SuppressedError|Symbol|SyntaxError|Temporal|TypeError|TypedArray|URIError|Uint16Array|Uint32Array|Uint8Array|Uint8ClampedArray|WeakMap|WeakRef|WeakSet|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|escape|eval|globalThis|isFinite|isNaN|parseFloat|parseInt|undefined|unescape)/,
	'Web/JavaScript/Reference/Statements/$1': /(break|class|const|continue|debugger|export|for|function|import|let|return|switch|throw|using|var|while|with)/,
	'Web/JavaScript/Reference/Statements/do...while': /(do)/,
	'Web/JavaScript/Reference/Statements/if...else': /(if|else)/,
	'Web/JavaScript/Reference/Statements/try...catch': /(try|catch|finally)/,
	'Web/JavaScript/Reference/Operators/$1': /(delete|in|instanceof|new|this|typeof|void)/,
	'Web/JavaScript/Reference/Lexical_grammar#boolean_literal': /(true|false)/,
	'Web/JavaScript/Reference/Operators/null': /(null)/,
	'Web/API/Document/$1': /(alinkColor|anchors|applets|bgColor|body|characterSet|compatMode|contentType|cookie|defaultView|designMode|doctype|documentElement|domain|embeds|fgColor|forms|images|implementation|lastModified|linkColor|links|plugins|referrer|styleSheets|title|URL|vlinkColor|clear|createAttribute|createDocumentFragment|createElement|createElementNS|createEvent|createNSResolver|createRange|createTextNode|createTreeWalker|evaluate|execCommand|getElementById|getElementsByName|importNode|queryCommandEnabled|queryCommandState|write|writeln)/,
	'Web/API/Element/$1': /(attributes|className|clientHeight|clientLeft|clientTop|clientWidth|id|innerHTML|localName|namespaceURI|prefix|scrollHeight|scrollLeft|scrollTop|scrollWidth|tagName|getAttribute|getAttributeNS|getAttributeNode|getAttributeNodeNS|getElementsByTagName|getElementsByTagNameNS|hasAttribute|hasAttributeNS|hasAttributes|removeAttribute|removeAttributeNS|removeAttributeNode|scrollIntoView|setAttribute|setAttributeNS|setAttributeNode|setAttributeNodeNS)/,
	'Web/API/Node/$1': /(childNodes|firstChild|lastChild|nextSibling|nodeName|nodeType|nodeValue|ownerDocument|parentNode|previousSibling|textContent|appendChild|cloneNode|hasChildNodes|insertBefore|normalize|removeChild|replaceChild)/,
	'Web/API/HTMLElement/$1': /(dir|lang|offsetHeight|offsetLeft|offsetParent|offsetTop|offsetWidth|style|tabIndex|blur|click|focus)/,
	'Web/API/EventTarget/$1': /(addEventListener|dispatchEvent|removeEventListener)/,
	'Web/API/MouseEvent/$1': /(altKey|button|clientX|clientY|ctrlKey|layerX|layerY|metaKey|pageX|pageY|relatedTarget|screenX|screenY|shiftKey|initMouseEvent)/,
	'Web/API/Event/$1': /(bubbles|cancelBubble|cancelable|currentTarget|eventPhase|explicitOriginalTarget|originalTarget|target|timeStamp|type|initEvent|stopPropagation|preventDefault)/,
	'Web/API/UIEvent/$1': /(detail|view|which|initUIEvent)/,
	'Web/API/HTMLFormElement/$1': /(elements|name|acceptCharset|action|enctype|encoding|method|submit|reset)/,
	'Web/API/HTMLTableElement/$1': /(caption|tHead|tFoot|rows|tBodies|align|border|cellPadding|cellSpacing|frame|rules|summary|width|createTHead|deleteTHead|createTFoot|deleteTFoot|createCaption|deleteCaption|insertRow|deleteRow)/,
	'Web/API/Window/$1': /(closed|crypto|document|frameElement|frames|history|innerHeight|innerWidth|location|locationbar|menubar|navigator|opener|outerHeight|outerWidth|parent|personalbar|screen|top|scrollbars|scrollMaxX|scrollMaxY|scrollX|scrollY|self|status|statusbar|toolbar|window|alert|atob|btoa|captureEvents|clearInterval|clearTimeout|close|confirm|dump|find|getComputedStyle|getSelection|moveBy|moveTo|open|print|prompt|releaseEvents|resizeBy|resizeTo|scroll|scrollBy|scrollByLines|scrollByPages|scrollTo|setInterval|setTimeout|sizeToContent|stop)/,
	'Web/API/Screen/$1': /(availHeight|availWidth|colorDepth|height|pixelDepth)/,
	'Web/API/History/$1': /(back|forward)/,
	'Web/API/Element/$1_event': /(onblur|onclick|ondblclick|onfocus|onkeydown|onkeypress|onkeyup|onmousedown|onmousemove|onmouseout|onmouseover|onmouseup|onscroll)/,
	'Web/API/HTMLElement/$1_event': /(onchange)/,
	'Web/API/Window/$1_event': /(onresize|onerror|onload|onunload)/,
	'Web/API/HTMLMediaElement/$1_event': /(onabort)/,
	'Web/API/HTMLDialogElement/$1_event': /(onclose)/,
	'Web/API/HTMLFormElement/$1_event': /(onreset|onsubmit)/,
	'Web/API/HTMLInputElement/$1_event': /(onselect)/,
	'Web/API/XMLHttpRequest': /(XMLHttpRequest)/,
	'Web/API/XMLHttpRequest/$1': /(\.)(abort|getAllResponseHeaders|getResponseHeader|overrideMimeType|send|setAttributionReporting|setPrivateToken|setRequestHeader)/,
	'Web/JavaScript/Reference/Global_Objects/Array/$1': /(\.)(at|concat|copyWithin|entries|every|fill|filter|find|findIndex|findLast|findLastIndex|flat|flatMap|forEach|includes|indexOf|join|keys|lastIndexOf|length|map|pop|push|reduce|reduceRight|reverse|shift|slice|some|sort|splice|toLocaleString|toReversed|toSorted|toSpliced|toString|unshift|values|with)/,
	'Web/JavaScript/Reference/Global_Objects/Date/$1': /(\.)(getDate|getDay|getFullYear|getHours|getMilliseconds|getMinutes|getMonth|getSeconds|getTime|getTimezoneOffset|getUTCDate|getUTCDay|getUTCFullYear|getUTCHours|getUTCMilliseconds|getUTCMinutes|getUTCMonth|getUTCSeconds|getYear|setDate|setFullYear|setHours|setMilliseconds|setMinutes|setMonth|setSeconds|setTime|setUTCDate|setUTCFullYear|setUTCHours|setUTCMilliseconds|setUTCMinutes|setUTCMonth|setUTCSeconds|setYear|toDateString|toISOString|toJSON|toLocaleDateString|toLocaleString|toLocaleTimeString|toString|toTemporalInstant|toTimeString|toUTCString|valueOf)/,
	'Web/JavaScript/Reference/Global_Objects/Function/$1': /(\.)(apply|arguments|bind|call|caller|displayName|length|name|prototype|toString)/,
	'Web/JavaScript/Reference/Global_Objects/Number/$1': /(\.)(toExponential|toFixed|toLocaleString|toPrecision|toString|valueOf)/,
	'Web/JavaScript/Reference/Global_Objects/RegExp/$1': /(\.)(compile|dotAll|exec|flags|global|hasIndices|ignoreCase|lastIndex|multiline|source|sticky|test|toString|unicode|unicodeSets)/,
	'Web/JavaScript/Reference/Global_Objects/String/$1': /(\.)(anchor|at|big|blink|bold|charAt|charCodeAt|codePointAt|concat|endsWith|fixed|fontcolor|fontsize|includes|indexOf|isWellFormed|italics|lastIndexOf|length|link|localeCompare|match|matchAll|normalize|padEnd|padStart|repeat|replace|replaceAll|search|slice|small|split|startsWith|strike|sub|substr|substring|sup|toLocaleLowerCase|toLocaleUpperCase|toLowerCase|toString|toUpperCase|toWellFormed|trim|trimEnd|trimStart|valueOf)/,
}); // collisions: bgColor, length, name, open, target, title, width - the first interface wins, the (\.) members must stay last

// values of object and array literals are not highlighted by the js state
jush.build_links2('js_val', 'https://developer.mozilla.org/en-US/docs/$key', /(\b)/, /(\b)/g, {
	'Web/JavaScript/Reference/Lexical_grammar#boolean_literal': /(true|false)/,
	'Web/JavaScript/Reference/Operators/null': /(null)/,
});
jush.links2.js_arr = jush.links2.js_val;
jush.urls.js_arr = jush.urls.js_val;

jush.build_links2('js_doc', 'https://jsdoc.app/$key', /(^[ \t]*|\n\s*\*\s*|(?={))/, /(\b)/g, {
	'tags-$1': /(@(?:abstract|access|alias|async|augments|author|borrows|callback|class|classdesc|constant|constructs|copyright|default|deprecated|description|enum|event|example|exports|external|file|fires|function|generator|global|hideconstructor|ignore|implements|inheritdoc|inner|instance|interface|kind|lends|license|listens|member|memberof|mixes|mixin|module|name|namespace|override|package|param|private|property|protected|public|readonly|requires|returns|see|since|static|summary|this|throws|todo|tutorial|type|typedef|variation|version|yields))/,
	'tags-abstract': /(@virtual)/,
	'tags-augments': /(@extends)/,
	'tags-class': /(@constructor)/,
	'tags-constant': /(@const)/,
	'tags-default': /(@defaultvalue)/,
	'tags-description': /(@desc)/,
	'tags-external': /(@host)/,
	'tags-file': /(@fileoverview|@overview)/,
	'tags-fires': /(@emits)/,
	'tags-function': /(@func|@method)/,
	'tags-inline-link': /(\{@link|\{@linkcode|\{@linkplain)/,
	'tags-inline-tutorial': /(\{@tutorial)/,
	'tags-member': /(@var)/,
	'tags-param': /(@arg|@argument)/,
	'tags-property': /(@prop)/,
	'tags-returns': /(@return)/,
	'tags-throws': /(@exception)/,
	'tags-yields': /(@yield)/,
});



jush.tr.json = { json_obj: /\{/, json_arr: /\[/, quo: /"/, num: /-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/i };
jush.tr.json_obj = { json_val: /:/, _1: /\s*}/, json_key: /()/ };
jush.tr.json_key = { quo: /"/, _1: /(?=[:}])/ };
jush.tr.json_val = { json_obj: /\{/, json_arr: /\[/, quo: /"/, num: /-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/i, _1: /,|(?=})/ };
jush.tr.json_arr = { json_obj: /\{/, json_arr: /\[/, quo: /"/, num: /-?\d+(?:\.\d+)?(?:e[-+]?\d+)?/i, _1: /]/ };

jush.build_links2('json_val', '', /(\b)/, /(\b)/g, { // empty key - highlight without a link
	'': /(true|false|null)/,
});
jush.links2.json = jush.links2.json_arr = jush.links2.json_val;
jush.urls.json = jush.urls.json_arr = jush.urls.json_val;



jush.tr.mssql = { sqlite_apo: /'/, sqlite_quo: /"/, one: /--/, com: /\/\*/, mssql_bra: /\[/, num: jush.num }; // QUOTED IDENTIFIER = OFF
jush.tr.mssql_bra = { _0: /]]/, _1: /]/ };

jush.autocompleting.sql.push('mssql', 'mssql_bra', 'sqlite_quo'); // mssql_bra and sqlite_quo are quoted identifiers

jush.slugs.mssql = name => name.toLowerCase().replace(/[\s_]+/g, '-'); // CREATE TABLE -> create-table, sql_variant -> sql-variant

jush.build_links2('mssql', 'https://learn.microsoft.com/sql/$key', /(\b)/, /(\b)/gi, {
	't-sql/statements/add-signature-transact-sql': /(ADD(?:\s+COUNTER)?\s+SIGNATURE)/,
	't-sql/language-elements/begin-distributed-transaction-transact-sql': /(BEGIN\s+DISTRIBUTED\s+(?:TRANSACTION|TRAN))/,
	't-sql/language-elements/begin-transaction-transact-sql': /(BEGIN\s+(?:TRANSACTION|TRAN))/,
	't-sql/data-types/binary-and-varbinary-transact-sql': /((?:var)?binary)/,
	't-sql/data-types/$1-transact-sql': /(bit|date|datetime|datetime2|datetimeoffset|rowversion|smalldatetime|sql_variant|time|uniqueidentifier)/,
	't-sql/language-elements/try-catch-transact-sql': /(CATCH|TRY)/,
	't-sql/data-types/char-and-varchar-transact-sql': /((?:var)?char)/,
	't-sql/statements/close-symmetric-key-transact-sql': /(CLOSE\s+(?:SYMMETRIC\s+KEY|ALL\s+SYMMETRIC\s+KEYS))/,
	't-sql/statements/collations': /(COLLATE)/,
	't-sql/language-elements/commit-transaction-transact-sql': /(COMMIT(?:\s+(?:TRANSACTION|TRAN))?)/,
	'https://learn.microsoft.com/previous-versions/sql/sql-server-2008-r2/ms181708(v=sql.105)': /(COMPUTE)/,
	't-sql/language-elements/while-transact-sql': /(CONTINUE|WHILE)/,
	't-sql/data-types/decimal-and-numeric-transact-sql': /(decimal|numeric)/,
	't-sql/language-elements/else-if-else-transact-sql': /(ELSE)/,
	't-sql/language-elements/set-operators-except-and-intersect-transact-sql': /(EXCEPT|INTERSECT)/,
	't-sql/statements/execute-as-transact-sql': /((?:EXECUTE|EXEC)\s+AS)/,
	't-sql/language-elements/execute-transact-sql': /(EXEC|EXECUTE)/,
	't-sql/data-types/float-and-real-transact-sql': /(float|real)/,
	't-sql/queries/select-$1-clause-transact-sql': /(FOR|INTO|ORDER\s+BY|OVER)/,
	't-sql/spatial-geography/spatial-types-geography': /(geography)/,
	't-sql/spatial-geometry/spatial-types-geometry-transact-sql': /(geometry)/,
	't-sql/language-elements/sql-server-utilities-statements-$1': /(GO)/,
	't-sql/queries/select-$1-transact-sql': /(GROUP\s+BY|HAVING)/,
	't-sql/data-types/$1-data-type-method-reference': /(hierarchyid)/,
	't-sql/statements/create-table-transact-sql-$1-property': /(IDENTITY)/,
	't-sql/language-elements/$1-else-transact-sql': /(IF)/,
	't-sql/data-types/int-bigint-smallint-and-tinyint-transact-sql': /((?:big|small|tiny)?int)/,
	't-sql/queries/is-null-transact-sql': /(IS(?:\s+NOT)?\s+NULL)/,
	't-sql/data-types/money-and-smallmoney-transact-sql': /((?:small)?money)/,
	't-sql/data-types/nchar-and-nvarchar-transact-sql': /(nchar|nvarchar)/,
	't-sql/data-types/ntext-text-and-image-transact-sql': /(image|ntext|text)/,
	't-sql/queries/$1-clause-transact-sql': /(OPTION|OUTPUT)/,
	't-sql/language-elements/some-any-transact-sql': /(ANY|SOME)/,
	't-sql/language-elements/set-operators-$1-transact-sql': /(UNION)/,
	't-sql/functions/$1-transact-sql': /(NEXT\s+VALUE\s+FOR|VAR|XACT_STATE|(?:ABS|ACOS|AI_ANALYZE_SENTIMENT|AI_CLASSIFY|AI_EXTRACT|AI_FIX_GRAMMAR|AI_GENERATE_CHUNKS|AI_GENERATE_EMBEDDINGS|AI_GENERATE_RESPONSE|AI_SUMMARIZE|AI_TRANSLATE|ANY_VALUE|APPLOCK_MODE|APPLOCK_TEST|APPROX_COUNT_DISTINCT|APPROX_PERCENTILE_CONT|APPROX_PERCENTILE_DISC|APP_NAME|ASCII|ASIN|ASSEMBLYPROPERTY|ASYMKEYPROPERTY|ASYMKEY_ID|ATAN|ATN2|AVG|BASE64_DECODE|BASE64_ENCODE|BINARY_CHECKSUM|BIT_COUNT|CEILING|CERTENCODED|CERTPRIVATEKEY|CHAR|CHARINDEX|CHECKSUM|CHECKSUM_AGG|COLUMNPROPERTY|COLUMNS_UPDATED|COL_LENGTH|COL_NAME|COMPRESS|CONCAT|CONCAT_WS|CONNECTIONPROPERTY|CONTEXT_INFO|COS|COT|COUNT|COUNT_BIG|CRYPT_GEN_RANDOM|CUME_DIST|CURRENT_DATE|CURRENT_REQUEST_ID|CURRENT_TIMESTAMP|CURRENT_TIMEZONE|CURRENT_TIMEZONE_ID|CURRENT_TRANSACTION_ID|CURRENT_USER|CURSOR_STATUS|CertProperty|Cert_ID|DATABASEPROPERTYEX|DATABASE_PRINCIPAL_ID|DATALENGTH|DATEADD|DATEDIFF|DATEDIFF_BIG|DATEFROMPARTS|DATENAME|DATEPART|DATETIME2FROMPARTS|DATETIMEFROMPARTS|DATETIMEOFFSETFROMPARTS|DATETRUNC|DATE_BUCKET|DAY|DB_ID|DB_NAME|DECOMPRESS|DECRYPTBYASYMKEY|DECRYPTBYCERT|DECRYPTBYKEY|DECRYPTBYKEYAUTOASYMKEY|DECRYPTBYKEYAUTOCERT|DECRYPTBYPASSPHRASE|DEGREES|DENSE_RANK|DIFFERENCE|EDGE_ID_FROM_PARTS|EDIT_DISTANCE|EDIT_DISTANCE_SIMILARITY|ENCRYPTBYASYMKEY|ENCRYPTBYCERT|ENCRYPTBYKEY|ENCRYPTBYPASSPHRASE|EOMONTH|ERROR_LINE|ERROR_MESSAGE|ERROR_NUMBER|ERROR_PROCEDURE|ERROR_SEVERITY|ERROR_STATE|EVENTDATA|EXP|FILEGROUPPROPERTY|FILEGROUP_ID|FILEGROUP_NAME|FILEPROPERTY|FILEPROPERTYEX|FILE_ID|FILE_IDEX|FILE_NAME|FIRST_VALUE|FLOOR|FORMAT|FORMATMESSAGE|FULLTEXTCATALOGPROPERTY|FULLTEXTSERVICEPROPERTY|GENERATE_SERIES|GETANSINULL|GETDATE|GETUTCDATE|GET_BIT|GET_FILESTREAM_TRANSACTION_CONTEXT|GRAPH_ID_FROM_EDGE_ID|GRAPH_ID_FROM_NODE_ID|GROUPING|GROUPING_ID|HASHBYTES|HAS_DBACCESS|HAS_PERMS_BY_NAME|HOST_ID|HOST_NAME|IDENT_CURRENT|IDENT_INCR|IDENT_SEED|INDEXKEY_PROPERTY|INDEXPROPERTY|INDEX_COL|ISDATE|ISJSON|ISNULL|ISNUMERIC|IS_MEMBER|IS_OBJECTSIGNED|IS_ROLEMEMBER|IS_SRVROLEMEMBER|JARO_WINKLER_DISTANCE|JARO_WINKLER_SIMILARITY|JSON_ARRAY|JSON_ARRAYAGG|JSON_CONTAINS|JSON_MODIFY|JSON_OBJECT|JSON_OBJECTAGG|JSON_PATH_EXISTS|JSON_QUERY|JSON_VALUE|KEY_NAME|Key_GUID|Key_ID|LAG|LAST_VALUE|LEAD|LEFT|LEFT_SHIFT|LEN|LOG|LOG10|LOGINPROPERTY|LOWER|LTRIM|MAX|MIN|MIN_ACTIVE_ROWVERSION|MONTH|NCHAR|NEWID|NEWSEQUENTIALID|NODE_ID_FROM_PARTS|NTILE|OBJECTPROPERTY|OBJECTPROPERTYEX|OBJECT_DEFINITION|OBJECT_ID|OBJECT_ID_FROM_EDGE_ID|OBJECT_ID_FROM_NODE_ID|OBJECT_NAME|OBJECT_SCHEMA_NAME|OPENDATASOURCE|OPENJSON|OPENQUERY|OPENROWSET|OPENXML|ORIGINAL_DB_NAME|ORIGINAL_LOGIN|PARSENAME|PATINDEX|PERCENTILE_CONT|PERCENTILE_DISC|PERCENT_RANK|PERMISSIONS|PI|POWER|PWDCOMPARE|PWDENCRYPT|QUOTENAME|RADIANS|RAND|RANK|REGEXP_COUNT|REGEXP_INSTR|REGEXP_LIKE|REGEXP_MATCHES|REGEXP_REPLACE|REGEXP_SPLIT_TO_TABLE|REGEXP_SUBSTR|REPLACE|REPLICATE|REVERSE|RIGHT|RIGHT_SHIFT|ROUND|ROWCOUNT_BIG|ROW_NUMBER|RTRIM|SCHEMA_ID|SCHEMA_NAME|SCOPE_IDENTITY|SERVERPROPERTY|SESSIONPROPERTY|SESSION_CONTEXT|SESSION_ID|SESSION_USER|SET_BIT|SIGN|SIN|SMALLDATETIMEFROMPARTS|SOUNDEX|SPACE|SQL_VARIANT_PROPERTY|SQRT|SQUARE|STATS_DATE|STDEV|STDEVP|STR|STRING_AGG|STRING_ESCAPE|STRING_SPLIT|STUFF|SUBSTRING|SUM|SUSER_ID|SUSER_NAME|SUSER_SID|SUSER_SNAME|SWITCHOFFSET|SYMKEYPROPERTY|SYSDATETIME|SYSDATETIMEOFFSET|SYSTEM_USER|SYSUTCDATETIME|SignByAsymKey|SignByCert|TAN|TIMEFROMPARTS|TODATETIMEOFFSET|TRANSLATE|TRIGGER_NESTLEVEL|TRIM|TRY_CAST|TRY_CONVERT|TRY_PARSE|TYPEPROPERTY|TYPE_ID|TYPE_NAME|UNICODE|UNISTR|UPPER|USER|USER_ID|USER_NAME|VARP|VECTORPROPERTY|VECTOR_DISTANCE|VECTOR_NORM|VECTOR_NORMALIZE|VECTOR_SEARCH|VerifySignedByAsymKey|VerifySignedByCert|YEAR)(?=\s*\(|$))/,
	't-sql/xml/$1': /(WITH\s+XMLNAMESPACES|xml_schema_namespace(?=\s*\(|$))/,
	't-sql/queries/$1-common-table-expression-transact-sql': /(WITH)/,
	't-sql/statements/create-index-transact-sql': /(CREATE(?:\s+UNIQUE)?\s+INDEX)/,
	't-sql/data-types/$1-data-type': /(json|vector)/,
	't-sql/functions/cast-and-convert-transact-sql': /(CAST|CONVERT)(?=\s*\(|$)/,
	't-sql/functions/collation-functions-$1-transact-sql': /(COLLATIONPROPERTY|TERTIARY_WEIGHTS)(?=\s*\(|$)/,
	'relational-databases/system-functions/$1-transact-sql': /(CONTAINSTABLE|FREETEXTTABLE|PathName)(?=\s*\(|$)/,
	'https://learn.microsoft.com/previous-versions/sql/sql-server-2008-r2/ms176049(v=sql.105)': /(DATABASEPROPERTY)(?=\s*\(|$)/,
	't-sql/database-console-commands/$1-transact-sql': /(DBCC)(?=\s*\(|$)/,
	't-sql/functions/replication-functions-$1': /(PUBLISHINGSERVERNAME)(?=\s*\(|$)/,
	't-sql/functions/text-and-image-functions-$1-transact-sql': /(TEXTPTR|TEXTVALID)(?=\s*\(|$)/,
	't-sql/xml/xml-transact-sql': /(xml)(?=\s*\(|$)/,
	't-sql/functions/logical-functions-$1-transact-sql': /(CHOOSE|GREATEST|IIF|LEAST)(?=\s*\(|$)/,
	't-sql/functions/$1-aggregate-transact-sql': /(PRODUCT)(?=\s*\(|$)/,
	't-sql/statements/alter-database-transact-sql-set-hadr': /(ALTER\s+DATABASE\s+SET\s+HADR)/,
	't-sql/statements/$1-transact-sql': /(ADD\s+SENSITIVITY\s+CLASSIFICATION|ALTER\s+APPLICATION\s+ROLE|ALTER\s+ASSEMBLY|ALTER\s+ASYMMETRIC\s+KEY|ALTER\s+AUTHORIZATION|ALTER\s+AVAILABILITY\s+GROUP|ALTER\s+BROKER\s+PRIORITY|ALTER\s+CERTIFICATE|ALTER\s+COLUMN\s+ENCRYPTION\s+KEY|ALTER\s+CREDENTIAL|ALTER\s+CRYPTOGRAPHIC\s+PROVIDER|ALTER\s+DATABASE\s+AUDIT\s+SPECIFICATION|ALTER\s+DATABASE\s+ENCRYPTION\s+KEY|ALTER\s+DATABASE\s+SCOPED\s+CONFIGURATION|ALTER\s+DATABASE\s+SCOPED\s+CREDENTIAL|ALTER\s+DATABASE|ALTER\s+ENDPOINT|ALTER\s+EVENT\s+SESSION|ALTER\s+EXTERNAL\s+DATA\s+SOURCE|ALTER\s+EXTERNAL\s+LIBRARY|ALTER\s+EXTERNAL\s+MODEL|ALTER\s+EXTERNAL\s+RESOURCE\s+POOL|ALTER\s+FULLTEXT\s+CATALOG|ALTER\s+FULLTEXT\s+INDEX|ALTER\s+FULLTEXT\s+STOPLIST|ALTER\s+FUNCTION|ALTER\s+INDEX|ALTER\s+LOGIN|ALTER\s+MASTER\s+KEY|ALTER\s+MATERIALIZED\s+VIEW|ALTER\s+MESSAGE\s+TYPE|ALTER\s+PARTITION\s+FUNCTION|ALTER\s+PARTITION\s+SCHEME|ALTER\s+PROCEDURE|ALTER\s+QUEUE|ALTER\s+REMOTE\s+SERVICE\s+BINDING|ALTER\s+RESOURCE\s+GOVERNOR|ALTER\s+RESOURCE\s+POOL|ALTER\s+ROLE|ALTER\s+ROUTE|ALTER\s+SCHEMA|ALTER\s+SEARCH\s+PROPERTY\s+LIST|ALTER\s+SECURITY\s+POLICY|ALTER\s+SEQUENCE|ALTER\s+SERVER\s+AUDIT\s+SPECIFICATION|ALTER\s+SERVER\s+AUDIT|ALTER\s+SERVER\s+CONFIGURATION|ALTER\s+SERVER\s+ROLE|ALTER\s+SERVICE\s+MASTER\s+KEY|ALTER\s+SERVICE|ALTER\s+SYMMETRIC\s+KEY|ALTER\s+TABLE|ALTER\s+TRIGGER|ALTER\s+USER|ALTER\s+VIEW|ALTER\s+WORKLOAD\s+GROUP|ALTER\s+XML\s+SCHEMA\s+COLLECTION|BACKUP\s+CERTIFICATE|BACKUP\s+MASTER\s+KEY|BACKUP\s+SERVICE\s+MASTER\s+KEY|BACKUP\s+SYMMETRIC\s+KEY|BACKUP|BEGIN\s+CONVERSATION\s+TIMER|BEGIN\s+DIALOG\s+CONVERSATION|BULK\s+INSERT|CLOSE\s+MASTER\s+KEY|COPY\s+INTO|CREATE\s+AGGREGATE|CREATE\s+APPLICATION\s+ROLE|CREATE\s+ASSEMBLY|CREATE\s+ASYMMETRIC\s+KEY|CREATE\s+AVAILABILITY\s+GROUP|CREATE\s+BROKER\s+PRIORITY|CREATE\s+CERTIFICATE|CREATE\s+COLUMN\s+ENCRYPTION\s+KEY|CREATE\s+COLUMN\s+MASTER\s+KEY|CREATE\s+COLUMNSTORE\s+INDEX|CREATE\s+CONTRACT|CREATE\s+CREDENTIAL|CREATE\s+CRYPTOGRAPHIC\s+PROVIDER|CREATE\s+DATABASE\s+AUDIT\s+SPECIFICATION|CREATE\s+DATABASE\s+ENCRYPTION\s+KEY|CREATE\s+DATABASE\s+SCOPED\s+CREDENTIAL|CREATE\s+DATABASE|CREATE\s+DEFAULT|CREATE\s+ENDPOINT|CREATE\s+EVENT\s+NOTIFICATION|CREATE\s+EVENT\s+SESSION|CREATE\s+EXTERNAL\s+DATA\s+SOURCE|CREATE\s+EXTERNAL\s+FILE\s+FORMAT|CREATE\s+EXTERNAL\s+MODEL|CREATE\s+EXTERNAL\s+RESOURCE\s+POOL|CREATE\s+EXTERNAL\s+TABLE|CREATE\s+FULLTEXT\s+CATALOG|CREATE\s+FULLTEXT\s+INDEX|CREATE\s+FULLTEXT\s+STOPLIST|CREATE\s+FUNCTION|CREATE\s+JSON\s+INDEX|CREATE\s+LOGIN|CREATE\s+MASTER\s+KEY|CREATE\s+MESSAGE\s+TYPE|CREATE\s+PARTITION\s+FUNCTION|CREATE\s+PARTITION\s+SCHEME|CREATE\s+PROCEDURE|CREATE\s+QUEUE|CREATE\s+REMOTE\s+SERVICE\s+BINDING|CREATE\s+RESOURCE\s+POOL|CREATE\s+ROLE|CREATE\s+ROUTE|CREATE\s+RULE|CREATE\s+SCHEMA|CREATE\s+SEARCH\s+PROPERTY\s+LIST|CREATE\s+SECURITY\s+POLICY|CREATE\s+SELECTIVE\s+XML\s+INDEX|CREATE\s+SEQUENCE|CREATE\s+SERVER\s+AUDIT\s+SPECIFICATION|CREATE\s+SERVER\s+AUDIT|CREATE\s+SERVER\s+ROLE|CREATE\s+SERVICE|CREATE\s+SPATIAL\s+INDEX|CREATE\s+STATISTICS|CREATE\s+SYMMETRIC\s+KEY|CREATE\s+SYNONYM|CREATE\s+TABLE\s+AS\s+CLONE\s+OF|CREATE\s+TABLE|CREATE\s+TRIGGER|CREATE\s+TYPE|CREATE\s+USER|CREATE\s+VECTOR\s+INDEX|CREATE\s+VIEW|CREATE\s+WORKLOAD\s+GROUP|CREATE\s+XML\s+INDEX|CREATE\s+XML\s+SCHEMA\s+COLLECTION|DELETE|DENY|DISABLE\s+TRIGGER|DROP\s+AGGREGATE|DROP\s+APPLICATION\s+ROLE|DROP\s+ASSEMBLY|DROP\s+ASYMMETRIC\s+KEY|DROP\s+AVAILABILITY\s+GROUP|DROP\s+BROKER\s+PRIORITY|DROP\s+CERTIFICATE|DROP\s+COLUMN\s+ENCRYPTION\s+KEY|DROP\s+COLUMN\s+MASTER\s+KEY|DROP\s+CONTRACT|DROP\s+CREDENTIAL|DROP\s+CRYPTOGRAPHIC\s+PROVIDER|DROP\s+DATABASE\s+AUDIT\s+SPECIFICATION|DROP\s+DATABASE\s+ENCRYPTION\s+KEY|DROP\s+DATABASE\s+SCOPED\s+CREDENTIAL|DROP\s+DATABASE|DROP\s+DEFAULT|DROP\s+ENDPOINT|DROP\s+EVENT\s+NOTIFICATION|DROP\s+EVENT\s+SESSION|DROP\s+EXTERNAL\s+DATA\s+SOURCE|DROP\s+EXTERNAL\s+FILE\s+FORMAT|DROP\s+EXTERNAL\s+LIBRARY|DROP\s+EXTERNAL\s+MODEL|DROP\s+EXTERNAL\s+RESOURCE\s+POOL|DROP\s+EXTERNAL\s+TABLE|DROP\s+FULLTEXT\s+CATALOG|DROP\s+FULLTEXT\s+INDEX|DROP\s+FULLTEXT\s+STOPLIST|DROP\s+FUNCTION|DROP\s+INDEX|DROP\s+LOGIN|DROP\s+MASTER\s+KEY|DROP\s+MESSAGE\s+TYPE|DROP\s+PARTITION\s+FUNCTION|DROP\s+PARTITION\s+SCHEME|DROP\s+PROCEDURE|DROP\s+QUEUE|DROP\s+REMOTE\s+SERVICE\s+BINDING|DROP\s+RESOURCE\s+POOL|DROP\s+ROLE|DROP\s+ROUTE|DROP\s+RULE|DROP\s+SCHEMA|DROP\s+SEARCH\s+PROPERTY\s+LIST|DROP\s+SECURITY\s+POLICY|DROP\s+SENSITIVITY\s+CLASSIFICATION|DROP\s+SEQUENCE|DROP\s+SERVER\s+AUDIT\s+SPECIFICATION|DROP\s+SERVER\s+AUDIT|DROP\s+SERVER\s+ROLE|DROP\s+SERVICE|DROP\s+SIGNATURE|DROP\s+STATISTICS|DROP\s+SYMMETRIC\s+KEY|DROP\s+SYNONYM|DROP\s+TABLE|DROP\s+TRIGGER|DROP\s+TYPE|DROP\s+USER|DROP\s+VIEW|DROP\s+WORKLOAD\s+GROUP|DROP\s+XML\s+SCHEMA\s+COLLECTION|ENABLE\s+TRIGGER|END\s+CONVERSATION|GET\s+CONVERSATION\s+GROUP|GRANT|INSERT|MERGE|MOVE\s+CONVERSATION|OPEN\s+MASTER\s+KEY|OPEN\s+SYMMETRIC\s+KEY|RENAME|RESTORE\s+MASTER\s+KEY|RESTORE\s+SERVICE\s+MASTER\s+KEY|RESTORE\s+SYMMETRIC\s+KEY|REVERT|REVOKE|SEND|SET\s+ANSI_DEFAULTS|SET\s+ANSI_NULLS|SET\s+ANSI_NULL_DFLT_OFF|SET\s+ANSI_NULL_DFLT_ON|SET\s+ANSI_PADDING|SET\s+ANSI_WARNINGS|SET\s+ARITHABORT|SET\s+ARITHIGNORE|SET\s+CONCAT_NULL_YIELDS_NULL|SET\s+CONTEXT_INFO|SET\s+CURSOR_CLOSE_ON_COMMIT|SET\s+DATEFIRST|SET\s+DATEFORMAT|SET\s+DEADLOCK_PRIORITY|SET\s+FIPS_FLAGGER|SET\s+FMTONLY|SET\s+FORCEPLAN|SET\s+IDENTITY_INSERT|SET\s+IMPLICIT_TRANSACTIONS|SET\s+LANGUAGE|SET\s+LOCK_TIMEOUT|SET\s+NOCOUNT|SET\s+NOEXEC|SET\s+NUMERIC_ROUNDABORT|SET\s+OFFSETS|SET\s+PARSEONLY|SET\s+QUERY_GOVERNOR_COST_LIMIT|SET\s+QUOTED_IDENTIFIER|SET\s+REMOTE_PROC_TRANSACTIONS|SET\s+RESULT_SET_CACHING|SET\s+ROWCOUNT|SET\s+SHOWPLAN_ALL|SET\s+SHOWPLAN_TEXT|SET\s+SHOWPLAN_XML|SET\s+STATISTICS\s+IO|SET\s+STATISTICS\s+PROFILE|SET\s+STATISTICS\s+TIME|SET\s+STATISTICS\s+XML|SET\s+TEXTSIZE|SET\s+TRANSACTION\s+ISOLATION\s+LEVEL|SET\s+XACT_ABORT|TRUNCATE\s+TABLE|UPDATE\s+STATISTICS|(?:GET_TRANSMISSION_STATUS|RECEIVE|SETUSER)(?=\s*\(|$))/,
	't-sql/statements/$1-conversation-transact-sql': /(BEGIN\s+DIALOG)/,
	't-sql/language-elements/$1-end-transact-sql': /(BEGIN)/,
	't-sql/language-elements/$1-transact-sql': /(ALL|AND|BETWEEN|BREAK|CASE|CHECKPOINT|CLOSE|DEALLOCATE|DECLARE\s+CURSOR|EXISTS|FETCH|GOTO|IN|KILL\s+QUERY\s+NOTIFICATION\s+SUBSCRIPTION|KILL\s+STATS\s+JOB|KILL|LIKE|NOT|OPEN|OR|PRINT|RETURN|ROLLBACK\s+TRANSACTION|ROLLBACK\s+WORK|SAVE\s+TRANSACTION|SHUTDOWN|USE|WAITFOR|(?:COALESCE|NULLIF|RAISERROR|RECONFIGURE)(?=\s*\(|$))/,
	't-sql/language-elements/$1-local-variable-transact-sql': /(DECLARE)/,
	't-sql/language-elements/end-begin-end-transact-sql': /(END)/,
	't-sql/queries/$1-transact-sql': /(FROM|SELECT|TOP|UPDATE|UPDATETEXT|WHERE|WRITETEXT|(?:CONTAINS|FREETEXT|READTEXT)(?=\s*\(|$))/,
	't-sql/functions/$1-trigger-functions-transact-sql': /(UPDATE)(?=\s*\(|$)/,
	't-sql/statements/restore-statements-filelistonly-transact-sql': /(RESTORE\s+FILELISTONLY)/,
	't-sql/statements/restore-statements-headeronly-transact-sql': /(RESTORE\s+HEADERONLY)/,
	't-sql/statements/restore-statements-labelonly-transact-sql': /(RESTORE\s+LABELONLY)/,
	't-sql/statements/restore-statements-rewindonly-transact-sql': /(RESTORE\s+REWINDONLY)/,
	't-sql/statements/restore-statements-verifyonly-transact-sql': /(RESTORE\s+VERIFYONLY)/,
	't-sql/statements/$1-sql': /(SET\s+RECOMMENDATIONS)/,
	't-sql/statements/$1-statements-transact-sql': /(RESTORE|SET)/,
}); // collisions: IDENTITY



jush.tr.oracle = { sqlite_apo: /n?'/i, sqlite_quo: /"/, one: /--/, com: /\/\*/, num: /(?:\b[0-9]+\.?[0-9]*|\.[0-9]+)(?:e[+-]?[0-9]+)?[fd]?/i }; //! q'

jush.autocompleting.sql.push('oracle', 'sqlite_quo'); // sqlite_quo is a quoted identifier

jush.slugs.oracle = name => name.toUpperCase().replace(/\s+/g, '-'); // the pages are named after the construct: ALTER TABLE -> ALTER-TABLE

jush.build_links2('oracle', 'https://docs.oracle.com/en/database/oracle/oracle-database/19/sqlrf/$key', /(\b)/, /(\b)/gi, {
	'$1-Unified-Auditing.html': /(AUDIT|NOAUDIT)/,
	'SET-CONSTRAINTS.html': /(SET\s+CONSTRAINTS?)/,
	'$1.html': /(ADMINISTER\s+KEY\s+MANAGEMENT|ALTER\s+ANALYTIC\s+VIEW|ALTER\s+ATTRIBUTE\s+DIMENSION|ALTER\s+CLUSTER|ALTER\s+DATABASE\s+DICTIONARY|ALTER\s+DATABASE\s+LINK|ALTER\s+DATABASE|ALTER\s+DIMENSION|ALTER\s+DISKGROUP|ALTER\s+FLASHBACK\s+ARCHIVE|ALTER\s+FUNCTION|ALTER\s+HIERARCHY|ALTER\s+INDEX|ALTER\s+INDEXTYPE|ALTER\s+INMEMORY\s+JOIN\s+GROUP|ALTER\s+JAVA|ALTER\s+LIBRARY|ALTER\s+LOCKDOWN\s+PROFILE|ALTER\s+MATERIALIZED\s+VIEW\s+LOG|ALTER\s+MATERIALIZED\s+VIEW|ALTER\s+MATERIALIZED\s+ZONEMAP|ALTER\s+OPERATOR|ALTER\s+OUTLINE|ALTER\s+PACKAGE|ALTER\s+PLUGGABLE\s+DATABASE|ALTER\s+PROCEDURE|ALTER\s+PROFILE|ALTER\s+RESOURCE\s+COST|ALTER\s+ROLE|ALTER\s+ROLLBACK\s+SEGMENT|ALTER\s+SEQUENCE|ALTER\s+SESSION|ALTER\s+SYNONYM|ALTER\s+SYSTEM|ALTER\s+TABLE|ALTER\s+TABLESPACE\s+SET|ALTER\s+TABLESPACE|ALTER\s+TRIGGER|ALTER\s+TYPE|ALTER\s+USER|ALTER\s+VIEW|ANALYZE|ASSOCIATE\s+STATISTICS|CALL|COMMENT|COMMIT|CREATE\s+ANALYTIC\s+VIEW|CREATE\s+ATTRIBUTE\s+DIMENSION|CREATE\s+CLUSTER|CREATE\s+CONTEXT|CREATE\s+CONTROLFILE|CREATE\s+DATABASE\s+LINK|CREATE\s+DATABASE|CREATE\s+DIMENSION|CREATE\s+DIRECTORY|CREATE\s+DISKGROUP|CREATE\s+EDITION|CREATE\s+FLASHBACK\s+ARCHIVE|CREATE\s+FUNCTION|CREATE\s+HIERARCHY|CREATE\s+INDEX|CREATE\s+INDEXTYPE|CREATE\s+INMEMORY\s+JOIN\s+GROUP|CREATE\s+JAVA|CREATE\s+LIBRARY|CREATE\s+LOCKDOWN\s+PROFILE|CREATE\s+MATERIALIZED\s+VIEW\s+LOG|CREATE\s+MATERIALIZED\s+VIEW|CREATE\s+MATERIALIZED\s+ZONEMAP|CREATE\s+OPERATOR|CREATE\s+OUTLINE|CREATE\s+PACKAGE\s+BODY|CREATE\s+PACKAGE|CREATE\s+PFILE|CREATE\s+PLUGGABLE\s+DATABASE|CREATE\s+PROCEDURE|CREATE\s+PROFILE|CREATE\s+RESTORE\s+POINT|CREATE\s+ROLE|CREATE\s+ROLLBACK\s+SEGMENT|CREATE\s+SCHEMA|CREATE\s+SEQUENCE|CREATE\s+SPFILE|CREATE\s+SYNONYM|CREATE\s+TABLE|CREATE\s+TABLESPACE\s+SET|CREATE\s+TABLESPACE|CREATE\s+TRIGGER|CREATE\s+TYPE\s+BODY|CREATE\s+TYPE|CREATE\s+USER|CREATE\s+VIEW|DELETE|DISASSOCIATE\s+STATISTICS|DROP\s+ANALYTIC\s+VIEW|DROP\s+ATTRIBUTE\s+DIMENSION|DROP\s+CLUSTER|DROP\s+CONTEXT|DROP\s+DATABASE\s+LINK|DROP\s+DATABASE|DROP\s+DIMENSION|DROP\s+DIRECTORY|DROP\s+DISKGROUP|DROP\s+EDITION|DROP\s+FLASHBACK\s+ARCHIVE|DROP\s+FUNCTION|DROP\s+HIERARCHY|DROP\s+INDEX|DROP\s+INDEXTYPE|DROP\s+INMEMORY\s+JOIN\s+GROUP|DROP\s+JAVA|DROP\s+LIBRARY|DROP\s+LOCKDOWN\s+PROFILE|DROP\s+MATERIALIZED\s+VIEW\s+LOG|DROP\s+MATERIALIZED\s+VIEW|DROP\s+MATERIALIZED\s+ZONEMAP|DROP\s+OPERATOR|DROP\s+OUTLINE|DROP\s+PACKAGE|DROP\s+PLUGGABLE\s+DATABASE|DROP\s+PROCEDURE|DROP\s+PROFILE|DROP\s+RESTORE\s+POINT|DROP\s+ROLE|DROP\s+ROLLBACK\s+SEGMENT|DROP\s+SEQUENCE|DROP\s+SYNONYM|DROP\s+TABLE|DROP\s+TABLESPACE\s+SET|DROP\s+TABLESPACE|DROP\s+TRIGGER|DROP\s+TYPE\s+BODY|DROP\s+TYPE|DROP\s+USER|DROP\s+VIEW|EXPLAIN\s+PLAN|FLASHBACK\s+DATABASE|FLASHBACK\s+TABLE|GRANT|INSERT|LOCK\s+TABLE|MERGE|PURGE|RENAME|REVOKE|ROLLBACK|SAVEPOINT|SELECT|SET\s+ROLE|SET\s+TRANSACTION|TRUNCATE\s+CLUSTER|TRUNCATE\s+TABLE|UPDATE|abs|acos|add_months|approx_count|approx_count_distinct|approx_count_distinct_agg|approx_count_distinct_detail|approx_median|approx_percentile|approx_percentile_agg|approx_percentile_detail|approx_rank|approx_sum|ascii|asciistr|asin|atan|atan2|avg|bfilename|bin_to_num|bitand|bitmap_bit_position|bitmap_bucket_number|bitmap_construct_agg|bitmap_count|bitmap_or_agg|cardinality|cast|ceil|chartorowid|chr|cluster_details|cluster_distance|cluster_id|cluster_probability|cluster_set|coalesce|collation|collect|compose|con_dbid_to_id|con_guid_to_id|con_name_to_id|con_uid_to_id|concat|convert|corr|cos|cosh|count|covar_pop|covar_samp|cube_table|cume_dist|current_date|current_timestamp|cv|dataobj_to_mat_partition|dataobj_to_partition|dbtimezone|decode|decompose|dense_rank|depth|deref|dump|existsnode|exp|extractvalue|feature_compare|feature_details|feature_id|feature_set|feature_value|first|first_value|floor|from_tz|greatest|group_id|grouping|grouping_id|hextoraw|initcap|instr|iteration_number|json_array|json_arrayagg|json_dataguide|json_mergepatch|json_object|json_objectagg|json_query|json_serialize|json_table|json_value|lag|last|last_day|last_value|lead|least|length|listagg|ln|lnnvl|localtimestamp|log|lower|lpad|ltrim|make_ref|max|median|min|mod|months_between|nanvl|nchr|new_time|next_day|nls_charset_decl_len|nls_charset_id|nls_charset_name|nls_collation_id|nls_collation_name|nls_initcap|nls_lower|nls_upper|nlssort|nth_value|ntile|nullif|numtodsinterval|numtoyminterval|nvl|nvl2|ora_dm_partition_name|ora_dst_affected|ora_dst_convert|ora_dst_error|ora_hash|ora_invoking_user|ora_invoking_userid|path|percent_rank|percentile_cont|percentile_disc|power|powermultiset|powermultiset_by_cardinality|prediction|prediction_bounds|prediction_cost|prediction_details|prediction_probability|prediction_set|presentnnv|presentv|previous|rank|ratio_to_report|rawtohex|rawtonhex|ref|reftohex|regexp_count|regexp_instr|regexp_replace|regexp_substr|remainder|replace|row_number|rowidtochar|rowidtonchar|rpad|rtrim|scn_to_timestamp|sessiontimezone|set|sign|sin|sinh|soundex|sqrt|standard_hash|stats_binomial_test|stats_crosstab|stats_f_test|stats_ks_test|stats_mode|stats_mw_test|stats_one_way_anova|stats_wsr_test|stddev|stddev_pop|stddev_samp|substr|sum|sys_connect_by_path|sys_context|sys_dburigen|sys_extract_utc|sys_guid|sys_op_zone_id|sys_typeid|sys_xmlagg|sys_xmlgen|sysdate|systimestamp|tan|tanh|timestamp_to_scn|to_approx_count_distinct|to_approx_percentile|to_binary_double|to_binary_float|to_date|to_dsinterval|to_lob|to_multi_byte|to_nclob|to_number|to_single_byte|to_timestamp|to_timestamp_tz|to_utc_timestamp_tz|to_yminterval|translate|treat|trim|tz_offset|uid|unistr|upper|user|userenv|validate_conversion|value|var_pop|var_samp|variance|vsize|width_bucket|xmlagg|xmlcast|xmlcdata|xmlcolattval|xmlcomment|xmlconcat|xmldiff|xmlelement|xmlexists|xmlforest|xmlisvalid|xmlparse|xmlpatch|xmlpi|xmlquery|xmlroot|xmlsequence|xmlserialize|xmltable|xmltransform)/,
	'Data-Types.html': /(BFILE|BINARY_DOUBLE|BINARY_FLOAT|BLOB|CHAR|CLOB|DATE|INTERVAL\s+DAY|INTERVAL\s+YEAR|LONG\s+RAW|LONG|NCHAR|NCLOB|NUMBER|NVARCHAR2|RAW|ROWID|TIMESTAMP|UROWID|VARCHAR2)/,
	'CORR_A.html': /(corr_k|corr_s)/,
	'EMPTY_BLOB-EMPTY_CLOB.html': /(empty_blob|empty_clob)/,
	'$1-datetime.html': /(extract)/,
	'REGR_-Linear-Regression-Functions.html': /(regr_(?:slope|intercept|count|r2|avgx|avgy|sxx|syy|sxy))/,
	'$1-number.html': /(round|trunc)/,
	'STATS_T_TEST_.html': /(stats_t_test_indep|stats_t_test_indepu|stats_t_test_one|stats_t_test_paired)/,
	'$1-character.html': /(to_char|to_clob|to_nchar)/,
}); // collisions: IDENTITY, extract, round, to_char, to_nchar, translate, trunc



jush.tr.pgsql = { one: /--/, com_nest: /\/\*/, pgsql_pgsqlset: /(\s*)(SHOW|SET(?!\s+(?:CONSTRAINTS|ROLE|SESSION\s+AUTHORIZATION|TRANSACTION)\b))(\s+|$)/i, pgsql_pgsqlext: /(\b)((?:CREATE|ALTER|DROP)\s+EXTENSION)(\s+)/i, pgsql_code: /()/ }; // the beginning of a statement - SET elsewhere (e.g. UPDATE ... SET) is not the command, SET ROLE and similar are linked as phrases
jush.tr.pgsql_code = { sql_apo: /'/, sqlite_quo: /"/, pgsql_eot: /\$/, one: /--/, com_nest: /\/\*/, num: jush.num, _1: /;/ }; // standard_conforming_strings=off
jush.tr.pgsql_eot = { pgsql_eot2: /([a-z]\w*)?\$/i, _1: /()/ };
jush.tr.pgsql_eot2 = { }; // pgsql_eot2._2 to be set in pgsql_eot handler
jush.tr.pgsql_pgsqlset = { sql_apo: /'/, sqlite_quo: /"/, pgsql_eot: /\$/, one: /--/, com_nest: /\/\*/, num: jush.num, _1: /;|$/ };
jush.tr.pgsqlset = { _0: /$/ };
jush.tr.pgsql_pgsqlext = { one: /--/, com_nest: /\/\*/, _1: /(?=\s+(?:ADD|CASCADE|DROP|RESTRICT|SCHEMA|SET|UPDATE|VERSION|WITH)\b)|;|$/i }; // the names end before the next clause
jush.tr.pgsqlext = { _0: /$/ }; // an extension name

jush.autocompleting.sql.push('pgsql', 'pgsql_code', 'pgsql_pgsqlset', 'pgsql_eot2', 'sqlite_quo'); // pgsql_eot2 is a dollar-quoted body, sqlite_quo is a quoted identifier

jush.urls.pgsql_pgsqlset = 'https://www.postgresql.org/docs/current/$key';
jush.links.pgsql_pgsqlset = { 'sql-$val.html': /.+/ };
jush.urls.pgsql_pgsqlext = 'https://www.postgresql.org/docs/current/$key';
jush.links.pgsql_pgsqlext = { 'sql-createextension.html': /^CREATE/i, 'sql-alterextension.html': /^ALTER/i, 'sql-dropextension.html': /^DROP/i };

jush.slugs.pgsql = (name, key) => name.toLowerCase().replace(/(^|\s+)/g, (key == 'sql-$1.html' ? '' : '-'));
jush.slugs.pgsqlset = name => name.replace(/_/g, '-').toUpperCase();
jush.slugs.pgsqlext = (name, key) => (key == '$1.html' ? name.replace(/_/g, '') : name); // pg_stat_statements is on pgstatstatements.html, PGXN keeps the name

// Adminer replaces the base URL by the CockroachDB documentation, it has a page of each statement and type it shares with PostgreSQL; update/pgsql.php generates the lists
jush.link_key.pgsql = (key, url, name) => {
	if (!key || !/cockroachlabs/.test(url[0])) {
		return key;
	}
	const slug = name.toLowerCase().replace(/\s+/g, '-');
	const renamed = { 'begin': 'begin-transaction', 'commit': 'commit-transaction', 'rollback': 'rollback-transaction', 'select': 'select-clause', 'timestamptz': 'timestamp' };
	return (/^functions-/.test(key) ? 'functions-and-operators#' + slug // each function has an anchor
		: renamed[slug] || (/^(alter-database|alter-default-privileges|alter-function|alter-index|alter-policy|alter-procedure|alter-role|alter-schema|alter-sequence|alter-table|alter-type|alter-user|alter-view|bit|call|copy|create-database|create-function|create-index|create-policy|create-procedure|create-role|create-schema|create-sequence|create-statistics|create-table|create-table-as|create-trigger|create-type|create-user|create-view|date|delete|do|drop-database|drop-function|drop-index|drop-policy|drop-procedure|drop-role|drop-schema|drop-sequence|drop-table|drop-trigger|drop-type|drop-user|drop-view|explain|grant|inet|insert|interval|jsonb|point|polygon|reassign-owned|release-savepoint|revoke|savepoint|serial|set-transaction|time|timestamp|truncate|tsquery|tsvector|update|uuid)$/.test(slug) ? slug : (/^datatype-/.test(key) ? 'data-types' : ''))
	);
};

jush.build_links2('pgsql', 'https://www.postgresql.org/docs/current/$key', /(\b)/, /(\b)/gi, {
	'sql-alteropclass.html': /(ALTER\s+OPERATOR\s+CLASS)/,
	'sql-alteropfamily.html': /(ALTER\s+OPERATOR\s+FAMILY)/,
	'sql-altertsconfig.html': /(ALTER\s+TEXT\s+SEARCH\s+CONFIGURATION)/,
	'sql-altertsdictionary.html': /(ALTER\s+TEXT\s+SEARCH\s+DICTIONARY)/,
	'sql-altertsparser.html': /(ALTER\s+TEXT\s+SEARCH\s+PARSER)/,
	'sql-altertstemplate.html': /(ALTER\s+TEXT\s+SEARCH\s+TEMPLATE)/,
	'sql-createopclass.html': /(CREATE\s+OPERATOR\s+CLASS)/,
	'sql-createopfamily.html': /(CREATE\s+OPERATOR\s+FAMILY)/,
	'sql-createtsconfig.html': /(CREATE\s+TEXT\s+SEARCH\s+CONFIGURATION)/,
	'sql-createtsdictionary.html': /(CREATE\s+TEXT\s+SEARCH\s+DICTIONARY)/,
	'sql-createtsparser.html': /(CREATE\s+TEXT\s+SEARCH\s+PARSER)/,
	'sql-createtstemplate.html': /(CREATE\s+TEXT\s+SEARCH\s+TEMPLATE)/,
	'sql-dropopclass.html': /(DROP\s+OPERATOR\s+CLASS)/,
	'sql-dropopfamily.html': /(DROP\s+OPERATOR\s+FAMILY)/,
	'sql-droptsconfig.html': /(DROP\s+TEXT\s+SEARCH\s+CONFIGURATION)/,
	'sql-droptsdictionary.html': /(DROP\s+TEXT\s+SEARCH\s+DICTIONARY)/,
	'sql-droptsparser.html': /(DROP\s+TEXT\s+SEARCH\s+PARSER)/,
	'sql-droptstemplate.html': /(DROP\s+TEXT\s+SEARCH\s+TEMPLATE)/,
	'sql-rollback-to.html': /(ROLLBACK\s+TO\s+SAVEPOINT)/,
	'sql$1.html': /(COMMIT\s+PREPARED|CREATE\s+ACCESS\s+METHOD|DROP\s+ACCESS\s+METHOD|DROP\s+OWNED|PREPARE\s+TRANSACTION|REASSIGN\s+OWNED|RELEASE\s+SAVEPOINT|ROLLBACK\s+PREPARED|SECURITY\s+LABEL|SET\s+CONSTRAINTS|SET\s+ROLE|SET\s+SESSION\s+AUTHORIZATION|SET\s+TRANSACTION|START\s+TRANSACTION)/,
	'sql-$1.html': /(ABORT|ALTER\s+AGGREGATE|ALTER\s+COLLATION|ALTER\s+CONVERSION|ALTER\s+DATABASE|ALTER\s+DEFAULT\s+PRIVILEGES|ALTER\s+DOMAIN|ALTER\s+EVENT\s+TRIGGER|ALTER\s+EXTENSION|ALTER\s+FOREIGN\s+DATA\s+WRAPPER|ALTER\s+FOREIGN\s+TABLE|ALTER\s+FUNCTION|ALTER\s+GROUP|ALTER\s+INDEX|ALTER\s+LANGUAGE|ALTER\s+LARGE\s+OBJECT|ALTER\s+MATERIALIZED\s+VIEW|ALTER\s+OPERATOR|ALTER\s+POLICY|ALTER\s+PROCEDURE|ALTER\s+PUBLICATION|ALTER\s+ROLE|ALTER\s+ROUTINE|ALTER\s+RULE|ALTER\s+SCHEMA|ALTER\s+SEQUENCE|ALTER\s+SERVER|ALTER\s+STATISTICS|ALTER\s+SUBSCRIPTION|ALTER\s+SYSTEM|ALTER\s+TABLE|ALTER\s+TABLESPACE|ALTER\s+TRIGGER|ALTER\s+TYPE|ALTER\s+USER\s+MAPPING|ALTER\s+USER|ALTER\s+VIEW|ANALYZE|BEGIN|CALL|CHECKPOINT|CLOSE|CLUSTER|COMMENT|COMMIT|COPY|CREATE\s+AGGREGATE|CREATE\s+CAST|CREATE\s+COLLATION|CREATE\s+CONVERSION|CREATE\s+DATABASE|CREATE\s+DOMAIN|CREATE\s+EVENT\s+TRIGGER|CREATE\s+EXTENSION|CREATE\s+FOREIGN\s+DATA\s+WRAPPER|CREATE\s+FOREIGN\s+TABLE|CREATE\s+FUNCTION|CREATE\s+GROUP|CREATE\s+INDEX|CREATE\s+LANGUAGE|CREATE\s+MATERIALIZED\s+VIEW|CREATE\s+OPERATOR|CREATE\s+POLICY|CREATE\s+PROCEDURE|CREATE\s+PUBLICATION|CREATE\s+ROLE|CREATE\s+RULE|CREATE\s+SCHEMA|CREATE\s+SEQUENCE|CREATE\s+SERVER|CREATE\s+STATISTICS|CREATE\s+SUBSCRIPTION|CREATE\s+TABLE\s+AS|CREATE\s+TABLE|CREATE\s+TABLESPACE|CREATE\s+TRANSFORM|CREATE\s+TRIGGER|CREATE\s+TYPE|CREATE\s+USER\s+MAPPING|CREATE\s+USER|CREATE\s+VIEW|DEALLOCATE|DECLARE|DELETE|DISCARD|DO|DROP\s+AGGREGATE|DROP\s+CAST|DROP\s+COLLATION|DROP\s+CONVERSION|DROP\s+DATABASE|DROP\s+DOMAIN|DROP\s+EVENT\s+TRIGGER|DROP\s+EXTENSION|DROP\s+FOREIGN\s+DATA\s+WRAPPER|DROP\s+FOREIGN\s+TABLE|DROP\s+FUNCTION|DROP\s+GROUP|DROP\s+INDEX|DROP\s+LANGUAGE|DROP\s+MATERIALIZED\s+VIEW|DROP\s+OPERATOR|DROP\s+POLICY|DROP\s+PROCEDURE|DROP\s+PUBLICATION|DROP\s+ROLE|DROP\s+ROUTINE|DROP\s+RULE|DROP\s+SCHEMA|DROP\s+SEQUENCE|DROP\s+SERVER|DROP\s+STATISTICS|DROP\s+SUBSCRIPTION|DROP\s+TABLE|DROP\s+TABLESPACE|DROP\s+TRANSFORM|DROP\s+TRIGGER|DROP\s+TYPE|DROP\s+USER\s+MAPPING|DROP\s+USER|DROP\s+VIEW|END|EXECUTE|EXPLAIN|FETCH|GRANT|IMPORT\s+FOREIGN\s+SCHEMA|INSERT|LISTEN|LOAD|LOCK|MERGE|MOVE|NOTIFY|PREPARE|REFRESH\s+MATERIALIZED\s+VIEW|REINDEX|RESET|REVOKE|ROLLBACK|SAVEPOINT|SELECT\s+INTO|SELECT|TRUNCATE|UNLISTEN|UPDATE|VACUUM|VALUES)/,
	'datatype-numeric.html': /(smallint|bigint|integer|smallserial|bigserial|serial|numeric|real|double\s+precision)/,
	'datatype-money.html': /(money)/,
	'datatype-character.html': /(character\s+varying|character|varchar|char|text(?!\s*\())/, // text( is a function
	'datatype-binary.html': /(bytea)/,
	'datatype-datetime.html': /(timestamptz|timestamp|time|date|interval)/,
	'datatype-boolean.html': /(boolean)/,
	'datatype-geometric.html': /(point|line|lseg|box|path|polygon|circle)(?!\s*\()/, // the same names are also functions
	'datatype-net-types.html': /(cidr|inet|macaddr8|macaddr)/,
	'datatype-bit.html': /(bit\s+varying|bit)/,
	'datatype-textsearch.html': /(tsvector|tsquery)/,
	'datatype-uuid.html': /(uuid)/,
	'datatype-xml.html': /(xml)/,
	'datatype-json.html': /(jsonpath|jsonb|json(?!\s*\())/, // json( is a function
	'rangetypes.html': /(int4range|int8range|numrange|daterange|tsrange|tstzrange|int4multirange|int8multirange|nummultirange|datemultirange|tsmultirange|tstzmultirange)/,
	'functions-datetime.html': /(current_date|current_time|current_timestamp|localtime|localtimestamp|AT\s+TIME\s+ZONE|(?:age|clock_timestamp|date_add|date_bin|date_part|date_subtract|date_trunc|extract|isfinite|justify_days|justify_hours|justify_interval|make_date|make_interval|make_time|make_timestamp|make_timestamptz|now|statement_timestamp|timeofday|to_timestamp|transaction_timestamp)(?=\s*\(|$))/,
	'functions-info.html': /(current_catalog|current_role|current_schema|current_user|session_user|system_user|user|pg_snapshot|txid_snapshot|(?:acldefault|aclexplode|age|col_description|current_database|current_query|current_schemas|format_type|has_any_column_privilege|has_column_privilege|has_database_privilege|has_foreign_data_wrapper_privilege|has_function_privilege|has_language_privilege|has_largeobject_privilege|has_parameter_privilege|has_schema_privilege|has_sequence_privilege|has_server_privilege|has_table_privilege|has_tablespace_privilege|has_type_privilege|icu_unicode_version|inet_client_addr|inet_client_port|inet_server_addr|inet_server_port|makeaclitem|mxid_age|obj_description|pg_available_wal_summaries|pg_backend_pid|pg_basetype|pg_blocking_pids|pg_char_to_encoding|pg_collation_is_visible|pg_conf_load_time|pg_control_checkpoint|pg_control_init|pg_control_recovery|pg_control_system|pg_conversion_is_visible|pg_current_logfile|pg_current_snapshot|pg_current_xact_id|pg_current_xact_id_if_assigned|pg_describe_object|pg_encoding_to_char|pg_function_is_visible|pg_get_acl|pg_get_catalog_foreign_keys|pg_get_constraintdef|pg_get_expr|pg_get_function_arguments|pg_get_function_identity_arguments|pg_get_function_result|pg_get_functiondef|pg_get_indexdef|pg_get_keywords|pg_get_loaded_modules|pg_get_multixact_members|pg_get_object_address|pg_get_partition_constraintdef|pg_get_partkeydef|pg_get_ruledef|pg_get_serial_sequence|pg_get_statisticsobjdef|pg_get_triggerdef|pg_get_userbyid|pg_get_viewdef|pg_get_wal_summarizer_state|pg_has_role|pg_identify_object|pg_identify_object_as_address|pg_index_column_has_property|pg_index_has_property|pg_indexam_has_property|pg_input_error_info|pg_input_is_valid|pg_is_other_temp_schema|pg_jit_available|pg_last_committed_xact|pg_listening_channels|pg_my_temp_schema|pg_notification_queue_usage|pg_numa_available|pg_opclass_is_visible|pg_operator_is_visible|pg_opfamily_is_visible|pg_options_to_table|pg_postmaster_start_time|pg_safe_snapshot_blocking_pids|pg_settings_get_flags|pg_snapshot_xip|pg_snapshot_xmax|pg_snapshot_xmin|pg_statistics_obj_is_visible|pg_table_is_visible|pg_tablespace_databases|pg_tablespace_location|pg_trigger_depth|pg_ts_config_is_visible|pg_ts_dict_is_visible|pg_ts_parser_is_visible|pg_ts_template_is_visible|pg_type_is_visible|pg_typeof|pg_visible_in_snapshot|pg_wal_summary_contents|pg_xact_commit_timestamp|pg_xact_commit_timestamp_origin|pg_xact_status|row_security_active|shobj_description|to_regclass|to_regcollation|to_regnamespace|to_regoper|to_regoperator|to_regproc|to_regprocedure|to_regrole|to_regtype|to_regtypemod|txid_current|txid_current_if_assigned|txid_current_snapshot|txid_snapshot_xip|txid_snapshot_xmax|txid_snapshot_xmin|txid_status|txid_visible_in_snapshot|unicode_version|version)(?=\s*\(|$))/,
	'functions-logical.html': /(AND|NOT|OR)/,
	'functions-comparison.html': /(BETWEEN|(?:num_nonnulls|num_nulls)(?=\s*\(|$))/,
	'functions-matching.html': /(LIKE|SIMILAR\s+TO|(?:regexp_like)(?=\s*\(|$))/,
	'functions-conditional.html': /(CASE|WHEN|THEN|ELSE|(?:coalesce|greatest|least|nullif)(?=\s*\(|$))/,
	'functions-subquery.html': /(EXISTS|IN|ANY|SOME|ALL)/,
	'': /(ANALYSE|ARRAY|AS|ASC|ASYMMETRIC|AUTHORIZATION|BINARY|BOTH|CAST|CHECK|COLLATE|COLLATION|COLUMN|CONCURRENTLY|CONSTRAINT|CREATE|CROSS|DEFAULT|DEFERRABLE|DESC|DISTINCT|EXCEPT|FALSE|FOR|FOREIGN|FREEZE|FROM|FULL|GROUP|HAVING|ILIKE|INITIALLY|INNER|INTERSECT|INTO|IS|ISNULL|JOIN|LATERAL|LEADING|LEFT|LIMIT|NATURAL|NOTNULL|NULL|OFFSET|ON|ONLY|ORDER|OUTER|OVERLAPS|PLACING|PRIMARY|REFERENCES|RETURNING|RIGHT|SIMILAR|SYMMETRIC|TABLE|TABLESAMPLE|TO|TRAILING|TRUE|UNION|UNIQUE|USING|VARIADIC|VERBOSE|WHERE|WINDOW|WITH)/,
	'functions-math.html': /((?:abs|acos|acosd|acosh|asin|asind|asinh|atan|atan2|atan2d|atand|atanh|cbrt|ceil|ceiling|cos|cosd|cosh|cot|cotd|degrees|div|erf|erfc|exp|factorial|floor|gamma|gcd|lcm|lgamma|ln|log|log10|min_scale|mod|pi|power|radians|random|random_normal|round|scale|setseed|sign|sin|sind|sinh|sqrt|tan|tand|tanh|trim_scale|trunc|width_bucket)(?=\s*\(|$))/,
	'functions-string.html': /((?:ascii|bit_length|btrim|casefold|char_length|character_length|chr|concat|concat_ws|format|initcap|left|length|lower|lpad|ltrim|md5|normalize|octet_length|overlay|parse_ident|pg_client_encoding|position|quote_ident|quote_literal|quote_nullable|regexp_count|regexp_instr|regexp_like|regexp_match|regexp_matches|regexp_replace|regexp_split_to_array|regexp_split_to_table|regexp_substr|repeat|replace|reverse|right|rpad|rtrim|split_part|starts_with|string_to_array|string_to_table|strpos|substr|substring|to_ascii|to_bin|to_hex|to_oct|translate|trim|unicode_assigned|unistr|upper)(?=\s*\(|$))/,
	'functions-binarystring.html': /((?:bit_count|bit_length|btrim|convert|convert_from|convert_to|crc32|crc32c|decode|encode|get_bit|get_byte|length|ltrim|md5|octet_length|overlay|position|reverse|rtrim|set_bit|set_byte|sha224|sha256|sha384|sha512|substr|substring|trim)(?=\s*\(|$))/,
	'functions-formatting.html': /((?:to_char|to_date|to_number|to_timestamp)(?=\s*\(|$))/,
	'functions-geometry.html': /((?:area|bound_box|box|center|circle|diagonal|diameter|height|isclosed|isopen|length|line|lseg|npoints|path|pclose|point|polygon|popen|radius|slope|width)(?=\s*\(|$))/,
	'functions-net.html': /((?:abbrev|broadcast|family|host|hostmask|inet_merge|inet_same_family|macaddr8_set7bit|masklen|netmask|network|set_masklen|text|trunc)(?=\s*\(|$))/,
	'functions-sequence.html': /((?:currval|lastval|nextval|setval)(?=\s*\(|$))/,
	'functions-array.html': /((?:array_append|array_cat|array_dims|array_fill|array_length|array_lower|array_ndims|array_position|array_positions|array_prepend|array_remove|array_replace|array_reverse|array_sample|array_shuffle|array_sort|array_to_string|array_upper|cardinality|trim_array|unnest)(?=\s*\(|$))/,
	'functions-aggregate.html': /((?:any_value|array_agg|avg|bit_and|bit_or|bit_xor|bool_and|bool_or|corr|count|covar_pop|covar_samp|cume_dist|dense_rank|every|grouping|json_agg|json_agg_strict|json_arrayagg|json_object_agg|json_object_agg_strict|json_object_agg_unique|json_object_agg_unique_strict|json_objectagg|jsonb_agg|jsonb_agg_strict|jsonb_object_agg|jsonb_object_agg_strict|jsonb_object_agg_unique|jsonb_object_agg_unique_strict|max|min|mode|percent_rank|percentile_cont|percentile_disc|range_agg|range_intersect_agg|rank|regr_avgx|regr_avgy|regr_count|regr_intercept|regr_r2|regr_slope|regr_sxx|regr_sxy|regr_syy|stddev|stddev_pop|stddev_samp|string_agg|sum|var_pop|var_samp|variance|xmlagg)(?=\s*\(|$))/,
	'functions-srf.html': /((?:generate_series|generate_subscripts)(?=\s*\(|$))/,
	'functions-admin.html': /((?:brin_desummarize_range|brin_summarize_new_values|brin_summarize_range|current_setting|gin_clean_pending_list|pg_advisory_lock|pg_advisory_lock_shared|pg_advisory_unlock|pg_advisory_unlock_all|pg_advisory_unlock_shared|pg_advisory_xact_lock|pg_advisory_xact_lock_shared|pg_backup_start|pg_backup_stop|pg_cancel_backend|pg_clear_attribute_stats|pg_clear_relation_stats|pg_collation_actual_version|pg_column_compression|pg_column_size|pg_column_toast_chunk_id|pg_copy_logical_replication_slot|pg_copy_physical_replication_slot|pg_create_logical_replication_slot|pg_create_physical_replication_slot|pg_create_restore_point|pg_current_wal_flush_lsn|pg_current_wal_insert_lsn|pg_current_wal_lsn|pg_database_collation_actual_version|pg_database_size|pg_drop_replication_slot|pg_export_snapshot|pg_filenode_relation|pg_get_wal_replay_pause_state|pg_get_wal_resource_managers|pg_import_system_collations|pg_indexes_size|pg_is_in_recovery|pg_is_wal_replay_paused|pg_last_wal_receive_lsn|pg_last_wal_replay_lsn|pg_last_xact_replay_timestamp|pg_log_backend_memory_contexts|pg_log_standby_snapshot|pg_logical_emit_message|pg_logical_slot_get_binary_changes|pg_logical_slot_get_changes|pg_logical_slot_peek_binary_changes|pg_logical_slot_peek_changes|pg_ls_archive_statusdir|pg_ls_dir|pg_ls_logdir|pg_ls_logicalmapdir|pg_ls_logicalsnapdir|pg_ls_replslotdir|pg_ls_summariesdir|pg_ls_tmpdir|pg_ls_waldir|pg_partition_ancestors|pg_partition_root|pg_partition_tree|pg_promote|pg_read_binary_file|pg_read_file|pg_relation_filenode|pg_relation_filepath|pg_relation_size|pg_reload_conf|pg_replication_origin_advance|pg_replication_origin_create|pg_replication_origin_drop|pg_replication_origin_oid|pg_replication_origin_progress|pg_replication_origin_session_is_setup|pg_replication_origin_session_progress|pg_replication_origin_session_reset|pg_replication_origin_session_setup|pg_replication_origin_xact_reset|pg_replication_origin_xact_setup|pg_replication_slot_advance|pg_restore_attribute_stats|pg_restore_relation_stats|pg_rotate_logfile|pg_size_bytes|pg_size_pretty|pg_split_walfile_name|pg_stat_file|pg_switch_wal|pg_sync_replication_slots|pg_table_size|pg_tablespace_size|pg_terminate_backend|pg_total_relation_size|pg_try_advisory_lock|pg_try_advisory_lock_shared|pg_try_advisory_xact_lock|pg_try_advisory_xact_lock_shared|pg_wal_lsn_diff|pg_wal_replay_pause|pg_wal_replay_resume|pg_walfile_name|pg_walfile_name_offset|set_config)(?=\s*\(|$))/,
	'functions-bitstring.html': /((?:bit_count|bit_length|get_bit|length|octet_length|overlay|position|set_bit|substring)(?=\s*\(|$))/,
	'functions-enum.html': /((?:enum_first|enum_last|enum_range)(?=\s*\(|$))/,
	'functions-textsearch.html': /((?:array_to_tsvector|get_current_ts_config|json_to_tsvector|jsonb_to_tsvector|length|numnode|phraseto_tsquery|plainto_tsquery|querytree|setweight|strip|to_tsquery|to_tsvector|ts_debug|ts_delete|ts_filter|ts_headline|ts_lexize|ts_parse|ts_rank|ts_rank_cd|ts_rewrite|ts_stat|ts_token_type|tsquery_phrase|tsvector_to_array|unnest|websearch_to_tsquery)(?=\s*\(|$))/,
	'functions-uuid.html': /((?:gen_random_uuid|uuid_extract_timestamp|uuid_extract_version|uuidv4|uuidv7)(?=\s*\(|$))/,
	'functions-xml.html': /((?:cursor_to_xml|cursor_to_xmlschema|database_to_xml|database_to_xml_and_xmlschema|database_to_xmlschema|query_to_xml|query_to_xml_and_xmlschema|query_to_xmlschema|schema_to_xml|schema_to_xml_and_xmlschema|schema_to_xmlschema|table_to_xml|table_to_xml_and_xmlschema|table_to_xmlschema|xml_is_well_formed|xml_is_well_formed_content|xml_is_well_formed_document|xmlagg|xmlcomment|xmlconcat|xmlelement|xmlexists|xmlforest|xmlpi|xmlroot|xmltable|xmltext|xpath|xpath_exists)(?=\s*\(|$))/,
	'functions-json.html': /((?:array_to_json|json|json_array|json_array_elements|json_array_elements_text|json_array_length|json_build_array|json_build_object|json_each|json_each_text|json_exists|json_extract_path|json_extract_path_text|json_object|json_object_keys|json_populate_record|json_populate_recordset|json_query|json_scalar|json_serialize|json_strip_nulls|json_to_record|json_to_recordset|json_typeof|json_value|jsonb_array_elements|jsonb_array_elements_text|jsonb_array_length|jsonb_build_array|jsonb_build_object|jsonb_each|jsonb_each_text|jsonb_extract_path|jsonb_extract_path_text|jsonb_insert|jsonb_object|jsonb_object_keys|jsonb_path_exists|jsonb_path_exists_tz|jsonb_path_match|jsonb_path_match_tz|jsonb_path_query|jsonb_path_query_array|jsonb_path_query_array_tz|jsonb_path_query_first|jsonb_path_query_first_tz|jsonb_path_query_tz|jsonb_populate_record|jsonb_populate_record_valid|jsonb_populate_recordset|jsonb_pretty|jsonb_set|jsonb_set_lax|jsonb_strip_nulls|jsonb_to_record|jsonb_to_recordset|jsonb_typeof|row_to_json|to_json|to_jsonb)(?=\s*\(|$))/,
	'functions-range.html': /((?:isempty|lower|lower_inc|lower_inf|multirange|range_merge|unnest|upper|upper_inc|upper_inf)(?=\s*\(|$))/,
	'functions-window.html': /((?:cume_dist|dense_rank|first_value|lag|last_value|lead|nth_value|ntile|percent_rank|rank|row_number)(?=\s*\(|$))/,
	'functions-merge-support.html': /((?:merge_action)(?=\s*\(|$))/,
	'functions-trigger.html': /((?:suppress_redundant_updates_trigger|tsvector_update_trigger|tsvector_update_trigger_column)(?=\s*\(|$))/,
	'functions-event-triggers.html': /((?:pg_event_trigger_ddl_commands|pg_event_trigger_dropped_objects|pg_event_trigger_table_rewrite_oid|pg_event_trigger_table_rewrite_reason)(?=\s*\(|$))/,
	'functions-statistics.html': /((?:pg_mcv_list_items)(?=\s*\(|$))/,
}); // collisions: IN, ANY, SOME, ALL (array), trunc, md5, abbrev

jush.build_links2('pgsqlset', 'https://www.postgresql.org/docs/current/runtime-config-$key.html#GUC-$1', /(\b)/, /(\b)/gi, {
	'client': /(DateStyle|IntervalStyle|TimeZone|bytea_output|check_function_bodies|client_encoding|client_min_messages|createrole_self_grant|default_table_access_method|default_tablespace|default_text_search_config|default_toast_compression|default_transaction_deferrable|default_transaction_isolation|default_transaction_read_only|dynamic_library_path|event_triggers|extension_control_path|extra_float_digits|gin_fuzzy_search_limit|gin_pending_list_limit|icu_validation_level|idle_in_transaction_session_timeout|idle_session_timeout|jit_provider|lc_messages|lc_monetary|lc_numeric|lc_time|local_preload_libraries|lock_timeout|restrict_nonsystem_relation_kind|row_security|search_path|session_preload_libraries|session_replication_role|shared_preload_libraries|statement_timeout|temp_tablespaces|timezone_abbreviations|transaction_deferrable|transaction_isolation|transaction_read_only|transaction_timeout|xmlbinary|xmloption)/,
	'compatible': /(allow_alter_system|array_nulls|backslash_quote|escape_string_warning|lo_compat_privileges|standard_conforming_strings|synchronize_seqscans|transform_null_equals)/,
	'connection': /(authentication_timeout|bonjour|bonjour_name|client_connection_check_interval|gss_accept_delegation|krb_caseins_users|krb_server_keyfile|listen_addresses|max_connections|md5_password_warnings|oauth_validator_libraries|password_encryption|port|reserved_connections|scram_iterations|ssl|ssl_ca_file|ssl_cert_file|ssl_ciphers|ssl_crl_dir|ssl_crl_file|ssl_dh_params_file|ssl_groups|ssl_key_file|ssl_max_protocol_version|ssl_min_protocol_version|ssl_passphrase_command|ssl_passphrase_command_supports_reload|ssl_prefer_server_ciphers|ssl_tls13_ciphers|superuser_reserved_connections|tcp_keepalives_count|tcp_keepalives_idle|tcp_keepalives_interval|tcp_user_timeout|unix_socket_directories|unix_socket_group|unix_socket_permissions)/,
	'developer': /(allow_in_place_tablespaces|allow_system_table_mods|backtrace_functions|debug_copy_parse_plan_trees|debug_deadlocks|debug_discard_caches|debug_io_direct|debug_logical_replication_streaming|debug_parallel_query|debug_raw_expression_coverage_test|debug_write_read_parse_plan_trees|ignore_checksum_failure|ignore_invalid_pages|ignore_system_indexes|jit_debugging_support|jit_dump_bitcode|jit_expressions|jit_profiling_support|jit_tuple_deforming|log_btree_build_stats|post_auth_delay|pre_auth_delay|remove_temp_files_after_crash|send_abort_for_crash|send_abort_for_kill|trace_lock_oidmin|trace_lock_table|trace_locks|trace_lwlocks|trace_notify|trace_sort|trace_userlocks|wal_consistency_checking|wal_debug|zero_damaged_pages)/,
	'error-handling': /(data_sync_retry|exit_on_error|recovery_init_sync_method|restart_after_crash)/,
	'file-locations': /(config_file|data_directory|external_pid_file|hba_file|ident_file)/,
	'locks': /(deadlock_timeout|max_locks_per_transaction|max_pred_locks_per_page|max_pred_locks_per_relation|max_pred_locks_per_transaction)/,
	'logging': /(application_name|cluster_name|event_source|log_autovacuum_min_duration|log_checkpoints|log_connections|log_destination|log_directory|log_disconnections|log_duration|log_error_verbosity|log_file_mode|log_filename|log_hostname|log_line_prefix|log_lock_failures|log_lock_waits|log_min_duration_sample|log_min_duration_statement|log_min_error_statement|log_min_messages|log_parameter_max_length|log_parameter_max_length_on_error|log_recovery_conflict_waits|log_replication_commands|log_rotation_age|log_rotation_size|log_startup_progress_interval|log_statement|log_statement_sample_rate|log_temp_files|log_timezone|log_transaction_sample_rate|log_truncate_on_rotation|logging_collector|syslog_facility|syslog_ident|syslog_sequence_numbers|syslog_split_messages|update_process_title)/,
	'preset': /(block_size|data_checksums|data_directory_mode|debug_assertions|huge_pages_status|in_hot_standby|integer_datetimes|max_function_args|max_identifier_length|max_index_keys|num_os_semaphores|segment_size|server_encoding|server_version|server_version_num|shared_memory_size|shared_memory_size_in_huge_pages|ssl_library|wal_block_size|wal_segment_size)/,
	'query': /(constraint_exclusion|cpu_index_tuple_cost|cpu_operator_cost|cpu_tuple_cost|cursor_tuple_fraction|default_statistics_target|effective_cache_size|enable_async_append|enable_bitmapscan|enable_distinct_reordering|enable_gathermerge|enable_group_by_reordering|enable_hashagg|enable_hashjoin|enable_incremental_sort|enable_indexonlyscan|enable_indexscan|enable_material|enable_memoize|enable_mergejoin|enable_nestloop|enable_parallel_append|enable_parallel_hash|enable_partition_pruning|enable_partitionwise_aggregate|enable_partitionwise_join|enable_presorted_aggregate|enable_self_join_elimination|enable_seqscan|enable_sort|enable_tidscan|from_collapse_limit|geqo|geqo_effort|geqo_generations|geqo_pool_size|geqo_seed|geqo_selection_bias|geqo_threshold|jit|jit_above_cost|jit_inline_above_cost|jit_optimize_above_cost|join_collapse_limit|min_parallel_index_scan_size|min_parallel_table_scan_size|parallel_setup_cost|parallel_tuple_cost|plan_cache_mode|random_page_cost|recursive_worktable_factor|seq_page_cost)/,
	'replication': /(hot_standby|hot_standby_feedback|idle_replication_slot_timeout|max_active_replication_origins|max_logical_replication_workers|max_parallel_apply_workers_per_subscription|max_replication_slots|max_slot_wal_keep_size|max_standby_archive_delay|max_standby_streaming_delay|max_sync_workers_per_subscription|max_wal_senders|output_plugin_libraries|primary_conninfo|primary_slot_name|recovery_min_apply_delay|sync_replication_slots|synchronized_standby_slots|synchronous_standby_names|track_commit_timestamp|wal_keep_size|wal_receiver_create_temp_slot|wal_receiver_status_interval|wal_receiver_timeout|wal_retrieve_retry_interval|wal_sender_timeout)/,
	'resource': /(autovacuum_work_mem|backend_flush_after|bgwriter_delay|bgwriter_flush_after|bgwriter_lru_maxpages|bgwriter_lru_multiplier|commit_timestamp_buffers|dynamic_shared_memory_type|effective_io_concurrency|file_copy_method|file_extend_method|hash_mem_multiplier|huge_page_size|huge_pages|io_combine_limit|io_max_combine_limit|io_max_concurrency|io_method|io_workers|logical_decoding_work_mem|maintenance_io_concurrency|maintenance_work_mem|max_files_per_process|max_notify_queue_pages|max_parallel_maintenance_workers|max_parallel_workers|max_parallel_workers_per_gather|max_prepared_transactions|max_stack_depth|max_worker_processes|min_dynamic_shared_memory|multixact_member_buffers|multixact_offset_buffers|notify_buffers|parallel_leader_participation|serializable_buffers|shared_buffers|shared_memory_type|subtransaction_buffers|temp_buffers|temp_file_limit|transaction_buffers|vacuum_buffer_usage_limit|work_mem)/,
	'statistics': /(compute_query_id|stats_fetch_consistency|track_activities|track_activity_query_size|track_cost_delay_timing|track_counts|track_functions|track_io_timing|track_wal_io_timing)/,
	'vacuum': /(autovacuum|autovacuum_analyze_scale_factor|autovacuum_analyze_threshold|autovacuum_freeze_max_age|autovacuum_max_workers|autovacuum_multixact_freeze_max_age|autovacuum_naptime|autovacuum_vacuum_cost_delay|autovacuum_vacuum_cost_limit|autovacuum_vacuum_insert_scale_factor|autovacuum_vacuum_insert_threshold|autovacuum_vacuum_max_threshold|autovacuum_vacuum_scale_factor|autovacuum_vacuum_threshold|autovacuum_worker_slots|vacuum_cost_delay|vacuum_cost_limit|vacuum_cost_page_dirty|vacuum_cost_page_hit|vacuum_cost_page_miss|vacuum_failsafe_age|vacuum_freeze_min_age|vacuum_freeze_table_age|vacuum_max_eager_freeze_failure_rate|vacuum_multixact_failsafe_age|vacuum_multixact_freeze_min_age|vacuum_multixact_freeze_table_age|vacuum_truncate)/,
	'wal': /(archive_cleanup_command|archive_command|archive_library|archive_mode|archive_timeout|checkpoint_completion_target|checkpoint_flush_after|checkpoint_timeout|checkpoint_warning|commit_delay|commit_siblings|fsync|full_page_writes|max_wal_size|min_wal_size|recovery_end_command|recovery_prefetch|recovery_target|recovery_target_action|recovery_target_inclusive|recovery_target_lsn|recovery_target_name|recovery_target_time|recovery_target_timeline|recovery_target_xid|restore_command|summarize_wal|synchronous_commit|wal_buffers|wal_compression|wal_decode_buffer_size|wal_init_zero|wal_level|wal_log_hints|wal_recycle|wal_skip_threshold|wal_summary_keep_time|wal_sync_method|wal_writer_delay|wal_writer_flush_after)/,
});

// the contrib modules and procedural languages are generated by update/pgsql.php, the keywords and full URLs are maintained by hand, PGXN gets the rest
jush.build_links2('pgsqlext', 'https://www.postgresql.org/docs/current/$key', /(\b)/, /(\b)/gi, {
	'btree-gin.html': /(btree_gin)/,
	'btree-gist.html': /(btree_gist)/,
	'contrib-spi.html#CONTRIB-SPI-AUTOINC': /(autoinc)/,
	'contrib-spi.html#CONTRIB-SPI-INSERT-USERNAME': /(insert_username)/,
	'contrib-spi.html#CONTRIB-SPI-MODDATETIME': /(moddatetime)/,
	'contrib-spi.html#CONTRIB-SPI-REFINT': /(refint)/,
	'datatype-json.html#DATATYPE-JSON-TRANSFORMS': /(jsonb_plperl|jsonb_plperlu|jsonb_plpython3u)/,
	'dict-int.html': /(dict_int)/,
	'dict-xsyn.html': /(dict_xsyn)/,
	'file-fdw.html': /(file_fdw)/,
	'hstore.html#HSTORE-TRANSFORMS': /(hstore_plperl|hstore_plperlu|hstore_plpython3u)/,
	'ltree.html#LTREE-TRANSFORMS': /(ltree_plpython3u)/,
	'plperl-funcs.html': /(bool_plperl|bool_plperlu)/,
	'plperl.html': /(plperl|plperlu)/,
	'plpython.html': /(plpython3u)/,
	'pltcl.html': /(pltcl|pltclu)/,
	'postgres-fdw.html': /(postgres_fdw)/,
	'tsm-system-rows.html': /(tsm_system_rows)/,
	'tsm-system-time.html': /(tsm_system_time)/,
	'$1.html': /(amcheck|bloom|citext|cube|dblink|earthdistance|fuzzystrmatch|hstore|intagg|intarray|isn|lo|ltree|pageinspect|pg_buffercache|pg_freespacemap|pg_logicalinspect|pg_prewarm|pg_stat_statements|pg_surgery|pg_trgm|pg_visibility|pg_walinspect|pgcrypto|pgrowlocks|pgstattuple|plpgsql|seg|sslinfo|tablefunc|tcn|unaccent|uuid-ossp|xml2)/,
	'': /(IF|NOT|EXISTS)/, // CREATE EXTENSION IF NOT EXISTS, not extensions on PGXN
	'https://postgis.net/docs/': /(postgis(?:_raster|_sfcgal|_tiger_geocoder|_topology)?|address_standardizer(?:_data_us)?)/,
	'https://www.tigerdata.com/docs/': /(timescaledb)/,
	'https://github.com/citusdata/pg_cron': /(pg_cron)/,
	'https://docs.pgrouting.org/latest/en/index.html': /(pgrouting)/,
	'https://github.com/RhodiumToad/ip4r': /(ip4r)/,
	'https://pgxn.org/extension/$1': /([\w-]+)/,
});



(function () {
	const sql_function = 'mysql_db_query|mysql_query|mysql_unbuffered_query|mysqli_master_query|mysqli_multi_query|mysqli_query|mysqli_real_query|mysqli_rpl_query_type|mysqli_send_query|mysqli_stmt_prepare';
	const sqlite_function = 'sqlite_query|sqlite_unbuffered_query|sqlite_single_query|sqlite_array_query|sqlite_exec';
	const pgsql_function = 'pg_prepare|pg_query|pg_query_params|pg_send_prepare|pg_send_query|pg_send_query_params';
	const mssql_function = 'mssql_query|sqlsrv_prepare|sqlsrv_query';
	const oracle_function = 'oci_parse';
	const php_function = 'eval|create_function|assert|classkit_method_add|classkit_method_redefine|runkit_function_add|runkit_function_redefine|runkit_lint|runkit_method_add|runkit_method_redefine'
		+ '|array_filter|array_map|array_reduce|array_walk|array_walk_recursive|call_user_func|call_user_func_array|ob_start|sqlite_create_function|is_callable' // callback parameter with possible call of builtin function
	;
	const php_class = /(AllowDynamicProperties|Attribute|Deprecated|NoDiscard|Override|Closure|Error|ErrorException|Exception|Fiber|FiberError|InternalIterator|ReturnTypeWillChange|SensitiveParameter|SensitiveParameterValue|WeakReference|ArgumentCountError|ArithmeticError|ArrayAccess|AssertionError|BackedEnum|ClosedGeneratorException|CompileError|Countable|DivisionByZeroError|Generator|Iterator|IteratorAggregate|ParseError|__PHP_Incomplete_Class|RequestParseBodyException|Serializable|stdClass|Stringable|Throwable|Traversable|TypeError|UnhandledMatchError|UnitEnum|ValueError|WeakMap|DelayedTargetValidation|DateInterval|DatePeriod|DateTime|DateError|DateException|DateInvalidOperationException|DateInvalidTimeZoneException|DateMalformedIntervalStringException|DateMalformedPeriodStringException|DateMalformedStringException|DateObjectError|DateRangeError|DateTimeImmutable|DateTimeInterface|DateTimeZone|Directory|HashContext|JsonException|JsonSerializable|Random\\Engine\\Mt19937|Random\\Engine\\PcgOneseq128XslRr64|Random\\Engine\\Xoshiro256StarStar|Random\\Randomizer|Random\\BrokenRandomEngineError|Random\\CryptoSafeEngine|Random\\Engine\\Secure|Random\\Engine|Random\\RandomError|Random\\RandomException|ReflectionAttribute|ReflectionClass|ReflectionClassConstant|ReflectionConstant|ReflectionEnum|ReflectionEnumBackedCase|ReflectionEnumUnitCase|ReflectionExtension|ReflectionFiber|ReflectionFunction|ReflectionGenerator|ReflectionMethod|ReflectionObject|ReflectionParameter|ReflectionProperty|ReflectionReference|ReflectionZendExtension|Reflection|ReflectionException|ReflectionFunctionAbstract|ReflectionIntersectionType|ReflectionNamedType|ReflectionType|ReflectionUnionType|Reflector|AppendIterator|ArrayIterator|ArrayObject|CachingIterator|CallbackFilterIterator|DirectoryIterator|FilesystemIterator|FilterIterator|GlobIterator|InfiniteIterator|IteratorIterator|LimitIterator|MultipleIterator|NoRewindIterator|ParentIterator|RecursiveCachingIterator|RecursiveCallbackFilterIterator|RecursiveDirectoryIterator|RecursiveFilterIterator|RecursiveIteratorIterator|RecursiveRegexIterator|RecursiveTreeIterator|RegexIterator|SplFileInfo|SplFileObject|SplFixedArray|SplTempFileObject|BadFunctionCallException|BadMethodCallException|DomainException|EmptyIterator|InvalidArgumentException|LengthException|LogicException|OuterIterator|OutOfBoundsException|OutOfRangeException|OverflowException|RangeException|RecursiveArrayIterator|RecursiveIterator|RuntimeException|SeekableIterator|SplDoublyLinkedList|SplHeap|SplMaxHeap|SplMinHeap|SplObjectStorage|SplObserver|SplPriorityQueue|SplQueue|SplStack|SplSubject|UnderflowException|UnexpectedValueException|streamWrapper|php_user_filter|StreamBucket|Uri\\Rfc3986\\Uri|Uri\\WhatWg\\InvalidUrlException|Uri\\WhatWg\\Url|Uri\\WhatWg\\UrlValidationError|Uri\\InvalidUriException|Uri\\UriError|Uri\\UriException|BcMath\\Number|com|COMPersistHelper|dotnet|variant|com_exception|com_safearray_proxy|Dba\\Connection|FFI|FFI\\CData|FFI\\CType|FFI\\Exception|FFI\\ParserException|finfo|Filter\\FilterException|Filter\\FilterFailedException|FTP\\Connection|GdFont|GdImage|Collator|IntlBreakIterator|IntlCalendar|IntlGregorianCalendar|IntlListFormatter|IntlRuleBasedBreakIterator|IntlTimeZone|Spoofchecker|Transliterator|UConverter|IntlDateFormatter|IntlChar|IntlCodePointBreakIterator|IntlDatePatternGenerator|IntlException|IntlIterator|IntlPartsIterator|Locale|MessageFormatter|Normalizer|NumberFormatter|ResourceBundle|PDO|PDOException|PDORow|PDOStatement|Phar|PharData|PharFileInfo|PharException|SysvMessageQueue|SysvSemaphore|SysvSharedMemory|SessionHandler|SessionHandlerInterface|SessionIdInterface|SessionUpdateTimestampHandlerInterface|Shmop|AddressInfo|Socket|SQLite3|SQLite3Result|SQLite3Stmt|SQLite3Exception|PhpToken|DeflateContext|InflateContext|CURLStringFile|CURLFile|CurlHandle|CurlMultiHandle|CurlShareHandle|CurlSharePersistentHandle|DOMAttr|DOMCdataSection|DOMComment|DOMDocument|DOMDocumentFragment|DOMElement|DOMEntityReference|DOMImplementation|DOMProcessingInstruction|DOMText|DOMXPath|DOMCharacterData|DOMChildNode|DOMDocumentType|DOMEntity|DOMException|DOMNamedNodeMap|DOMNameSpaceNode|DOMNode|DOMNodeList|DOMNotation|DOMParentNode|Dom\\Attr|Dom\\CDATASection|Dom\\CharacterData|Dom\\ChildNode|Dom\\Comment|Dom\\Document|Dom\\DocumentFragment|Dom\\DocumentType|Dom\\DtdNamedNodeMap|Dom\\Element|Dom\\Entity|Dom\\EntityReference|Dom\\HTMLCollection|Dom\\HTMLDocument|Dom\\HTMLElement|Dom\\Implementation|Dom\\NamedNodeMap|Dom\\NamespaceInfo|Dom\\Node|Dom\\NodeList|Dom\\Notation|Dom\\ParentNode|Dom\\ProcessingInstruction|Dom\\Text|Dom\\TokenList|Dom\\XMLDocument|Dom\\XPath|EnchantBroker|EnchantDictionary|GMP|LDAP\\Connection|LDAP\\Result|LDAP\\ResultEntry|LibXMLError|mysqli_result|mysqli_stmt|mysqli_warning|mysqli|mysqli_driver|mysqli_sql_exception|OpenSSLAsymmetricKey|OpenSSLCertificate|OpenSSLCertificateSigningRequest|Pdo\\Dblib|Pdo\\Firebird|Pdo\\Mysql|Pdo\\Odbc|Pdo\\Pgsql|Pdo\\Sqlite|PgSql\\Connection|PgSql\\Lob|PgSql\\Result|SimpleXMLElement|SimpleXMLIterator|SNMP|SNMPException|SoapClient|SoapFault|SoapHeader|SoapParam|SoapServer|SoapVar|Soap\\Sdl|Soap\\Url|SodiumException|tidy|tidyNode|Odbc\\Connection|Odbc\\Result|XMLParser|XMLReader|XMLWriter|XSLTProcessor|ZipArchive)/;

	jush.tr.php = { php_echo: /=/, php2: /()/ };
	jush.tr.php2 = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_doc: /\/\*\*/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_new: /(\b)(new|instanceof|extends|class|implements|interface)(\b\s*)/i, php_met: /()([\w\u007F-\uFFFF\\]+)(::)/, php_fun: /()(\bfunction\b|->|::)(\s*)/i, php_php: new RegExp('(\\b)(' + php_function + ')(\\s*\\(|$)', 'i'), php_sql: new RegExp('(\\b)(' + sql_function + ')(\\s*\\(|$)', 'i'), php_sqlite: new RegExp('(\\b)(' + sqlite_function + ')(\\s*\\(|$)', 'i'), php_pgsql: new RegExp('(\\b)(' + pgsql_function + ')(\\s*\\(|$)', 'i'), php_mssql: new RegExp('(\\b)(' + mssql_function + ')(\\s*\\(|$)', 'i'), php_oracle: new RegExp('(\\b)(' + oracle_function + ')(\\s*\\(|$)', 'i'), php_echo: /(\b)(echo|print)\b/i, php_halt: /(\b)(__halt_compiler)(\s*\(\s*\)|$)/i, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, num: jush.num, php_phpini: /(\b)(ini_get|ini_set)(\s*\(|$)/i, php_http: /(\b)(header)(\s*\(|$)/i, php_mail: /(\b)(mail)(\s*\(|$)/i, _2: /\?>|<\/script>/i }; //! matches ::echo
	jush.tr.php_quo_var = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_new: /(\b)(new|instanceof|extends|class|implements|interface)(\b\s*)/i, php_met: /()([\w\u007F-\uFFFF\\]+)(::)/, php_fun: /()(\bfunction\b|->|::)(\s*)/i, php_php: new RegExp('(\\b)(' + php_function + ')(\\s*\\(|$)', 'i'), php_sql: new RegExp('(\\b)(' + sql_function + ')(\\s*\\(|$)', 'i'), php_sqlite: new RegExp('(\\b)(' + sqlite_function + ')(\\s*\\(|$)', 'i'), php_pgsql: new RegExp('(\\b)(' + pgsql_function + ')(\\s*\\(|$)', 'i'), php_mssql: new RegExp('(\\b)(' + mssql_function + ')(\\s*\\(|$)', 'i'), php_oracle: new RegExp('(\\b)(' + oracle_function + ')(\\s*\\(|$)', 'i'), _1: /}/ };
	jush.tr.php_echo = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_new: /(\b)(new|instanceof|extends|class|implements|interface)(\b\s*)/i, php_met: /()([\w\u007F-\uFFFF\\]+)(::)/, php_fun: /()(\bfunction\b|->|::)(\s*)/i, php_php: new RegExp('(\\b)(' + php_function + ')(\\s*\\(|$)', 'i'), php_sql: new RegExp('(\\b)(' + sql_function + ')(\\s*\\(|$)', 'i'), php_sqlite: new RegExp('(\\b)(' + sqlite_function + ')(\\s*\\(|$)', 'i'), php_pgsql: new RegExp('(\\b)(' + pgsql_function + ')(\\s*\\(|$)', 'i'), php_mssql: new RegExp('(\\b)(' + mssql_function + ')(\\s*\\(|$)', 'i'), php_oracle: new RegExp('(\\b)(' + oracle_function + ')(\\s*\\(|$)', 'i'), php_echo: /\(/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, num: jush.num, php_phpini: /(\b)(ini_get|ini_set)(\s*\(|$)/i, _1: /\)|;|(?=\?>|<\/script>)/i };
	jush.tr.php_php = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, num: jush.num, _1: /[(,)]/ }; // [(,)] - only first parameter //! disables second parameter in create_function()
	jush.tr.php_sql = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_sql: /\(/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, num: jush.num, _1: /\)/ };
	jush.tr.php_sqlite = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_sqlite: /\(/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, num: jush.num, _1: /\)/ };
	jush.tr.php_pgsql = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_pgsql: /\(/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, num: jush.num, _1: /\)/ };
	jush.tr.php_mssql = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_mssql: /\(/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, num: jush.num, _1: /\)/ };
	jush.tr.php_oracle = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_oracle: /\(/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, num: jush.num, _1: /\)/ };
	jush.tr.php_phpini = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_phpini: /\(/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, num: jush.num, _1: /[,)]/ };
	jush.tr.php_http = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_http: /\(/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, num: jush.num, _1: /\)/ };
	jush.tr.php_mail = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_mail: /\(/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, num: jush.num, _1: /\)/ };
	jush.tr.php_new = { php_one: /\/\/|#/, php_com: /\/\*/, _0: /\s*,\s*/, _1: /(?=[^\w\u007F-\uFFFF\\])/ }; //! classes are used also for type hinting and catch //! , because of 'implements' but fails for array(new A, new B)
	jush.tr.php_met = { php_one: /\/\/|#/, php_com: /\/\*/, _1: /()([\w\u007F-\uFFFF\\]+)()/ };
	jush.tr.php_fun = { php_one: /\/\/|#/, php_com: /\/\*/, _1: /(?=[^\w\u007F-\uFFFF\\])/ };
	jush.tr.php_one = { _1: /\n|(?=\?>)/ };
	jush.tr.php_eot = { php_eot2: /([^'"\n]+)(['"]?)/ };
	jush.tr.php_eot2 = { php_quo_var: /\$\{|\{\$/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/ }; // php_eot2._2 to be set in php_eot handler
	jush.tr.php_quo = { php_quo_var: /\$\{|\{\$/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, esc: /\\/, _1: /"/ };
	jush.tr.php_bac = { php_quo_var: /\$\{|\{\$/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, esc: /\\/, _1: /`/ }; //! highlight shell
	jush.tr.php_var = { _1: /()/ };
	jush.tr.php_apo = { esc: /\\/, _1: /'/ };
	jush.tr.php_doc = { _1: /\*\// };
	jush.tr.php_com = { _1: /\*\// };
	jush.tr.php_halt = { php_one: /\/\/|#/, php_com: /\/\*/, php_halt2: /;|\?>\n?/ };
	jush.tr.php_halt2 = { _4: /$/ };
	jush.tr.phpini = { one: /;/, _0: /$/ };
	jush.tr.mail = { _0: /$/ };

	jush.urls.php_var = 'https://www.php.net/reserved.variables.$key';
	jush.urls.php_php = 'https://www.php.net/$key.$val';
	jush.urls.php_sql = 'https://www.php.net/$key.$val';
	jush.urls.php_sqlite = 'https://www.php.net/$key.$val';
	jush.urls.php_pgsql = 'https://www.php.net/$key.$val';
	jush.urls.php_mssql = 'https://learn.microsoft.com/sql/$key';
	jush.urls.php_oracle = 'https://www.php.net/$key.$val';
	jush.urls.php_echo = 'https://www.php.net/$key.$val';
	jush.urls.php_phpini = 'https://www.php.net/$key.$val';
	jush.urls.php_http = 'https://www.php.net/$key.$val';
	jush.urls.php_mail = 'https://www.php.net/$key.$val';
	jush.urls.php_met = 'https://www.php.net/$key';
	jush.urls.php_halt = 'https://www.php.net/$key.halt-compiler';

	jush.slugs.php = name => name.toLowerCase();
	jush.slugs.php_new = name => name.toLowerCase().replace(/\\/g, '-'); // toLowerCase() - case sensitive after #
	jush.slugs.php_doc = name => name.replace(/^\W+/, '');
	jush.slugs.phpini = name => (/^suhosin\./.test(name) ? name : name.toLowerCase().replace(/_/g, '-'));

	jush.links.php_new = {
		'https://www.php.net/language.oop5.basic#language.oop5.basic.$val': /^(class|new|extends)$/i,
		'https://www.php.net/language.oop5.interfaces#language.oop5.interfaces.$val': /^(implements|interface)$/i,
		'https://www.php.net/language.operators.type': /^instanceof$/i
	};
	jush.links.php_met = {
		'language.oop5.paamayim-nekudotayim': /^(self|parent|static)$/i,
		'class.$val': new RegExp('^' + php_class.source + '$', 'i')
	};
	jush.links.php_fun = { 'https://www.php.net/functions.user-defined': /^function$/i };
	jush.links.php_var = {
		'globals': /^\$GLOBALS$/,
		'server': /^\$_SERVER$/, 'get': /^\$_GET$/, 'post': /^\$_POST$/, 'files': /^\$_FILES$/, 'request': /^\$_REQUEST$/, 'session': /^\$_SESSION$/, 'environment': /^\$_ENV$/, 'cookies': /^\$_COOKIE$/,
		'phperrormsg': /^\$php_errormsg$/, 'httprawpostdata': /^\$HTTP_RAW_POST_DATA$/, 'httpresponseheader': /^\$http_response_header$/,
		'argc': /^\$argc$/, 'argv': /^\$argv$/
	};
	jush.links.php_php = { 'function': new RegExp('^' + php_function + '$', 'i') };
	jush.links.php_sql = { 'function': new RegExp('^' + sql_function + '$', 'i') };
	jush.links.php_sqlite = { 'function': new RegExp('^' + sqlite_function + '$', 'i') };
	jush.links.php_pgsql = { 'function': new RegExp('^' + pgsql_function + '$', 'i') };
	jush.links.php_mssql = { 'https://www.php.net/function.$val': /^mssql_query$/i, 'connect/php/sqlsrv-prepare': /^sqlsrv_prepare$/i, 'connect/php/sqlsrv-query': /^sqlsrv_query$/i };
	jush.links.php_oracle = { 'function': new RegExp('^' + oracle_function + '$', 'i') };
	jush.links.php_phpini = { 'function': /^(ini_get|ini_set)$/i };
	jush.links.php_http = { 'function': /^header$/i };
	jush.links.php_mail = { 'function': /^mail$/i };
	jush.links.php_echo = { 'function': /^(echo|print)$/i };
	jush.links.php_halt = { 'function': /^__halt_compiler$/i };

	jush.build_links2('php2', 'https://www.php.net/$key', /(\b)/, /(\b)/gi, {
		'function.$1': /(return|(?:include|require)(?:_once)?|(?:array_all|array_any|array_change_key_case|array_chunk|array_column|array_combine|array_count_values|array_diff_assoc|array_diff_key|array_diff_uassoc|array_diff_ukey|array_diff|array_fill_keys|array_fill|array_filter|array_find_key|array_find|array_first|array_flip|array_intersect_assoc|array_intersect_key|array_intersect_uassoc|array_intersect_ukey|array_intersect|array_is_list|array_key_exists|array_key_first|array_key_last|array_keys|array_last|array_map|array_merge_recursive|array_merge|array_multisort|array_pad|array_pop|array_product|array_push|array_rand|array_reduce|array_replace_recursive|array_replace|array_reverse|array_search|array_shift|array_slice|array_splice|array_sum|array_udiff_assoc|array_udiff_uassoc|array_udiff|array_uintersect_assoc|array_uintersect_uassoc|array_uintersect|array_unique|array_unshift|array_values|array_walk_recursive|array_walk|array|arsort|asort|compact|count|current|each|end|extract|in_array|key_exists|key|krsort|ksort|list|natcasesort|natsort|next|pos|prev|range|reset|rsort|shuffle|sizeof|sort|uasort|uksort|usort|class_alias|class_exists|enum_exists|get_called_class|get_class_methods|get_class_vars|get_class|get_declared_classes|get_declared_interfaces|get_declared_traits|get_mangled_object_vars|get_object_vars|get_parent_class|interface_exists|is_a|is_subclass_of|method_exists|property_exists|trait_exists|date_interval_create_from_date_string|date_add|date_create_from_format|date_modify|date_date_set|date_isodate_set|date_time_set|date_timestamp_set|date_timezone_set|date_sub|date_create_immutable|date_create_immutable_from_format|date_diff|date_format|date_offset_get|date_timestamp_get|date_timezone_get|timezone_open|timezone_location_get|timezone_name_get|timezone_offset_get|timezone_transitions_get|timezone_abbreviations_list|timezone_identifiers_list|checkdate|date_create|date_default_timezone_get|date_default_timezone_set|date_get_last_errors|date_interval_format|date_parse_from_format|date_parse|date_sun_info|date_sunrise|date_sunset|date|getdate|gettimeofday|gmdate|gmmktime|gmstrftime|idate|localtime|microtime|mktime|strftime|strptime|strtotime|time|timezone_name_from_abbr|timezone_version_get|chdir|chroot|closedir|dir|getcwd|opendir|readdir|rewinddir|scandir|debug_backtrace|debug_print_backtrace|error_clear_last|error_get_last|error_log|error_reporting|get_error_handler|get_exception_handler|restore_error_handler|restore_exception_handler|set_error_handler|set_exception_handler|trigger_error|user_error|escapeshellarg|escapeshellcmd|exec|passthru|proc_close|proc_get_status|proc_nice|proc_open|proc_terminate|shell_exec|system|basename|chgrp|chmod|chown|clearstatcache|copy|dirname|disk_free_space|disk_total_space|diskfreespace|fclose|fdatasync|feof|fflush|fgetc|fgetcsv|fgets|fgetss|file_exists|file_get_contents|file_put_contents|file|fileatime|filectime|filegroup|fileinode|filemtime|fileowner|fileperms|filesize|filetype|flock|fnmatch|fopen|fpassthru|fputcsv|fputs|fread|fscanf|fseek|fstat|fsync|ftell|ftruncate|fwrite|glob|is_dir|is_executable|is_file|is_link|is_readable|is_uploaded_file|is_writable|is_writeable|lchgrp|lchown|link|linkinfo|lstat|mkdir|move_uploaded_file|parse_ini_file|parse_ini_string|pathinfo|pclose|popen|readfile|readlink|realpath_cache_get|realpath_cache_size|realpath|rename|rewind|rmdir|set_file_buffer|stat|symlink|tempnam|tmpfile|touch|umask|unlink|fastcgi_finish_request|fpm_get_status|call_user_func_array|call_user_func|create_function|forward_static_call_array|forward_static_call|func_get_arg|func_get_args|func_num_args|function_exists|get_defined_functions|register_shutdown_function|register_tick_function|unregister_tick_function|hash_algos|hash_copy|hash_equals|hash_file|hash_final|hash_hkdf|hash_hmac_algos|hash_hmac_file|hash_hmac|hash_init|hash_pbkdf2|hash_update_file|hash_update_stream|hash_update|hash|assert_options|assert|cli_get_process_title|cli_set_process_title|dl|extension_loaded|gc_collect_cycles|gc_disable|gc_enable|gc_enabled|gc_mem_caches|gc_status|get_cfg_var|get_current_user|get_defined_constants|get_extension_funcs|get_include_path|get_included_files|get_loaded_extensions|get_magic_quotes_gpc|get_magic_quotes_runtime|get_required_files|get_resources|getenv|getlastmod|getmygid|getmyinode|getmypid|getmyuid|getopt|getrusage|ini_alter|ini_get_all|ini_get|ini_parse_quantity|ini_restore|ini_set|memory_get_peak_usage|memory_get_usage|memory_reset_peak_usage|php_ini_loaded_file|php_ini_scanned_files|php_sapi_name|php_uname|phpcredits|phpinfo|phpversion|putenv|restore_include_path|set_include_path|set_time_limit|sys_get_temp_dir|version_compare|zend_thread_id|zend_version|json_decode|json_encode|json_last_error_msg|json_last_error|json_validate|ezmlm_hash|mail|abs|acos|acosh|asin|asinh|atan|atan2|atanh|base_convert|bindec|ceil|cos|cosh|decbin|dechex|decoct|deg2rad|exp|expm1|fdiv|floor|fmod|fpow|hexdec|hypot|intdiv|is_finite|is_infinite|is_nan|log|log10|log1p|max|min|octdec|pi|pow|rad2deg|round|sin|sinh|sqrt|tan|tanh|connection_aborted|connection_status|constant|define|defined|die|eval|exit|get_browser|highlight_file|highlight_string|hrtime|ignore_user_abort|pack|php_strip_whitespace|sapi_windows_cp_conv|sapi_windows_cp_get|sapi_windows_cp_is_utf8|sapi_windows_cp_set|sapi_windows_generate_ctrl_event|sapi_windows_set_ctrl_handler|sapi_windows_vt100_support|show_source|sleep|sys_getloadavg|time_nanosleep|time_sleep_until|uniqid|unpack|usleep|checkdnsrr|closelog|dns_check_record|dns_get_mx|dns_get_record|fsockopen|gethostbyaddr|gethostbyname|gethostbynamel|gethostname|getmxrr|getprotobyname|getprotobynumber|getservbyname|getservbyport|header_register_callback|header_remove|header|headers_list|headers_sent|http_clear_last_response_headers|http_get_last_response_headers|http_response_code|inet_ntop|inet_pton|ip2long|long2ip|net_get_interfaces|openlog|pfsockopen|request_parse_body|setcookie|setrawcookie|socket_get_status|socket_set_blocking|socket_set_timeout|syslog|opcache_compile_file|opcache_get_configuration|opcache_get_status|opcache_invalidate|opcache_is_script_cached_in_file_cache|opcache_is_script_cached|opcache_jit_blacklist|opcache_reset|flush|ob_clean|ob_end_clean|ob_end_flush|ob_flush|ob_get_clean|ob_get_contents|ob_get_flush|ob_get_length|ob_get_level|ob_get_status|ob_implicit_flush|ob_list_handlers|ob_start|output_add_rewrite_var|output_reset_rewrite_vars|password_algos|password_get_info|password_hash|password_needs_rehash|password_verify|preg_filter|preg_grep|preg_last_error_msg|preg_last_error|preg_match_all|preg_match|preg_quote|preg_replace_callback_array|preg_replace_callback|preg_replace|preg_split|getrandmax|lcg_value|mt_getrandmax|mt_rand|mt_srand|rand|random_bytes|random_int|srand|class_implements|class_parents|class_uses|iterator_apply|iterator_count|iterator_to_array|spl_autoload_call|spl_autoload_extensions|spl_autoload_functions|spl_autoload_register|spl_autoload_unregister|spl_autoload|spl_classes|spl_object_hash|spl_object_id|stream_bucket_append|stream_bucket_make_writeable|stream_bucket_new|stream_bucket_prepend|stream_context_create|stream_context_get_default|stream_context_get_options|stream_context_get_params|stream_context_set_default|stream_context_set_option|stream_context_set_options|stream_context_set_params|stream_copy_to_stream|stream_filter_append|stream_filter_prepend|stream_filter_register|stream_filter_remove|stream_get_contents|stream_get_filters|stream_get_line|stream_get_meta_data|stream_get_transports|stream_get_wrappers|stream_is_local|stream_isatty|stream_register_wrapper|stream_resolve_include_path|stream_select|stream_set_blocking|stream_set_chunk_size|stream_set_read_buffer|stream_set_timeout|stream_set_write_buffer|stream_socket_accept|stream_socket_client|stream_socket_enable_crypto|stream_socket_get_name|stream_socket_pair|stream_socket_recvfrom|stream_socket_sendto|stream_socket_server|stream_socket_shutdown|stream_supports_lock|stream_wrapper_register|stream_wrapper_restore|stream_wrapper_unregister|addcslashes|addslashes|bin2hex|chop|chr|chunk_split|convert_cyr_string|convert_uudecode|convert_uuencode|count_chars|crc32|crypt|echo|explode|fprintf|get_html_translation_table|hebrev|hebrevc|hex2bin|html_entity_decode|htmlentities|htmlspecialchars_decode|htmlspecialchars|implode|join|lcfirst|levenshtein|localeconv|ltrim|md5_file|md5|metaphone|money_format|nl_langinfo|nl2br|number_format|ord|parse_str|print|printf|quoted_printable_decode|quoted_printable_encode|quotemeta|rtrim|setlocale|sha1_file|sha1|similar_text|soundex|sprintf|sscanf|str_contains|str_decrement|str_ends_with|str_getcsv|str_increment|str_ireplace|str_pad|str_repeat|str_replace|str_rot13|str_shuffle|str_split|str_starts_with|str_word_count|strcasecmp|strchr|strcmp|strcoll|strcspn|strip_tags|stripcslashes|stripos|stripslashes|stristr|strlen|strnatcasecmp|strnatcmp|strncasecmp|strncmp|strpbrk|strpos|strrchr|strrev|strripos|strrpos|strspn|strstr|strtok|strtolower|strtoupper|strtr|substr_compare|substr_count|substr_replace|substr|trim|ucfirst|ucwords|utf8_decode|utf8_encode|vfprintf|vprintf|vsprintf|wordwrap|base64_decode|base64_encode|get_headers|get_meta_tags|http_build_query|parse_url|rawurldecode|rawurlencode|urldecode|urlencode|boolval|debug_zval_dump|doubleval|empty|floatval|get_debug_type|get_defined_vars|get_resource_id|get_resource_type|gettype|intval|is_array|is_bool|is_callable|is_countable|is_double|is_float|is_int|is_integer|is_iterable|is_long|is_null|is_numeric|is_object|is_real|is_resource|is_scalar|is_string|isset|print_r|serialize|settype|strval|unserialize|unset|var_dump|var_export|apache_child_terminate|apache_get_modules|apache_get_version|apache_getenv|apache_lookup_uri|apache_note|apache_request_headers|apache_response_headers|apache_setenv|getallheaders|virtual|bcadd|bcceil|bccomp|bcdiv|bcdivmod|bcfloor|bcmod|bcmul|bcpow|bcpowmod|bcround|bcscale|bcsqrt|bcsub|cal_days_in_month|cal_from_jd|cal_info|cal_to_jd|easter_date|easter_days|frenchtojd|gregoriantojd|jddayofweek|jdmonthname|jdtofrench|jdtogregorian|jdtojewish|jdtojulian|jdtounix|jewishtojd|juliantojd|unixtojd|com_create_guid|com_event_sink|com_get_active_object|com_load_typelib|com_message_pump|com_print_typeinfo|variant_abs|variant_add|variant_and|variant_cast|variant_cat|variant_cmp|variant_date_from_timestamp|variant_date_to_timestamp|variant_div|variant_eqv|variant_fix|variant_get_type|variant_idiv|variant_imp|variant_int|variant_mod|variant_mul|variant_neg|variant_not|variant_or|variant_pow|variant_round|variant_set_type|variant_set|variant_sub|variant_xor|ctype_alnum|ctype_alpha|ctype_cntrl|ctype_digit|ctype_graph|ctype_lower|ctype_print|ctype_punct|ctype_space|ctype_upper|ctype_xdigit|dba_close|dba_delete|dba_exists|dba_fetch|dba_firstkey|dba_handlers|dba_insert|dba_key_split|dba_list|dba_nextkey|dba_open|dba_optimize|dba_popen|dba_replace|dba_sync|exif_imagetype|exif_read_data|exif_tagname|exif_thumbnail|read_exif_data|finfo_buffer|finfo_close|finfo_file|finfo_open|finfo_set_flags|mime_content_type|filter_has_var|filter_id|filter_input_array|filter_input|filter_list|filter_var_array|filter_var|ftp_alloc|ftp_append|ftp_cdup|ftp_chdir|ftp_chmod|ftp_close|ftp_connect|ftp_delete|ftp_exec|ftp_fget|ftp_fput|ftp_get_option|ftp_get|ftp_login|ftp_mdtm|ftp_mkdir|ftp_mlsd|ftp_nb_continue|ftp_nb_fget|ftp_nb_fput|ftp_nb_get|ftp_nb_put|ftp_nlist|ftp_pasv|ftp_put|ftp_pwd|ftp_quit|ftp_raw|ftp_rawlist|ftp_rename|ftp_rmdir|ftp_set_option|ftp_site|ftp_size|ftp_ssl_connect|ftp_systype|iconv_get_encoding|iconv_mime_decode_headers|iconv_mime_decode|iconv_mime_encode|iconv_set_encoding|iconv_strlen|iconv_strpos|iconv_strrpos|iconv_substr|iconv|ob_iconv_handler|gd_info|getimagesize|getimagesizefromstring|image_type_to_extension|image_type_to_mime_type|image2wbmp|imageaffine|imageaffinematrixconcat|imageaffinematrixget|imagealphablending|imageantialias|imagearc|imageavif|imagebmp|imagechar|imagecharup|imagecolorallocate|imagecolorallocatealpha|imagecolorat|imagecolorclosest|imagecolorclosestalpha|imagecolorclosesthwb|imagecolordeallocate|imagecolorexact|imagecolorexactalpha|imagecolormatch|imagecolorresolve|imagecolorresolvealpha|imagecolorset|imagecolorsforindex|imagecolorstotal|imagecolortransparent|imageconvolution|imagecopy|imagecopymerge|imagecopymergegray|imagecopyresampled|imagecopyresized|imagecreate|imagecreatefromavif|imagecreatefrombmp|imagecreatefromgd|imagecreatefromgd2|imagecreatefromgd2part|imagecreatefromgif|imagecreatefromjpeg|imagecreatefrompng|imagecreatefromstring|imagecreatefromtga|imagecreatefromwbmp|imagecreatefromwebp|imagecreatefromxbm|imagecreatefromxpm|imagecreatetruecolor|imagecrop|imagecropauto|imagedashedline|imagedestroy|imageellipse|imagefill|imagefilledarc|imagefilledellipse|imagefilledpolygon|imagefilledrectangle|imagefilltoborder|imagefilter|imageflip|imagefontheight|imagefontwidth|imageftbbox|imagefttext|imagegammacorrect|imagegd|imagegd2|imagegetclip|imagegetinterpolation|imagegif|imagegrabscreen|imagegrabwindow|imageinterlace|imageistruecolor|imagejpeg|imagelayereffect|imageline|imageloadfont|imageopenpolygon|imagepalettecopy|imagepalettetotruecolor|imagepng|imagepolygon|imagerectangle|imageresolution|imagerotate|imagesavealpha|imagescale|imagesetbrush|imagesetclip|imagesetinterpolation|imagesetpixel|imagesetstyle|imagesetthickness|imagesettile|imagestring|imagestringup|imagesx|imagesy|imagetruecolortopalette|imagettfbbox|imagettftext|imagetypes|imagewbmp|imagewebp|imagexbm|iptcembed|iptcparse|jpeg2wbmp|png2wbmp|collator_asort|collator_compare|collator_create|collator_get_attribute|collator_get_error_code|collator_get_error_message|collator_get_locale|collator_get_sort_key|collator_get_strength|collator_set_attribute|collator_set_strength|collator_sort_with_sort_keys|collator_sort|datefmt_create|datefmt_format|datefmt_format_object|datefmt_get_calendar|datefmt_get_datetype|datefmt_get_error_code|datefmt_get_error_message|datefmt_get_locale|datefmt_get_pattern|datefmt_get_timetype|datefmt_get_timezone_id|datefmt_get_calendar_object|datefmt_get_timezone|datefmt_is_lenient|datefmt_localtime|datefmt_parse|datefmt_set_calendar|datefmt_set_lenient|datefmt_set_pattern|datefmt_set_timezone|intl_error_name|intl_get_error_code|intl_get_error_message|intl_is_failure|grapheme_extract|grapheme_levenshtein|grapheme_str_split|grapheme_stripos|grapheme_stristr|grapheme_strlen|grapheme_strpos|grapheme_strripos|grapheme_strrpos|grapheme_strstr|grapheme_substr|idn_to_ascii|idn_to_utf8|intlcal_add|intlcal_after|intlcal_before|intlcal_clear|intlcal_create_instance|intlcal_equals|intlcal_field_difference|intlcal_from_date_time|intlcal_get|intlcal_get_actual_maximum|intlcal_get_actual_minimum|intlcal_get_available_locales|intlcal_get_day_of_week_type|intlcal_get_error_code|intlcal_get_error_message|intlcal_get_first_day_of_week|intlcal_get_greatest_minimum|intlcal_get_keyword_values_for_locale|intlcal_get_least_maximum|intlcal_get_locale|intlcal_get_maximum|intlcal_get_minimal_days_in_first_week|intlcal_get_minimum|intlcal_get_now|intlcal_get_repeated_wall_time_option|intlcal_get_skipped_wall_time_option|intlcal_get_time|intlcal_get_time_zone|intlcal_get_type|intlcal_get_weekend_transition|intlcal_in_daylight_time|intlcal_is_equivalent_to|intlcal_is_lenient|intlcal_is_set|intlcal_is_weekend|intlcal_roll|intlcal_set|intlcal_set_first_day_of_week|intlcal_set_lenient|intlcal_set_minimal_days_in_first_week|intlcal_set_repeated_wall_time_option|intlcal_set_skipped_wall_time_option|intlcal_set_time|intlcal_set_time_zone|intlcal_to_date_time|intlgregcal_get_gregorian_change|intlgregcal_is_leap_year|intlgregcal_set_gregorian_change|intltz_count_equivalent_ids|intltz_create_default|intltz_create_enumeration|intltz_create_time_zone|intltz_create_time_zone_id_enumeration|intltz_from_date_time_zone|intltz_get_canonical_id|intltz_get_display_name|intltz_get_dst_savings|intltz_get_equivalent_id|intltz_get_error_code|intltz_get_error_message|intltz_get_gmt|intltz_get_iana_id|intltz_get_id|intltz_get_id_for_windows_id|intltz_get_offset|intltz_get_raw_offset|intltz_get_region|intltz_get_tz_data_version|intltz_get_unknown|intltz_get_windows_id|intltz_has_same_rules|intltz_to_date_time_zone|intltz_use_daylight_time|locale_accept_from_http|locale_add_likely_subtags|locale_compose|locale_filter_matches|locale_get_all_variants|locale_get_default|locale_get_display_language|locale_get_display_name|locale_get_display_region|locale_get_display_script|locale_get_display_variant|locale_get_keywords|locale_get_primary_language|locale_get_region|locale_get_script|locale_is_right_to_left|locale_lookup|locale_minimize_subtags|locale_parse|locale_set_default|msgfmt_create|msgfmt_format_message|msgfmt_format|msgfmt_get_error_code|msgfmt_get_error_message|msgfmt_get_locale|msgfmt_get_pattern|msgfmt_parse_message|msgfmt_parse|msgfmt_set_pattern|normalizer_get_raw_decomposition|normalizer_is_normalized|normalizer_normalize|numfmt_create|numfmt_format_currency|numfmt_format|numfmt_get_attribute|numfmt_get_error_code|numfmt_get_error_message|numfmt_get_locale|numfmt_get_pattern|numfmt_get_symbol|numfmt_get_text_attribute|numfmt_parse_currency|numfmt_parse|numfmt_set_attribute|numfmt_set_pattern|numfmt_set_symbol|numfmt_set_text_attribute|resourcebundle_count|resourcebundle_create|resourcebundle_get_error_code|resourcebundle_get_error_message|resourcebundle_get|resourcebundle_locales|transliterator_create|transliterator_create_from_rules|transliterator_create_inverse|transliterator_get_error_code|transliterator_get_error_message|transliterator_list_ids|transliterator_transliterate|litespeed_finish_request|litespeed_request_headers|litespeed_response_headers|mb_check_encoding|mb_chr|mb_convert_case|mb_convert_encoding|mb_convert_kana|mb_convert_variables|mb_decode_mimeheader|mb_decode_numericentity|mb_detect_encoding|mb_detect_order|mb_encode_mimeheader|mb_encode_numericentity|mb_encoding_aliases|mb_ereg_match|mb_ereg_replace_callback|mb_ereg_replace|mb_ereg_search_getpos|mb_ereg_search_getregs|mb_ereg_search_init|mb_ereg_search_pos|mb_ereg_search_regs|mb_ereg_search_setpos|mb_ereg_search|mb_ereg|mb_eregi_replace|mb_eregi|mb_get_info|mb_http_input|mb_http_output|mb_internal_encoding|mb_language|mb_lcfirst|mb_list_encodings|mb_ltrim|mb_ord|mb_output_handler|mb_parse_str|mb_preferred_mime_name|mb_regex_encoding|mb_regex_set_options|mb_rtrim|mb_scrub|mb_send_mail|mb_split|mb_str_pad|mb_str_split|mb_strcut|mb_strimwidth|mb_stripos|mb_stristr|mb_strlen|mb_strpos|mb_strrchr|mb_strrichr|mb_strripos|mb_strrpos|mb_strstr|mb_strtolower|mb_strtoupper|mb_strwidth|mb_substitute_character|mb_substr_count|mb_substr|mb_trim|mb_ucfirst|mhash_count|mhash_get_block_size|mhash_get_hash_name|mhash_keygen_s2k|mhash|pcntl_alarm|pcntl_async_signals|pcntl_errno|pcntl_exec|pcntl_fork|pcntl_forkx|pcntl_get_last_error|pcntl_getcpu|pcntl_getcpuaffinity|pcntl_getpriority|pcntl_getqos_class|pcntl_rfork|pcntl_setcpuaffinity|pcntl_setns|pcntl_setpriority|pcntl_setqos_class|pcntl_signal_dispatch|pcntl_signal_get_handler|pcntl_signal|pcntl_sigprocmask|pcntl_sigtimedwait|pcntl_sigwaitinfo|pcntl_strerror|pcntl_unshare|pcntl_wait|pcntl_waitid|pcntl_waitpid|pcntl_wexitstatus|pcntl_wifcontinued|pcntl_wifexited|pcntl_wifsignaled|pcntl_wifstopped|pcntl_wstopsig|pcntl_wtermsig|pdo_drivers|phpdbg_break_file|phpdbg_break_function|phpdbg_break_method|phpdbg_break_next|phpdbg_clear|phpdbg_color|phpdbg_end_oplog|phpdbg_exec|phpdbg_get_executable|phpdbg_prompt|phpdbg_start_oplog|posix_access|posix_ctermid|posix_eaccess|posix_errno|posix_fpathconf|posix_get_last_error|posix_getcwd|posix_getegid|posix_geteuid|posix_getgid|posix_getgrgid|posix_getgrnam|posix_getgroups|posix_getlogin|posix_getpgid|posix_getpgrp|posix_getpid|posix_getppid|posix_getpwnam|posix_getpwuid|posix_getrlimit|posix_getsid|posix_getuid|posix_initgroups|posix_isatty|posix_kill|posix_mkfifo|posix_mknod|posix_pathconf|posix_setegid|posix_seteuid|posix_setgid|posix_setpgid|posix_setrlimit|posix_setsid|posix_setuid|posix_strerror|posix_sysconf|posix_times|posix_ttyname|posix_uname|ftok|msg_get_queue|msg_queue_exists|msg_receive|msg_remove_queue|msg_send|msg_set_queue|msg_stat_queue|sem_acquire|sem_get|sem_release|sem_remove|shm_attach|shm_detach|shm_get_var|shm_has_var|shm_put_var|shm_remove_var|shm_remove|session_abort|session_cache_expire|session_cache_limiter|session_commit|session_create_id|session_decode|session_destroy|session_encode|session_gc|session_get_cookie_params|session_id|session_module_name|session_name|session_regenerate_id|session_register_shutdown|session_reset|session_save_path|session_set_cookie_params|session_set_save_handler|session_start|session_status|session_unset|session_write_close|shmop_close|shmop_delete|shmop_open|shmop_read|shmop_size|shmop_write|socket_accept|socket_addrinfo_bind|socket_addrinfo_connect|socket_addrinfo_explain|socket_addrinfo_lookup|socket_atmark|socket_bind|socket_clear_error|socket_close|socket_cmsg_space|socket_connect|socket_create_listen|socket_create_pair|socket_create|socket_export_stream|socket_get_option|socket_getopt|socket_getpeername|socket_getsockname|socket_import_stream|socket_last_error|socket_listen|socket_read|socket_recv|socket_recvfrom|socket_recvmsg|socket_select|socket_send|socket_sendmsg|socket_sendto|socket_set_block|socket_set_nonblock|socket_set_option|socket_setopt|socket_shutdown|socket_strerror|socket_write|socket_wsaprotocol_info_export|socket_wsaprotocol_info_import|socket_wsaprotocol_info_release|token_get_all|token_name|deflate_add|deflate_init|gzclose|gzcompress|gzdecode|gzdeflate|gzencode|gzeof|gzfile|gzgetc|gzgets|gzgetss|gzinflate|gzopen|gzpassthru|gzputs|gzread|gzrewind|gzseek|gztell|gzuncompress|gzwrite|inflate_get_read_len|inflate_get_status|inflate_add|inflate_init|ob_gzhandler|readgzfile|zlib_decode|zlib_encode|zlib_get_coding_type|bzclose|bzcompress|bzdecompress|bzerrno|bzerror|bzerrstr|bzflush|bzopen|bzread|bzwrite|curl_file_create|curl_close|curl_copy_handle|curl_errno|curl_error|curl_escape|curl_exec|curl_getinfo|curl_init|curl_multi_add_handle|curl_multi_close|curl_multi_errno|curl_multi_exec|curl_multi_getcontent|curl_multi_info_read|curl_multi_init|curl_multi_remove_handle|curl_multi_select|curl_multi_setopt|curl_multi_strerror|curl_pause|curl_reset|curl_setopt_array|curl_setopt|curl_share_close|curl_share_errno|curl_share_init_persistent|curl_share_init|curl_share_setopt|curl_share_strerror|curl_strerror|curl_unescape|curl_upkeep|curl_version|dom_import_simplexml|Dom\\import_simplexml|enchant_broker_describe|enchant_broker_dict_exists|enchant_broker_free_dict|enchant_broker_free|enchant_broker_get_dict_path|enchant_broker_get_error|enchant_broker_init|enchant_broker_list_dicts|enchant_broker_request_dict|enchant_broker_request_pwl_dict|enchant_broker_set_dict_path|enchant_broker_set_ordering|enchant_dict_add_to_personal|enchant_dict_add_to_session|enchant_dict_add|enchant_dict_check|enchant_dict_describe|enchant_dict_get_error|enchant_dict_is_added|enchant_dict_is_in_session|enchant_dict_quick_check|enchant_dict_remove_from_session|enchant_dict_remove|enchant_dict_store_replacement|enchant_dict_suggest|_|bind_textdomain_codeset|bindtextdomain|dcgettext|dcngettext|dgettext|dngettext|gettext|ngettext|textdomain|gmp_abs|gmp_add|gmp_and|gmp_binomial|gmp_clrbit|gmp_cmp|gmp_com|gmp_div_q|gmp_div_qr|gmp_div_r|gmp_div|gmp_divexact|gmp_export|gmp_fact|gmp_gcd|gmp_gcdext|gmp_hamdist|gmp_import|gmp_init|gmp_intval|gmp_invert|gmp_jacobi|gmp_kronecker|gmp_lcm|gmp_legendre|gmp_mod|gmp_mul|gmp_neg|gmp_nextprime|gmp_or|gmp_perfect_power|gmp_perfect_square|gmp_popcount|gmp_pow|gmp_powm|gmp_prob_prime|gmp_random_bits|gmp_random_range|gmp_random_seed|gmp_random|gmp_root|gmp_rootrem|gmp_scan0|gmp_scan1|gmp_setbit|gmp_sign|gmp_sqrt|gmp_sqrtrem|gmp_strval|gmp_sub|gmp_testbit|gmp_xor|ldap_8859_to_t61|ldap_add_ext|ldap_add|ldap_bind_ext|ldap_bind|ldap_close|ldap_compare|ldap_connect_wallet|ldap_connect|ldap_control_paged_result_response|ldap_control_paged_result|ldap_count_entries|ldap_count_references|ldap_delete_ext|ldap_delete|ldap_dn2ufn|ldap_err2str|ldap_errno|ldap_error|ldap_escape|ldap_exop_passwd|ldap_exop_refresh|ldap_exop_sync|ldap_exop_whoami|ldap_exop|ldap_explode_dn|ldap_first_attribute|ldap_first_entry|ldap_first_reference|ldap_free_result|ldap_get_attributes|ldap_get_dn|ldap_get_entries|ldap_get_option|ldap_get_values_len|ldap_get_values|ldap_list|ldap_mod_add_ext|ldap_mod_add|ldap_mod_del_ext|ldap_mod_del|ldap_mod_replace_ext|ldap_mod_replace|ldap_modify_batch|ldap_modify|ldap_next_attribute|ldap_next_entry|ldap_next_reference|ldap_parse_exop|ldap_parse_reference|ldap_parse_result|ldap_read|ldap_rename_ext|ldap_rename|ldap_sasl_bind|ldap_search|ldap_set_option|ldap_set_rebind_proc|ldap_sort|ldap_start_tls|ldap_t61_to_8859|ldap_unbind|libxml_clear_errors|libxml_disable_entity_loader|libxml_get_errors|libxml_get_external_entity_loader|libxml_get_last_error|libxml_set_external_entity_loader|libxml_set_streams_context|libxml_use_internal_errors|mysqli_execute|mysqli_get_client_stats|mysqli_get_links_stats|mysqli_affected_rows|mysqli_autocommit|mysqli_begin_transaction|mysqli_change_user|mysqli_character_set_name|mysqli_close|mysqli_commit|mysqli_connect_errno|mysqli_connect_error|mysqli_connect|mysqli_debug|mysqli_dump_debug_info|mysqli_errno|mysqli_error_list|mysqli_error|mysqli_execute_query|mysqli_field_count|mysqli_get_charset|mysqli_get_client_info|mysqli_get_client_version|mysqli_get_connection_stats|mysqli_get_host_info|mysqli_get_proto_info|mysqli_get_server_info|mysqli_get_server_version|mysqli_get_warnings|mysqli_info|mysqli_init|mysqli_insert_id|mysqli_kill|mysqli_more_results|mysqli_multi_query|mysqli_next_result|mysqli_options|mysqli_ping|mysqli_poll|mysqli_prepare|mysqli_query|mysqli_real_connect|mysqli_real_escape_string|mysqli_real_query|mysqli_reap_async_query|mysqli_refresh|mysqli_release_savepoint|mysqli_rollback|mysqli_savepoint|mysqli_select_db|mysqli_set_charset|mysqli_sqlstate|mysqli_ssl_set|mysqli_stat|mysqli_stmt_init|mysqli_store_result|mysqli_thread_id|mysqli_thread_safe|mysqli_use_result|mysqli_warning_count|mysqli_embedded_server_end|mysqli_embedded_server_start|mysqli_report|mysqli_field_tell|mysqli_data_seek|mysqli_fetch_all|mysqli_fetch_array|mysqli_fetch_assoc|mysqli_fetch_column|mysqli_fetch_field_direct|mysqli_fetch_field|mysqli_fetch_fields|mysqli_fetch_object|mysqli_fetch_row|mysqli_num_fields|mysqli_field_seek|mysqli_free_result|mysqli_fetch_lengths|mysqli_num_rows|mysqli_stmt_affected_rows|mysqli_stmt_attr_get|mysqli_stmt_attr_set|mysqli_stmt_bind_param|mysqli_stmt_bind_result|mysqli_stmt_close|mysqli_stmt_data_seek|mysqli_stmt_errno|mysqli_stmt_error_list|mysqli_stmt_error|mysqli_stmt_execute|mysqli_stmt_fetch|mysqli_stmt_field_count|mysqli_stmt_free_result|mysqli_stmt_get_result|mysqli_stmt_get_warnings|mysqli_stmt_insert_id|mysqli_stmt_more_results|mysqli_stmt_next_result|mysqli_stmt_num_rows|mysqli_stmt_param_count|mysqli_stmt_prepare|mysqli_stmt_reset|mysqli_stmt_result_metadata|mysqli_stmt_send_long_data|mysqli_stmt_sqlstate|mysqli_stmt_store_result|openssl_cipher_iv_length|openssl_cipher_key_length|openssl_cms_decrypt|openssl_cms_encrypt|openssl_cms_read|openssl_cms_sign|openssl_cms_verify|openssl_csr_export_to_file|openssl_csr_export|openssl_csr_get_public_key|openssl_csr_get_subject|openssl_csr_new|openssl_csr_sign|openssl_decrypt|openssl_dh_compute_key|openssl_digest|openssl_encrypt|openssl_error_string|openssl_free_key|openssl_get_cert_locations|openssl_get_cipher_methods|openssl_get_curve_names|openssl_get_md_methods|openssl_get_privatekey|openssl_get_publickey|openssl_open|openssl_password_hash|openssl_password_verify|openssl_pbkdf2|openssl_pkcs12_export_to_file|openssl_pkcs12_export|openssl_pkcs12_read|openssl_pkcs7_decrypt|openssl_pkcs7_encrypt|openssl_pkcs7_read|openssl_pkcs7_sign|openssl_pkcs7_verify|openssl_pkey_derive|openssl_pkey_export_to_file|openssl_pkey_export|openssl_pkey_free|openssl_pkey_get_details|openssl_pkey_get_private|openssl_pkey_get_public|openssl_pkey_new|openssl_private_decrypt|openssl_private_encrypt|openssl_public_decrypt|openssl_public_encrypt|openssl_random_pseudo_bytes|openssl_seal|openssl_sign|openssl_spki_export_challenge|openssl_spki_export|openssl_spki_new|openssl_spki_verify|openssl_verify|openssl_x509_check_private_key|openssl_x509_checkpurpose|openssl_x509_export_to_file|openssl_x509_export|openssl_x509_fingerprint|openssl_x509_free|openssl_x509_parse|openssl_x509_read|openssl_x509_verify|pg_affected_rows|pg_cancel_query|pg_change_password|pg_client_encoding|pg_close_stmt|pg_close|pg_connect_poll|pg_connect|pg_connection_busy|pg_connection_reset|pg_connection_status|pg_consume_input|pg_convert|pg_copy_from|pg_copy_to|pg_dbname|pg_delete|pg_end_copy|pg_escape_bytea|pg_escape_identifier|pg_escape_literal|pg_escape_string|pg_execute|pg_fetch_all_columns|pg_fetch_all|pg_fetch_array|pg_fetch_assoc|pg_fetch_object|pg_fetch_result|pg_fetch_row|pg_field_is_null|pg_field_name|pg_field_num|pg_field_prtlen|pg_field_size|pg_field_table|pg_field_type_oid|pg_field_type|pg_flush|pg_free_result|pg_get_notify|pg_get_pid|pg_get_result|pg_host|pg_insert|pg_jit|pg_last_error|pg_last_notice|pg_last_oid|pg_lo_close|pg_lo_create|pg_lo_export|pg_lo_import|pg_lo_open|pg_lo_read_all|pg_lo_read|pg_lo_seek|pg_lo_tell|pg_lo_truncate|pg_lo_unlink|pg_lo_write|pg_meta_data|pg_num_fields|pg_num_rows|pg_options|pg_parameter_status|pg_pconnect|pg_ping|pg_port|pg_prepare|pg_put_copy_data|pg_put_copy_end|pg_put_line|pg_query_params|pg_query|pg_result_error_field|pg_result_error|pg_result_memory_size|pg_result_seek|pg_result_status|pg_select|pg_send_execute|pg_send_prepare|pg_send_query_params|pg_send_query|pg_service|pg_set_chunked_rows_size|pg_set_client_encoding|pg_set_error_context_visibility|pg_set_error_verbosity|pg_socket_poll|pg_socket|pg_trace|pg_transaction_status|pg_tty|pg_unescape_bytea|pg_untrace|pg_update|pg_version|readline_add_history|readline_callback_handler_install|readline_callback_handler_remove|readline_callback_read_char|readline_clear_history|readline_completion_function|readline_info|readline_list_history|readline_on_new_line|readline_read_history|readline_redisplay|readline_write_history|readline|simplexml_import_dom|simplexml_load_file|simplexml_load_string|snmp_get_quick_print|snmp_get_valueretrieval|snmp_read_mib|snmp_set_enum_print|snmp_set_oid_numeric_print|snmp_set_oid_output_format|snmp_set_quick_print|snmp_set_valueretrieval|snmp2_get|snmp2_getnext|snmp2_real_walk|snmp2_set|snmp2_walk|snmp3_get|snmp3_getnext|snmp3_real_walk|snmp3_set|snmp3_walk|snmpget|snmpgetnext|snmprealwalk|snmpset|snmpwalk|snmpwalkoid|is_soap_fault|use_soap_error_handler|sodium_add|sodium_base642bin|sodium_bin2base64|sodium_bin2hex|sodium_compare|sodium_crypto_aead_aegis128l_decrypt|sodium_crypto_aead_aegis128l_encrypt|sodium_crypto_aead_aegis128l_keygen|sodium_crypto_aead_aegis256_decrypt|sodium_crypto_aead_aegis256_encrypt|sodium_crypto_aead_aegis256_keygen|sodium_crypto_aead_aes256gcm_decrypt|sodium_crypto_aead_aes256gcm_encrypt|sodium_crypto_aead_aes256gcm_is_available|sodium_crypto_aead_aes256gcm_keygen|sodium_crypto_aead_chacha20poly1305_decrypt|sodium_crypto_aead_chacha20poly1305_encrypt|sodium_crypto_aead_chacha20poly1305_ietf_decrypt|sodium_crypto_aead_chacha20poly1305_ietf_encrypt|sodium_crypto_aead_chacha20poly1305_ietf_keygen|sodium_crypto_aead_chacha20poly1305_keygen|sodium_crypto_aead_xchacha20poly1305_ietf_decrypt|sodium_crypto_aead_xchacha20poly1305_ietf_encrypt|sodium_crypto_aead_xchacha20poly1305_ietf_keygen|sodium_crypto_auth_keygen|sodium_crypto_auth_verify|sodium_crypto_auth|sodium_crypto_box_keypair_from_secretkey_and_publickey|sodium_crypto_box_keypair|sodium_crypto_box_open|sodium_crypto_box_publickey_from_secretkey|sodium_crypto_box_publickey|sodium_crypto_box_seal_open|sodium_crypto_box_seal|sodium_crypto_box_secretkey|sodium_crypto_box_seed_keypair|sodium_crypto_box|sodium_crypto_core_ristretto255_add|sodium_crypto_core_ristretto255_from_hash|sodium_crypto_core_ristretto255_is_valid_point|sodium_crypto_core_ristretto255_random|sodium_crypto_core_ristretto255_scalar_add|sodium_crypto_core_ristretto255_scalar_complement|sodium_crypto_core_ristretto255_scalar_invert|sodium_crypto_core_ristretto255_scalar_mul|sodium_crypto_core_ristretto255_scalar_negate|sodium_crypto_core_ristretto255_scalar_random|sodium_crypto_core_ristretto255_scalar_reduce|sodium_crypto_core_ristretto255_scalar_sub|sodium_crypto_core_ristretto255_sub|sodium_crypto_generichash_final|sodium_crypto_generichash_init|sodium_crypto_generichash_keygen|sodium_crypto_generichash_update|sodium_crypto_generichash|sodium_crypto_kdf_derive_from_key|sodium_crypto_kdf_keygen|sodium_crypto_kx_client_session_keys|sodium_crypto_kx_keypair|sodium_crypto_kx_publickey|sodium_crypto_kx_secretkey|sodium_crypto_kx_seed_keypair|sodium_crypto_kx_server_session_keys|sodium_crypto_pwhash_scryptsalsa208sha256_str_verify|sodium_crypto_pwhash_scryptsalsa208sha256_str|sodium_crypto_pwhash_scryptsalsa208sha256|sodium_crypto_pwhash_str_needs_rehash|sodium_crypto_pwhash_str_verify|sodium_crypto_pwhash_str|sodium_crypto_pwhash|sodium_crypto_scalarmult_base|sodium_crypto_scalarmult_ristretto255_base|sodium_crypto_scalarmult_ristretto255|sodium_crypto_scalarmult|sodium_crypto_secretbox_keygen|sodium_crypto_secretbox_open|sodium_crypto_secretbox|sodium_crypto_secretstream_xchacha20poly1305_init_pull|sodium_crypto_secretstream_xchacha20poly1305_init_push|sodium_crypto_secretstream_xchacha20poly1305_keygen|sodium_crypto_secretstream_xchacha20poly1305_pull|sodium_crypto_secretstream_xchacha20poly1305_push|sodium_crypto_secretstream_xchacha20poly1305_rekey|sodium_crypto_shorthash_keygen|sodium_crypto_shorthash|sodium_crypto_sign_detached|sodium_crypto_sign_ed25519_pk_to_curve25519|sodium_crypto_sign_ed25519_sk_to_curve25519|sodium_crypto_sign_keypair_from_secretkey_and_publickey|sodium_crypto_sign_keypair|sodium_crypto_sign_open|sodium_crypto_sign_publickey_from_secretkey|sodium_crypto_sign_publickey|sodium_crypto_sign_secretkey|sodium_crypto_sign_seed_keypair|sodium_crypto_sign_verify_detached|sodium_crypto_sign|sodium_crypto_stream_keygen|sodium_crypto_stream_xchacha20_keygen|sodium_crypto_stream_xchacha20_xor_ic|sodium_crypto_stream_xchacha20_xor|sodium_crypto_stream_xchacha20|sodium_crypto_stream_xor|sodium_crypto_stream|sodium_hex2bin|sodium_increment|sodium_memcmp|sodium_memzero|sodium_pad|sodium_unpad|ob_tidyhandler|tidy_access_count|tidy_config_count|tidy_error_count|tidy_get_output|tidy_warning_count|tidy_get_body|tidy_clean_repair|tidy_diagnose|tidy_get_error_buffer|tidy_get_config|tidy_get_html_ver|tidy_getopt|tidy_get_opt_doc|tidy_get_release|tidy_get_status|tidy_get_head|tidy_get_html|tidy_is_xhtml|tidy_is_xml|tidy_parse_file|tidy_parse_string|tidy_repair_file|tidy_repair_string|tidy_get_root|odbc_autocommit|odbc_binmode|odbc_close_all|odbc_close|odbc_columnprivileges|odbc_columns|odbc_commit|odbc_connect|odbc_connection_string_is_quoted|odbc_connection_string_quote|odbc_connection_string_should_quote|odbc_cursor|odbc_data_source|odbc_do|odbc_error|odbc_errormsg|odbc_exec|odbc_execute|odbc_fetch_array|odbc_fetch_into|odbc_fetch_object|odbc_fetch_row|odbc_field_len|odbc_field_name|odbc_field_num|odbc_field_precision|odbc_field_scale|odbc_field_type|odbc_foreignkeys|odbc_free_result|odbc_gettypeinfo|odbc_longreadlen|odbc_next_result|odbc_num_fields|odbc_num_rows|odbc_pconnect|odbc_prepare|odbc_primarykeys|odbc_procedurecolumns|odbc_procedures|odbc_result_all|odbc_result|odbc_rollback|odbc_setoption|odbc_specialcolumns|odbc_statistics|odbc_tableprivileges|odbc_tables|xml_error_string|xml_get_current_byte_index|xml_get_current_column_number|xml_get_current_line_number|xml_get_error_code|xml_parse_into_struct|xml_parse|xml_parser_create_ns|xml_parser_create|xml_parser_free|xml_parser_get_option|xml_parser_set_option|xml_set_character_data_handler|xml_set_default_handler|xml_set_element_handler|xml_set_end_namespace_decl_handler|xml_set_external_entity_ref_handler|xml_set_notation_decl_handler|xml_set_object|xml_set_processing_instruction_handler|xml_set_start_namespace_decl_handler|xml_set_unparsed_entity_decl_handler|xmlwriter_end_attribute|xmlwriter_end_cdata|xmlwriter_end_comment|xmlwriter_end_document|xmlwriter_end_dtd|xmlwriter_end_dtd_attlist|xmlwriter_end_dtd_element|xmlwriter_end_dtd_entity|xmlwriter_end_element|xmlwriter_end_pi|xmlwriter_flush|xmlwriter_full_end_element|xmlwriter_open_memory|xmlwriter_open_uri|xmlwriter_output_memory|xmlwriter_set_indent|xmlwriter_set_indent_string|xmlwriter_start_attribute|xmlwriter_start_attribute_ns|xmlwriter_start_cdata|xmlwriter_start_comment|xmlwriter_start_document|xmlwriter_start_dtd|xmlwriter_start_dtd_attlist|xmlwriter_start_dtd_element|xmlwriter_start_dtd_entity|xmlwriter_start_element|xmlwriter_start_element_ns|xmlwriter_start_pi|xmlwriter_text|xmlwriter_write_attribute|xmlwriter_write_attribute_ns|xmlwriter_write_cdata|xmlwriter_write_comment|xmlwriter_write_dtd|xmlwriter_write_dtd_attlist|xmlwriter_write_dtd_element|xmlwriter_write_dtd_entity|xmlwriter_write_element|xmlwriter_write_element_ns|xmlwriter_write_pi|xmlwriter_write_raw|zip_close|zip_entry_close|zip_entry_compressedsize|zip_entry_compressionmethod|zip_entry_filesize|zip_entry_name|zip_entry_open|zip_entry_read|zip_open|zip_read)(?=\s*\(|$))/,
		'control-structures.alternative-syntax': /(end(?:for|foreach|if|switch|while|declare))/,
		'control-structures.$1': /(break|continue|declare|else|elseif|for|foreach|if|switch|while|goto)/,
		'control-structures.do.while': /(do)/,
		'control-structures.foreach': /(as)/,
		'control-structures.switch': /(case|default)/,
		'keyword.class': /(var)/,
		'language.constants.magic': /(__(?:CLASS|FILE|FUNCTION|LINE|METHOD|PROPERTY|DIR|NAMESPACE|TRAIT)__)/,
		'language.exceptions': /(catch|throw|try|finally)/,
		'language.oop5.$1': /(abstract|final)/,
		'language.oop5.cloning': /(clone)/,
		'language.oop5.constants': /(const)/,
		'language.oop5.visibility': /(private|protected|public)/,
		'language.operators.logical': /(and|x?or)/,
		'language.variables.scope#language.variables.scope.$1': /(global|static)/,
		'language.namespaces': /(namespace|use)/,
		'language.oop5.traits': /(trait)/,
		'language.generators.syntax#control-structures.yield': /(yield)/,
		'language.generators.syntax#control-structures.yield.from': /(from)/,
		'language.types.callable': /(callable)/,
		'functions.arrow': /(fn)/,
		'language.oop5.traits#language.oop5.traits.conflict': /(insteadof)/,
		'control-structures.match': /(match)/,
		'language.oop5.properties#language.oop5.properties.readonly-properties': /(readonly)/,
		'language.types.$1': /(array|float|string|null|void|iterable|mixed|never|object|resource)/,
		'language.types.integer': /(int)/,
		'language.types.boolean': /(bool)/,
		'language.types.singleton': /(true|false)/,
		'language.types.relative-class-types': /(self|parent)/,
		'language.types.enumerations': /(enum)/,
		'language.types.numeric-strings': /(numeric)/,
	}); // collisions: while

	jush.build_links2('php_new', 'https://www.php.net/$key', /(\b)/, /(\b)/i, {
		'class.$1': php_class,
		'language.types.object#language.types.object.casting': /(stdClass)/,
		'reserved.classes#reserved.classes.standard': /(__PHP_Incomplete_Class)/,
		'language.oop5.paamayim-nekudotayim': /(self|parent|static)/,
	});

	jush.build_links2('php_fun', 'https://www.php.net/$key', /(\b)/, /(\b)/i, {
		'language.oop5.autoload': /(__autoload)/,
		'language.oop5.decon#language.oop5.decon.constructor': /(__construct)/,
		'language.oop5.decon#language.oop5.decon.destructor': /(__destruct)/,
		'language.oop5.overloading#language.oop5.overloading.methods': /(__call|__callStatic)/,
		'language.oop5.overloading#language.oop5.overloading.members': /(__get|__set|__isset|__unset)/,
		'language.oop5.magic#language.oop5.magic.sleep': /(__sleep|__wakeup)/,
		'language.oop5.magic#language.oop5.magic.serialize': /(__serialize|__unserialize)/,
		'language.oop5.magic#language.oop5.magic.tostring': /(__toString)/,
		'language.oop5.magic#language.oop5.magic.invoke': /(__invoke)/,
		'language.oop5.magic#language.oop5.magic.set-state': /(__set_state)/,
		'language.oop5.cloning': /(__clone)/,
	}); //! link interfaces method inside class

	jush.build_links2('phpini', 'https://www.php.net/$key', /((?:^|\n)\s*)/, /(\b)/gi, {
		'ini.core#ini.$1': /(allow_call_time_pass_reference|always_populate_raw_post_data|arg_separator\.input|arg_separator\.output|asp_tags|auto_append_file|auto_globals_jit|auto_prepend_file|cgi\.check_shebang_line|cgi\.fix_pathinfo|cgi\.force_redirect|cgi\.redirect_status_env|cgi\.rfc2616_headers|default_charset|default_mimetype|detect_unicode|disable_classes|disable_functions|doc_root|expose_php|extension|extension_dir|fastcgi\.impersonate|file_uploads|gpc_order|include_path|memory_limit|open_basedir|post_max_size|precision|realpath_cache_size|realpath_cache_ttl|register_argc_argv|register_globals|register_long_arrays|request_order|serialize_precision|short_open_tag|sql\.safe_mode|track_vars|upload_max_filesize|max_file_uploads|upload_tmp_dir|user_dir|variables_order|y2k_compliance|zend\.ze1_compatibility_mode|zend\.multibyte|zend_extension|zend_extension_debug|zend_extension_debug_ts|zend_extension_ts)/,
		'errorfunc.configuration#ini.$1': /(error_reporting|display_errors|display_startup_errors|log_errors|log_errors_max_len|ignore_repeated_errors|ignore_repeated_source|report_memleaks|track_errors|html_errors|xmlrpc_errors|xmlrpc_error_number|docref_root|docref_ext|error_prepend_string|error_append_string|error_log)/,
		'outcontrol.configuration#ini.$1': /(output_buffering|output_handler|implicit_flush)/,
		'info.configuration#ini.$1': /(assert\.active|assert\.bail|assert\.warning|assert\.callback|assert\.quiet_eval|enable_dl|max_execution_time|max_input_time|max_input_nesting_level|max_input_vars|magic_quotes_gpc|magic_quotes_runtime|zend\.enable_gc)/,
		'datetime.configuration#ini.$1': /(date\.default_latitude|date\.default_longitude|date\.sunrise_zenith|date\.sunset_zenith|date\.timezone)/,
		'readline.configuration#ini.$1': /(cli\.pager|cli\.prompt)/,
		'phar.configuration#ini.$1': /(phar\.readonly|phar\.require_hash|phar\.extract_list|phar\.cache_list)/,
		'zlib.configuration#ini.$1': /(zlib\.output_compression|zlib\.output_compression_level|zlib\.output_handler)/,
		'mcrypt.configuration#ini.$1': /(mcrypt\.algorithms_dir|mcrypt\.modes_dir)/,
		'odbc.configuration#ini.$1': /(odbc\.default_db *|odbc\.default_user *|odbc\.default_pw *|odbc\.allow_persistent|odbc\.check_persistent|odbc\.max_persistent|odbc\.max_links|odbc\.defaultlrl|odbc\.defaultbinmode|odbc\.default_cursortype)/,
		'pdo.configuration#ini.$1': /(pdo\.dsn\..*)/,
		'pdo-mysql.configuration#ini.$1': /(pdo_mysql\.default_socket|pdo_mysql\.debug)/,
		'pdo-odbc.configuration#ini.$1': /(pdo_odbc\.connection_pooling|pdo_odbc\.db2_instance_name)/,
		'ibase.configuration#ini.$1': /(ibase\.allow_persistent|ibase\.max_persistent|ibase\.max_links|ibase\.default_db|ibase\.default_user|ibase\.default_password|ibase\.default_charset|ibase\.timestampformat|ibase\.dateformat|ibase\.timeformat)/,
		'fbsql.configuration#ini.$1': /(fbsql\.allow_persistent|fbsql\.generate_warnings|fbsql\.autocommit|fbsql\.max_persistent|fbsql\.max_links|fbsql\.max_connections|fbsql\.max_results|fbsql\.batchSize|fbsql\.default_host|fbsql\.default_user|fbsql\.default_password|fbsql\.default_database|fbsql\.default_database_password)/,
		'ifx.configuration#ini.$1': /(ifx\.allow_persistent|ifx\.max_persistent|ifx\.max_links|ifx\.default_host|ifx\.default_user|ifx\.default_password|ifx\.blobinfile|ifx\.textasvarchar|ifx\.byteasvarchar|ifx\.charasvarchar|ifx\.nullformat)/,
		'msql.configuration#ini.$1': /(msql\.allow_persistent|msql\.max_persistent|msql\.max_links)/,
		'mssql.configuration#ini.$1': /(mssql\.allow_persistent|mssql\.max_persistent|mssql\.max_links|mssql\.min_error_severity|mssql\.min_message_severity|mssql\.compatability_mode|mssql\.connect_timeout|mssql\.timeout|mssql\.textsize|mssql\.textlimit|mssql\.batchsize|mssql\.datetimeconvert|mssql\.secure_connection|mssql\.max_procs|mssql\.charset)/,
		'mysql.configuration#ini.$1': /(mysql\.allow_local_infile|mysql\.allow_persistent|mysql\.max_persistent|mysql\.max_links|mysql\.trace_mode|mysql\.default_port|mysql\.default_socket|mysql\.default_host|mysql\.default_user|mysql\.default_password|mysql\.connect_timeout)/,
		'mysqli.configuration#ini.$1': /(mysqli\.allow_local_infile|mysqli\.allow_persistent|mysqli\.max_persistent|mysqli\.max_links|mysqli\.default_port|mysqli\.default_socket|mysqli\.default_host|mysqli\.default_user|mysqli\.default_pw|mysqli\.reconnect|mysqli\.cache_size)/,
		'oci8.configuration#ini.$1': /(oci8\.connection_class|oci8\.default_prefetch|oci8\.events|oci8\.max_persistent|oci8\.old_oci_close_semantics|oci8\.persistent_timeout|oci8\.ping_interval|oci8\.privileged_connect|oci8\.statement_cache_size)/,
		'pgsql.configuration#ini.$1': /(pgsql\.allow_persistent|pgsql\.max_persistent|pgsql\.max_links|pgsql\.auto_reset_persistent|pgsql\.ignore_notice|pgsql\.log_notice)/,
		'sqlite3.configuration#ini.$1': /(sqlite3\.extension_dir)/,
		'sybase.configuration#ini.$1': /(sybase\.allow_persistent|sybase\.max_persistent|sybase\.max_links|sybase\.interface_file |sybase\.min_error_severity|sybase\.min_message_severity|sybase\.compatability_mode|magic_quotes_sybase|sybct\.allow_persistent|sybct\.max_persistent|sybct\.max_links|sybct\.min_server_severity|sybct\.min_client_severity|sybct\.hostname|sybct\.deadlock_retry_count)/,
		'filesystem.configuration#ini.$1': /(allow_url_fopen|allow_url_include|user_agent|default_socket_timeout|from|auto_detect_line_endings)/,
		'mime-magic.configuration#ini.$1': /(mime_magic\.debug|mime_magic\.magicfile)/,
		'iconv.configuration#ini.$1': /(iconv\.input_encoding|iconv\.output_encoding|iconv\.internal_encoding)/,
		'intl.configuration#ini.$1': /(intl\.default_locale)/,
		'mbstring.configuration#ini.$1': /(mbstring\.language|mbstring\.detect_order|mbstring\.http_input|mbstring\.http_output|mbstring\.internal_encoding|mbstring\.script_encoding|mbstring\.substitute_character|mbstring\.func_overload|mbstring\.encoding_translation|mbstring\.strict_detection)/,
		'exif.configuration#ini.$1': /(exif\.encode_unicode|exif\.decode_unicode_motorola|exif\.decode_unicode_intel|exif\.encode_jis|exif\.decode_jis_motorola|exif\.decode_jis_intel)/,
		'image.configuration#ini.$1': /(gd\.jpeg_ignore_warning)/,
		'mail.configuration#ini.$1': /(mail\.add_x_header|mail\.log|SMTP|smtp_port|sendmail_from|sendmail_path)/,
		'bc.configuration#ini.$1': /(bcmath\.scale)/,
		'sem.configuration#ini.$1': /(sysvshm\.init_mem)/,
		'misc.configuration#ini.$1': /(ignore_user_abort|highlight\.string|highlight\.comment|highlight\.keyword|highlight\.bg|highlight\.default|highlight\.html|browscap)/,
		'tidy.configuration#ini.$1': /(tidy\.default_config|tidy\.clean_output)/,
		'curl.configuration#ini.$1': /(curl\.cainfo)/,
		'ldap.configuration#ini.$1': /(ldap\.max_links)/,
		'network.configuration#ini.$1': /(define_syslog_variables)/,
		'apache.configuration#ini.$1': /(engine|child_terminate|last_modified|xbithack)/,
		'nsapi.configuration#ini.$1': /(nsapi\.read_timeout)/,
		'session.configuration#ini.$1': /(session\.save_path|session\.name|session\.save_handler|session\.auto_start|session\.gc_probability|session\.gc_divisor|session\.gc_maxlifetime|session\.serialize_handler|session\.cookie_lifetime|session\.cookie_path|session\.cookie_domain|session\.cookie_secure|session\.cookie_httponly|session\.use_cookies|session\.use_only_cookies|session\.referer_check|session\.entropy_file|session\.entropy_length|session\.cache_limiter|session\.cache_expire|session\.use_trans_sid|session\.bug_compat_42|session\.bug_compat_warn|session\.hash_function|session\.hash_bits_per_character|url_rewriter\.tags|session\.upload_progress\.enabled|session\.upload_progress\.cleanup|session\.upload_progress\.prefix|session\.upload_progress\.name|session\.upload_progress\.freq|session\.upload_progress\.min_freq)/,
		'pcre.configuration#ini.$1': /(pcre\.backtrack_limit|pcre\.recursion_limit)/,
		'filter.configuration#ini.$1': /(filter\.default|filter\.default_flags)/,
		'var.configuration#ini.$1': /(unserialize_callback_func)/,
		'soap.configuration#ini.$1': /(soap\.wsdl_cache_enabled|soap\.wsdl_cache_dir|soap\.wsdl_cache_ttl|soap\.wsdl_cache|soap\.wsdl_cache_limit)/,
		'com.configuration#ini.$1': /(com\.allow_dcom|com\.autoregister_typelib|com\.autoregister_verbose|com\.autoregister_casesensitive|com\.code_page|com\.typelib_file)/,
		'https://www.hardened-php.net/suhosin/configuration.html#$1': /(suhosin\.[-a-z0-9_.]+)/,
	});

	jush.build_links2('php_doc', 'https://manual.phpdoc.org/HTMLSmartyConverter/HandS/phpDocumentor/tutorial_tags.$key.pkg.html', /(^[ \t]*|\n\s*\*\s*|(?={))/, /(\b)/g, {
		'$1': /(@(?:abstract|access|author|category|copyright|deprecated|example|final|filesource|global|ignore|internal|license|link|method|name|package|param|property|return|see|since|static|staticvar|subpackage|todo|tutorial|uses|var|version))/,
		'': /(@(?:exception|throws))/,
		'inline$1': /(\{@(?:example|id|internal|inheritdoc|link|source|toc|tutorial))/,
	});

	jush.build_links2('mail', 'https://tools.ietf.org/html/rfc2076#section-3.$key', /(^|\n|\\n)/, /(:|$)/gi, {
		'2': /(Return-Path|Received|Path|DL-Expansion-History-Indication)/,
		'3': /(MIME-Version|Control|Also-Control|Original-Encoded-Information-Types|Alternate-Recipient|Disclose-Recipients|Content-Disposition)/,
		'4': /(From|Approved|Sender|To|Cc|Bcc|For-Handling|For-Comment|Newsgroups|Apparently-To|Distribution|Fax|Telefax|Phone|Mail-System-Version|Mailer|Originating-Client|X-Mailer|X-Newsreader)/,
		'5': /(Reply-To|Followup-To|Errors-To|Return-Receipt-To|Prevent-NonDelivery-Report|Generate-Delivery-Report|Content-Return|X400-Content-Return)/,
		'6': /(Message-ID|Content-ID|Content-Base|Content-Location|In-Reply-To|References|See-Also|Obsoletes|Supersedes|Article-Updates|Article-Names)/,
		'7': /(Keywords|Subject|Comments|Content-Description|Organization|Organisation|Summary|Content-Identifier)/,
		'8': /(Delivery-Date|Date|Expires|Expiry-Date|Reply-By)/,
		'9': /(Priority|Precedence|Importance|Sensitivity|Incomplete-Copy)/,
		'10': /(Language|Content-Language)/,
		'11': /(Content-Length|Lines)/,
		'12': /(Conversion|Content-Conversion|Conversion-With-Loss)/,
		'13': /(Content-Type|Content-SGML-Entity|Content-Transfer-Encoding|Message-Type|Encoding)/,
		'14': /(Resent-Reply-To|Resent-From|Resent-Sender|Resent-From|Resent-Date|Resent-To|Resent-cc|Resent-bcc|Resent-Message-ID)/,
		'15': /(Content-MD5|Xref)/,
		'16': /(Fcc|Auto-Forwarded|Discarded-X400-IPMS-Extensions|Discarded-X400-MTS-Extensions|Status)/,
	});
})();



jush.tr.redis = { quo: /"/, apo: /'/ };

jush.slugs.redis = name => name.toLowerCase().replace(/\s+/g, '-'); // CONFIG GET -> config-get

jush.build_links2('redis', 'https://redis.io/docs/latest/commands/$1/', /(^[ \t]*)/, /(\b)/gim, { // commands are linked only at the beginning of a line
	'$1': /(ACL\s+CAT|ACL\s+DELUSER|ACL\s+DRYRUN|ACL\s+GENPASS|ACL\s+GETUSER|ACL\s+HELP|ACL\s+LIST|ACL\s+LOAD|ACL\s+LOG|ACL\s+SAVE|ACL\s+SETUSER|ACL\s+USERS|ACL\s+WHOAMI|ACL|APPEND|ARCOUNT|ARDEL|ARDELRANGE|ARGET|ARGETRANGE|ARGREP|ARINFO|ARINSERT|ARLASTITEMS|ARLEN|ARMGET|ARMSET|ARNEXT|AROP|ARRING|ARSCAN|ARSEEK|ARSET|ASKING|AUTH|BACKUP\s+ABORT|BACKUP\s+CLEANUP|BACKUP\s+HELP|BACKUP\s+LIST|BACKUP\s+SEAL|BACKUP\s+START|BACKUP\s+STATUS|BACKUP|BGREWRITEAOF|BGSAVE|BITCOUNT|BITFIELD|BITFIELD_RO|BITOP|BITPOS|BLMOVE|BLMOVEM|BLMPOP|BLPOP|BRPOP|BRPOPLPUSH|BZMPOP|BZPOPMAX|BZPOPMIN|CLIENT\s+CACHING|CLIENT\s+GETNAME|CLIENT\s+GETREDIR|CLIENT\s+HELP|CLIENT\s+ID|CLIENT\s+INFO|CLIENT\s+KILL|CLIENT\s+LIST|CLIENT\s+NO-EVICT|CLIENT\s+NO-TOUCH|CLIENT\s+PAUSE|CLIENT\s+REPLY|CLIENT\s+SETINFO|CLIENT\s+SETNAME|CLIENT\s+TRACKING|CLIENT\s+TRACKINGINFO|CLIENT\s+UNBLOCK|CLIENT\s+UNPAUSE|CLIENT|CLUSTER\s+ADDSLOTS|CLUSTER\s+ADDSLOTSRANGE|CLUSTER\s+BUMPEPOCH|CLUSTER\s+COUNT-FAILURE-REPORTS|CLUSTER\s+COUNTKEYSINSLOT|CLUSTER\s+DELSLOTS|CLUSTER\s+DELSLOTSRANGE|CLUSTER\s+FAILOVER|CLUSTER\s+FLUSHSLOTS|CLUSTER\s+FORGET|CLUSTER\s+GETKEYSINSLOT|CLUSTER\s+HELP|CLUSTER\s+INFO|CLUSTER\s+KEYSLOT|CLUSTER\s+LINKS|CLUSTER\s+MEET|CLUSTER\s+MIGRATION|CLUSTER\s+MYID|CLUSTER\s+MYSHARDID|CLUSTER\s+NODES|CLUSTER\s+REPLICAS|CLUSTER\s+REPLICATE|CLUSTER\s+RESET|CLUSTER\s+SAVECONFIG|CLUSTER\s+SET-CONFIG-EPOCH|CLUSTER\s+SETSLOT|CLUSTER\s+SHARDS|CLUSTER\s+SLAVES|CLUSTER\s+SLOT-STATS|CLUSTER\s+SLOTS|CLUSTER\s+SYNCSLOTS|CLUSTER|COMMAND\s+COUNT|COMMAND\s+DOCS|COMMAND\s+GETKEYS|COMMAND\s+GETKEYSANDFLAGS|COMMAND\s+HELP|COMMAND\s+INFO|COMMAND\s+LIST|COMMAND|CONFIG\s+GET|CONFIG\s+HELP|CONFIG\s+RESETSTAT|CONFIG\s+REWRITE|CONFIG\s+SET|CONFIG|COPY|DBSIZE|DEBUG|DECR|DECRBY|DEL|DELEX|DIGEST|DISCARD|DUMP|ECHO|EVAL|EVALSHA|EVALSHA_RO|EVAL_RO|EXEC|EXISTS|EXPIRE|EXPIREAT|EXPIRETIME|FAILOVER|FCALL|FCALL_RO|FLUSHALL|FLUSHDB|FUNCTION\s+DELETE|FUNCTION\s+DUMP|FUNCTION\s+FLUSH|FUNCTION\s+HELP|FUNCTION\s+KILL|FUNCTION\s+LIST|FUNCTION\s+LOAD|FUNCTION\s+RESTORE|FUNCTION\s+STATS|FUNCTION|GEOADD|GEODIST|GEOHASH|GEOPOS|GEORADIUS|GEORADIUSBYMEMBER|GEORADIUSBYMEMBER_RO|GEORADIUS_RO|GEOSEARCH|GEOSEARCHSTORE|GET|GETBIT|GETDEL|GETEX|GETRANGE|GETSET|HDEL|HELLO|HEXISTS|HEXPIRE|HEXPIREAT|HEXPIRETIME|HGET|HGETALL|HGETDEL|HGETEX|HIMPORT\s+DISCARD|HIMPORT\s+DISCARDALL|HIMPORT\s+PREPARE|HIMPORT\s+SET|HIMPORT|HINCRBY|HINCRBYFLOAT|HKEYS|HLEN|HMGET|HMSET|HOTKEYS\s+GET|HOTKEYS\s+HELP|HOTKEYS\s+RESET|HOTKEYS\s+START|HOTKEYS\s+STOP|HOTKEYS|HPERSIST|HPEXPIRE|HPEXPIREAT|HPEXPIRETIME|HPTTL|HRANDFIELD|HSCAN|HSET|HSETEX|HSETNX|HSTRLEN|HTTL|HVALS|INCR|INCRBY|INCRBYFLOAT|INCREX|INFO|KEYS|LASTSAVE|LATENCY\s+DOCTOR|LATENCY\s+GRAPH|LATENCY\s+HELP|LATENCY\s+HISTOGRAM|LATENCY\s+HISTORY|LATENCY\s+LATEST|LATENCY\s+RESET|LATENCY|LCS|LINDEX|LINSERT|LLEN|LMOVE|LMOVEM|LMPOP|LOLWUT|LPOP|LPOS|LPUSH|LPUSHX|LRANGE|LREM|LSET|LTRIM|MEMORY\s+DOCTOR|MEMORY\s+HELP|MEMORY\s+MALLOC-STATS|MEMORY\s+PURGE|MEMORY\s+STATS|MEMORY\s+USAGE|MEMORY|MGET|MIGRATE|MODULE\s+HELP|MODULE\s+LIST|MODULE\s+LOAD|MODULE\s+LOADEX|MODULE\s+UNLOAD|MODULE|MONITOR|MOVE|MSET|MSETEX|MSETNX|MULTI|OBJECT\s+ENCODING|OBJECT\s+FREQ|OBJECT\s+HELP|OBJECT\s+IDLETIME|OBJECT\s+REFCOUNT|OBJECT|PERSIST|PEXPIRE|PEXPIREAT|PEXPIRETIME|PFADD|PFCOUNT|PFDEBUG|PFMERGE|PFSELFTEST|PING|PSETEX|PSUBSCRIBE|PSYNC|PTTL|PUBLISH|PUBSUB\s+CHANNELS|PUBSUB\s+HELP|PUBSUB\s+NUMPAT|PUBSUB\s+NUMSUB|PUBSUB\s+SHARDCHANNELS|PUBSUB\s+SHARDNUMSUB|PUBSUB|PUNSUBSCRIBE|QUIT|RANDOMKEY|READONLY|READWRITE|RENAME|RENAMENX|REPLCONF|REPLICAOF|RESET|RESTORE-ASKING|RESTORE|ROLE|RPOP|RPOPLPUSH|RPUSH|RPUSHX|SADD|SAVE|SCAN|SCARD|SCRIPT\s+DEBUG|SCRIPT\s+EXISTS|SCRIPT\s+FLUSH|SCRIPT\s+HELP|SCRIPT\s+KILL|SCRIPT\s+LOAD|SCRIPT|SDIFF|SDIFFCARD|SDIFFSTORE|SELECT|SENTINEL\s+CKQUORUM|SENTINEL\s+CONFIG|SENTINEL\s+DEBUG|SENTINEL\s+FAILOVER|SENTINEL\s+FLUSHCONFIG|SENTINEL\s+GET-MASTER-ADDR-BY-NAME|SENTINEL\s+HELP|SENTINEL\s+INFO-CACHE|SENTINEL\s+IS-MASTER-DOWN-BY-ADDR|SENTINEL\s+MASTER|SENTINEL\s+MASTERS|SENTINEL\s+MONITOR|SENTINEL\s+MYID|SENTINEL\s+PENDING-SCRIPTS|SENTINEL\s+REMOVE|SENTINEL\s+REPLICAS|SENTINEL\s+RESET|SENTINEL\s+SENTINELS|SENTINEL\s+SET|SENTINEL\s+SIMULATE-FAILURE|SENTINEL\s+SLAVES|SENTINEL|SET|SETBIT|SETEX|SETNX|SETRANGE|SFLUSH|SHUTDOWN|SINTER|SINTERCARD|SINTERSTORE|SISMEMBER|SLAVEOF|SLOWLOG\s+GET|SLOWLOG\s+HELP|SLOWLOG\s+LEN|SLOWLOG\s+RESET|SLOWLOG|SMEMBERS|SMISMEMBER|SMOVE|SORT|SORT_RO|SPOP|SPUBLISH|SRANDMEMBER|SREM|SSCAN|SSUBSCRIBE|STRLEN|SUBSCRIBE|SUBSTR|SUNION|SUNIONCARD|SUNIONSTORE|SUNSUBSCRIBE|SWAPDB|SYNC|TIME|TOUCH|TRIMSLOTS|TTL|TYPE|UNLINK|UNSUBSCRIBE|UNWATCH|WAIT|WAITAOF|WATCH|XACK|XACKDEL|XADD|XAUTOCLAIM|XCFGSET|XCLAIM|XDEL|XDELEX|XGROUP\s+CREATE|XGROUP\s+CREATECONSUMER|XGROUP\s+DELCONSUMER|XGROUP\s+DESTROY|XGROUP\s+HELP|XGROUP\s+SETID|XGROUP|XIDMPRECORD|XINFO\s+CONSUMERS|XINFO\s+GROUPS|XINFO\s+HELP|XINFO\s+STREAM|XINFO|XLEN|XNACK|XPENDING|XRANGE|XREAD|XREADGROUP|XREVRANGE|XSETID|XTRIM|ZADD|ZCARD|ZCOUNT|ZDIFF|ZDIFFSTORE|ZINCRBY|ZINTER|ZINTERCARD|ZINTERSTORE|ZLEXCOUNT|ZMPOP|ZMSCORE|ZPOPMAX|ZPOPMIN|ZRANDMEMBER|ZRANGE|ZRANGEBYLEX|ZRANGEBYSCORE|ZRANGESTORE|ZRANK|ZREM|ZREMRANGEBYLEX|ZREMRANGEBYRANK|ZREMRANGEBYSCORE|ZREVRANGE|ZREVRANGEBYLEX|ZREVRANGEBYSCORE|ZREVRANK|ZSCAN|ZSCORE|ZUNION|ZUNIONSTORE)/,
});



jush.tr.simpledb = { sqlite_apo: /'/, sqlite_quo: /"/, bac: /`/ };

jush.build_links2('simpledb', 'https://docs.aws.amazon.com/AmazonSimpleDB/latest/DeveloperGuide/$key.html', /(\b)/, /(\b)/gi, {
	'QuotingRulesSelect': /(select|limit)/,
	'CountingDataSelect': /(count)/,
	'SortingDataSelect': /(order\s+by|asc|desc)/,
	'SimpleQueriesSelect': /(where)/,
	'UsingSelectOperators': /(between|like|is|in)/,
	'RangeValueQueriesSelect': /(every)/,
	'': /(or|and|not|from|null|intersection)/,
});



jush.tr.sql = { one: /-- |#|--(?=\n|$)/, com_code: /\/\*![0-9]*|\*\//, com: /\/\*/, sql_sqlset: /(\s*)(SET)(\s+|$)(?!NAMES\b|CHARACTER\b|PASSWORD\b|(?:GLOBAL\s+|SESSION\s+)?TRANSACTION\b|@[^@]|NEW\.|OLD\.)/i, sql_code: /()/ };
jush.tr.sql_code = { sql_apo: /'/, sql_quo: /"/, bac: /`/, one: /-- |#|--(?=\n|$)/, com_code: /\/\*![0-9]*|\*\//, com: /\/\*/, sql_var: /\B@/, num: jush.num, _1: /;|\b(THEN|ELSE|LOOP|REPEAT|DO)\b/i };
jush.tr.sql_sqlset = { one: /-- |#|--(?=\n|$)/, com: /\/\*/, sqlset_val: /=/, _1: /;|$/ };
jush.tr.sqlset_val = { sql_apo: /'/, sql_quo: /"/, bac: /`/, one: /-- |#|--(?=\n|$)/, com: /\/\*/, _1: /,/, _2: /;|$/, num: jush.num }; //! comma can be inside function call
jush.tr.sqlset = { _0: /$/ }; //! jump from SHOW VARIABLES LIKE ''
jush.tr.sqlstatus = { _0: /$/ }; //! jump from SHOW STATUS LIKE ''
jush.tr.com_code = { _1: /()/ };

jush.autocompleting.sql.push('sql', 'sql_code', 'sql_sqlset', 'sqlset_val', 'bac'); // bac is a quoted identifier

jush.urls.sql_sqlset = 'https://dev.mysql.com/doc/mysql/en/$key';
jush.links.sql_sqlset = { 'set-statement.html': /.+/ };

jush.link_key.sql = jush.link_key.sqlset = jush.link_key.sqlstatus = (key, url) => { // keys may be 'mysql-key maria-key'
	const keys = key.split(' ');
	return (/mariadb/.test(url[0]) ? (keys.length > 1 ? keys[1] : keys[0].replace('.html', '/')) : keys[0]);
};

jush.slugs.sql = (name, key, url) => name.replace(/\b(ALTER|CREATE|DROP|RENAME|SHOW)\s+SCHEMA\b/, '$1 DATABASE').toLowerCase().replace((/mariadb/.test(url[0]) ? /\s+/g : /\s+|_/g), '-'); // MariaDB keeps underscores in slugs
jush.slugs.sqlset = (name, key, url) => (/mariadb/.test(url[0]) ? name : (jush.links2.sqlset.test(name.replace(/_/g, '-')) ? name.replace(/_/g, '-') : name)).toLowerCase();
jush.slugs.sqlstatus = (name, key, url) => (/mariadb/.test(url[0]) ? name.toLowerCase() : name);

jush.build_links2('sql', 'https://dev.mysql.com/doc/mysql/en/$key', /(\b)/, /(\b)/gi, {
	'alter-event.html': /(ALTER(?:\s+DEFINER\s*=\s*\S+)?\s+EVENT)/,
	'alter-table.html': /(ALTER(?:\s+ONLINE|\s+OFFLINE)?(?:\s+IGNORE)?\s+TABLE)/,
	'alter-view.html': /(ALTER(?:\s+ALGORITHM\s*=\s*(?:UNDEFINED|MERGE|TEMPTABLE))?(?:\s+DEFINER\s*=\s*\S+)?(?:\s+SQL\s+SECURITY\s+(?:DEFINER|INVOKER))?\s+VIEW)/,
	'analyze-table.html': /(ANALYZE(?:\s+NO_WRITE_TO_BINLOG|\s+LOCAL)?\s+TABLE)/,
	'create-event.html': /(CREATE(?:\s+DEFINER\s*=\s*\S+)?\s+EVENT)/,
	'create-function.html': /(CREATE(?:\s+DEFINER\s*=\s*\S+)?\s+FUNCTION)/,
	'create-procedure.html': /(CREATE(?:\s+DEFINER\s*=\s*\S+)?\s+PROCEDURE)/,
	'create-index.html': /(CREATE(?:\s+ONLINE|\s+OFFLINE)?(?:\s+UNIQUE|\s+FULLTEXT|\s+SPATIAL|\s+VECTOR)?\s+INDEX)/,
	'create-table.html': /(CREATE(?:\s+TEMPORARY)?\s+TABLE)/,
	'create-trigger.html': /(CREATE(?:\s+DEFINER\s*=\s*\S+)?\s+TRIGGER)/,
	'create-view.html': /(CREATE(?:\s+OR\s+REPLACE)?(?:\s+ALGORITHM\s*=\s*(?:UNDEFINED|MERGE|TEMPTABLE))?(?:\s+DEFINER\s*=\s*\S+)?(?:\s+SQL\s+SECURITY\s+(?:DEFINER|INVOKER))?\s+VIEW)/,
	'drop-index.html': /(DROP(?:\s+ONLINE|\s+OFFLINE)?\s+INDEX)/,
	'drop-table.html': /(DROP(?:\s+TEMPORARY)?\s+TABLE)/,
	'begin-end.html': /(END)/,
	'optimize-table.html': /(OPTIMIZE(?:\s+NO_WRITE_TO_BINLOG|\s+LOCAL)?\s+TABLE)/,
	'repair-table.html': /(REPAIR(?:\s+NO_WRITE_TO_BINLOG|\s+LOCAL)?\s+TABLE)/,
	'set-transaction.html': /(SET(?:\s+GLOBAL|\s+SESSION)?\s+TRANSACTION\s+ISOLATION\s+LEVEL)/,
	'show-columns.html': /(SHOW(?:\s+FULL)?\s+COLUMNS)/,
	'show-engines.html': /(SHOW(?:\s+STORAGE)?\s+ENGINES)/,
	'show-index.html': /(SHOW\s+(?:INDEX|INDEXES|KEYS))/,
	'show-processlist.html': /(SHOW(?:\s+FULL)?\s+PROCESSLIST)/,
	'show-status.html': /(SHOW(?:\s+GLOBAL|\s+SESSION)?\s+STATUS)/,
	'show-tables.html': /(SHOW(?:\s+FULL)?\s+TABLES)/,
	'show-variables.html': /(SHOW(?:\s+GLOBAL|\s+SESSION)?\s+VARIABLES)/,
	'join.html join-syntax/': /(JOIN)/,
	// statements (generated by update/sql.php)
	'$1-statements.html ': /(SQL)(?!\()/,
	'- $1-sequence_name/': /(NEXT\s+VALUE\s+FOR|PREVIOUS\s+VALUE\s+FOR)(?!\()/,
	'- show-binlog-status/': /(SHOW\s+MASTER\s+STATUS)(?!\()/,
	'- transactions-$1/': /(READ\s+COMMITTED|READ\s+UNCOMMITTED|REPEATABLE\s+READ|SERIALIZABLE)(?!\()/,
	'load-index.html -': /(LOAD\s+INDEX\s+INTO\s+CACHE)(?!\()/,
	' $1/': /(CONSTRAINT|DECLARE\s+CONDITION|DECLARE\s+CURSOR|DROP\s+PROCEDURE|DUAL|EXPLAIN\s+ANALYZE|FETCH|FOR\s+UPDATE|FOR|GROUP\s+BY|IGNORE|INSERT\s+IGNORE|INSERT\s+SELECT|LIMIT|LOAD\s+INDEX|ORDER\s+BY|PROCEDURE|REPEAT\s+LOOP|SELECT\s+INTO\s+OUTFILE|SHOW\s+ANALYZE|SHOW\s+EXPLAIN|SQLSTATE|WITH(?!\s+(?:QUERY\s+EXPANSION|ROLLUP)))(?!\()/,
	'show-parse-tree.html -': /(SHOW\s+PARSE_TREE)(?!\()/,
	'start-group-replication.html -': /(START\s+GROUP_REPLICATION)(?!\()/,
	'stop-group-replication.html -': /(STOP\s+GROUP_REPLICATION)(?!\()/,
	'- $1/': /(ALTER\s+SEQUENCE|BACKUP\s+LOCK|BACKUP\s+STAGE|BEGIN\s+END|CHANGE\s+MASTER\s+TO|CHECK\s+VIEW|CLOSE|CREATE\s+PACKAGE\s+BODY|CREATE\s+PACKAGE|CREATE\s+SEQUENCE|DECLARE\s+HANDLER|DECLARE\s+TYPE|DENY|DROP\s+PACKAGE\s+BODY|DROP\s+PACKAGE|DROP\s+SEQUENCE|EXECUTE\s+IMMEDIATE|FLUSH\s+QUERY\s+CACHE|FLUSH\s+TABLES\s+FOR\s+EXPORT|GOTO|INSERT\s+ON\s+DUPLICATE\s+KEY\s+UPDATE|INSTALL\s+SONAME|LASTVAL|LOAD\s+DATA\s+INFILE|LOCK\s+IN\s+SHARE\s+MODE|MINUS|NEXTVAL|OPEN|REPAIR\s+VIEW|RESET\s+MASTER|SELECT\s+INTO\s+DUMPFILE|SELECT\s+WITH\s+ROLLUP|SET\s+PATH|SET\s+STATEMENT|SETVAL|SHOW\s+AUTHORS|SHOW\s+CONTRIBUTORS|SHOW\s+CREATE\s+PACKAGE\s+BODY|SHOW\s+CREATE\s+PACKAGE|SHOW\s+CREATE\s+SEQUENCE|SHOW\s+CREATE\s+SERVER|SHOW\s+ENGINE\s+INNODB\s+STATUS|SHOW\s+LOCALES|SHOW\s+PACKAGE\s+BODY\s+STATUS|SHOW\s+PACKAGE\s+STATUS|SHOW\s+PLUGINS\s+SONAME|SHOW\s+REPLICA\s+HOSTS|UNINSTALL\s+SONAME(?!\()|(?:add_months|aswkb|binlog_gtid_pos|buffer|centroid|chr|column_add|column_check|column_create|column_delete|column_exists|column_get|column_json|column_list|contains|convexhull|crc32c|crosses|decode|decode_histogram|des_decrypt|des_encrypt|dimension|disjoint|encode|encrypt|equals|geometrycollectionfromtext|geometrycollectionfromwkb|geometryfromtext|geometryfromwkb|glength|inet6_aton|inet6_ntoa|intersects|is_ipv4|is_ipv4_compat|is_ipv4_mapped|is_ipv6|isclosed|isring|json_array_intersect|json_compact|json_detailed|json_equals|json_exists|json_key_value|json_loose|json_normalize|json_object_filter_keys|json_object_to_array|json_query|kdf|linestringfromtext|linestringfromwkb|master_gtid_wait|mbrequal|md5|median|mlinefromtext|mlinefromwkb|mpointfromtext|mpointfromwkb|mpolyfromtext|mpolyfromwkb|multilinestringfromtext|multilinestringfromwkb|multipointfromtext|multipointfromwkb|multipolygonfromtext|multipolygonfromwkb|natural_sort_key|old_password|overlaps|password|percentile_cont|percentile_disc|pointonsurface|polygonfromtext|polygonfromwkb|setval|sha1|st_aswkb|st_aswkt|st_boundary|st_geometrycollectionfromtext|st_geometrycollectionfromwkb|st_geometryfromtext|st_geometryfromwkb|st_isring|st_linestringfromtext|st_linestringfromwkb|st_numinteriorrings|st_pointonsurface|st_polygonfromtext|st_polygonfromwkb|st_relate|sys_guid|to_char|to_number|touches|trunc|vec_distance_cosine|vec_distance_euclidean|vec_fromtext|vec_totext|within|wsrep_last_seen_gtid|wsrep_last_written_gtid|wsrep_sync_wait_upto_gtid|xor)(?=\s*\(|$))/,
	' selectinto/': /(SELECT\s+INTO)(?!\()/,
	'$1.html -': /(ALTER\s+INSTANCE|ALTER\s+JSON\s+DUALITY\s+VIEW|ALTER\s+LIBRARY|ALTER\s+RESOURCE\s+GROUP|CHANGE\s+REPLICATION\s+FILTER|CHANGE\s+REPLICATION\s+SOURCE\s+TO|CLONE|CREATE\s+JSON\s+DUALITY\s+VIEW|CREATE\s+LIBRARY|CREATE\s+MASKING\s+POLICY|CREATE\s+RESOURCE\s+GROUP|CREATE\s+SPATIAL\s+REFERENCE\s+SYSTEM|DEALLOCATE\s+PREPARE|DROP\s+LIBRARY|DROP\s+MASKING\s+POLICY|DROP\s+RESOURCE\s+GROUP|DROP\s+SPATIAL\s+REFERENCE\s+SYSTEM|EXECUTE|HANDLER|HELP|IMPORT\s+TABLE|INSTALL\s+COMPONENT|LOAD\s+DATA|PREPARE|RESET\s+BINARY\s+LOGS\s+AND\s+GTIDS|RESET\s+PERSIST|RESTART|SET\s+RESOURCE\s+GROUP|SHOW\s+BINARY\s+LOG\s+STATUS|SHOW\s+CREATE\s+LIBRARY|SHOW\s+CREATE\s+MASKING\s+POLICY|SHOW\s+LIBRARY\s+STATUS|SHOW\s+REPLICAS|UNINSTALL\s+COMPONENT)(?!\()/,
	'$1.html': /(ALTER\s+(?:DATABASE|SCHEMA)|ALTER\s+FUNCTION|ALTER\s+LOGFILE\s+GROUP|ALTER\s+PROCEDURE|ALTER\s+SERVER|ALTER\s+TABLESPACE|ALTER\s+USER|BINLOG|CACHE\s+INDEX|CALL|CHECK\s+TABLE|CHECKSUM\s+TABLE|CREATE\s+(?:DATABASE|SCHEMA)|CREATE\s+LOGFILE\s+GROUP|CREATE\s+ROLE|CREATE\s+SERVER|CREATE\s+TABLESPACE|CREATE\s+USER|DELETE|DESCRIBE|DO|DROP\s+(?:DATABASE|SCHEMA)|DROP\s+EVENT|DROP\s+FUNCTION|DROP\s+LOGFILE\s+GROUP|DROP\s+ROLE|DROP\s+SERVER|DROP\s+TABLESPACE|DROP\s+TRIGGER|DROP\s+USER|DROP\s+VIEW|EXCEPT|EXPLAIN|FLUSH|GET\s+DIAGNOSTICS|GRANT|INSERT\s+DELAYED|INSERT|INSTALL\s+PLUGIN|INTERSECT|KILL|LOAD\s+XML|PURGE\s+BINARY\s+LOGS|RENAME\s+TABLE|RENAME\s+USER|REPLACE|RESET\s+REPLICA|RESET|RESIGNAL|RETURN|REVOKE|SELECT|SET\s+DEFAULT\s+ROLE|SET\s+PASSWORD|SET\s+ROLE|SET\s+TRANSACTION|SHOW\s+BINARY\s+LOGS|SHOW\s+BINLOG\s+EVENTS|SHOW\s+CHARACTER\s+SET|SHOW\s+COLLATION|SHOW\s+CREATE\s+(?:DATABASE|SCHEMA)|SHOW\s+CREATE\s+EVENT|SHOW\s+CREATE\s+FUNCTION|SHOW\s+CREATE\s+PROCEDURE|SHOW\s+CREATE\s+TABLE|SHOW\s+CREATE\s+TRIGGER|SHOW\s+CREATE\s+USER|SHOW\s+CREATE\s+VIEW|SHOW\s+(?:DATABASE|SCHEMA)S|SHOW\s+ENGINE|SHOW\s+ERRORS|SHOW\s+EVENTS|SHOW\s+FUNCTION\s+CODE|SHOW\s+FUNCTION\s+STATUS|SHOW\s+GRANTS|SHOW\s+OPEN\s+TABLES|SHOW\s+PLUGINS|SHOW\s+PRIVILEGES|SHOW\s+PROCEDURE\s+CODE|SHOW\s+PROCEDURE\s+STATUS|SHOW\s+PROFILE|SHOW\s+PROFILES|SHOW\s+RELAYLOG\s+EVENTS|SHOW\s+REPLICA\s+STATUS|SHOW\s+TABLE\s+STATUS|SHOW\s+TRIGGERS|SHOW\s+WARNINGS|SHUTDOWN|SIGNAL|START\s+REPLICA|STOP\s+REPLICA|UNINSTALL\s+PLUGIN|UNION|UPDATE)(?!\()/,
	'$1.html ': /(DECLARE|SHOW|TABLE|USE|VALUES)(?!\()/,
	// end statements
	'$1-statement.html': /(LOOP|LEAVE|ITERATE|WHILE)/,
	'if-statement.html': /(IF|ELSEIF)(?!\()/,
	'repeat-statement.html': /(REPEAT|UNTIL)(?!\()/,
	'truncate-table.html': /(TRUNCATE(?:\s+TABLE)?)(?!\()/,
	'commit.html': /(START\s+TRANSACTION|BEGIN|COMMIT|ROLLBACK(?!\s+(?:TO\s+SAVEPOINT)))/,
	'savepoints.html': /(SAVEPOINT|ROLLBACK\s+TO\s+SAVEPOINT)/,
	'lock-tables.html': /((?:UN)?LOCK\s+TABLES?)/,
	'charset-connection.html': /(SET\s+NAMES|SET\s+CHARACTER\s+SET)/,
	'insert-on-duplicate.html': /(ON\s+DUPLICATE\s+KEY\s+UPDATE)/,
	'fulltext-search.html': /(IN\s+BOOLEAN\s+MODE|IN\s+NATURAL\s+LANGUAGE\s+MODE|WITH\s+QUERY\s+EXPANSION)/,
	'example-auto-increment.html auto_increment/': /(AUTO_INCREMENT)/,
	'comparison-operators.html#operator_$1': /(IS(?!\s+(?:NULL))|IS\s+NULL)/,
	'comparison-operators.html#function_$1': /((?:BETWEEN|NOT\s+BETWEEN|IN|NOT\s+IN)(?!\()|(?:coalesce|greatest|interval|isnull|least)(?=\s*\(|$))/,
	'any-in-some-subqueries.html': /(ANY|IN|SOME)(?=\s*\(|$)/,
	'all-subqueries.html': /(ALL)/,
	'exists-and-not-exists-subqueries.html': /(EXISTS|NOT\s+EXISTS)/,
	'group-by-modifiers.html': /(WITH\s+ROLLUP)/,
	'string-functions.html#operator_$1': /(SOUNDS\s+LIKE)/,
	'string-comparison-functions.html#operator_$1': /(LIKE|NOT\s+LIKE)/,
	'regexp.html#operator_$1': /(NOT\s+REGEXP|REGEXP)/,
	'regexp.html#operator_regexp': /(RLIKE)/,
	'logical-operators.html#operator_$1': /(NOT|AND|OR|XOR)(?!\()/,
	'control-flow-functions.html#operator_$1': /(CASE)/,
	'arithmetic-functions.html#operator_$1': /(DIV)/,
	'cast-functions.html#operator_$1': /(BINARY)/,
	'numeric-type-syntax.html numeric-data-types/': /(bit|tinyint|bool|boolean|smallint|mediumint|int|integer|bigint|float|double\s+precision|double|real|decimal|dec|numeric|fixed)/,
	'date-and-time-type-syntax.html date-and-time-data-types/': /(datetime|(?:timestamp|date|time|year)(?!\s*\())/,
	'string-type-syntax.html string-data-types/': /(char|varchar|binary|varbinary|tinyblob|tinytext|blob|text|mediumblob|mediumtext|longblob|longtext|enum|set)/,
	'json.html json-data-type/': /(json)/,
	'spatial-type-overview.html geometry-types/': /(geometry|(?:point|linestring|polygon|multipoint|multilinestring|multipolygon|geometrycollection)(?!\s*\())/,
	'vector.html vector/': /(vector)/,
	'- inet4/': /(inet4)/,
	'- inet6/': /(inet6)/,
	'date-and-time-functions.html#function_$1': /(CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|LOCALTIME|LOCALTIMESTAMP|UTC_DATE|UTC_TIME|UTC_TIMESTAMP|(?:adddate|addtime|convert_tz|curdate|curtime|date|date_add|date_format|date_sub|datediff|day|dayname|dayofmonth|dayofweek|dayofyear|extract|from_days|from_unixtime|get_format|hour|last_day|makedate|maketime|microsecond|minute|month|monthname|now|period_add|period_diff|quarter|sec_to_time|second|str_to_date|subdate|subtime|sysdate|time|time_format|time_to_sec|timediff|timestamp|timestampadd|timestampdiff|to_days|to_seconds|unix_timestamp|week|weekday|weekofyear|year|yearweek)(?=\s*\(|$))/,
	'date-and-time-functions.html#function_date-add': /(INTERVAL)/,
	'': /(ACCESSIBLE|ADD|ALTER|ANALYZE|AS|ASC|ASENSITIVE|BEFORE|BOTH|BY|CASCADE|CHANGE|CHARACTER|CHECK|COLLATE|COLUMN|CONDITION|CONTINUE|CONVERT|CREATE|CROSS|CUBE|CUME_DIST|CURSOR|DATABASE|DATABASES|DAY_HOUR|DAY_MICROSECOND|DAY_MINUTE|DAY_SECOND|DEFAULT|DELAYED|DENSE_RANK|DESC|DETERMINISTIC|DISTINCT|DISTINCTROW|DROP|EACH|ELSE|EMPTY|ENCLOSED|ESCAPED|EXIT|EXTERNAL|FALSE|FIRST_VALUE|FLOAT4|FLOAT8|FORCE|FOREIGN|FROM|FULLTEXT|FUNCTION|GENERAL|GENERATED|GET|GROUP|GROUPING|GROUPS|HAVING|HIGH_PRIORITY|HOUR_MICROSECOND|HOUR_MINUTE|HOUR_SECOND|INDEX|INFILE|INNER|INOUT|INSENSITIVE|INT1|INT2|INT3|INT4|INT8|INTO|IO_AFTER_GTIDS|IO_BEFORE_GTIDS|JSON_TABLE|KEY|KEYS|LAG|LAST_VALUE|LATERAL|LEAD|LEADING|LEFT|LIBRARY|LINEAR|LINES|LOAD|LOCK|LONG|LOW_PRIORITY|MATCH|MAXVALUE|MIDDLEINT|MINUTE_MICROSECOND|MINUTE_SECOND|MODIFIES|NATURAL|NO_WRITE_TO_BINLOG|NTH_VALUE|NTILE|NULL|OF|ON|OPTIMIZE|OPTIMIZER_COSTS|OPTION|OPTIONALLY|ORDER|OUT|OUTER|OUTFILE|OVER|PARTITION(?!\s+(?:BY\s+COLUMNS|BY\s+HASH|BY\s+KEY|BY\s+LINEAR\s+HASH|BY\s+LINEAR\s+KEY|BY\s+LIST|BY\s+RANGE))|PERCENT_RANK|PRECISION|PRIMARY|PURGE|QUALIFY|RANGE|RANK|READ|READS|READ_WRITE|RECURSIVE|REFERENCES|RELEASE|RENAME|REQUIRE|RESTRICT|RETURNING|RIGHT|ROW|ROWS|ROW_NUMBER|SCHEMA|SCHEMAS|SECOND_MICROSECOND|SENSITIVE|SEPARATOR|SLOW|SPATIAL|SPECIFIC|SQLEXCEPTION|SQLWARNING|SQL_BIG_RESULT|SQL_CALC_FOUND_ROWS|SQL_SMALL_RESULT|SSL|STARTING|STORED|STRAIGHT_JOIN|SYSTEM|TABLESAMPLE|TERMINATED|THEN|TO|TRAILING|TRIGGER|TRUE|UNDO|UNIQUE|UNLOCK|UNSIGNED|USAGE|USING|VARCHARACTER|VARYING|VIRTUAL|WHEN|WHERE|WINDOW|WRITE|YEAR_MONTH|ZEROFILL)(?!\()/,
	'mathematical-functions.html#function_$1': /(mod|(?:abs|acos|asin|atan|atan2|ceil|ceiling|conv|cos|cot|crc32|degrees|exp|floor|ln|log|log10|log2|pi|pow|power|radians|rand|round|sign|sin|sqrt|tan|truncate)(?=\s*\(|$))/,
	'information-functions.html#function_$1': /(CURRENT_USER|(?:benchmark|charset|coercibility|collation|connection_id|current_role|database|found_rows|icu_version|last_insert_id|roles_graphml|row_count|schema|session_user|system_user|user|version)(?=\s*\(|$))/,
	'$1-storage-engine.html': /(InnoDB|MyISAM|MEMORY|CSV|ARCHIVE|BLACKHOLE|MERGE|FEDERATED)/,
	'merge-storage-engine.html': /(MRG_MyISAM)/,
	'partitioning-range.html': /(PARTITION\s+BY\s+RANGE)/,
	'partitioning-list.html': /(PARTITION\s+BY\s+LIST)/,
	'partitioning-columns.html': /(PARTITION\s+BY\s+COLUMNS)/,
	'partitioning-hash.html': /(PARTITION\s+BY\s+HASH)/,
	'partitioning-linear-hash.html': /(PARTITION\s+BY\s+LINEAR\s+HASH)/,
	'partitioning-key.html': /(PARTITION\s+BY(?:\s+LINEAR)?\s+KEY)/,
	// functions (generated by update/sql.php)
	'- $11/': /(sha)(?=\s*\(|$)/,
	'- geometry-properties-$1/': /(issimple)(?=\s*\(|$)/,
	'- next-value-for-sequence_name/': /(nextval)(?=\s*\(|$)/,
	'- previous-value-for-sequence_name/': /(lastval)(?=\s*\(|$)/,
	'- st_$1/': /(area|asbinary|astext|aswkt|boundary|endpoint|envelope|exteriorring|geomcollfromtext|geomcollfromwkb|geometryn|geometrytype|geomfromtext|geomfromwkb|interiorringn|isempty|linefromtext|linefromwkb|numgeometries|numinteriorrings|numpoints|pointfromtext|pointfromwkb|pointn|polyfromtext|polyfromwkb|srid|startpoint|x|y)(?=\s*\(|$)/,
	'- st_geomfromtext/': /(st_multilinestringfromtext|st_multipointfromtext|st_multipolygonfromtext)(?=\s*\(|$)/,
	'- st_geomfromwkb/': /(st_multilinestringfromwkb|st_multipointfromwkb|st_multipolygonfromwkb)(?=\s*\(|$)/,
	'- uuid_v4/': /(uuidv4)(?=\s*\(|$)/,
	'- uuid_v7/': /(uuidv7)(?=\s*\(|$)/,
	'- vector-functions-$1/': /(vec_distance)(?=\s*\(|$)/,
	'aggregate-functions.html#function_$1 $1/': /(avg|bit_and|bit_or|bit_xor|count|group_concat|json_arrayagg|json_objectagg|max|min|std|stddev|stddev_pop|stddev_samp|sum|var_pop|var_samp|variance)(?=\s*\(|$)/,
	'bit-functions.html#function_$1 $1/': /(bit_count)(?=\s*\(|$)/,
	'cast-functions.html#function_$1 $1/': /(cast|convert)(?=\s*\(|$)/,
	'encryption-functions.html#function_$1 $1/': /(aes_decrypt|aes_encrypt|compress|sha2|uncompress|uncompressed_length)(?=\s*\(|$)/,
	'encryption-functions.html#function_$1 -': /(random_bytes|statement_digest|statement_digest_text|validate_password_strength)(?=\s*\(|$)/,
	'flow-control-functions.html#function_$1 $1-function/': /(if)(?=\s*\(|$)/,
	'flow-control-functions.html#function_$1 $1/': /(ifnull|nullif)(?=\s*\(|$)/,
	'gis-format-conversion-functions.html#function_$1 $1/': /(st_asbinary|st_astext)(?=\s*\(|$)/,
	'gis-format-conversion-functions.html#function_$1 -': /(st_swapxy)(?=\s*\(|$)/,
	'gis-general-property-functions.html#function_$1 $1/': /(st_dimension|st_envelope|st_geometrytype|st_isempty|st_issimple|st_srid)(?=\s*\(|$)/,
	'gis-geometrycollection-property-functions.html#function_$1 $1/': /(st_geometryn|st_numgeometries)(?=\s*\(|$)/,
	'gis-linestring-property-functions.html#function_$1 $1/': /(st_endpoint|st_isclosed|st_length|st_numpoints|st_pointn|st_startpoint)(?=\s*\(|$)/,
	'gis-mysql-specific-functions.html#function_$1 $1/': /(geometrycollection|linestring|multilinestring|multipoint|multipolygon|point|polygon)(?=\s*\(|$)/,
	'gis-mysql-specific-functions.html#function_$1 -': /(geomcollection)(?=\s*\(|$)/,
	'gis-point-property-functions.html#function_$1 $1/': /(st_x|st_y)(?=\s*\(|$)/,
	'gis-point-property-functions.html#function_$1 -': /(st_latitude|st_longitude)(?=\s*\(|$)/,
	'gis-polygon-property-functions.html#function_$1 $1/': /(st_area|st_centroid|st_exteriorring|st_interiorringn)(?=\s*\(|$)/,
	'gis-polygon-property-functions.html#function_$1s -': /(st_numinteriorring)(?=\s*\(|$)/,
	'gis-wkb-functions.html#function_$1 $1/': /(st_geomcollfromwkb|st_geomfromwkb|st_linefromwkb|st_pointfromwkb|st_polyfromwkb)(?=\s*\(|$)/,
	'gis-wkb-functions.html#function_$1 st_geomfromwkb/': /(st_mlinefromwkb|st_mpointfromwkb|st_mpolyfromwkb)(?=\s*\(|$)/,
	'gis-wkt-functions.html#function_$1 $1/': /(st_geomcollfromtext|st_geomfromtext|st_linefromtext|st_pointfromtext|st_polyfromtext)(?=\s*\(|$)/,
	'gis-wkt-functions.html#function_$1 st_geomfromtext/': /(st_mlinefromtext|st_mpointfromtext|st_mpolyfromtext)(?=\s*\(|$)/,
	'gtid-functions.html#function_$1 -': /(wait_for_executed_gtid_set)(?=\s*\(|$)/,
	'internal-functions.html#function_$1 -': /(can_access_column|can_access_database|can_access_table|can_access_user|can_access_view|get_dd_column_privileges|get_dd_create_options|get_dd_index_sub_part_length|internal_auto_increment|internal_avg_row_length|internal_check_time|internal_checksum|internal_data_free|internal_data_length|internal_dd_char_length|internal_get_comment_or_error|internal_get_enabled_role_json|internal_get_hostname|internal_get_username|internal_get_view_warning_or_error|internal_index_column_cardinality|internal_index_length|internal_is_enabled_role|internal_is_mandatory_role|internal_keys_disabled|internal_max_data_length|internal_table_rows|internal_update_time)(?=\s*\(|$)/,
	'json-attribute-functions.html#function_$1 $1/': /(json_depth|json_length|json_type|json_valid)(?=\s*\(|$)/,
	'json-creation-functions.html#function_$1 $1/': /(json_array|json_object|json_quote)(?=\s*\(|$)/,
	'json-creation-functions.html#function_$1 -': /(json_duality_object)(?=\s*\(|$)/,
	'json-modification-functions.html#function_$1 $1/': /(json_array_append|json_array_insert|json_insert|json_merge|json_remove|json_replace|json_set|json_unquote)(?=\s*\(|$)/,
	'json-modification-functions.html#function_$1 json_merge/': /(json_merge_patch|json_merge_preserve)(?=\s*\(|$)/,
	'json-search-functions.html#function_$1 $1/': /(json_contains|json_contains_path|json_extract|json_keys|json_overlaps|json_search|json_value)(?=\s*\(|$)/,
	'json-table-functions.html#function_$1 $1/': /(json_table)(?=\s*\(|$)/,
	'json-utility-functions.html#function_$1 $1/': /(json_pretty)(?=\s*\(|$)/,
	'json-utility-functions.html#function_$1 -': /(json_storage_free|json_storage_size)(?=\s*\(|$)/,
	'json-validation-functions.html#function_$1 $1/': /(json_schema_valid)(?=\s*\(|$)/,
	'json-validation-functions.html#function_$1 -': /(json_schema_validation_report)(?=\s*\(|$)/,
	'locking-functions.html#function_$1 $1/': /(get_lock|is_free_lock|is_used_lock|release_lock)(?=\s*\(|$)/,
	'locking-functions.html#function_$1 -': /(release_all_locks)(?=\s*\(|$)/,
	'miscellaneous-functions.html#function_$1 $1/': /(default|inet_aton|inet_ntoa|name_const|sleep|uuid|uuid_short)(?=\s*\(|$)/,
	'miscellaneous-functions.html#function_$1 -': /(any_value|bin_to_uuid|etag|grouping|is_uuid|uuid_to_bin|values)(?=\s*\(|$)/,
	'performance-schema-functions.html#function_$1 $1/': /(format_pico_time)(?=\s*\(|$)/,
	'performance-schema-functions.html#function_$1 -': /(ps_current_thread_id|ps_thread_id)(?=\s*\(|$)/,
	'performance-schema-functions.html#function_$1 miscellaneous-functions-$1/': /(format_bytes)(?=\s*\(|$)/,
	'regexp.html#function_$1 $1/': /(regexp_instr|regexp_replace|regexp_substr)(?=\s*\(|$)/,
	'regexp.html#function_$1 -': /(regexp_like)(?=\s*\(|$)/,
	'replication-functions-async-failover.html#function_$1 -': /(asynchronous_connection_failover_add_managed|asynchronous_connection_failover_add_source|asynchronous_connection_failover_delete_managed|asynchronous_connection_failover_delete_source|asynchronous_connection_failover_reset)(?=\s*\(|$)/,
	'replication-functions-synchronization.html#function_$1 $1/': /(master_pos_wait)(?=\s*\(|$)/,
	'replication-functions-synchronization.html#function_$1 -': /(source_pos_wait)(?=\s*\(|$)/,
	'spatial-aggregate-functions.html#function_$1 $1/': /(st_collect)(?=\s*\(|$)/,
	'spatial-convenience-functions.html#function_$1 $1/': /(st_distance_sphere|st_isvalid|st_simplify|st_validate)(?=\s*\(|$)/,
	'spatial-convenience-functions.html#function_$1 -': /(st_makeenvelope)(?=\s*\(|$)/,
	'spatial-geohash-functions.html#function_$1 $1/': /(st_geohash|st_latfromgeohash|st_longfromgeohash|st_pointfromgeohash)(?=\s*\(|$)/,
	'spatial-geojson-functions.html#function_$1 $1/': /(st_geomfromgeojson)(?=\s*\(|$)/,
	'spatial-geojson-functions.html#function_$1 geojson-$1/': /(st_asgeojson)(?=\s*\(|$)/,
	'spatial-operator-functions.html#function_$1 $1/': /(st_buffer|st_convexhull|st_difference|st_intersection|st_symdifference|st_union)(?=\s*\(|$)/,
	'spatial-operator-functions.html#function_$1 -': /(st_buffer_strategy|st_lineinterpolatepoint|st_lineinterpolatepoints|st_pointatdistance|st_transform)(?=\s*\(|$)/,
	'spatial-relation-functions-mbr.html#function_$1 $1/': /(mbrcontains|mbrcoveredby|mbrdisjoint|mbrintersects|mbroverlaps|mbrtouches|mbrwithin)(?=\s*\(|$)/,
	'spatial-relation-functions-mbr.html#function_$1 -': /(mbrcovers)(?=\s*\(|$)/,
	'spatial-relation-functions-mbr.html#function_$1 mbrequal/': /(mbrequals)(?=\s*\(|$)/,
	'spatial-relation-functions-object-shapes.html#function_$1 $1/': /(st_disjoint|st_distance)(?=\s*\(|$)/,
	'spatial-relation-functions-object-shapes.html#function_$1 -': /(st_frechetdistance|st_hausdorffdistance)(?=\s*\(|$)/,
	'spatial-relation-functions-object-shapes.html#function_$1 st-contains/': /(st_contains)(?=\s*\(|$)/,
	'spatial-relation-functions-object-shapes.html#function_$1 st-crosses/': /(st_crosses)(?=\s*\(|$)/,
	'spatial-relation-functions-object-shapes.html#function_$1 st-equals/': /(st_equals)(?=\s*\(|$)/,
	'spatial-relation-functions-object-shapes.html#function_$1 st-intersects/': /(st_intersects)(?=\s*\(|$)/,
	'spatial-relation-functions-object-shapes.html#function_$1 st-overlaps/': /(st_overlaps)(?=\s*\(|$)/,
	'spatial-relation-functions-object-shapes.html#function_$1 st-touches/': /(st_touches)(?=\s*\(|$)/,
	'spatial-relation-functions-object-shapes.html#function_$1 st-within/': /(st_within)(?=\s*\(|$)/,
	'string-comparison-functions.html#function_$1 $1/': /(strcmp)(?=\s*\(|$)/,
	'string-functions.html#function_$1 $1/': /(ascii|bin|bit_length|char_length|character_length|concat|concat_ws|elt|export_set|field|find_in_set|format|from_base64|hex|instr|lcase|left|length|load_file|locate|lower|lpad|ltrim|make_set|mid|oct|octet_length|ord|position|quote|reverse|right|rpad|rtrim|soundex|space|substr|substring|substring_index|to_base64|trim|ucase|unhex|upper|weight_string)(?=\s*\(|$)/,
	'string-functions.html#function_$1 -': /(insert|repeat|replace)(?=\s*\(|$)/,
	'vector-functions.html#function_$1 -': /(distance|string_to_vector|vector_dim|vector_to_string)(?=\s*\(|$)/,
	'window-function-descriptions.html#function_$1 $1/': /(cume_dist|dense_rank|last_value|ntile|percent_rank|rank|row_number)(?=\s*\(|$)/,
	'window-function-descriptions.html#function_$1 -': /(first_value|lag|lead|nth_value)(?=\s*\(|$)/,
	'xml-functions.html#function_$1 $1/': /(extractvalue|updatexml)(?=\s*\(|$)/,
	// end functions
	'row-subqueries.html': /(row)(?=\s*\(|$)/,
	'fulltext-search.html#function_match': /(match|against)(?=\s*\(|$)/,
}); // collisions: char, set, union(), allow parenthesis - IN, ANY, ALL, SOME, NOT, AND, OR, XOR; the uuid type is not linked because of the UUID() function (and MySQL has no such type), binary links to the operator

jush.build_links2('sqlset', 'https://dev.mysql.com/doc/mysql/en/$key', /(\b)/, /((?!-)\b)/gi, {
	'- aria-system-variables/#$1': /(aria_block_size|aria_checkpoint_interval|aria_checkpoint_log_activity|aria_encrypt_tables|aria_force_start_after_recovery_failures|aria_group_commit|aria_group_commit_interval|aria_log_dir_path|aria_log_file_size|aria_log_purge_type|aria_max_sort_file_size|aria_page_checksum|aria_pagecache_age_threshold|aria_pagecache_buffer_size|aria_pagecache_division_limit|aria_pagecache_file_hash_size|aria_pagecache_segments|aria_recover|aria_recover_options|aria_repair_threads|aria_sort_buffer_size|aria_stats_method|aria_sync_log_dir|aria_used_for_temp_tables)/,
	'- galera-cluster-system-variables/#$1': /(wsrep_OSU_method|wsrep_allowlist|wsrep_applier_retry_count|wsrep_auto_increment_control|wsrep_causal_reads|wsrep_certification_rules|wsrep_certify_nonPK|wsrep_cluster_address|wsrep_cluster_name|wsrep_convert_LOCK_to_trx|wsrep_data_home_dir|wsrep_dbug_option|wsrep_debug|wsrep_desync|wsrep_dirty_reads|wsrep_drupal_282555_workaround|wsrep_forced_binlog_format|wsrep_gtid_domain_id|wsrep_gtid_mode|wsrep_gtid_seq_no|wsrep_ignore_apply_errors|wsrep_load_data_splitting|wsrep_log_conflicts|wsrep_max_ws_rows|wsrep_max_ws_size|wsrep_mode|wsrep_mysql_replication_bundle|wsrep_node_address|wsrep_node_incoming_address|wsrep_node_name|wsrep_notify_cmd|wsrep_on|wsrep_patch_version|wsrep_provider|wsrep_provider_options|wsrep_recover|wsrep_reject_queries|wsrep_replicate_myisam|wsrep_retry_autocommit|wsrep_slave_FK_checks|wsrep_slave_UK_checks|wsrep_slave_threads|wsrep_sst_auth|wsrep_sst_donor|wsrep_sst_donor_rejects_queries|wsrep_sst_method|wsrep_sst_receive_address|wsrep_start_position|wsrep_status_file|wsrep_strict_ddl|wsrep_sync_wait|wsrep_thread_count)/,
	'- galera-cluster-system-variables/#$1_auth': /(wsrep_sr_store)/,
	'- innodb-system-variables/#$1': /(have_innodb|ignore_builtin_innodb|innodb_adaptive_checkpoint|innodb_adaptive_flushing_method|innodb_adaptive_hash_index_partitions|innodb_additional_mem_pool_size|innodb_alter_copy_bulk|innodb_api_bk_commit_interval|innodb_api_disable_rowlock|innodb_api_enable_binlog|innodb_api_enable_mdl|innodb_api_trx_level|innodb_background_scrub_data_check_interval|innodb_background_scrub_data_compressed|innodb_background_scrub_data_interval|innodb_background_scrub_data_uncompressed|innodb_blocking_buffer_pool_restore|innodb_buf_dump_status_frequency|innodb_buffer_pool_evict|innodb_buffer_pool_instances|innodb_buffer_pool_load_pages_abort|innodb_buffer_pool_populate|innodb_buffer_pool_restore_at_startup|innodb_buffer_pool_shm_checksum|innodb_buffer_pool_shm_key|innodb_buffer_pool_size_auto_min|innodb_buffer_pool_size_max|innodb_change_buffer_dump|innodb_change_buffering_debug|innodb_checkpoint_age_target|innodb_checksums|innodb_cleaner_lsn_age_factor|innodb_cmp_per_index_enabled|innodb_compression_algorithm|innodb_compression_default|innodb_compression_failure_threshold_pct|innodb_compression_level|innodb_compression_pad_pct_max|innodb_corrupt_table_action|innodb_data_file_buffering|innodb_data_file_write_through|innodb_deadlock_report|innodb_default_encryption_key_id|innodb_default_page_encryption_key|innodb_defragment|innodb_defragment_fill_factor|innodb_defragment_fill_factor_n_recs|innodb_defragment_frequency|innodb_defragment_n_pages|innodb_defragment_stats_accuracy|innodb_dict_size_limit|innodb_disallow_writes|innodb_doublewrite_file|innodb_empty_free_list_algorithm|innodb_enable_unsafe_group_commit|innodb_encrypt_log|innodb_encrypt_tables|innodb_encrypt_temporary_tables|innodb_encryption_rotate_key_age|innodb_encryption_rotation_iops|innodb_encryption_threads|innodb_extra_rsegments|innodb_extra_undoslots|innodb_fake_changes|innodb_fast_checksum|innodb_fatal_semaphore_wait_threshold|innodb_file_format|innodb_file_format_check|innodb_file_format_max|innodb_flush_neighbor_pages|innodb_force_primary_key|innodb_foreground_preflush|innodb_ibuf_accel_rate|innodb_ibuf_active_contract|innodb_ibuf_max_size|innodb_immediate_scrub_data_uncompressed|innodb_import_table_from_xtrabackup|innodb_instant_alter_column_allowed|innodb_instrument_semaphores|innodb_kill_idle_transaction|innodb_large_prefix|innodb_lazy_drop_table|innodb_lock_schedule_algorithm|innodb_locking_fake_changes|innodb_locks_unsafe_for_binlog|innodb_log_arch_dir|innodb_log_arch_expire_sec|innodb_log_archive|innodb_log_block_size|innodb_log_checksum_algorithm|innodb_log_file_buffering|innodb_log_file_mmap|innodb_log_file_size|innodb_log_file_write_through|innodb_log_files_in_group|innodb_log_optimize_ddl|innodb_log_spin_wait_delay|innodb_lru_flush_size|innodb_max_bitmap_file_size|innodb_max_changed_pages|innodb_max_purge_lag_wait|innodb_merge_sort_block_size|innodb_mirrored_log_groups|innodb_mtflush_threads|innodb_prefix_index_cluster_optimization|innodb_read_ahead|innodb_read_only|innodb_recovery_stats|innodb_safe_truncate|innodb_sched_priority_cleaner|innodb_scrub_log|innodb_scrub_log_interval|innodb_scrub_log_speed|innodb_show_verbose_locks|innodb_simulate_comp_failures|innodb_snapshot_isolation|innodb_stats_auto_update|innodb_stats_modified_counter|innodb_stats_sample_pages|innodb_stats_traditional|innodb_stats_update_need_lock|innodb_support_xa|innodb_thread_concurrency_timer_based|innodb_track_changed_pages|innodb_track_redo_log_now|innodb_truncate_temporary_tablespace_now|innodb_undo_logs|innodb_undo_tablespaces|innodb_use_atomic_writes|innodb_use_fallocate|innodb_use_global_flush_log_at_trx_commit|innodb_use_mtflush|innodb_use_purge_thread|innodb_use_stacktrace|innodb_use_sys_malloc|innodb_use_sys_stats_table|innodb_use_trim)/,
	'- myisam-system-variables/#$1': /(key_cache_file_hash_size|key_cache_segments|myisam_block_size|myisam_max_extra_sort_file_size|myisam_repair_threads)/,
	'- performance-schema-system-variables/#$1': /(performance_schema_max_prepared_statement_instances)/,
	'- replication-and-binary-log-system-variables/#$1': /(binlog_alter_two_phase|binlog_annotate_row_events|binlog_commit_wait_count|binlog_commit_wait_usec|binlog_do_db|binlog_file_cache_size|binlog_gtid_index|binlog_gtid_index_page_size|binlog_gtid_index_span_min|binlog_ignore_db|binlog_large_commit_threshold|binlog_legacy_event_pos|binlog_optimize_thread_scheduling|binlog_space_limit|create_tmp_table_binlog_formats|default_master_connection|encrypt_binlog|expire_logs_days|master_info_file|replicate_annotate_row_events|replicate_do_db|replicate_do_table|replicate_events_marked_for_skip|replicate_ignore_db|replicate_ignore_table|replicate_rewrite_db|replicate_wild_do_table|replicate_wild_ignore_table|show_slave_auth_info|slave_abort_blocking_timeout|slave_connections_needed_for_purge|slave_ddl_exec_mode|slave_domain_parallel_threads|slave_run_triggers_for_rbr)/,
	'- server-system-variables/#$1': /(allow_suspicious_udfs|alter_algorithm|analyze_max_length|analyze_sample_percentage|character_set_collations|check_constraint_checks|date_format|datetime_format|debug_no_thread_alarm|default_regex_flags|default_table_type|encrypt_tmp_disk_tables|encrypt_tmp_files|encryption_algorithm|enforce_storage_engine|engine_condition_pushdown|expensive_subquery_limit|have_crypt|have_csv|have_ndbcluster|have_partitioning|histogram_size|histogram_type|idle_readonly_transaction_timeout|idle_transaction_timeout|idle_write_transaction_timeout|ignore_db_dirs|in_predicate_conversion_threshold|in_transaction|join_buffer_space_limit|join_cache_level|log|log_disabled_statements|log_slow_disabled_statements|log_slow_filter|log_slow_min_examined_row_limit|log_slow_queries|log_slow_query|log_slow_query_file|log_slow_query_time|log_slow_rate_limit|log_slow_verbosity|log_tc_size|log_warnings|max_long_data_size|max_open_cursors|max_password_errors|max_recursive_iterations|max_rowid_filter_size|max_session_mem_used|max_statement_time|max_tmp_tables|metadata_locks_cache_size|metadata_locks_hash_instances|metadata_locks_instances|mrr_buffer_size|multi_range_count|mysql56_temporal_format|old|old_mode|old_passwords|optimizer_extra_pruning_depth|optimizer_join_limit_pref_ratio|optimizer_max_sel_arg_weight|optimizer_max_sel_args|optimizer_record_context|optimizer_selectivity_sampling_limit|optimizer_use_condition_selectivity|plugin_maturity|progress_report_time|proxy_protocol_networks|query_cache_limit|query_cache_min_res_unit|query_cache_size|query_cache_strip_comments|query_cache_type|query_cache_wlock_invalidate|redirect_url|rowid_merge_buff_size|rpl_recovery_rank|safe_show_database|secure_auth|secure_timestamp|server_uid|skip_grant_tables|sql_big_tables|sql_if_exists|sql_log_update|sql_low_priority_updates|sql_max_join_size|standard_compliant_cte|storage_engine|strict_password_validation|sync_frm|table_lock_wait_timeout|table_type|tcp_keepalive_interval|tcp_keepalive_probes|tcp_keepalive_time|tcp_nodelay|thread_concurrency|timed_mutexes|tmp_disk_table_size|tmp_memory_table_size|tx_isolation|tx_read_only|use_stat_tables|version_malloc_library|version_source_revision)/,
	'- ssltls-system-variables/#$1': /(ssl_passphrase)/,
	'- vector-system-variables/#$1': /(mhnsw_default_distance|mhnsw_default_m|mhnsw_ef_search|mhnsw_max_cache_size)/,
	'innodb-parameters.html#option_mysqld_$1 -': /(innodb[-_]dedicated[-_]server)/,
	'innodb-parameters.html#sysvar_$1 -': /(enable_cascade_triggers|innodb_background_drop_list_empty|innodb_buffer_pool_debug|innodb_buffer_pool_in_core_file|innodb_checkpoint_disabled|innodb_compress_debug|innodb_ddl_buffer_size|innodb_ddl_log_crash_reset_debug|innodb_ddl_threads|innodb_directories|innodb_doublewrite_batch_size|innodb_doublewrite_dir|innodb_doublewrite_files|innodb_doublewrite_pages|innodb_extend_and_initialize|innodb_fsync_threshold|innodb_limit_optimistic_insert_debug|innodb_log_checkpoint_fuzzy_now|innodb_log_spin_cpu_abs_lwm|innodb_log_spin_cpu_pct_hwm|innodb_log_wait_for_flush_spin_hwm|innodb_log_writer_threads|innodb_merge_threshold_set_all_debug|innodb_native_foreign_keys|innodb_parallel_read_threads|innodb_print_ddl_logs|innodb_redo_log_archive_dirs|innodb_redo_log_capacity|innodb_redo_log_encrypt|innodb_segment_reserve_factor|innodb_spin_wait_pause_multiplier|innodb_stats_on_metadata|innodb_sync_debug|innodb_temp_tablespaces_dir|innodb_undo_log_encrypt|innodb_use_fdatasync|innodb_validate_tablespace_paths)/,
	'innodb-parameters.html#sysvar_$1 innodb-system-variables/#$1': /(innodb_adaptive_flushing|innodb_adaptive_flushing_lwm|innodb_adaptive_hash_index|innodb_adaptive_hash_index_parts|innodb_adaptive_max_sleep_delay|innodb_autoextend_increment|innodb_autoinc_lock_mode|innodb_buffer_pool_chunk_size|innodb_buffer_pool_dump_at_shutdown|innodb_buffer_pool_dump_now|innodb_buffer_pool_dump_pct|innodb_buffer_pool_filename|innodb_buffer_pool_load_abort|innodb_buffer_pool_load_at_startup|innodb_buffer_pool_load_now|innodb_buffer_pool_size|innodb_change_buffer_max_size|innodb_change_buffering|innodb_checksum_algorithm|innodb_commit_concurrency|innodb_concurrency_tickets|innodb_data_file_path|innodb_data_home_dir|innodb_deadlock_detect|innodb_default_row_format|innodb_disable_sort_file_cache|innodb_doublewrite|innodb_fast_shutdown|innodb_file_per_table|innodb_fill_factor|innodb_flush_log_at_timeout|innodb_flush_log_at_trx_commit|innodb_flush_method|innodb_flush_neighbors|innodb_flush_sync|innodb_flushing_avg_loops|innodb_force_load_corrupted|innodb_force_recovery|innodb_ft_aux_table|innodb_ft_cache_size|innodb_ft_enable_diag_print|innodb_ft_enable_stopword|innodb_ft_max_token_size|innodb_ft_min_token_size|innodb_ft_num_word_optimize|innodb_ft_result_cache_limit|innodb_ft_server_stopword_table|innodb_ft_sort_pll_degree|innodb_ft_total_cache_size|innodb_ft_user_stopword_table|innodb_idle_flush_pct|innodb_io_capacity|innodb_io_capacity_max|innodb_lock_wait_timeout|innodb_log_buffer_size|innodb_log_checkpoint_now|innodb_log_checksums|innodb_log_compressed_pages|innodb_log_group_home_dir|innodb_log_write_ahead_size|innodb_lru_scan_depth|innodb_max_dirty_pages_pct|innodb_max_dirty_pages_pct_lwm|innodb_max_purge_lag|innodb_max_purge_lag_delay|innodb_max_undo_log_size|innodb_monitor_disable|innodb_monitor_enable|innodb_monitor_reset|innodb_monitor_reset_all|innodb_numa_interleave|innodb_old_blocks_pct|innodb_old_blocks_time|innodb_online_alter_log_max_size|innodb_open_files|innodb_optimize_fulltext_only|innodb_page_cleaners|innodb_page_size|innodb_print_all_deadlocks|innodb_purge_batch_size|innodb_purge_rseg_truncate_frequency|innodb_purge_threads|innodb_random_read_ahead|innodb_read_ahead_threshold|innodb_read_io_threads|innodb_replication_delay|innodb_rollback_on_timeout|innodb_rollback_segments|innodb_sort_buffer_size|innodb_spin_wait_delay|innodb_stats_auto_recalc|innodb_stats_include_delete_marked|innodb_stats_method|innodb_stats_persistent|innodb_stats_persistent_sample_pages|innodb_stats_transient_sample_pages|innodb_status_output|innodb_status_output_locks|innodb_strict_mode|innodb_sync_array_size|innodb_table_locks|innodb_temp_data_file_path|innodb_thread_concurrency|innodb_thread_sleep_delay|innodb_tmpdir|innodb_undo_directory|innodb_undo_log_truncate|innodb_use_native_aio|innodb_version|innodb_write_io_threads)/,
	'innodb-parameters.html#sysvar_$1 innodb-system-variables/#innodb_support_xa': /(innodb_sync_spin_loops)/,
	'performance-schema-system-variables.html#sysvar_$1 -': /(performance_schema_error_size|performance_schema_max_digest_sample_age|performance_schema_max_logger_classes|performance_schema_max_meter_classes|performance_schema_max_metric_classes|performance_schema_max_prepared_statements_instances|performance_schema_show_processlist)/,
	'performance-schema-system-variables.html#sysvar_$1 performance-schema-system-variables/#$1': /(performance_schema|performance_schema_accounts_size|performance_schema_digests_size|performance_schema_events_stages_history_long_size|performance_schema_events_stages_history_size|performance_schema_events_statements_history_long_size|performance_schema_events_statements_history_size|performance_schema_events_transactions_history_long_size|performance_schema_events_transactions_history_size|performance_schema_events_waits_history_long_size|performance_schema_events_waits_history_size|performance_schema_hosts_size|performance_schema_max_cond_classes|performance_schema_max_cond_instances|performance_schema_max_digest_length|performance_schema_max_file_classes|performance_schema_max_file_handles|performance_schema_max_file_instances|performance_schema_max_index_stat|performance_schema_max_memory_classes|performance_schema_max_metadata_locks|performance_schema_max_mutex_classes|performance_schema_max_mutex_instances|performance_schema_max_program_instances|performance_schema_max_rwlock_classes|performance_schema_max_rwlock_instances|performance_schema_max_socket_classes|performance_schema_max_socket_instances|performance_schema_max_sql_text_length|performance_schema_max_stage_classes|performance_schema_max_statement_classes|performance_schema_max_statement_stack|performance_schema_max_table_handles|performance_schema_max_table_instances|performance_schema_max_table_lock_stat|performance_schema_max_thread_classes|performance_schema_max_thread_instances|performance_schema_session_connect_attrs_size|performance_schema_setup_actors_size|performance_schema_setup_objects_size|performance_schema_users_size)/,
	'replication-options-binary-log.html#option_mysqld_$1 -': /(log[-_]bin[-_]index)/,
	'replication-options-binary-log.html#option_mysqld_$1 replication-and-binary-log-system-variables/#$1': /(binlog[-_]row[-_]event[-_]max[-_]size)/,
	'replication-options-binary-log.html#sysvar_$1 -': /(binlog_encryption|binlog_error_action|binlog_expire_logs_auto_purge|binlog_group_commit_sync_delay|binlog_group_commit_sync_no_delay_count|binlog_max_flush_queue_time|binlog_order_commits|binlog_rotate_encryption_master_key_at_startup|binlog_row_value_options|binlog_rows_query_log_events|binlog_transaction_compression|binlog_transaction_compression_level_zstd|binlog_transaction_dependency_history_size|log_bin|log_bin_basename|log_bin_trust_function_creators|log_replica_updates|log_slave_updates|log_statements_unsafe_for_binlog|original_commit_timestamp|source_verify_checksum|sql_log_bin|sync_binlog)/,
	'replication-options-binary-log.html#sysvar_$1 replication-and-binary-log-system-variables/#$1': /(binlog_cache_size|binlog_checksum|binlog_direct_non_transactional_updates|binlog_expire_logs_seconds|binlog_format|binlog_row_image|binlog_row_metadata|binlog_stmt_cache_size|master_verify_checksum|max_binlog_cache_size|max_binlog_size|max_binlog_stmt_cache_size)/,
	'replication-options-gtids.html#sysvar_$1 -': /(enforce_gtid_consistency|gtid_executed|gtid_executed_compression_period|gtid_mode|gtid_next|gtid_owned|gtid_purged)/,
	'replication-options-replica.html#option_mysqld_$1 -': /(skip[-_]replica[-_]start|skip[-_]slave[-_]start|slave[-_]skip[-_]errors)/,
	'replication-options-replica.html#sysvar_$1 -': /(init_replica|init_slave|log_slow_replica_statements|log_slow_slave_statements|max_relay_log_size|relay_log|relay_log_basename|relay_log_index|relay_log_purge|relay_log_recovery|relay_log_space_limit|replica_allow_higher_version_source|replica_checkpoint_group|replica_checkpoint_period|replica_compressed_protocol|replica_exec_mode|replica_load_tmpdir|replica_max_allowed_packet|replica_net_timeout|replica_parallel_workers|replica_pending_jobs_size_max|replica_preserve_commit_order|replica_skip_errors|replica_sql_verify_checksum|replica_transaction_retries|replica_type_conversions|replication_optimize_for_static_plugin_config|replication_sender_observe_commit_only|rpl_read_size|rpl_semi_sync_replica_enabled|rpl_semi_sync_replica_trace_level|rpl_semi_sync_slave_enabled|rpl_semi_sync_slave_trace_level|rpl_stop_replica_timeout|rpl_stop_slave_timeout|slave_checkpoint_group|slave_checkpoint_period|slave_exec_mode|slave_load_tmpdir|slave_max_allowed_packet|slave_net_timeout|slave_parallel_workers|slave_pending_jobs_size_max|slave_preserve_commit_order|slave_sql_verify_checksum|slave_transaction_retries|slave_type_conversions|sql_replica_skip_counter|sql_slave_skip_counter|sync_master_info|sync_relay_log|sync_relay_log_info|sync_source_info|terminology_use_previous)/,
	'replication-options-replica.html#sysvar_$1 replication-and-binary-log-system-variables/#$1': /(report_host|report_password|report_port|report_user|slave_compressed_protocol)/,
	'replication-options-source.html#sysvar_$1 -': /(immediate_server_version|original_server_version|rpl_semi_sync_master_enabled|rpl_semi_sync_master_timeout|rpl_semi_sync_master_trace_level|rpl_semi_sync_master_wait_no_slave|rpl_semi_sync_source_enabled|rpl_semi_sync_source_timeout|rpl_semi_sync_source_trace_level|rpl_semi_sync_source_wait_for_replica_count|rpl_semi_sync_source_wait_no_replica|rpl_semi_sync_source_wait_point)/,
	'replication-options-source.html#sysvar_$1 replication-and-binary-log-system-variables/#$1': /(auto_increment_increment|auto_increment_offset)/,
	'replication-options.html#sysvar_$1 -': /(server_id|server_uuid)/,
	'server-options.html#option_mysqld_$1 -': /(log[-_]raw|transaction[-_]read[-_]only)/,
	'server-options.html#option_mysqld_$1 server-system-variables/#$1': /(large[-_]pages|lc[-_]messages|lc[-_]messages[-_]dir|log[-_]error|port|skip[-_]show[-_]database|socket|sql[-_]mode|tmpdir|transaction[-_]isolation)/,
	'server-options.html#option_mysqld_$1 server-system-variables/#debug-$1_dbug': /(debug)/,
	'server-system-variables.html#sysvar_$1 -': /(activate_all_roles_on_login|activate_mandatory_roles|admin_address|admin_port|admin_ssl_ca|admin_ssl_capath|admin_ssl_cert|admin_ssl_cipher|admin_ssl_crl|admin_ssl_crlpath|admin_ssl_key|admin_tls_ciphersuites|admin_tls_version|authentication_openid_connect_configuration|authentication_policy|authentication_windows_log_level|authentication_windows_use_principal_name|auto_generate_certs|build_id|caching_sha2_password_auto_generate_rsa_keys|caching_sha2_password_digest_rounds|caching_sha2_password_enforce_storage_format|caching_sha2_password_private_key_path|caching_sha2_password_proxy_users|caching_sha2_password_public_key_path|caching_sha2_password_storage_format|check_proxy_users|connection_memory_chunk_size|connection_memory_limit|connection_memory_status_limit|create_admin_listener_thread|cte_max_recursion_depth|default_collation_for_utf8mb4|default_table_encryption|disabled_storage_engines|enable_secondary_engine_statistics|end_markers_in_json|explain_format|explain_json_format_version|generated_random_password_length|global_connection_memory_limit|global_connection_memory_status_limit|global_connection_memory_tracking|have_statement_timeout|histogram_generation_max_mem_size|information_schema_stats_expiry|internal_tmp_mem_storage_engine|log_error_services|log_error_suppression_list|log_error_verbosity|log_slow_extra|log_throttle_queries_not_using_indexes|log_timestamps|mandatory_roles|max_execution_time|max_points_in_geometry|mecab_rc_file|min_examined_row_limit|named_pipe_full_access_group|ngram_token_size|object_policy_flush_interval_seconds|offline_mode|optimizer_trace_features|optimizer_trace_limit|optimizer_trace_offset|parser_max_mem_size|partial_revokes|password_history|password_require_current|password_reuse_interval|persist_only_admin_x509_subject|persist_sensitive_variables_in_plaintext|persisted_globals_load|print_identified_with_as_hex|protocol_compression_algorithms|pseudo_replica_mode|range_optimizer_max_mem_size|rbr_exec_mode|regexp_stack_limit|regexp_time_limit|require_row_format|restrict_fk_on_non_standard_key|resultset_metadata|schema_definition_cache|select_into_buffer_size|select_into_disk_sync|select_into_disk_sync_delay|session_track_gtids|set_operations_buffer_size|sha256_password_auto_generate_rsa_keys|sha256_password_private_key_path|sha256_password_proxy_users|sha256_password_public_key_path|show_create_table_verbosity|show_gipk_in_create_table_and_information_schema|sql_generate_invisible_primary_key|sql_require_primary_key|ssl_ca|ssl_capath|ssl_cert|ssl_cipher|ssl_crl|ssl_crlpath|ssl_fips_mode|ssl_key|ssl_session_cache_mode|ssl_session_cache_timeout|statement_id|stored_program_definition_cache|super_read_only|table_encryption_privilege_check|table_open_cache_triggers|tablespace_definition_cache|temptable_max_mmap|temptable_max_ram|thread_handling|thread_pool_algorithm|thread_pool_dedicated_listeners|thread_pool_high_priority_connection|thread_pool_longrun_trx_limit|thread_pool_max_active_query_threads|thread_pool_max_transactions_limit|thread_pool_max_unused_threads|thread_pool_prio_kickup_timer|thread_pool_query_threads_per_group|thread_pool_size|thread_pool_stall_limit|thread_pool_transaction_delay|tls_certificates_enforced_validation|tls_ciphersuites|version_compile_zlib|windowing_use_high_precision|xa_detach_on_prepare)/,
	'server-system-variables.html#sysvar_$1 myisam-system-variables/#$1': /(key_buffer_size|key_cache_age_threshold|key_cache_block_size|key_cache_division_limit|myisam_data_pointer_size|myisam_max_sort_file_size|myisam_mmap_size|myisam_recover_options|myisam_sort_buffer_size|myisam_stats_method|myisam_use_mmap)/,
	'server-system-variables.html#sysvar_$1 server-system-variables/#$1': /(autocommit|automatic_sp_privileges|back_log|basedir|big_tables|bind_address|block_encryption_mode|bulk_insert_buffer_size|character_set_client|character_set_connection|character_set_database|character_set_filesystem|character_set_results|character_set_server|character_set_system|character_sets_dir|collation_connection|collation_database|collation_server|completion_type|concurrent_insert|connect_timeout|core_file|datadir|debug_sync|default_password_lifetime|default_storage_engine|default_tmp_storage_engine|default_week_format|delay_key_write|delayed_insert_limit|delayed_insert_timeout|delayed_queue_size|disconnect_on_expired_password|div_precision_increment|eq_range_index_dive_limit|error_count|event_scheduler|explicit_defaults_for_timestamp|external_user|flush|flush_time|foreign_key_checks|ft_boolean_syntax|ft_max_word_len|ft_min_word_len|ft_query_expansion_limit|ft_stopword_file|general_log|general_log_file|group_concat_max_len|have_compress|have_dynamic_loading|have_geometry|have_profiling|have_query_cache|have_rtree_keys|have_symlink|host_cache_size|hostname|identity|init_connect|init_file|insert_id|interactive_timeout|join_buffer_size|keep_files_on_create|large_files_support|large_page_size|last_insert_id|lc_time_names|license|local_infile|lock_wait_timeout|locked_in_memory|log_output|log_queries_not_using_indexes|log_slow_admin_statements|long_query_time|low_priority_updates|lower_case_file_system|lower_case_table_names|max_allowed_packet|max_connect_errors|max_connections|max_delayed_threads|max_digest_length|max_error_count|max_heap_table_size|max_insert_delayed_threads|max_join_size|max_length_for_sort_data|max_prepared_stmt_count|max_seeks_for_key|max_sort_length|max_sp_recursion_depth|max_user_connections|max_write_lock_count|named_pipe|net_buffer_length|net_read_timeout|net_retry_count|net_write_timeout|old_alter_table|open_files_limit|optimizer_prune_level|optimizer_search_depth|optimizer_switch|optimizer_trace|optimizer_trace_max_mem_size|pid_file|plugin_dir|preload_buffer_size|profiling|profiling_history_size|protocol_version|proxy_user|pseudo_slave_mode|pseudo_thread_id|query_alloc_block_size|query_prealloc_size|rand_seed1|rand_seed2|range_alloc_block_size|read_buffer_size|read_only|read_rnd_buffer_size|require_secure_transport|secure_file_priv|session_track_schema|session_track_state_change|session_track_system_variables|session_track_transaction_info|shared_memory|shared_memory_base_name|skip_external_locking|skip_name_resolve|skip_networking|slow_launch_time|slow_query_log|slow_query_log_file|sort_buffer_size|sql_auto_is_null|sql_big_selects|sql_buffer_result|sql_log_off|sql_notes|sql_quote_show_create|sql_safe_updates|sql_select_limit|sql_warnings|stored_program_cache|system_time_zone|table_definition_cache|table_open_cache|table_open_cache_instances|thread_cache_size|thread_stack|time_zone|timestamp|tmp_table_size|transaction_alloc_block_size|transaction_prealloc_size|unique_checks|updatable_views_with_limit|version|version_comment|version_compile_machine|version_compile_os|wait_timeout|warning_count)/,
	'server-system-variables.html#sysvar_$1 ssltls-system-variables/#$1': /(tls_version)/,
});

jush.build_links2('sqlstatus', 'https://dev.mysql.com/doc/mysql/en/$key', /()/, /()/gi, {
	'server-status-variables.html#statvar_Com_xxx server-status-variables/#$1': /(Com_.+)/,
	'- aria-status-variables/#$1': /(aria_.+)/,
	'- galera-cluster-status-variables/#$1': /(wsrep_.+)/,
	'server-status-variables.html#statvar_$1 innodb-status-variables/#$1': /(Innodb_.+)/,
	'performance-schema-status-variables.html#statvar_$1 performance-schema-status-variables/#$1': /(Performance_schema_.+)/,
	'server-status-variables.html#statvar_$1 replication-and-binary-log-status-variables/#$1': /(Binlog_bytes_written|Binlog_cache_disk_use|Binlog_cache_use|Binlog_commits|Binlog_disk_use|Binlog_group_commit_trigger_count|Binlog_group_commit_trigger_lock_wait|Binlog_group_commit_trigger_timeout|Binlog_group_commits|Binlog_gtid_index_hit|Binlog_gtid_index_miss|Binlog_snapshot_file|Binlog_snapshot_position|Binlog_stmt_cache_disk_use|Binlog_stmt_cache_use|Master_gtid_wait_count|Master_gtid_wait_time|Master_gtid_wait_timeouts|Rpl_transactions_multi_engine|Slave_connections)/,
	'server-status-variables.html#statvar_$1 semisynchronous-replication-plugin-status-variables/#$1': /(Rpl_semi_sync_.+)/,
	'- thread-pool-system-status-variables/#$1': /(extra_.+)/,
	'server-status-variables.html#statvar_$1 server-status-variables/#$1': /(.+)/,
});



jush.tr.sqlite = { sqlite_apo: /'/, sqlite_quo: /"/, bra: /\[/, bac: /`/, one: /--/, com: /\/\*/, sql_var: /[:@$]/, sqlite_sqliteset: /(\b)(PRAGMA)(\s+)/i, num: jush.num };
jush.tr.sqlite_sqliteset = { sqlite_apo: /'/, sqlite_quo: /"/, bra: /\[/, bac: /`/, one: /--/, com: /\/\*/, num: jush.num, _1: /;|$/ };
jush.tr.sqliteset = { _0: /$/ };
jush.tr.sqlitestatus = { _0: /$/ };

jush.autocompleting.sql.push('sqlite', 'sqlite_sqliteset', 'sqlite_quo', 'bra', 'bac'); // sqlite_quo, bra and bac are quoted identifiers

jush.urls.sqlite_sqliteset = 'https://www.sqlite.org/$key';

jush.slugs.sqlite = name => name.toLowerCase().replace(/\s+/g, '');
jush.slugs.sqliteset = name => name.toLowerCase();
jush.slugs.sqlitestatus = jush.slugs.sqliteset;

jush.build_links2('sqlite', 'https://www.sqlite.org/$key', /(\b)/, /(\b)/gi, {
	'lang_$1.html': /(ALTER\s+TABLE|ANALYZE|ATTACH|COPY|DELETE|DETACH|DROP\s+INDEX|DROP\s+TABLE|DROP\s+TRIGGER|DROP\s+VIEW|EXPLAIN|INSERT|CONFLICT|REINDEX|REPLACE|SELECT|UPDATE|TRANSACTION|VACUUM|WITH)/,
	'lang_createvtab.html': /(CREATE\s+VIRTUAL\s+TABLE)/,
	'lang_transaction.html': /(BEGIN|COMMIT|ROLLBACK)/,
	'lang_createindex.html': /(CREATE(?:\s+UNIQUE)?\s+INDEX)/,
	'lang_createtable.html': /(CREATE(?:\s+TEMP|\s+TEMPORARY)?\s+TABLE)/,
	'lang_createtrigger.html': /(CREATE(?:\s+TEMP|\s+TEMPORARY)?\s+TRIGGER)/,
	'lang_createview.html': /(CREATE(?:\s+TEMP|\s+TEMPORARY)?\s+VIEW)/,
	'stricttables.html': /(STRICT|ANY)/,
	'withoutrowid.html': /(WITHOUT\s+ROWID)/,
	'gencol.html': /(GENERATED|ALWAYS|STORED|VIRTUAL)/,
	'windowfunctions.html': /(OVER|PARTITION\s+BY|WINDOW|FILTER)/,
	'windowfunctions.html#$1': /(cume_dist|dense_rank|first_value|lag|last_value|lead|nth_value|ntile|percent_rank|rank|row_number)(?=\s*\(|$)/,
	'datatype3.html': /(INTEGER|TEXT|BLOB|REAL|NUMERIC)/,
	'': /(ABORT|ACTION|ADD|AFTER|ALL|ALTER|AS|ASC|AUTOINCREMENT|BEFORE|BY|CASCADE|CHECK|COLUMN|CONSTRAINT|CREATE|CROSS|CURRENT|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|DATABASE|DEFAULT|DEFERRABLE|DEFERRED|DESC|DISTINCT|DO|DROP|EACH|END|EXCEPT|EXCLUDE|EXCLUDED|EXCLUSIVE|FAIL|FALSE|FIRST|FOLLOWING|FOR|FOREIGN|FROM|FULL|GROUP|GROUPS|HAVING|IF|IGNORE|IMMEDIATE|INDEX|INDEXED|INITIALLY|INNER|INSTEAD|INTERSECT|INTO|IS|JOIN|KEY|LAST|LEFT|LIMIT|MATERIALIZED|NATURAL|NO|NOTHING|NOTNULL|NULL|NULLS|OF|OFFSET|ON|ORDER|OTHERS|OUTER|PARTITION|PLAN|PRAGMA|PRECEDING|PRIMARY|QUERY|RAISE|RANGE|RECURSIVE|REFERENCES|RELEASE|RENAME|RESTRICT|RETURNING|RIGHT|ROW|ROWS|SAVEPOINT|SET|TABLE|TEMP|TEMPORARY|TIES|TO|TRIGGER|TRUE|UNBOUNDED|UNION|UNIQUE|USING|VALUES|VIEW|WHERE|WITHOUT)/,
	'lang_expr.html#$1': /(like|glob|regexp|match|escape|isnull|isnotnull|between|exists|case|when|then|else|cast|collate|in|and|or|not)/,
	'lang_corefunc.html#$1': /(abs|changes|char|coalesce|concat|concat_ws|format|glob|hex|if|ifnull|iif|instr|last_insert_rowid|length|like|likelihood|likely|load_extension|lower|ltrim|max|min|nullif|octet_length|printf|quote|random|randomblob|replace|round|rtrim|sign|soundex|sqlite_compileoption_get|sqlite_compileoption_used|sqlite_offset|sqlite_source_id|sqlite_version|substr|substring|total_changes|trim|typeof|unhex|unicode|unistr|unistr_quote|unlikely|upper|zeroblob)(?=\s*\(|$)/,
	'lang_mathfunc.html#$1': /(acos|acosh|asin|asinh|atan|atan2|atanh|ceil|ceiling|cos|cosh|degrees|exp|floor|ln|log|log10|log2|mod|pi|pow|power|radians|sin|sinh|sqrt|tan|tanh|trunc)(?=\s*\(|$)/,
	'lang_datefunc.html#$1': /(date|datetime|julianday|strftime|time|timediff|unixepoch)(?=\s*\(|$)/,
	'lang_aggfunc.html#$1': /(avg|count|group_concat|max|median|min|percentile|percentile_cont|percentile_disc|string_agg|sum|total)(?=\s*\(|$)/,
	'json1.html#$1': /(json|json_array|json_array_insert|json_array_length|json_each|json_error_position|json_extract|json_group_array|json_group_object|json_insert|json_object|json_patch|json_pretty|json_quote|json_remove|json_replace|json_set|json_tree|json_type|json_valid|jsonb|jsonb_array|jsonb_array_insert|jsonb_each|jsonb_extract|jsonb_group_array|jsonb_group_object|jsonb_insert|jsonb_object|jsonb_patch|jsonb_remove|jsonb_replace|jsonb_set|jsonb_tree)(?=\s*\(|$)/,
}); // collisions: min, max, end, like, glob, trunc
jush.urls.sqliteset = ['https://www.sqlite.org/pragma.html#$key',
	'pragma_$1'
];
jush.urls.sqlitestatus = ['https://www.sqlite.org/compile.html#$key',
	'$1'
];

jush.links.sqlite_sqliteset = { 'pragma.html': /.+/ };

jush.links2.sqliteset = /(\b)(analysis_limit|application_id|auto_vacuum|automatic_index|busy_timeout|cache_size|cache_spill|case_sensitive_like|cell_size_check|checkpoint_fullfsync|collation_list|compile_options|count_changes|data_store_directory|data_version|database_list|default_cache_size|defer_foreign_keys|empty_result_callbacks|encoding|foreign_key_check|foreign_key_list|foreign_keys|freelist_count|full_column_names|fullfsync|function_list|hard_heap_limit|ignore_check_constraints|incremental_vacuum|index_info|index_list|index_xinfo|integrity_check|journal_mode|journal_size_limit|legacy_alter_table|legacy_file_format|locking_mode|max_page_count|mmap_size|module_list|optimize|page_count|page_size|parser_trace|pragma_list|query_only|quick_check|read_uncommitted|recursive_triggers|reverse_unordered_selects|schema_version|secure_delete|short_column_names|shrink_memory|soft_heap_limit|stats|synchronous|table_info|table_list|table_xinfo|temp_store|temp_store_directory|threads|trusted_schema|user_version|vdbe_addoptrace|vdbe_debug|vdbe_listing|vdbe_trace|wal_autocheckpoint|wal_checkpoint|writable_schema)(\b)/gi;
jush.links2.sqlitestatus = /()(.+)()/g;



jush.textarea = (function () {
	//! IE sometimes inserts empty <p> in start of a string when newline is entered inside

	function findSelPos(pre) {
		const sel = getSelection();
		if (sel.rangeCount) {
			const range = sel.getRangeAt(0);
			if (pre.contains(range.startContainer)) { // a selection elsewhere would move to the end of pre
				return findPosition(pre, range.startContainer, range.startOffset);
			}
		}
	}

	function findPosition(el, container, offset) {
		const pos = { pos: 0 };
		findPositionRecurse(el, container, offset, pos);
		return pos.pos;
	}

	function findPositionRecurse(child, container, offset, pos) {
		if (child.nodeType == 3) {
			if (child == container) {
				pos.pos += offset;
				return true;
			}
			pos.pos += child.textContent.length;
		} else if (child == container) {
			for (let i = 0; i < offset; i++) {
				findPositionRecurse(child.childNodes[i], container, offset, pos);
			}
			return true;
		} else {
			if (/^(br|div)$/i.test(child.tagName)) {
				pos.pos++;
			}
			for (const node of child.childNodes) {
				if (findPositionRecurse(node, container, offset, pos)) {
					return true;
				}
			}
			if (/^p$/i.test(child.tagName)) {
				pos.pos++;
			}
		}
	}

	function findOffset(el, pos) {
		return findOffsetRecurse(el, { pos: pos });
	}

	function findOffsetRecurse(child, pos) {
		if (child.nodeType == 3) { // 3 - TEXT_NODE
			if (child.textContent.length >= pos.pos) {
				return { container: child, offset: pos.pos };
			}
			pos.pos -= child.textContent.length;
		} else {
			for (let i = 0; i < child.childNodes.length; i++) {
				if (/^br$/i.test(child.childNodes[i].tagName)) {
					if (!pos.pos) {
						return { container: child, offset: i };
					}
					pos.pos--;
					if (!pos.pos && i == child.childNodes.length - 1) { // last invisible <br>
						return { container: child, offset: i };
					}
				} else {
					const result = findOffsetRecurse(child.childNodes[i], pos);
					if (result) {
						return result;
					}
				}
			}
		}
	}

	function setSelPos(pre, pos) {
		if (pos) {
			const start = findOffset(pre, pos);
			if (start) {
				const range = document.createRange();
				range.setStart(start.container, start.offset);
				const sel = getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
	}

	function setText(pre, text, end) {
		let lang = 'txt';
		if (text.length < 1e4) { // highlighting is slow with most languages
			const match = /(^|\s)(?:jush|language)-(\S+)/.exec(pre.jushTextarea.className);
			lang = (match ? match[2] : 'htm');
		}
		const html = jush.highlight(lang, text).replace(/\n/g, '<br>');
		setHTML(pre, html, text, end);
		if (openAc) {
			openAutocomplete(pre);
			openAc = false;
		} else {
			closeAutocomplete();
		}
	}

	function setHTML(pre, html, text, pos) {
		pre.innerHTML = html;
		pre.lastHTML = pre.innerHTML; // not html because IE reformats the string
		pre.jushTextarea.value = text;
		setSelPos(pre, pos);
	}

	function keydown(event) {
		const ctrl = (event.ctrlKey || event.metaKey);
		if (!event.altKey) {
			if (!ctrl && acEl.options.length) {
				const select =
					(event.key == 'ArrowDown' ? Math.min(acEl.options.length - 1, acEl.selectedIndex + 1) :
					(event.key == 'ArrowUp' ? Math.max(0, acEl.selectedIndex - 1) :
					(event.key == 'PageDown' ? Math.min(acEl.options.length - 1, acEl.selectedIndex + acEl.size) :
					(event.key == 'PageUp' ? Math.max(0, acEl.selectedIndex - acEl.size) :
					null))))
				;
				if (select !== null) {
					acEl.selectedIndex = select;
					return false;
				}
				if (/^(Enter|Tab)$/.test(event.key) && !event.shiftKey) {
					insertAutocomplete(this);
					return false;
				}
			}

			if (!event.shiftKey && /^(Delete|Backspace)$/.test(event.key) && getSelection().toString().length >= this.innerText.replace(/\n$/, '').length) { // native delete of long text is slow in Chrome 150
				this.innerText = '';
				forceNewUndo = true; // undo the whole deletion at once
				this.oninput(); // the assignment fires no input event, so the <textarea> and the undo history would keep the deleted text
				return false;
			}

			if (ctrl) {
				if (event.key == ' ') {
					openAutocomplete(this);
				}
			} else if (autocomplete.openBy && (autocomplete.openBy.test(event.key) || event.key == 'Backspace' || (event.key == 'Enter' && event.shiftKey))) {
				openAc = true;
			} else if (/^(Escape|ArrowLeft|ArrowRight|Home|End)$/.test(event.key)) {
				closeAutocomplete();
			}
		}

		if (ctrl && !event.altKey) {
			const isUndo = (event.keyCode == 90); // 90 - z
			const isRedo = (event.keyCode == 89 || (event.keyCode == 90 && event.shiftKey)); // 89 - y
			if (isUndo || isRedo) {
				if (isRedo) {
					if (this.jushUndoPos + 1 < this.jushUndo.length) {
						this.jushUndoPos++;
						const undo = this.jushUndo[this.jushUndoPos];
						setText(this, undo.text, undo.end)
					}
				} else if (this.jushUndoPos >= 0) {
					this.jushUndoPos--;
					const undo = this.jushUndo[this.jushUndoPos] || { html: '', text: '' };
					setText(this, undo.text, this.jushUndo[this.jushUndoPos + 1].start);
				}
				return false;
			}
		} else {
			setLastPos(this);
		}
	}

	const maxSize = 8;
	const acEl = document.createElement('select');
	acEl.size = maxSize;
	acEl.className = 'jush-autocomplete';
	acEl.style.position = 'absolute';
	acEl.style.zIndex = 1;
	acEl.onclick = () => {
		insertAutocomplete(pre);
	};
	let openAc = false;
	closeAutocomplete();

	function findState(node) {
		let match;
		// jush-op, jush-help and jush-custom mark an operator and the links, they are not states
		while (node && !(match = (node.className || '').match(/(^|\s)jush-(?!(?:op|help|custom)\b)(\w+)/))) {
			node = node.parentElement;
		}
		return (match ? match[2] : '');
	}

	function openAutocomplete(pre) {
		const prevSelected = acEl.options[acEl.selectedIndex];
		closeAutocomplete();
		const sel = getSelection();
		if (sel.rangeCount) {
			const range = sel.getRangeAt(0);
			const pos = findSelPos(pre);
			const state = findState(range.startContainer);
			if (state) {
				const ac = autocomplete(
					state,
					pre.innerText.substring(0, pos),
					pre.innerText.substring(pos)
				);
				if (Object.keys(ac).length) {
					let select = 0;
					for (const word in ac) {
						const option = document.createElement('option');
						option.value = ac[word];
						option.textContent = word;
						acEl.append(option);
						if (prevSelected && prevSelected.textContent == word) {
							select = acEl.options.length - 1;
						}
					}
					acEl.selectedIndex = select;
					acEl.size = Math.min(Math.max(acEl.options.length, 2), maxSize);
					positionAutocomplete();
					acEl.style.display = '';
				}
			}
		}
	}

	function positionAutocomplete() {
		const sel = getSelection();
		if (sel.rangeCount && acEl.options.length) {
			const pos = findSelPos(pre);
			const range = sel.getRangeAt(0);
			const range2 = range.cloneRange();
			range2.setStart(range.startContainer, Math.max(0, range.startOffset - acEl.options[0].value)); // autocompletions currently couldn't cross container boundary
			const span = document.createElement('span'); // collapsed ranges have empty bounding rect
			span.innerHTML = ' ';
			range2.insertNode(span);
			acEl.style.left = span.offsetLeft + 'px';
			acEl.style.top = (span.offsetTop - pre.scrollTop + span.offsetHeight * 1.2) + 'px';
			span.remove();
			setSelPos(pre, pos); // required on iOS
		}
	}

	function closeAutocomplete() {
		acEl.options.length = 0;
		acEl.style.display = 'none';
	}

	function insertAutocomplete(pre) {
		const sel = getSelection();
		const range = sel.rangeCount && sel.getRangeAt(0);
		if (range) {
			const insert = acEl.options[acEl.selectedIndex].textContent;
			const offset = +acEl.options[acEl.selectedIndex].value;
			forceNewUndo = true;
			pre.lastPos = findSelPos(pre);
			const start = findOffset(pre, pre.lastPos - offset);
			if (start) {
				range.setStart(start.container, start.offset);
			}
			document.execCommand('insertText', false, insert);
			if (/ $/.test(insert)) {
				setTimeout(() => openAutocomplete(pre));
			}
		}
	}

	function setLastPos(pre) {
		if (pre.lastPos === undefined) {
			pre.lastPos = findSelPos(pre);
		}
	}

	let forceNewUndo = true;

	function highlight(pre) {
		const start = pre.lastPos;
		pre.lastPos = undefined;
		let innerHTML = pre.innerHTML;
		if (innerHTML != pre.lastHTML) {
			let end = findSelPos(pre);
			innerHTML = innerHTML.replace(/<br>((<\/[^>]+>)*<\/?div>)(?!$)/gi, (all, rest) => {
				if (end) {
					end--;
				}
				return rest;
			});
			const parsed = document.createElement('pre'); // outside the document, otherwise the element would be rebuilt twice on each keystroke
			parsed.innerHTML = innerHTML
				.replace(/^<br\b[^>]*>$/i, '') // Mac OS: Firefox, Chrome
				.replace(/<(br|div)\b[^>]*>/gi, '\n') // Firefox, Chrome
				.replace(/&nbsp;(<\/[pP]\b)/g, '$1') // IE
				.replace(/<\/p\b[^>]*>($|<p\b[^>]*>)/gi, '\n') // IE
				.replace(/(&nbsp;)+$/gm, '') // Chrome for some users
			;
			setText(pre, parsed.textContent.replace(/\u00A0/g, ' '), end);
			pre.jushUndo.length = pre.jushUndoPos + 1;
			if (forceNewUndo || !pre.jushUndo.length || pre.jushUndo[pre.jushUndoPos].end !== start) {
				pre.jushUndo.push({ text: pre.jushTextarea.value, start: start, end: (forceNewUndo ? undefined : end) });
				pre.jushUndoPos++;
				forceNewUndo = false;
			} else {
				pre.jushUndo[pre.jushUndoPos].text = pre.jushTextarea.value;
				pre.jushUndo[pre.jushUndoPos].end = end;
			}
		}
	}

	function input() {
		setTimeout(() => highlight(this));
	}

	function paste(event) {
		if (event.clipboardData) {
			setLastPos(this);
			if (document.execCommand('insertHTML', false, jush.htmlspecialchars(event.clipboardData.getData('text')))) { // Opera doesn't support insertText
				event.preventDefault();
			}
			forceNewUndo = true; // highlighted in input
		}
	}

	function click(event) {
		if ((event.ctrlKey || event.metaKey) && event.target.href) {
			open(event.target.href);
		}
		closeAutocomplete();
	}

	let pre;
	let autocomplete = () => ({});
	addEventListener('resize', positionAutocomplete);

	return function textarea(el, autocompleter) {
		if (!window.getSelection) {
			return;
		}
		if (autocompleter) {
			autocomplete = autocompleter;
		}
		pre = document.createElement('pre');
		pre.contentEditable = true;
		pre.className = el.className + ' jush';
		pre.style.width = el.clientWidth + 'px';
		pre.style.height = el.clientHeight + 'px';
		pre.style.padding = '3px';
		pre.style.overflow = 'auto';
		pre.style.resize = 'both';
		if (el.wrap != 'off') {
			pre.style.whiteSpace = 'pre-wrap';
		}
		pre.jushTextarea = el;
		pre.jushUndo = [ ];
		pre.jushUndoPos = -1;
		pre.onkeydown = keydown;
		pre.oninput = input;
		pre.onpaste = paste;
		pre.onclick = click;
		pre.appendChild(document.createTextNode(el.value));
		highlight(pre);
		if (el.spellcheck === false) {
			pre.spellcheck = false;
		}
		el.before(pre);
		el.before(acEl);
		if (document.activeElement === el) {
			pre.focus();
			if (!el.value) {
				openAutocomplete(pre);
			}
		}
		acEl.style.font = getComputedStyle(pre).font;
		el.style.display = 'none';
		return pre;
	};
})();



jush.tr.txt = { };
