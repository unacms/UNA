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

var jush = {
	create_links: true, // string for extra <a> parameters, e.g. 'target="_blank"'
	timeout: 1000, // milliseconds
	custom_links: { }, // { state: { url: regexp } }, for example { php : { 'doc/$&.html': /\b(getData|setData)\b/g } }
	api: { }, // { state: { function: description } }, for example { php: { array: 'Create an array' } }

	php: /<\?(?!xml)(?:php)?|<script\s+language\s*=\s*(?:"php"|'php'|php)\s*>/i, // asp_tags=0, short_open_tag=1
	num: /(?:0x[0-9a-f]+)|(?:\b[0-9]+\.?[0-9]*|\.[0-9]+)(?:e[+-]?[0-9]+)?/i,

	regexps: undefined,
	subpatterns: { },

	/** Link stylesheet
	* @param string
	* @param [string]
	*/
	style: function (href, media) {
		var link = document.createElement('link');
		link.rel = 'stylesheet';
		if (media) {
			link.media = media;
		}
		link.href = href;
		document.getElementsByTagName('head')[0].appendChild(link);
	},

	/** Highlight text
	* @param string
	* @param string
	* @return string
	*/
	highlight: function (language, text) {
		this.last_tag = '';
		this.last_class = '';
		return '<span class="jush">' + this.highlight_states([ language ], text.replace(/\r\n?/g, '\n'), !/^(htm|tag|xml|txt)$/.test(language))[0] + '</span>';
	},

	/** Highlight html
	* @param string
	* @param string
	* @return string
	*/
	highlight_html: function (language, html) {
		var original = html.replace(/<br(\s+[^>]*)?>/gi, '\n');
		var highlighted = jush.highlight(language, jush.html_entity_decode(original.replace(/<[^>]*>/g, '')));

		var inject = { };
		var pos = 0;
		var last_offset = 0;
		original.replace(/(&[^;]+;)|(?:<[^>]+>)+/g, function (str, entity, offset) {
			pos += (offset - last_offset) + (entity ? 1 : 0);
			if (!entity) {
				inject[pos] = str;
			}
			last_offset = offset + str.length;
		});

		pos = 0;
		highlighted = highlighted.replace(/([^&<]*)(?:(&[^;]+;)|(?:<[^>]+>)+|$)/g, function (str, text, entity) {
			for (var i = text.length; i >= 0; i--) {
				if (inject[pos + i]) {
					str = str.substr(0, i) + inject[pos + i] + str.substr(i);
					delete inject[pos + i];
				}
			}
			pos += text.length + (entity ? 1 : 0);
			return str;
		});
		return highlighted;
	},

	/** Highlight text in tags
	* @param mixed tag name or array of HTMLElement
	* @param number number of spaces for tab, 0 for tab itself, defaults to 4
	*/
	highlight_tag: function (tag, tab_width) {
		var pre = (typeof tag == 'string' ? document.getElementsByTagName(tag) : tag);
		var tab = '';
		for (var i = (tab_width !== undefined ? tab_width : 4); i--; ) {
			tab += ' ';
		}
		var i = 0;
		var highlight = function () {
			var start = new Date();
			while (i < pre.length) {
				var match = /(^|\s)(?:jush|language(?=-\S))($|\s|-(\S+))/.exec(pre[i].className); // https://www.w3.org/TR/html5/text-level-semantics.html#the-code-element
				if (match) {
					var language = match[3] ? match[3] : 'htm';
					pre[i].innerHTML = '<span class="jush"><span class="jush-' + language + '">' + jush.highlight_html(language, pre[i].innerHTML.replace(/\t/g, tab.length ? tab : '\t')) + '</span></span>'; // span - enable style for class="language-"
				}
				i++;
				if (jush.timeout && window.setTimeout && (new Date() - start) > jush.timeout) {
					window.setTimeout(highlight, 100);
					break;
				}
			}
		};
		highlight();
	},

	link_manual: function (language, text) {
		var code = document.createElement('code');
		code.innerHTML = this.highlight(language, text);
		var as = code.getElementsByTagName('a');
		for (var i = 0; i < as.length; i++) {
			if (as[i].href) {
				return as[i].href;
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

	keywords_links: function (state, s) {
		if (/^js(_write|_code)+$/.test(state)) {
			state = 'js';
		}
		if (/^(php_quo_var|php_php|php_sql|php_sqlite|php_pgsql|php_mssql|php_oracle|php_echo|php_phpini|php_http|php_mail)$/.test(state)) {
			state = 'php2';
		}
		if (state == 'sql_code') {
			state = 'sql';
		}
		if (this.links2 && this.links2[state]) {
			var url = this.urls[state];
			var links2 = this.links2[state];
			s = s.replace(links2, function (str, match1) {
				for (var i=arguments.length - 4; i > 1; i--) {
					if (arguments[i]) {
						var link = (/^https?:/.test(url[i-1]) || !url[i-1] ? url[i-1] : url[0].replace(/\$key/g, url[i-1]));
						switch (state) {
							case 'php': link = link.replace(/\$1/g, arguments[i].toLowerCase()); break;
							case 'php_new': link = link.replace(/\$1/g, arguments[i].toLowerCase()).replace(/\\/g, '-'); break; // toLowerCase() - case sensitive after #
							case 'phpini': link = link.replace(/\$1/g, (/^suhosin\./.test(arguments[i])) ? arguments[i] : arguments[i].toLowerCase().replace(/_/g, '-')); break;
							case 'php_doc': link = link.replace(/\$1/g, arguments[i].replace(/^\W+/, '')); break;
							case 'js_doc': link = link.replace(/\$1/g, arguments[i].replace(/^\W*(.)/, function (match, p1) { return p1.toUpperCase(); })); break;
							case 'http': link = link.replace(/\$1/g, arguments[i].toLowerCase()); break;
							case 'sql': link = link.replace(/\$1/g, arguments[i].replace(/\b(ALTER|CREATE|DROP|RENAME|SHOW)\s+SCHEMA\b/, '$1 DATABASE').toLowerCase().replace(/\s+|_/g, '-')); break;
							case 'sqlset': link = link.replace(/\$1/g, (links2.test(arguments[i].replace(/_/g, '-')) ? arguments[i].replace(/_/g, '-') : arguments[i]).toLowerCase()); break;
							case 'sqlstatus': link = link.replace(/\$1/g, (/mariadb/.test(url[0]) ? arguments[i].toLowerCase() : arguments[i])); break;
							case 'sqlite': link = link.replace(/\$1/g, arguments[i].toLowerCase().replace(/\s+/g, '')); break;
							case 'sqliteset': link = link.replace(/\$1/g, arguments[i].toLowerCase()); break;
							case 'sqlitestatus': link = link.replace(/\$1/g, arguments[i].toLowerCase()); break;
							case 'pgsql': link = link.replace(/\$1/g, arguments[i].toLowerCase().replace(/\s+/g, (i == 1 ? '-' : ''))); break;
							case 'pgsqlset': link = link.replace(/\$1/g, arguments[i].replace(/_/g, '-').toUpperCase()); break;
							case 'cnf': link = link.replace(/\$1/g, arguments[i].toLowerCase()); break;
							case 'js': link = link.replace(/\$1/g, arguments[i].replace(/\./g, '/')); break;
							default: link = link.replace(/\$1/g, arguments[i]).replace(/\\/g, '-');
						}
						var title = '';
						if (jush.api[state]) {
							title = jush.api[state][(state == 'js' ? arguments[i] : arguments[i].toLowerCase())];
						}
						return (match1 ? match1 : '') + jush.create_link(link, arguments[i], (title ? ' title="' + jush.htmlspecialchars_quo(title) + '"' : '')) + (arguments[arguments.length - 3] ? arguments[arguments.length - 3] : '');
					}
				}
			});
		}
		if (this.custom_links[state]) {
			if (Array.isArray(this.custom_links[state])) { // backwards compatibility
				var url = this.custom_links[state][0];
				var re = this.custom_links[state][1];
				this.custom_links[state] = {};
				this.custom_links[state][url] = re;
			}
			for (var url in this.custom_links[state]) {
				s = s.replace(this.custom_links[state][url], function (str) {
					var offset = arguments[arguments.length - 2];
					if (/<[^>]*$/.test(s.substr(0, offset)) || /^[^<]*<\/a>/.test(s.substr(offset))) {
						return str; // don't create links inside tags
					}
					return '<a href="' + jush.htmlspecialchars_quo(url.replace('$&', encodeURIComponent(str))) + '" class="jush-custom">' + str + '</a>' // not create_link() - ignores create_links
				});
			}
		}
		return s;
	},

	build_regexp: function (key, tr1) {
		var re = [ ];
		subpatterns = [ '' ];
		for (var k in tr1) {
			var in_bra = false;
			subpatterns.push(k);
			var s = tr1[k].source.replace(/\\.|\((?!\?)|\[|]|([a-z])(?:-([a-z]))?/gi, function (str, match1, match2) {
				// count capturing subpatterns
				if (str == (in_bra ? ']' : '[')) {
					in_bra = !in_bra;
				}
				if (str == '(') {
					subpatterns.push(k);
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

	highlight_states: function (states, text, in_php, escape) {
		if (!this.regexps) {
			this.regexps = { };
			for (var key in this.tr) {
				this.build_regexp(key, this.tr[key]);
			}
		} else {
			for (var key in this.tr) {
				this.regexps[key].lastIndex = 0;
			}
		}
		var state = states[states.length - 1];
		if (!this.tr[state]) {
			return [ this.htmlspecialchars(text), states ];
		}
		var ret = [ ]; // return
		for (var i=1; i < states.length; i++) {
			ret.push('<span class="jush-' + states[i] + '">');
		}
		var match;
		var child_states = [ ];
		var s_states;
		var start = 0;
		while (start < text.length && (match = this.regexps[state].exec(text))) {
			if (states[0] != 'htm' && /^<\/(script|style)>$/i.test(match[0])) {
				continue;
			}
			var key, m = [ ];
			for (var i = match.length; i--; ) {
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
			var out = (key.charAt(0) == '_');
			var division = match.index + (key == 'php_halt2' ? match[0].length : 0);
			var s = text.substring(start, division);

			// highlight children
			var prev_state = states[states.length - 2];
			if (/^(att_quo|att_apo|att_val)$/.test(state) && (/^(att_js|att_css|att_http)$/.test(prev_state) || /^\s*javascript:/i.test(s))) { // javascript: - easy but without own state //! should be checked only in %URI;
				child_states.unshift(prev_state == 'att_css' ? 'css_pro' : (prev_state == 'att_http' ? 'http' : 'js'));
				s_states = this.highlight_states(child_states, this.html_entity_decode(s), true, (state == 'att_apo' ? this.htmlspecialchars_apo : (state == 'att_quo' ? this.htmlspecialchars_quo : this.htmlspecialchars_quo_apo)));
			} else if (state == 'css_js' || state == 'cnf_http' || state == 'cnf_phpini' || state == 'sql_sqlset' || state == 'sqlite_sqliteset' || state == 'pgsql_pgsqlset') {
				child_states.unshift(state.replace(/^[^_]+_/, ''));
				s_states = this.highlight_states(child_states, s, true);
			} else if ((state == 'php_quo' || state == 'php_apo') && /^(php_php|php_sql|php_sqlite|php_pgsql|php_mssql|php_oracle|php_phpini|php_http|php_mail)$/.test(prev_state)) {
				child_states.unshift(prev_state.substr(4));
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
				var i;
				for (i=states.length; i--; ) {
					prev_state = states[i];
					if (prev_state.substring(0, 3) != 'php' && prev_state != 'att_quo' && prev_state != 'att_apo' && prev_state != 'att_val') {
						break;
					}
					prev_state = '';
				}
				var f = (state == 'php_eot2' ? this.addslashes : (state == 'php_apo' ? this.addslashes_apo : this.addslashes_quo));
				s = this.stripslashes(s);
				if (/^(att_js|att_css|att_http)$/.test(prev_state)) {
					var g = (states[i+1] == 'att_quo' ? this.htmlspecialchars_quo : (states[i+1] == 'att_apo' ? this.htmlspecialchars_apo : this.htmlspecialchars_quo_apo));
					child_states.unshift(prev_state == 'att_js' ? 'js' : prev_state.substr(4));
					s_states = this.highlight_states(child_states, this.html_entity_decode(s), true, function (string) { return f(g(string)); });
				} else if (prev_state && child_states) {
					child_states.unshift(prev_state);
					s_states = this.highlight_states(child_states, s, true, f);
				} else {
					s = this.htmlspecialchars(s);
					s_states = [ (escape ? escape(s) : s), (!out || !/^(att_js|att_css|att_http|css_js|js_write_code|js_http_code|php_php|php_sql|php_sqlite|php_pgsql|php_mssql|php_oracle|php_echo|php_phpini|php_http|php_mail)$/.test(state) ? child_states : [ ]) ];
				}
			} else {
				s = this.htmlspecialchars(s);
				s_states = [ (escape ? escape(s) : s), (!out || !/^(att_js|att_css|att_http|css_js|js_write_code|js_http_code|php_php|php_sql|php_sqlite|php_pgsql|php_mssql|php_oracle|php_echo|php_phpini|php_http|php_mail)$/.test(state) ? child_states : [ ]) ]; // reset child states when leaving construct
			}
			s = s_states[0];
			child_states = s_states[1];
			s = this.keywords_links(state, s);
			ret.push(s);

			s = text.substring(division, match.index + match[0].length);
			s = (m.length < 3 ? (s ? '<span class="jush-op">' + this.htmlspecialchars(escape ? escape(s) : s) + '</span>' : '') : (m[1] ? '<span class="jush-op">' + this.htmlspecialchars(escape ? escape(m[1]) : m[1]) + '</span>' : '') + this.htmlspecialchars(escape ? escape(m[2]) : m[2]) + (m[3] ? '<span class="jush-op">' + this.htmlspecialchars(escape ? escape(m[3]) : m[3]) + '</span>' : ''));
			if (!out) {
				if (this.links && this.links[key] && m[2]) {
					if (/^tag/.test(key)) {
						this.last_tag = m[2].toLowerCase();
					}
					var link = m[2].toLowerCase();
					var k_link = '';
					for (var k in this.links[key]) {
						var m2 = this.links[key][k].exec(m[2]);
						if (m2) {
							if (m2[1]) {
								link = m2[1].toLowerCase().replace(/\\/g, '-'); // \ is PHP namespace;
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
					this.tr.php_eot2._2 = new RegExp('(\n)(' + match[1] + ')(;?\n)');
					this.build_regexp('php_eot2', (match[2] == "'" ? { _2: this.tr.php_eot2._2 } : this.tr.php_eot2));
				} else if (state == 'pgsql_eot') {
					this.tr.pgsql_eot2._2 = new RegExp('\\$' + match[0].replace(/\$/, '\\$'));
					this.build_regexp('pgsql_eot2', this.tr.pgsql_eot2);
				}
			} else {
				if (state == 'php_met' && this.last_class) {
					var title = (jush.api['php2'] ? jush.api['php2'][(this.last_class + '::' + s).toLowerCase()] : '');
					s = this.create_link(this.urls[state].replace(/\$key/, this.last_class) + '.' + s.toLowerCase(), s, (title ? ' title="' + this.htmlspecialchars_quo(title) + '"' : ''));
				}
				ret.push(s);
				for (var i = Math.min(states.length, +key.substr(1)); i--; ) {
					ret.push('</span>');
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
		for (var i=1; i < states.length; i++) {
			ret.push('</span>');
		}
		states.shift();
		return [ ret.join(''), states ];
	},

	/** Replace <&> by HTML entities
	* @param string
	* @return string
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
	* @param string
	* @return string
	*/
	html_entity_decode: function (string) {
		return string.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&nbsp;/g, '\u00A0').replace(/&#(?:([0-9]+)|x([0-9a-f]+));/gi, function (str, p1, p2) { //! named entities
			return String.fromCharCode(p1 ? p1 : parseInt(p2, 16));
		}).replace(/&amp;/g, '&');
	},

	/** Add backslash before backslash
	* @param string
	* @return string
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
	* @param string
	* @return string
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



/** Get callback for autocompletition
* @param string escaped empty identifier, e.g. `` for MySQL or [] for MS SQL
* @param Object<string, Array<string>> keys are table names, values are lists of columns
* @return Function see autocomplete()
*/
jush.autocompleteSql = function (esc, tablesColumns) {
	/**
	* key: regular expression; ' ' will be expanded to '\\s+', '\\w' to esc[0]+'?\\w'+esc[1]+'?', '$' will be appended
	* value: list of autocomplete words; '?' means to not use the word if it's already in the current query
	*/
	const keywordsDefault = {
		'^': ['SELECT', 'INSERT INTO', 'UPDATE', 'DELETE FROM', 'TRUNCATE', 'EXPLAIN'],
		'^EXPLAIN ': ['SELECT'],
		'^INSERT ': ['IGNORE'],
		'^INSERT .+\\) ': ['?VALUES', 'ON DUPLICATE KEY UPDATE'],
		'^UPDATE \\w+ ': ['SET'],
		'^UPDATE \\w+ SET .+ ': ['?WHERE'],
		'^DELETE FROM \\w+ ': ['WHERE'],
		' JOIN \\w+(( AS)? (?!(ON|USING|AS) )\\w+)? ': ['ON', 'USING'],
		'\\bSELECT ': ['*', 'DISTINCT'],
		'\\bSELECT .*[^,] ': ['?FROM'],
		'\\bSELECT (?!.* (WHERE|GROUP BY|HAVING|ORDER BY|LIMIT) ).+ FROM .+ ': ['INNER JOIN', 'LEFT JOIN', '?WHERE'],
		'\\bSELECT (?!.* (HAVING|ORDER BY|LIMIT|OFFSET) ).+ FROM .+ ': ['?GROUP BY'],
		'\\bSELECT (?!.* (ORDER BY|LIMIT|OFFSET) ).+ FROM .+ ': ['?HAVING'],
		'\\bSELECT (?!.* (LIMIT|OFFSET) ).+ FROM .+ ': ['?ORDER BY'], // this matches prefixes without LIMIT|OFFSET and offers ORDER BY if it's not already used in prefix or suffix
		'\\bSELECT (?!.* (OFFSET) ).+ FROM .+ ': ['?LIMIT', '?OFFSET'],
		' ORDER BY (?!.* (LIMIT|OFFSET) ).+ ': ['DESC'],
	};
	
	let forceEscape = false;
	
	/** Get list of strings for autocompletion
	* @param string
	* @param string
	* @param string
	* @return Object<string, number> keys are words, values are offsets
	*/
	function autocomplete(state, before, after) {
		if (/^(one|com|sql_apo|sqlite_apo)$/.test(state)) {
			return {};
		}
		before = before
			.replace(/\/\*.*?\*\/|(^|\s)--[^\n]*/s, ' ') // replace comments with whitespace
			.replace(/'[^']+'/, '0') // replace string with placeholder
			.replace(/.*;/s, '') // strip previous query
			.trimStart()
		;
		after = after.replace(/;.*/s, ''); // strip next query
		const query = before + after;
		const allTables = Object.keys(tablesColumns);
		const usedTables = findTables(query); // tables used by the current query
		const uniqueColumns = {};
		for (const table of Object.values(usedTables)) {
			for (const column of tablesColumns[table]) {
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
			'(^UPDATE .+ SET| DUPLICATE KEY UPDATE| BY) (.+, )?': columns,
			' (WHERE|HAVING|AND|OR|ON|=) ': columns,
		};
		keywordsDefault['\\bSELECT( DISTINCT)? (?!.* FROM )(.+, )?'] = columns; // this is not in preferred because we prefer '*'
		
		const context = before.replace(escRe('[\\w`]+$'), ''); // in 'UPDATE tab.`co', context is 'UPDATE tab.'
		before = before.replace(escRe('.*[^\\w`]', 's'), ''); // in 'UPDATE tab.`co', before is '`co'

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
				if (context.match(escRe(re.replace(/ /g, '\\s+').replace(/\\w\+/g, '`?\\w+`?') + '$', 'is'))) {
					for (let keyword of keywords[re]) {
						if (keyword[0] == '?') {
							keyword = keyword.substring(1);
							if (query.match(new RegExp('\\s+' + keyword + '\\s+', 'i'))) {
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

	/** @return Object<string, string> key is alias, value is actual table */
	function findTables(query) {
		const matches = query.matchAll(escRe('\\b(FROM|JOIN|INTO|UPDATE)\\s+(\\w+|`.+?`)((\\s+AS)?\\s+((?!(LEFT|INNER|JOIN|ON|USING|WHERE|GROUP|HAVING|ORDER|LIMIT)\\b)\\w+|`.+?`))?', 'gi')); //! handle `abc``def`
		const result = {};
		for (const match of matches) {
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



jush.tr.cnf = { quo_one: /"/, one: /#/, cnf_http: /((?:^|\n)\s*)(RequestHeader|Header|CacheIgnoreHeaders)([ \t]+|$)/i, cnf_php: /((?:^|\n)\s*)(PHPIniDir)([ \t]+|$)/i, cnf_phpini: /((?:^|\n)\s*)(php_value|php_flag|php_admin_value|php_admin_flag)([ \t]+|$)/i };
jush.tr.quo_one = { esc: /\\/, _1: /"|(?=\n)/ };
jush.tr.cnf_http = { apo: /'/, quo: /"/, _1: /(?=\n)/ };
jush.tr.cnf_php = { _1: /()/ };
jush.tr.cnf_phpini = { cnf_phpini_val: /[ \t]/ };
jush.tr.cnf_phpini_val = { apo: /'/, quo: /"/, _2: /(?=\n)/ };

jush.urls.cnf_http = 'https://httpd.apache.org/docs/current/mod/$key.html#$val';
jush.urls.cnf_php = 'https://www.php.net/$key';
jush.urls.cnf_phpini = 'https://www.php.net/configuration.changes#$key';
jush.urls.cnf = ['https://httpd.apache.org/docs/current/mod/$key.html#$1',
	'beos', 'core', 'mod_actions', 'mod_alias', 'mod_auth_basic', 'mod_auth_digest', 'mod_authn_alias', 'mod_authn_anon', 'mod_authn_dbd', 'mod_authn_dbm', 'mod_authn_default', 'mod_authn_file', 'mod_authnz_ldap', 'mod_authz_dbm', 'mod_authz_default', 'mod_authz_groupfile', 'mod_authz_host', 'mod_authz_owner', 'mod_authz_user', 'mod_autoindex', 'mod_cache', 'mod_cern_meta', 'mod_cgi', 'mod_cgid', 'mod_dav', 'mod_dav_fs', 'mod_dav_lock', 'mod_dbd', 'mod_deflate', 'mod_dir', 'mod_disk_cache', 'mod_dumpio', 'mod_echo', 'mod_env', 'mod_example', 'mod_expires', 'mod_ext_filter', 'mod_file_cache', 'mod_filter', 'mod_charset_lite', 'mod_ident', 'mod_imagemap', 'mod_include', 'mod_info', 'mod_isapi', 'mod_ldap', 'mod_log_config', 'mod_log_forensic', 'mod_mem_cache', 'mod_mime', 'mod_mime_magic', 'mod_negotiation', 'mod_nw_ssl', 'mod_proxy', 'mod_rewrite', 'mod_setenvif', 'mod_so', 'mod_speling', 'mod_ssl', 'mod_status', 'mod_substitute', 'mod_suexec', 'mod_userdir', 'mod_usertrack', 'mod_version', 'mod_vhost_alias', 'mpm_common', 'mpm_netware', 'mpm_winnt', 'prefork'
];

jush.links.cnf_http = { 'mod_cache': /CacheIgnoreHeaders/i, 'mod_headers': /.+/ };
jush.links.cnf_php = { 'configuration.file': /.+/ };
jush.links.cnf_phpini = { 'configuration.changes.apache': /.+/ };

jush.links2.cnf = /((?:^|\n)\s*(?:&lt;)?)(MaxRequestsPerThread|(AcceptFilter|AcceptPathInfo|AccessFileName|AddDefaultCharset|AddOutputFilterByType|AllowEncodedSlashes|AllowOverride|AuthName|AuthType|CGIMapExtension|ContentDigest|DefaultType|Directory|DirectoryMatch|DocumentRoot|EnableMMAP|EnableSendfile|ErrorDocument|ErrorLog|FileETag|Files|FilesMatch|ForceType|HostnameLookups|IfDefine|IfModule|Include|KeepAlive|KeepAliveTimeout|Limit|LimitExcept|LimitInternalRecursion|LimitRequestBody|LimitRequestFields|LimitRequestFieldSize|LimitRequestLine|LimitXMLRequestBody|Location|LocationMatch|LogLevel|MaxKeepAliveRequests|NameVirtualHost|Options|Require|RLimitCPU|RLimitMEM|RLimitNPROC|Satisfy|ScriptInterpreterSource|ServerAdmin|ServerAlias|ServerName|ServerPath|ServerRoot|ServerSignature|ServerTokens|SetHandler|SetInputFilter|SetOutputFilter|TimeOut|TraceEnable|UseCanonicalName|UseCanonicalPhysicalPort|VirtualHost)|(Action|Script)|(Alias|AliasMatch|Redirect|RedirectMatch|RedirectPermanent|RedirectTemp|ScriptAlias|ScriptAliasMatch)|(AuthBasicAuthoritative|AuthBasicProvider)|(AuthDigestAlgorithm|AuthDigestDomain|AuthDigestNcCheck|AuthDigestNonceFormat|AuthDigestNonceLifetime|AuthDigestProvider|AuthDigestQop|AuthDigestShmemSize)|(AuthnProviderAlias)|(Anonymous|Anonymous_LogEmail|Anonymous_MustGiveEmail|Anonymous_NoUserID|Anonymous_VerifyEmail)|(AuthDBDUserPWQuery|AuthDBDUserRealmQuery)|(AuthDBMType|AuthDBMUserFile)|(AuthDefaultAuthoritative)|(AuthUserFile)|(AuthLDAPBindDN|AuthLDAPBindPassword|AuthLDAPCharsetConfig|AuthLDAPCompareDNOnServer|AuthLDAPDereferenceAliases|AuthLDAPGroupAttribute|AuthLDAPGroupAttributeIsDN|AuthLDAPRemoteUserAttribute|AuthLDAPRemoteUserIsDN|AuthLDAPUrl|AuthzLDAPAuthoritative)|(AuthDBMGroupFile|AuthzDBMAuthoritative|AuthzDBMType)|(AuthzDefaultAuthoritative)|(AuthGroupFile|AuthzGroupFileAuthoritative)|(Allow|Deny|Order)|(AuthzOwnerAuthoritative)|(AuthzUserAuthoritative)|(AddAlt|AddAltByEncoding|AddAltByType|AddDescription|AddIcon|AddIconByEncoding|AddIconByType|DefaultIcon|HeaderName|IndexHeadInsert|IndexIgnore|IndexOptions|IndexOrderDefault|IndexStyleSheet|ReadmeName)|(CacheDefaultExpire|CacheDisable|CacheEnable|CacheIgnoreCacheControl|CacheIgnoreNoLastMod|CacheIgnoreQueryString|CacheLastModifiedFactor|CacheMaxExpire|CacheStoreNoStore|CacheStorePrivate)|(MetaDir|MetaFiles|MetaSuffix)|(ScriptLog|ScriptLogBuffer|ScriptLogLength)|(ScriptSock)|(Dav|DavDepthInfinity|DavMinTimeout)|(DavLockDB)|(DavGenericLockDB)|(DBDExptime|DBDKeep|DBDMax|DBDMin|DBDParams|DBDPersist|DBDPrepareSQL|DBDriver)|(DeflateBufferSize|DeflateCompressionLevel|DeflateFilterNote|DeflateMemLevel|DeflateWindowSize)|(DirectoryIndex|DirectorySlash)|(CacheDirLength|CacheDirLevels|CacheMaxFileSize|CacheMinFileSize|CacheRoot)|(DumpIOInput|DumpIOLogLevel|DumpIOOutput)|(ProtocolEcho)|(PassEnv|SetEnv|UnsetEnv)|(Example)|(ExpiresActive|ExpiresByType|ExpiresDefault)|(ExtFilterDefine|ExtFilterOptions)|(CacheFile|MMapFile)|(FilterChain|FilterDeclare|FilterProtocol|FilterProvider|FilterTrace)|(CharsetDefault|CharsetOptions|CharsetSourceEnc)|(IdentityCheck|IdentityCheckTimeout)|(ImapBase|ImapDefault|ImapMenu)|(SSIEnableAccess|SSIEndTag|SSIErrorMsg|SSIStartTag|SSITimeFormat|SSIUndefinedEcho|XBitHack)|(AddModuleInfo)|(ISAPIAppendLogToErrors|ISAPIAppendLogToQuery|ISAPICacheFile|ISAPIFakeAsync|ISAPILogNotSupported|ISAPIReadAheadBuffer)|(LDAPCacheEntries|LDAPCacheTTL|LDAPConnectionTimeout|LDAPOpCacheEntries|LDAPOpCacheTTL|LDAPSharedCacheFile|LDAPSharedCacheSize|LDAPTrustedClientCert|LDAPTrustedGlobalCert|LDAPTrustedMode|LDAPVerifyServerCert)|(BufferedLogs|CookieLog|CustomLog|LogFormat|TransferLog)|(ForensicLog)|(MCacheMaxObjectCount|MCacheMaxObjectSize|MCacheMaxStreamingBuffer|MCacheMinObjectSize|MCacheRemovalAlgorithm|MCacheSize)|(AddCharset|AddEncoding|AddHandler|AddInputFilter|AddLanguage|AddOutputFilter|AddType|DefaultLanguage|ModMimeUsePathInfo|MultiviewsMatch|RemoveCharset|RemoveEncoding|RemoveHandler|RemoveInputFilter|RemoveLanguage|RemoveOutputFilter|RemoveType|TypesConfig)|(MimeMagicFile)|(CacheNegotiatedDocs|ForceLanguagePriority|LanguagePriority)|(NWSSLTrustedCerts|NWSSLUpgradeable|SecureListen)|(AllowCONNECT|BalancerMember|NoProxy|Proxy|ProxyBadHeader|ProxyBlock|ProxyDomain|ProxyErrorOverride|ProxyFtpDirCharset|ProxyIOBufferSize|ProxyMatch|ProxyMaxForwards|ProxyPass|ProxyPassInterpolateEnv|ProxyPassMatch|ProxyPassReverse|ProxyPassReverseCookieDomain|ProxyPassReverseCookiePath|ProxyPreserveHost|ProxyReceiveBufferSize|ProxyRemote|ProxyRemoteMatch|ProxyRequests|ProxySet|ProxyStatus|ProxyTimeout|ProxyVia)|(RewriteBase|RewriteCond|RewriteEngine|RewriteLock|RewriteLog|RewriteLogLevel|RewriteMap|RewriteOptions|RewriteRule)|(BrowserMatch|BrowserMatchNoCase|SetEnvIf|SetEnvIfNoCase)|(LoadFile|LoadModule)|(CheckCaseOnly|CheckSpelling)|(SSLCACertificateFile|SSLCACertificatePath|SSLCADNRequestFile|SSLCADNRequestPath|SSLCARevocationFile|SSLCARevocationPath|SSLCertificateChainFile|SSLCertificateFile|SSLCertificateKeyFile|SSLCipherSuite|SSLCryptoDevice|SSLEngine|SSLHonorCipherOrder|SSLMutex|SSLOptions|SSLPassPhraseDialog|SSLProtocol|SSLProxyCACertificateFile|SSLProxyCACertificatePath|SSLProxyCARevocationFile|SSLProxyCARevocationPath|SSLProxyCipherSuite|SSLProxyEngine|SSLProxyMachineCertificateFile|SSLProxyMachineCertificatePath|SSLProxyProtocol|SSLProxyVerify|SSLProxyVerifyDepth|SSLRandomSeed|SSLRequire|SSLRequireSSL|SSLSessionCache|SSLSessionCacheTimeout|SSLUserName|SSLVerifyClient|SSLVerifyDepth)|(ExtendedStatus|SeeRequestTail)|(Substitute)|(SuexecUserGroup)|(UserDir)|(CookieDomain|CookieExpires|CookieName|CookieStyle|CookieTracking)|(IfVersion)|(VirtualDocumentRoot|VirtualDocumentRootIP|VirtualScriptAlias|VirtualScriptAliasIP)|(AcceptMutex|ChrootDir|CoreDumpDirectory|EnableExceptionHook|GracefulShutdownTimeout|Group|Listen|ListenBackLog|LockFile|MaxClients|MaxMemFree|MaxRequestsPerChild|MaxSpareThreads|MinSpareThreads|PidFile|ReceiveBufferSize|ScoreBoardFile|SendBufferSize|ServerLimit|StartServers|StartThreads|ThreadLimit|ThreadsPerChild|ThreadStackSize|User)|(MaxThreads)|(Win32DisableAcceptEx)|(MaxSpareServers|MinSpareServers))(\b)/gi;



jush.tr.css = { php: jush.php, quo: /"/, apo: /'/, com: /\/\*/, css_at: /(@)([^;\s{]+)/, css_pro: /\{/, _2: /(<)(\/style)(>)/i };
jush.tr.css_at = { php: jush.php, quo: /"/, apo: /'/, com: /\/\*/, css_at2: /\{/, _1: /;/ };
jush.tr.css_at2 = { php: jush.php, quo: /"/, apo: /'/, com: /\/\*/, css_at: /@/, css_pro: /\{/, _2: /}/ };
jush.tr.css_pro = { php: jush.php, com: /\/\*/, css_val: /(\s*)([-\w]+)(\s*:)/, _1: /}/ }; //! misses e.g. margin/*-left*/:
jush.tr.css_val = { php: jush.php, quo: /"/, apo: /'/, css_js: /expression\s*\(/i, com: /\/\*/, clr: /#/, num: /[-+]?[0-9]*\.?[0-9]+(?:em|ex|px|in|cm|mm|pt|pc|%)?/, _2: /}/, _1: /;|$/ };
jush.tr.css_js = { php: jush.php, css_js: /\(/, _1: /\)/ };
jush.tr.clr = { _1: /(?=[^a-fA-F0-9])/ };

jush.urls.css_at = 'https://developer.mozilla.org/en-US/docs/Web/CSS/$key';
jush.urls.css_val = jush.urls.css_at;
jush.urls.css = [jush.urls.css_at,
	'_colon_$1', '_doublecolon_$1'
];

jush.links.css_at = {
	'@$val': /^(charset|color-profile|container|counter-style|document|font-face|font-feature-values|font-palette-values|import|keyframes|layer|media|namespace|page|position-try|property|scope|starting-style|supports|view-transition)$/i
};
jush.links.css_val = {
	'$val': /^(accent-color|align-(content|items|self)|alignment-baseline|all|anchor-name|animation(-composition|-delay|-direction|-duration|-fill-mode|-iteration-count|-name|-play-state|-range(-end|-start)?|-timeline|-timing-function)?|appearance|aspect-ratio|backdrop-filter|backface-visibility|background(-attachment|-blend-mode|-clip|-color|-image|-origin|-position(-x|-y)?|-repeat|-size)?|block-size|border(-block(-color|-end(-color|-style|-width)?|-start(-color|-style|-width)?|-style|-width)?|-bottom(-color|-left-radius|-right-radius|-style|-width)?|-collapse|-color|-end-end-radius|-end-start-radius|-image(-outset|-repeat|-slice|-source|-width)?|-inline(-color|-end(-color|-style|-width)?|-start(-color|-style|-width)?|-style|-width)?|-left(-color|-style|-width)?|-radius|-right(-color|-style|-width)?|-spacing|-start-end-radius|-start-start-radius|-style|-top(-color|-left-radius|-right-radius|-style|-width)?|-width)?|bottom|box-(align|decoration-break|direction|flex(-group)?|lines|ordinal-group|orient|pack|shadow|sizing)|break-(after|before|inside)|caption-side|caret-color|clear|clip(-path|-rule)?|color(-interpolation(-filters)?|-scheme)?|column-(count|fill|gap|rule(-color|-style|-width)?|span|width)|columns|contain(-intrinsic-block-size|-intrinsic-height|-intrinsic-inline-size|-intrinsic-size|-intrinsic-width)?|container(-name|-type)?|content(-visibility)?|counter-(increment|reset|set)|cursor|cx|cy|d|direction|display|dominant-baseline|empty-cells|field-sizing|fill(-opacity|-rule)?|filter|flex(-basis|-direction|-flow|-grow|-shrink|-wrap)?|float|flood-(color|opacity)|font(-family|-feature-settings|-kerning|-language-override|-optical-sizing|-palette|-size(-adjust)?|-smooth|-stretch|-style|-synthesis(-position|-small-caps|-style|-weight)?|-variant(-alternates|-caps|-east-asian|-emoji|-ligatures|-numeric|-position)?|-variation-settings|-weight)?|forced-color-adjust|gap|grid(-area|-auto-columns|-auto-flow|-auto-rows|-column(-end|-start)?|-row(-end|-start)?|-template(-areas|-columns|-rows)?)?|hanging-punctuation|height|hyphenate-(character|limit-chars)|hyphens|image-(orientation|rendering|resolution)|initial-letter|inline-size|inset(-block(-end|-start)?|-inline(-end|-start)?)?|interpolate-size|isolation|justify-(content|items|self)|left|letter-spacing|lighting-color|line-(break|clamp|height(-step)?)|list-style(-image|-position|-type)?|margin(-block(-end|-start)?|-bottom|-inline(-end|-start)?|-left|-right|-top|-trim)?|marker(-end|-mid|-start)?|mask(-border(-mode|-outset|-repeat|-slice|-source|-width)?|-clip|-composite|-image|-mode|-origin|-position|-repeat|-size|-type)?|math-(depth|shift|style)|max-(block-size|height|inline-size|width)|min-(block-size|height|inline-size|width)|mix-blend-mode|object-(fit|position)|offset(-anchor|-distance|-path|-position|-rotate)?|opacity|order|orphans|outline(-color|-offset|-style|-width)?|overflow(-anchor|-block|-clip-margin|-inline|-wrap|-x|-y)?|overlay|overscroll-behavior(-block|-inline|-x|-y)?|padding(-block(-end|-start)?|-bottom|-inline(-end|-start)?|-left|-right|-top)?|page(-break-after|-break-before|-break-inside)?|paint-order|perspective(-origin)?|place-(content|items|self)|pointer-events|position(-anchor|-area|-try(-fallbacks|-order)?|-visibility)?|print-color-adjust|quotes|r|resize|right|rotate|row-gap|ruby-(align|position)|rx|ry|scale|scroll-(behavior|margin(-block(-end|-start)?|-bottom|-inline(-end|-start)?|-left|-right|-top)?|marker-group|padding(-block(-end|-start)?|-bottom|-inline(-end|-start)?|-left|-right|-top)?|snap-(align|stop|type)|timeline(-axis|-name)?)|scrollbar-(color|gutter|width)|shape-(image-threshold|margin|outside|rendering)|speak-as|stop-(color|opacity)|stroke(-dasharray|-dashoffset|-linecap|-linejoin|-miterlimit|-opacity|-width)?|tab-size|table-layout|text-(align(-last)?|anchor|box(-edge|-trim)?|combine-upright|decoration(-color|-line|-skip(-ink)?|-style|-thickness)?|emphasis(-color|-position|-style)?|indent|justify|orientation|overflow|rendering|shadow|size-adjust|spacing-trim|transform|underline-(offset|position)|wrap(-mode|-style)?)|timeline-scope|top|touch-action|transform(-box|-origin|-style)?|transition(-behavior|-delay|-duration|-property|-timing-function)?|translate|unicode-bidi|user-(modify|select)|vector-effect|vertical-align|view-(timeline(-axis|-inset|-name)?|transition-name)|visibility|white-space(-collapse)?|widows|width|will-change|word-(break|spacing)|writing-mode|x|y|z-index|zoom)$/i
};

jush.links2.css = /(:)(?<!::)(active|any-link|autofill|blank|buffering|checked|current|default|defined|dir|disabled|empty|enabled|first|first-child|first-of-type|focus|focus-visible|focus-within|fullscreen|future|has|has-slotted|host|host-context|host_function|hover|in-range|indeterminate|invalid|is|lang|last-child|last-of-type|left|link|local-link|modal|muted|not|nth-child|nth-last-child|nth-last-of-type|nth-of-type|only-child|only-of-type|open|optional|out-of-range|past|paused|picture-in-picture|placeholder-shown|playing|popover-open|read-only|read-write|required|right|root|scope|seeking|stalled|state|target|target-current|target-within|user-invalid|user-valid|valid|visited|volume-locked|where)|(?<=::)(after|backdrop|before|checkmark|column|cue|details-content|file-selector-button|first-letter|first-line|grammar-error|highlight|marker|part|picker|picker-icon|placeholder|scroll-button|scroll-marker|scroll-marker-group|selection|slotted|spelling-error|target-text|view-transition|view-transition-group|view-transition-image-pair|view-transition-new|view-transition-old)((?![-\w]))/gi;



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
	'Elements/$val': /^(a|abbr|acronym|address|area|article|aside|audio|b|base|bdi|bdo|big|blockquote|body|br|button|canvas|caption|center|cite|code|col|colgroup|data|datalist|dd|del|details|dfn|dialog|dir|div|dl|dt|em|embed|fencedframe|fieldset|figcaption|figure|font|footer|form|frame|frameset|head|header|heading_elements|hgroup|hr|html|i|iframe|img|input|ins|kbd|label|legend|li|link|main|map|mark|marquee|menu|meta|meter|nav|nobr|noembed|noframes|noscript|object|ol|optgroup|option|output|p|param|picture|plaintext|pre|progress|q|rb|rp|rt|rtc|ruby|s|samp|search|section|select|selectedcontent|slot|small|source|span|strike|strong|sub|summary|sup|table|tbody|td|template|textarea|tfoot|th|thead|time|title|tr|track|tt|u|ul|var|video|wbr|xmp)$/i
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
	'Global_attributes/$val': /^(accesskey|anchor|autocapitalize|autocorrect|autofocus|class|contenteditable|dir|draggable|enterkeyhint|exportparts|hidden|id|inert|inputmode|is|itemid|itemprop|itemref|itemscope|itemtype|lang|nonce|part|popover|slot|spellcheck|style|tabindex|title|translate|virtualkeyboardpolicy|writingsuggestions)$/i,
	'Global_attributes/data-_star_': /^(data-.*)$/i,
	'Elements/$tag#$val': /^(abbr|accept|accept-charset|action|align|alink|allow|allowfullscreen|allowpaymentrequest|alt|archive|as|async|attributionsrc|autocomplete|autoplay|axis|background|behavior|bgcolor|blocking|border|bottommargin|browsingtopics|capture|cellpadding|cellspacing|char|charoff|charset|checked|cite|classid|clear|codebase|codetype|color|cols|colspan|command|commandfor|compact|content|controls|controlslist|coords|credentialless|crossorigin|csp|data|datetime|declare|decoding|default|defer|direction|dirname|disabled|disablepictureinpicture|disableremoteplayback|download|elementtiming|enctype|face|fetchpriority|for|form|formaction|formenctype|formmethod|formnovalidate|formtarget|frame|frameborder|headers|height|high|href|hreflang|hspace|http-equiv|imagesizes|imagesrcset|incremental|integrity|ismap|kind|label|language|leftmargin|link|list|loading|longdesc|loop|low|marginheight|marginwidth|max|maxlength|media|method|min|minlength|moz-opaque|multiple|muted|name|nomodule|noresize|noshade|novalidate|onafterprint|onbeforeprint|onbeforeunload|onblur|onerror|onfocus|onhashchange|onlanguagechange|onload|onmessage|onmessageerror|onoffline|ononline|onpagehide|onpagereveal|onpageshow|onpageswap|onpopstate|onrejectionhandled|onresize|onstorage|onunhandledrejection|onunload|open|optimum|orient|pattern|ping|placeholder|playsinline|popovertarget|popovertargetaction|poster|preload|profile|readonly|referrerpolicy|rel|required|results|rev|reversed|rightmargin|rows|rowspan|rules|sandbox|scope|scrollamount|scrolldelay|scrolling|selected|shadowrootclonable|shadowrootdelegatesfocus|shadowrootmode|shadowrootserializable|shape|size|sizes|span|src|srcdoc|srclang|srcset|standby|start|step|summary|target|text|topmargin|truespeed|type|usemap|valign|value|valuetype|version|vlink|vspace|webkitdirectory|width|wrap|xmlns)$/i
};



jush.tr.http = { _0: /$/ };

jush.urls.http = ['https://www.w3.org/Protocols/rfc2616/rfc2616-$key',
	'sec10.html#sec10.1.1', 'sec10.html#sec10.1.2', 'sec10.html#sec10.2.1', 'sec10.html#sec10.2.2', 'sec10.html#sec10.2.3', 'sec10.html#sec10.2.4', 'sec10.html#sec10.2.5', 'sec10.html#sec10.2.6', 'sec10.html#sec10.2.7', 'sec10.html#sec10.3.1', 'sec10.html#sec10.3.2', 'sec10.html#sec10.3.3', 'sec10.html#sec10.3.4', 'sec10.html#sec10.3.5', 'sec10.html#sec10.3.6', 'sec10.html#sec10.3.7', 'sec10.html#sec10.3.8', 'sec10.html#sec10.4.1', 'sec10.html#sec10.4.2', 'sec10.html#sec10.4.3', 'sec10.html#sec10.4.4', 'sec10.html#sec10.4.5', 'sec10.html#sec10.4.6', 'sec10.html#sec10.4.7', 'sec10.html#sec10.4.8', 'sec10.html#sec10.4.9', 'sec10.html#sec10.4.10', 'sec10.html#sec10.4.11', 'sec10.html#sec10.4.12', 'sec10.html#sec10.4.13', 'sec10.html#sec10.4.14', 'sec10.html#sec10.4.15', 'sec10.html#sec10.4.16', 'sec10.html#sec10.4.17', 'sec10.html#sec10.4.18', 'sec10.html#sec10.5.1', 'sec10.html#sec10.5.2', 'sec10.html#sec10.5.3', 'sec10.html#sec10.5.4', 'sec10.html#sec10.5.5', 'sec10.html#sec10.5.6',
	'sec14.html#sec14.1', 'sec14.html#sec14.2', 'sec14.html#sec14.3', 'sec14.html#sec14.4', 'sec14.html#sec14.5', 'sec14.html#sec14.6', 'sec14.html#sec14.7', 'sec14.html#sec14.8', 'sec14.html#sec14.9', 'sec14.html#sec14.10', 'sec14.html#sec14.11', 'sec14.html#sec14.12', 'sec14.html#sec14.13', 'sec14.html#sec14.14', 'sec14.html#sec14.15', 'sec14.html#sec14.16', 'sec14.html#sec14.17', 'sec14.html#sec14.18', 'sec14.html#sec14.19', 'sec14.html#sec14.20', 'sec14.html#sec14.21', 'sec14.html#sec14.22', 'sec14.html#sec14.23', 'sec14.html#sec14.24', 'sec14.html#sec14.25', 'sec14.html#sec14.26', 'sec14.html#sec14.27', 'sec14.html#sec14.28', 'sec14.html#sec14.29', 'sec14.html#sec14.30', 'sec14.html#sec14.31', 'sec14.html#sec14.32', 'sec14.html#sec14.33', 'sec14.html#sec14.34', 'sec14.html#sec14.35', 'sec14.html#sec14.36', 'sec14.html#sec14.37', 'sec14.html#sec14.38', 'sec14.html#sec14.39', 'sec14.html#sec14.40', 'sec14.html#sec14.41', 'sec14.html#sec14.42', 'sec14.html#sec14.43', 'sec14.html#sec14.44', 'sec14.html#sec14.45', 'sec14.html#sec14.46', 'sec14.html#sec14.47',
	'sec19.html#sec19.5.1',
	'https://tools.ietf.org/html/rfc2068#section-19.7.1.1',
	'https://tools.ietf.org/html/rfc2109#section-4.2.2', 'https://tools.ietf.org/html/rfc2109#section-4.3.4', 'https://en.wikipedia.org/wiki/Meta_refresh', 'https://www.w3.org/TR/cors/#$1-response-header', 'https://www.w3.org/TR/cors/#$1-request-header',
	'https://en.wikipedia.org/wiki/$1', 'https://msdn.microsoft.com/library/cc288472.aspx#_replace', 'https://msdn.microsoft.com/en-us/library/dd565640.aspx', 'https://msdn.microsoft.com/library/cc817574.aspx', 'https://noarchive.net/xrobots/', 'https://www.w3.org/TR/CSP/#$1-header-field', 'https://tools.ietf.org/html/rfc6797'
];

jush.links2.http = /(^(?:HTTP\/[0-9.]+\s+)?)(100.*|(101.*)|(200.*)|(201.*)|(202.*)|(203.*)|(204.*)|(205.*)|(206.*)|(300.*)|(301.*)|(302.*)|(303.*)|(304.*)|(305.*)|(306.*)|(307.*)|(400.*)|(401.*)|(402.*)|(403.*)|(404.*)|(405.*)|(406.*)|(407.*)|(408.*)|(409.*)|(410.*)|(411.*)|(412.*)|(413.*)|(414.*)|(415.*)|(416.*)|(417.*)|(500.*)|(501.*)|(502.*)|(503.*)|(504.*)|(505.*)|(Accept)|(Accept-Charset)|(Accept-Encoding)|(Accept-Language)|(Accept-Ranges)|(Age)|(Allow)|(Authorization)|(Cache-Control)|(Connection)|(Content-Encoding)|(Content-Language)|(Content-Length)|(Content-Location)|(Content-MD5)|(Content-Range)|(Content-Type)|(Date)|(ETag)|(Expect)|(Expires)|(From)|(Host)|(If-Match)|(If-Modified-Since)|(If-None-Match)|(If-Range)|(If-Unmodified-Since)|(Last-Modified)|(Location)|(Max-Forwards)|(Pragma)|(Proxy-Authenticate)|(Proxy-Authorization)|(Range)|(Referer)|(Retry-After)|(Server)|(TE)|(Trailer)|(Transfer-Encoding)|(Upgrade)|(User-Agent)|(Vary)|(Via)|(Warning)|(WWW-Authenticate)|(Content-Disposition)|(Keep-Alive)|(Set-Cookie)|(Cookie)|(Refresh)|(Access-Control-Allow-Origin|Access-Control-Max-Age|Access-Control-Allow-Credentials|Access-Control-Allow-Methods|Access-Control-Allow-Headers)|(Origin|Access-Control-Request-Method|Access-Control-Request-Headers)|(X-Forwarded-For|X-Requested-With)|(X-Frame-Options|X-XSS-Protection)|(X-Content-Type-Options)|(X-UA-Compatible)|(X-Robots-Tag)|(Content-Security-Policy|Content-Security-Policy-Report-Only)|(Strict-Transport-Security))(:|$)/gim;



jush.tr.igdb = { quo: /"/ };

jush.urls.igdb = ['https://api-docs.igdb.com/#$key',
	'endpoints', '$1', 'filters', 'sorting', 'search-1', 'pagination', 'multi-query'
];

jush.links2.igdb = /(\b)(POST|GET|DELETE|(fields|exclude)|(where)|(sort)|(search)|(limit|offset)|(query))(\b)/gi;



jush.tr.js = { php: jush.php, js_reg: /\s*\/(?![\/*])/, js_obj: /\s*\{/, _1: /}/, js_code: /()/ };
jush.tr.js_code = { php: jush.php, quo: /"/, apo: /'/, js_bac: /`/, js_one: /\/\//, js_doc: /\/\*\*/, com: /\/\*/, num: jush.num, js_write: /(\b)(write(?:ln)?)(\()/, js_http: /(\.)(setRequestHeader|getResponseHeader)(\()/, js: /\{/, _3: /(<)(\/script)(>)/i, _2: /}/, _1: /[^.\])}$\w\s]/ };
jush.tr.js_write = { php: jush.php, js_reg: /\s*\/(?![\/*])/, js_write_code: /()/ };
jush.tr.js_http = { php: jush.php, js_reg: /\s*\/(?![\/*])/, js_http_code: /()/ };
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

jush.urls.js_write = 'https://developer.mozilla.org/en/docs/DOM/$key.$val';
jush.urls.js_http = 'https://www.w3.org/TR/XMLHttpRequest/#the-$val-$key';
jush.urls.js = ['https://developer.mozilla.org/en/$key',
	'JavaScript/Reference/Global_Objects/$1',
	'JavaScript/Reference/Statements/$1',
	'JavaScript/Reference/Statements/do...while',
	'JavaScript/Reference/Statements/if...else',
	'JavaScript/Reference/Statements/try...catch',
	'JavaScript/Reference/Operators/Special/$1',
	'DOM/document.$1', 'DOM/element.$1', 'DOM/event.$1', 'DOM/form.$1', 'DOM/table.$1', 'DOM/window.$1',
	'https://www.w3.org/TR/XMLHttpRequest/',
	'JavaScript/Reference/Global_Objects/Array.$1',
	'JavaScript/Reference/Global_Objects/Array$1',
	'JavaScript/Reference/Global_Objects/Date$1',
	'JavaScript/Reference/Global_Objects/Function$1',
	'JavaScript/Reference/Global_Objects/Number$1',
	'JavaScript/Reference/Global_Objects/RegExp$1',
	'JavaScript/Reference/Global_Objects/String$1'
];
jush.urls.js_doc = ['https://code.google.com/p/jsdoc-toolkit/wiki/Tag$key',
	'$1', 'Param', 'Augments', '$1'
];

jush.links.js_write = { 'document': /^(write|writeln)$/ };
jush.links.js_http = { 'method': /^(setRequestHeader|getResponseHeader)$/ };

jush.links2.js = /(\b)(String\.fromCharCode|Date\.(?:parse|UTC)|Math\.(?:E|LN2|LN10|LOG2E|LOG10E|PI|SQRT1_2|SQRT2|abs|acos|asin|atan|atan2|ceil|cos|exp|floor|log|max|min|pow|random|round|sin|sqrt|tan)|Array|Boolean|Date|Error|Function|JavaArray|JavaClass|JavaObject|JavaPackage|Math|Number|Object|Packages|RegExp|String|Infinity|JSON|NaN|undefined|Error|EvalError|RangeError|ReferenceError|SyntaxError|TypeError|URIError|decodeURI|decodeURIComponent|encodeURI|encodeURIComponent|eval|isFinite|isNaN|parseFloat|parseInt|(break|continue|for|function|return|switch|throw|var|while|with)|(do)|(if|else)|(try|catch|finally)|(delete|in|instanceof|new|this|typeof|void)|(alinkColor|anchors|applets|bgColor|body|characterSet|compatMode|contentType|cookie|defaultView|designMode|doctype|documentElement|domain|embeds|fgColor|forms|height|images|implementation|lastModified|linkColor|links|plugins|popupNode|referrer|styleSheets|title|tooltipNode|URL|vlinkColor|width|clear|createAttribute|createDocumentFragment|createElement|createElementNS|createEvent|createNSResolver|createRange|createTextNode|createTreeWalker|evaluate|execCommand|getElementById|getElementsByName|importNode|loadOverlay|queryCommandEnabled|queryCommandIndeterm|queryCommandState|queryCommandValue|write|writeln)|(attributes|childNodes|className|clientHeight|clientLeft|clientTop|clientWidth|dir|firstChild|id|innerHTML|lang|lastChild|localName|name|namespaceURI|nextSibling|nodeName|nodeType|nodeValue|offsetHeight|offsetLeft|offsetParent|offsetTop|offsetWidth|ownerDocument|parentNode|prefix|previousSibling|scrollHeight|scrollLeft|scrollTop|scrollWidth|style|tabIndex|tagName|textContent|addEventListener|appendChild|blur|click|cloneNode|dispatchEvent|focus|getAttribute|getAttributeNS|getAttributeNode|getAttributeNodeNS|getElementsByTagName|getElementsByTagNameNS|hasAttribute|hasAttributeNS|hasAttributes|hasChildNodes|insertBefore|item|normalize|removeAttribute|removeAttributeNS|removeAttributeNode|removeChild|removeEventListener|replaceChild|scrollIntoView|setAttribute|setAttributeNS|setAttributeNode|setAttributeNodeNS|supports|onblur|onchange|onclick|ondblclick|onfocus|onkeydown|onkeypress|onkeyup|onmousedown|onmousemove|onmouseout|onmouseover|onmouseup|onresize)|(altKey|bubbles|button|cancelBubble|cancelable|clientX|clientY|ctrlKey|currentTarget|detail|eventPhase|explicitOriginalTarget|isChar|layerX|layerY|metaKey|originalTarget|pageX|pageY|relatedTarget|screenX|screenY|shiftKey|target|timeStamp|type|view|which|initEvent|initKeyEvent|initMouseEvent|initUIEvent|stopPropagation|preventDefault)|(elements|name|acceptCharset|action|enctype|encoding|method|submit|reset)|(caption|tHead|tFoot|rows|tBodies|align|bgColor|border|cellPadding|cellSpacing|frame|rules|summary|width|createTHead|deleteTHead|createTFoot|deleteTFoot|createCaption|deleteCaption|insertRow|deleteRow)|(content|closed|controllers|crypto|defaultStatus|directories|document|frameElement|frames|history|innerHeight|innerWidth|location|locationbar|menubar|name|navigator|opener|outerHeight|outerWidth|pageXOffset|pageYOffset|parent|personalbar|pkcs11|screen|availTop|availLeft|availHeight|availWidth|colorDepth|height|left|pixelDepth|top|width|scrollbars|scrollMaxX|scrollMaxY|scrollX|scrollY|self|sidebar|status|statusbar|toolbar|window|alert|atob|back|btoa|captureEvents|clearInterval|clearTimeout|close|confirm|dump|escape|find|forward|getAttention|getComputedStyle|getSelection|home|moveBy|moveTo|open|openDialog|print|prompt|releaseEvents|resizeBy|resizeTo|scroll|scrollBy|scrollByLines|scrollByPages|scrollTo|setInterval|setTimeout|sizeToContent|stop|unescape|updateCommands|onabort|onclose|ondragdrop|onerror|onload|onpaint|onreset|onscroll|onselect|onsubmit|onunload)|(XMLHttpRequest)|(length))\b|(\.(?:pop|push|reverse|shift|sort|splice|unshift|concat|join|slice)|(\.(?:getDate|getDay|getFullYear|getHours|getMilliseconds|getMinutes|getMonth|getSeconds|getTime|getTimezoneOffset|getUTCDate|getUTCDay|getUTCFullYear|getUTCHours|getUTCMilliseconds|getUTCMinutes|getUTCMonth|getUTCSeconds|setDate|setFullYear|setHours|setMilliseconds|setMinutes|setMonth|setSeconds|setTime|setUTCDate|setUTCFullYear|setUTCHours|setUTCMilliseconds|setUTCMinutes|setUTCMonth|setUTCSeconds|toDateString|toLocaleDateString|toLocaleTimeString|toTimeString|toUTCString))|(\.(?:apply|call))|(\.(?:toExponential|toFixed|toPrecision))|(\.(?:exec|test))|(\.(?:charAt|charCodeAt|concat|indexOf|lastIndexOf|localeCompare|match|replace|search|slice|split|substr|substring|toLocaleLowerCase|toLocaleUpperCase|toLowerCase|toUpperCase)))(\s*\(|$)/g; // collisions: bgColor, height, width, length, name
jush.links2.js_doc = /(^[ \t]*|\n\s*\*\s*|(?={))(@(?:augments|author|borrows|class|constant|constructor|constructs|default|deprecated|description|event|example|field|fileOverview|function|ignore|inner|lends|memberOf|name|namespace|param|private|property|public|requires|returns|see|since|static|throws|type|version)|(@argument)|(@extends)|(\{@link))(\b)/g;



jush.tr.mssql = { sqlite_apo: /'/, sqlite_quo: /"/, one: /--/, com: /\/\*/, mssql_bra: /\[/, num: jush.num }; // QUOTED IDENTIFIER = OFF
jush.tr.mssql_bra = { _0: /]]/, _1: /]/ };

jush.urls.mssql = ['https://msdn.microsoft.com/library/$key.aspx',
	'ms181700', 'ms178543', 'ms188372', 'ms189526', 'ms186865', 'ms178578', 'ms174387', 'ms190337', 'ms190487', 'ms187804', 'ms187377', 'ms188386', 'ms188929', 'ms187922', 'ms188362', 'ms177603', 'ms181271', 'ms188365', 'ms181765', 'ms187368', 'ms176089', 'ms188748', 'ms175035', 'ms188387', 'ms177938', 'ms184391', 'ms178628', 'ms190295', 'ms181708', 'ms174366', 'bb630352', 'ms187819', 'bb677335', 'bb630289', 'ms188782', 'ms187746', 'ms188927', 'ms180169', 'ms189835', 'ms188338', 'ms189748', 'ms182587', 'ms182706', 'ms176030', 'ms177521', 'ms188055', 'ms188332', 'ms181362', 'ms188336', 'ms180152', 'ms173773', 'ms173812', 'ms177634', 'cc280766', 'cc280487', 'ms178624', 'ms188037', 'ms180188', 'ms187965', 'ms177673', 'ms180199', 'bb677290', 'ms186775', 'ms182717', 'ms177682', 'ms174335', 'ms187745', 'ms188029', 'ms188795', 'ms173730', 'ms186764', 'ms180016', 'ms179859', 'bb510625', 'ms179882', 'ms174987', 'ms186939', 'ms189455', 'ms187993', 'ms190500', 'ms174433', 'ms190499', 'ms190322', 'ms188361', 'ms188385', 'ms177564', 'ms189461', 'ms176047', 'ms190372', 'ms186336', 'ms187972', 'ms174998', 'ms178632', 'ms187728', 'ms181299', 'ms174973', 'ms182776', 'ms188378', 'ms189499', 'ms188407', 'ms190356', 'ms188767', 'ms182418', 'ms175064', 'ms173829', 'bb677243', 'ms189463', 'ms175976', 'ms177570', 'ms180026', 'ms187942', 'ms177523', 'ms187348', 'ms189466', 'ms188366', 'ms186290', 'ms187331', 'ms188047', 'ms178642', 'ms175972', 'ms177607', 'ms186838', 'ms189797',
	'ms182741', 'ms181491', 'ms189524', 'ms174430', 'bb934170', 'ms187798', 'ms178528', 'ms189522', 'bb677184', 'ms176061', 'cc280404', 'bb677241', 'ms173565', 'ms181591', 'ms189453', 'bb677289', 'ms189520', 'ms187317', 'cc280405', 'ms186755', 'ms188783', 'ms189751', 'ms174382', 'ms187744', 'ms187802', 'ms179854', 'ms187926', 'ms190495', 'ms178024', 'bb895329', 'ms187936', 'ms186742', 'ms188064', 'ms189462', 'cc280448', 'cc280767', 'ms190332', 'ms188038', 'ms188357', 'ms177544', 'ms174979', 'ms189799', 'ms175007', 'ms173463', 'ms187956', 'bb934146', 'ms176009',
	'ms186847', 'ms177517', 'ms177514', 'ms188389', 'bb964728', 'ms179906', 'ms190475', 'ms189450', 'bb677309', 'ms178613', 'cc280479', 'bb630256', 'ms188747', 'ms181586', 'ms174414', 'bb630257', 'ms188403', 'ms184393', 'cc280482', 'ms190290', 'ms176118', 'ms188012', 'ms180071', 'ms186728', 'ms187759', 'ms181249', 'ms174969', 'ms190480', 'ms177539', 'bb933779', 'ms174988', 'ms189449', 'ms186791', 'ms186751', 'cc280899', 'cc280603', 'ms174990', 'ms186977', 'ms175075', 'ms182698', 'ms174996', 'ms173790', 'ms173497', 'ms174407', 'ms189438', 'ms173492', 'bb933867', 'ms189448',
	'ms188900', 'ms186711', 'ms187311', 'ms187359', 'bb933778', 'ms189511', 'ms187923', 'bb677336', 'ms174269', 'cc280645', 'bb630389', 'ms186332', 'bb630368', 'ms176095', 'ms188359', 'cc280871', 'ms186967', 'ms188388', 'ms189828', 'ms186937', 'ms187345', 'ms186307', 'ms190347', 'ms189762', 'ms189529', 'ms190363', 'bb934013', 'bb934024', 'ms189775', 'ms187353', 'ms173423', 'cc280563', 'cc280682', 'ms176036', 'ms187788', 'ms189440', 'ms190273', 'ms176072', 'ms176060', 'ms173846', 'bb895361', 'ms189778',
	'ms189800', 'ms178627', 'ms189749', 'ms178647', 'ms189770', 'ms177545', 'ms181581', 'ms188750', 'ms189508', 'cc627393', 'ms181746', 'ms173854', 'ms177677', 'ms173784', 'ms187928', 'ms189818', 'ms187324', 'ms180142', 'ms187323', 'ms186323', 'ms189788', 'ms188920', 'ms190349', 'ms190305', 'ms188732', 'ms174974', 'ms174968', 'ms186329', 'bb895240', 'ms187787', 'ms189760', 'ms180125', 'ms189534', 'ms188919', 'ms188921', 'ms175997', 'ms190317', 'cc627408', 'ms187352', 'ms188751', 'ms176050', 'ms177609', 'ms187319', 'ms176049', 'ms186823', 'ms173486', 'ms186819', 'ms189794', 'ms174395', 'ms174420', 'ms176052', 'ms186274', 'ms189753', 'ms188796', 'ms189507', 'ms178601', 'ms181860', 'ms365420', 'ms182559', 'ms188910', 'ms178566', 'ms173825', 'ms188753', 'ms186950', 'ms188061', 'ms174361', 'ms190357', 'ms178600', 'ms190358', 'ms175069', 'ms188398', 'ms178567', 'ms180031', 'ms173781', 'ms179857', 'ms182063', 'ms186275', 'ms181399', 'ms186980', 'ms176088', 'ms188069', 'ms188401', 'ms178531', 'ms186788', 'ms176078', 'ms177652', 'ms190370', 'ms188418', 'bb934014', 'ms181825', 'ms174960', 'ms188383', 'ms178635', 'ms178544', 'bb510624', 'ms187718', 'ms189802', 'ms174415', 'ms177605', 'ms178598', 'ms175098', 'ms189795', 'ms189834', 'ms186773', 'ms187729', 'ms178545', 'ms186271', 'cc627401', 'ms176015', 'ms187347', 'ms184325', 'ms186272', 'ms187385', 'ms189457', 'cc645960', 'ms177601', 'ms190329', 'ms190319', 'ms175121', 'ms345412', 'ms174400', 'ms177827', 'ms187751', 'ms179916', 'bb839514', 'ms187813', 'ms182673', 'ms190348', 'ms189786', 'ms175126', 'ms177562', 'ms176090', 'ms190328', 'ms186301', 'bb326599', 'ms176105', 'ms188390', 'ms179856', 'ms188427', 'ms190312', 'ms186918', 'bb895328', 'ms189492', 'ms188006', 'bb895239', 'ms188395', 'ms186915', 'ms189512', 'ms174276', 'ms189830', 'dd822792', 'dd822791', 'ms176114', 'ms189742', 'ms178592', 'ms177610', 'ms176102', 'ms187365', 'ms186963', 'ms176069', 'ms186862', 'ms174383', 'ms180040', 'ms177532', 'ms175003', 'ms186734', 'ms181406', 'ms178660', 'ms188797', 'ms175068', 'ms190315', 'ms174396', 'ms177587', 'ms175001', 'ms186297', 'ms188420', 'ms187913', 'ms187920', 'ms188377', 'ms187384', 'ms187950', 'ms178550', 'ms176108', 'ms173569', 'ms190330', 'ms190474', 'ms176080', 'ms189527', 'ms188043', 'ms187748', 'ms187810', 'ms176042', 'ms187934', 'ms179889', 'ms174427', 'bb677244', 'bb630353', 'bb677334', 'cc645882', 'bb630387', 'ms179930', 'ms190338', 'ms186881', 'ms176068', 'ms187362', 'bb630335', 'ms182737', 'ms181628', 'ms189750', 'ms188419', 'ms180059', 'ms187326', 'ms180055', 'ms186738', 'ms181466', 'ms188014', 'ms188735', 'ms178631', 'ms187791', 'ms187339', 'ms190316', 'ms186313'
];

jush.links2.mssql = /(\b)(ADD(?:\s+COUNTER)?\s+SIGNATURE|(ALL)|(AND)|(ANY)|(BACKUP)|(BACKUP\s+CERTIFICATE)|(BACKUP\s+MASTER\s+KEY)|(BACKUP\s+SERVICE\s+MASTER\s+KEY)|(BEGIN)|(BEGIN\s+CONVERSATION\s+TIMER)|(BEGIN\s+DIALOG)|(BEGIN\s+DISTRIBUTED\s+(?:TRANSACTION|TRAN))|(BEGIN\s+(?:TRANSACTION|TRAN))|(BETWEEN)|((?:var)?binary)|(bit)|(BREAK)|(BULK\s+INSERT)|(CASE)|(CATCH)|((?:var)?char)|(CHECKPOINT)|(CLOSE)|(CLOSE\s+MASTER\s+KEY)|(CLOSE\s+(?:SYMMETRIC\s+KEY|ALL\s+SYMMETRIC\s+KEYS))|(COLLATE)|(COMMIT)|(COMMIT\s+(?:TRANSACTION|TRAN))|(COMPUTE)|(CONTINUE)|(date)|(datetime)|(datetime2)|(datetimeoffset)|(DEALLOCATE)|(decimal|numeric)|(DECLARE)|(DECLARE\s+CURSOR)|(DELETE)|(DENY)|(DISABLE\s+TRIGGER)|(ELSE)|(ENABLE\s+TRIGGER)|(END)|(END\s+CONVERSATION)|(EXCEPT|INTERSECT)|(EXECUTE|EXEC)|((?:EXECUTE|EXEC)\s+AS)|(EXISTS)|(FETCH)|(float|real)|(FOR)|(FROM)|(geography)|(geometry)|(GET\s+CONVERSATION\s+GROUP)|(GO)|(GOTO)|(GRANT)|(GROUP\s+BY)|(HAVING)|(hierarchyid)|(IDENTITY)|(IF)|(IN)|(INSERT)|((?:big|small|tiny)?int)|(INTO)|(IS(?:\s+NOT)?\s+NULL)|(KILL)|(KILL\s+QUERY\s+NOTIFICATION\s+SUBSCRIPTION)|(KILL\s+STATS\s+JOB)|(LIKE)|(MERGE)|((?:small)?money)|(MOVE\s+CONVERSATION)|(nchar|nvarchar)|(NOT)|(ntext|text|image)|(OPEN)|(OPEN\s+MASTER\s+KEY)|(OPEN\s+SYMMETRIC\s+KEY)|(OPTION)|(OR)|(ORDER\s+BY)|(OUTPUT)|(OVER)|(PRINT)|(RESTORE)|(RESTORE\s+MASTER\s+KEY)|(RESTORE\s+SERVICE\s+MASTER\s+KEY)|(RETURN)|(REVERT)|(REVOKE)|(ROLLBACK\s+TRANSACTION)|(ROLLBACK\s+WORK)|(rowversion)|(SAVE\s+TRANSACTION)|(SELECT)|(SEND)|(SET)|(SHUTDOWN)|(smalldatetime)|(SOME|ANY)|(sql_variant)|(time)|(TOP)|(TRY)|(TRUNCATE\s+TABLE)|(UNION)|(uniqueidentifier)|(UPDATE)|(UPDATE\s+STATISTICS)|(UPDATETEXT)|(USE)|(VAR)|(WAITFOR)|(WHERE)|(WHILE)|(WITH)|(WITH\s+XMLNAMESPACES)|(WRITETEXT)|(XACT_STATE)|(CREATE\s+AGGREGATE)|(CREATE\s+APPLICATION\s+ROLE)|(CREATE\s+ASSEMBLY)|(CREATE\s+ASYMMETRIC\s+KEY)|(CREATE\s+BROKER\s+PRIORITY)|(CREATE\s+CERTIFICATE)|(CREATE\s+CONTRACT)|(CREATE\s+CREDENTIAL)|(CREATE\s+CRYPTOGRAPHIC\s+PROVIDER)|(CREATE\s+DATABASE)|(CREATE\s+DATABASE\s+AUDIT\s+SPECIFICATION)|(CREATE\s+DATABASE\s+ENCRYPTION\s+KEY)|(CREATE\s+DEFAULT)|(CREATE\s+ENDPOINT)|(CREATE\s+EVENT\s+NOTIFICATION)|(CREATE\s+EVENT\s+SESSION)|(CREATE\s+FULLTEXT\s+CATALOG)|(CREATE\s+FULLTEXT\s+INDEX)|(CREATE\s+FULLTEXT\s+STOPLIST)|(CREATE\s+FUNCTION)|(CREATE(?:\s+UNIQUE)?\s+INDEX)|(CREATE\s+LOGIN)|(CREATE\s+MASTER\s+KEY)|(CREATE\s+MESSAGE\s+TYPE)|(CREATE\s+PARTITION\s+FUNCTION)|(CREATE\s+PARTITION\s+SCHEME)|(CREATE\s+PROCEDURE)|(CREATE\s+QUEUE)|(CREATE\s+REMOTE\s+SERVICE\s+BINDING)|(CREATE\s+RESOURCE\s+POOL)|(CREATE\s+ROLE)|(CREATE\s+ROUTE)|(CREATE\s+RULE)|(CREATE\s+SCHEMA)|(CREATE\s+SERVER\s+AUDIT)|(CREATE\s+SERVER\s+AUDIT\s+SPECIFICATION)|(CREATE\s+SERVICE)|(CREATE\s+STATISTICS)|(CREATE\s+SYMMETRIC\s+KEY)|(CREATE\s+SYNONYM)|(CREATE\s+TABLE)|(CREATE\s+TRIGGER)|(CREATE\s+TYPE)|(CREATE\s+USER)|(CREATE\s+VIEW)|(CREATE\s+WORKLOAD\s+GROUP)|(CREATE\s+XML\s+SCHEMA\s+COLLECTION)|(DROP\s+AGGREGATE)|(DROP\s+APPLICATION\s+ROLE)|(DROP\s+ASSEMBLY)|(DROP\s+ASYMMETRIC\s+KEY)|(DROP\s+BROKER\s+PRIORITY)|(DROP\s+CERTIFICATE)|(DROP\s+CONTRACT)|(DROP\s+CREDENTIAL)|(DROP\s+CRYPTOGRAPHIC\s+PROVIDER)|(DROP\s+DATABASE)|(DROP\s+DATABASE\s+AUDIT\s+SPECIFICATION)|(DROP\s+DATABASE\s+ENCRYPTION\s+KEY)|(DROP\s+DEFAULT)|(DROP\s+ENDPOINT)|(DROP\s+EVENT\s+NOTIFICATION)|(DROP\s+EVENT\s+SESSION)|(DROP\s+FULLTEXT\s+CATALOG)|(DROP\s+FULLTEXT\s+INDEX)|(DROP\s+FULLTEXT\s+STOPLIST)|(DROP\s+FUNCTION)|(DROP\s+INDEX)|(DROP\s+LOGIN)|(DROP\s+MASTER\s+KEY)|(DROP\s+MESSAGE\s+TYPE)|(DROP\s+PARTITION\s+FUNCTION)|(DROP\s+PARTITION\s+SCHEME)|(DROP\s+PROCEDURE)|(DROP\s+QUEUE)|(DROP\s+REMOTE\s+SERVICE\s+BINDING)|(DROP\s+RESOURCE\s+POOL)|(DROP\s+ROLE)|(DROP\s+ROUTE)|(DROP\s+RULE)|(DROP\s+SCHEMA)|(DROP\s+SERVER\s+AUDIT)|(DROP\s+SERVER\s+AUDIT\s+SPECIFICATION)|(DROP\s+SERVICE)|(DROP\s+SIGNATURE)|(DROP\s+STATISTICS)|(DROP\s+SYMMETRIC\s+KEY)|(DROP\s+SYNONYM)|(DROP\s+TABLE)|(DROP\s+TRIGGER)|(DROP\s+TYPE)|(DROP\s+USER)|(DROP\s+VIEW)|(DROP\s+WORKLOAD\s+GROUP)|(DROP\s+XML\s+SCHEMA\s+COLLECTION)|(ALTER\s+APPLICATION\s+ROLE)|(ALTER\s+ASSEMBLY)|(ALTER\s+ASYMMETRIC\s+KEY)|(ALTER\s+AUTHORIZATION)|(ALTER\s+BROKER\s+PRIORITY)|(ALTER\s+CERTIFICATE)|(ALTER\s+CREDENTIAL)|(ALTER\s+CRYPTOGRAPHIC\s+PROVIDER)|(ALTER\s+DATABASE)|(ALTER\s+DATABASE\s+AUDIT\s+SPECIFICATION)|(ALTER\s+DATABASE\s+ENCRYPTION\s+KEY)|(ALTER\s+ENDPOINT)|(ALTER\s+EVENT\s+SESSION)|(ALTER\s+FULLTEXT\s+CATALOG)|(ALTER\s+FULLTEXT\s+INDEX)|(ALTER\s+FULLTEXT\s+STOPLIST)|(ALTER\s+FUNCTION)|(ALTER\s+INDEX)|(ALTER\s+LOGIN)|(ALTER\s+MASTER\s+KEY)|(ALTER\s+MESSAGE\s+TYPE)|(ALTER\s+PARTITION\s+FUNCTION)|(ALTER\s+PARTITION\s+SCHEME)|(ALTER\s+PROCEDURE)|(ALTER\s+QUEUE)|(ALTER\s+REMOTE\s+SERVICE\s+BINDING)|(ALTER\s+RESOURCE\s+GOVERNOR)|(ALTER\s+RESOURCE\s+POOL)|(ALTER\s+ROLE)|(ALTER\s+ROUTE)|(ALTER\s+SCHEMA)|(ALTER\s+SERVER\s+AUDIT)|(ALTER\s+SERVER\s+AUDIT\s+SPECIFICATION)|(ALTER\s+SERVICE)|(ALTER\s+SERVICE\s+MASTER\s+KEY)|(ALTER\s+SYMMETRIC\s+KEY)|(ALTER\s+TABLE)|(ALTER\s+TRIGGER)|(ALTER\s+USER)|(ALTER\s+VIEW)|(ALTER\s+WORKLOAD\s+GROUP)|(ALTER\s+XML\s+SCHEMA\s+COLLECTION))\b|\b(ABS|(ACOS)|(APPLOCK_MODE)|(APPLOCK_TEST)|(APP_NAME)|(ASCII)|(ASIN)|(ASSEMBLYPROPERTY)|(ASYMKEY_ID)|(ASYMKEYPROPERTY)|(ATAN)|(ATN2)|(AVG)|(BINARY_CHECKSUM )|(CAST|CONVERT)|(CEILING)|(CertProperty)|(Cert_ID)|(CHAR)|(CHARINDEX)|(CHECKSUM)|(CHECKSUM_AGG)|(COALESCE)|(COLLATIONPROPERTY)|(COL_LENGTH)|(COL_NAME)|(COLUMNPROPERTY)|(COLUMNS_UPDATED)|(CONNECTIONPROPERTY)|(CONTAINS)|(CONTAINSTABLE)|(CONTEXT_INFO)|(CONVERT)|(COS)|(COT)|(COUNT)|(COUNT_BIG)|(CRYPT_GEN_RANDOM)|(CURRENT_REQUEST_ID)|(CURRENT_TIMESTAMP)|(CURRENT_USER)|(CURSOR_STATUS)|(DATABASE_PRINCIPAL_ID)|(DATABASEPROPERTY)|(DATABASEPROPERTYEX)|(DATALENGTH)|(DATEADD)|(DATEDIFF)|(DATENAME)|(DATEPART)|(DAY)|(DB_ID)|(DB_NAME)|(DBCC)|(DECRYPTBYASYMKEY)|(DECRYPTBYCERT)|(DECRYPTBYKEY)|(DECRYPTBYKEYAUTOASYMKEY)|(DECRYPTBYKEYAUTOCERT)|(DECRYPTBYPASSPHRASE)|(DEGREES)|(DENSE_RANK)|(DIFFERENCE)|(ENCRYPTBYASYMKEY)|(ENCRYPTBYCERT)|(ENCRYPTBYKEY)|(ENCRYPTBYPASSPHRASE)|(ERROR_LINE)|(ERROR_MESSAGE)|(ERROR_NUMBER)|(ERROR_PROCEDURE)|(ERROR_SEVERITY)|(ERROR_STATE)|(EVENTDATA)|(EXP)|(FILE_ID)|(FILE_IDEX)|(FILE_NAME)|(FILEGROUP_ID)|(FILEGROUP_NAME)|(FILEGROUPPROPERTY)|(FILEPROPERTY)|(FLOOR)|(FORMATMESSAGE)|(FREETEXT)|(FREETEXTTABLE)|(FULLTEXTCATALOGPROPERTY)|(FULLTEXTSERVICEPROPERTY)|(GET_FILESTREAM_TRANSACTION_CONTEXT)|(GET_TRANSMISSION_STATUS)|(GETANSINULL)|(GETDATE)|(GETUTCDATE)|(GROUPING)|(GROUPING_ID)|(HAS_DBACCESS)|(HAS_PERMS_BY_NAME)|(HASHBYTES)|(HOST_ID)|(HOST_NAME)|(IDENT_CURRENT)|(IDENT_INCR)|(IDENT_SEED)|(INDEXKEY_PROPERTY)|(INDEXPROPERTY)|(INDEX_COL)|(IS_MEMBER)|(IS_OBJECTSIGNED)|(IS_SRVROLEMEMBER)|(ISDATE)|(ISNULL)|(ISNUMERIC)|(Key_GUID)|(Key_ID)|(KEY_NAME)|(LEFT)|(LEN)|(LOG)|(LOG10)|(LOGINPROPERTY)|(LOWER)|(LTRIM)|(MAX)|(MIN)|(MIN_ACTIVE_ROWVERSION)|(MONTH)|(NCHAR)|(NEWID)|(NEWSEQUENTIALID)|(NTILE)|(NULLIF)|(OBJECT_DEFINITION)|(OBJECT_ID)|(OBJECT_NAME)|(OBJECT_SCHEMA_NAME)|(OBJECTPROPERTY)|(OBJECTPROPERTYEX)|(OPENDATASOURCE)|(OPENQUERY)|(OPENROWSET)|(OPENXML)|(ORIGINAL_DB_NAME)|(ORIGINAL_LOGIN)|(PARSENAME)|(PathName)|(PATINDEX)|(PERMISSIONS)|(PI)|(POWER)|(PUBLISHINGSERVERNAME)|(PWDCOMPARE)|(PWDENCRYPT)|(QUOTENAME)|(RADIANS)|(RAISERROR)|(RAND)|(RANK)|(READTEXT)|(RECEIVE)|(RECONFIGURE)|(REPLACE)|(REPLICATE)|(REVERSE)|(RIGHT)|(ROUND)|(ROW_NUMBER)|(ROWCOUNT_BIG)|(RTRIM)|(SCHEMA_ID)|(SCHEMA_NAME)|(SCOPE_IDENTITY)|(SERVERPROPERTY)|(SESSION_USER)|(SESSIONPROPERTY)|(SETUSER)|(SIGN)|(SignByAsymKey)|(SignByCert)|(SIN)|(SOUNDEX)|(SPACE)|(SQL_VARIANT_PROPERTY)|(SQRT)|(SQUARE)|(STATS_DATE)|(STDEV)|(STDEVP)|(STR)|(STUFF)|(SUBSTRING)|(SUM)|(SUSER_ID)|(SUSER_NAME)|(SUSER_SID)|(SUSER_SNAME)|(SWITCHOFFSET)|(SYSDATETIME)|(SYSDATETIMEOFFSET)|(SYMKEYPROPERTY)|(SYSUTCDATETIME)|(SYSTEM_USER)|(TAN)|(TERTIARY_WEIGHTS)|(TEXTPTR)|(TEXTVALID)|(TODATETIMEOFFSET)|(TRIGGER_NESTLEVEL)|(TYPE_ID)|(TYPE_NAME)|(TYPEPROPERTY)|(UNICODE)|(UPDATE)|(UPPER)|(USER)|(USER_ID)|(USER_NAME)|(VARP)|(VerifySignedByCert)|(VerifySignedByAsymKey)|(xml)|(xml_schema_namespace)|(YEAR))(\s*\(|$)/gi; // collisions: IDENTITY



jush.tr.oracle = { sqlite_apo: /n?'/i, sqlite_quo: /"/, one: /--/, com: /\/\*/, num: /(?:\b[0-9]+\.?[0-9]*|\.[0-9]+)(?:e[+-]?[0-9]+)?[fd]?/i }; //! q'

jush.urls.oracle = ['https://download.oracle.com/docs/cd/B19306_01/server.102/b14200/$key',
	'statements_1003.htm', 'statements_1004.htm', 'statements_1005.htm', 'statements_1006.htm', 'statements_1007.htm', 'statements_1008.htm', 'statements_1009.htm', 'statements_1010.htm', 'statements_2001.htm', 'statements_2002.htm', 'statements_2003.htm', 'statements_2004.htm', 'statements_2005.htm', 'statements_2006.htm', 'statements_2007.htm', 'statements_2008.htm', 'statements_2009.htm', 'statements_2010.htm', 'statements_2011.htm', 'statements_2012.htm', 'statements_2013.htm', 'statements_3001.htm', 'statements_3002.htm', 'statements_4001.htm', 'statements_4002.htm', 'statements_4003.htm', 'statements_4004.htm', 'statements_4005.htm', 'statements_4006.htm', 'statements_4007.htm', 'statements_4008.htm', 'statements_4009.htm', 'statements_4010.htm', 'statements_5001.htm', 'statements_5002.htm', 'statements_5003.htm', 'statements_5004.htm', 'statements_5005.htm', 'statements_5006.htm', 'statements_5007.htm', 'statements_5008.htm', 'statements_5009.htm', 'statements_5010.htm', 'statements_5011.htm', 'statements_5012.htm', 'statements_6001.htm', 'statements_6002.htm', 'statements_6003.htm', 'statements_6004.htm', 'statements_6005.htm', 'statements_6006.htm', 'statements_6007.htm', 'statements_6008.htm', 'statements_6009.htm', 'statements_6010.htm', 'statements_6011.htm', 'statements_6012.htm', 'statements_6013.htm', 'statements_6014.htm', 'statements_6015.htm', 'statements_6016.htm', 'statements_7001.htm', 'statements_7002.htm', 'statements_7003.htm', 'statements_7004.htm', 'statements_8001.htm', 'statements_8002.htm', 'statements_8003.htm', 'statements_8004.htm', 'statements_8005.htm', 'statements_8006.htm', 'statements_8007.htm', 'statements_8008.htm', 'statements_8009.htm', 'statements_8010.htm', 'statements_8011.htm', 'statements_8012.htm', 'statements_8013.htm', 'statements_8014.htm', 'statements_8015.htm', 'statements_8016.htm', 'statements_8017.htm', 'statements_8018.htm', 'statements_8019.htm', 'statements_8020.htm', 'statements_8021.htm', 'statements_8022.htm', 'statements_8023.htm', 'statements_8024.htm', 'statements_8025.htm', 'statements_8026.htm', 'statements_8027.htm', 'statements_8028.htm', 'statements_9001.htm', 'statements_9002.htm', 'statements_9003.htm', 'statements_9004.htm', 'statements_9005.htm', 'statements_9006.htm', 'statements_9007.htm', 'statements_9008.htm', 'statements_9009.htm', 'statements_9010.htm', 'statements_9011.htm', 'statements_9012.htm', 'statements_9013.htm', 'statements_9014.htm', 'statements_9015.htm', 'statements_9016.htm', 'statements_9017.htm', 'statements_9018.htm', 'statements_9019.htm', 'statements_9020.htm', 'statements_9021.htm', 'statements_10001.htm', 'statements_10002.htm', 'statements_10003.htm', 'statements_10004.htm', 'statements_10005.htm', 'statements_10006.htm', 'statements_10007.htm',
	'functions002.htm', 'functions003.htm', 'functions004.htm', 'functions005.htm', 'functions006.htm', 'functions007.htm', 'functions008.htm', 'functions009.htm', 'functions010.htm', 'functions011.htm', 'functions012.htm', 'functions013.htm', 'functions014.htm', 'functions015.htm', 'functions016.htm', 'functions017.htm', 'functions018.htm', 'functions019.htm', 'functions020.htm', 'functions021.htm', 'functions022.htm', 'functions023.htm', 'functions024.htm', 'functions025.htm', 'functions026.htm', 'functions027.htm', 'functions028.htm', 'functions029.htm#i1279881', 'functions029.htm#i1281694', 'functions030.htm', 'functions031.htm', 'functions032.htm', 'functions033.htm', 'functions034.htm', 'functions035.htm', 'functions036.htm', 'functions037.htm', 'functions038.htm', 'functions039.htm', 'functions040.htm', 'functions041.htm', 'functions042.htm', 'functions043.htm', 'functions044.htm', 'functions045.htm', 'functions046.htm', 'functions047.htm', 'functions048.htm', 'functions049.htm', 'functions050.htm', 'functions052.htm', 'functions053.htm', 'functions054.htm', 'functions055.htm', 'functions056.htm', 'functions057.htm', 'functions058.htm', 'functions059.htm', 'functions060.htm', 'functions061.htm', 'functions062.htm', 'functions063.htm', 'functions064.htm', 'functions065.htm', 'functions066.htm', 'functions067.htm', 'functions068.htm', 'functions069.htm', 'functions070.htm', 'functions071.htm', 'functions072.htm', 'functions073.htm', 'functions074.htm', 'functions075.htm', 'functions076.htm', 'functions077.htm', 'functions078.htm', 'functions079.htm', 'functions080.htm', 'functions081.htm', 'functions082.htm', 'functions083.htm', 'functions084.htm', 'functions085.htm', 'functions086.htm', 'functions087.htm', 'functions088.htm', 'functions089.htm', 'functions090.htm', 'functions091.htm', 'functions092.htm', 'functions093.htm', 'functions094.htm', 'functions095.htm', 'functions096.htm', 'functions097.htm', 'functions098.htm', 'functions099.htm', 'functions100.htm', 'functions101.htm', 'functions102.htm', 'functions103.htm', 'functions104.htm', 'functions105.htm', 'functions106.htm', 'functions107.htm', 'functions108.htm', 'functions109.htm', 'functions110.htm', 'functions111.htm', 'functions112.htm', 'functions113.htm', 'functions114.htm', 'functions115.htm', 'functions116.htm', 'functions117.htm', 'functions118.htm', 'functions119.htm', 'functions120.htm', 'functions121.htm', 'functions122.htm', 'functions123.htm', 'functions124.htm', 'functions125.htm', 'functions126.htm', 'functions127.htm', 'functions128.htm', 'functions129.htm', 'functions130.htm', 'functions131.htm', 'functions132.htm', 'functions133.htm', 'functions134.htm', 'functions135.htm', 'functions137.htm', 'functions138.htm', 'functions139.htm', 'functions140.htm', 'functions141.htm', 'functions142.htm', 'functions143.htm', 'functions144.htm', 'functions145.htm', 'functions146.htm', 'functions147.htm', 'functions148.htm', 'functions149.htm', 'functions150.htm', 'functions151.htm', 'functions152.htm', 'functions153.htm', 'functions154.htm', 'functions155.htm', 'functions156.htm', 'functions157.htm#sthref2125', 'functions157.htm#sthref2129', 'functions157.htm#sthref2132', 'functions158.htm', 'functions159.htm', 'functions160.htm', 'functions161.htm', 'functions162.htm', 'functions163.htm', 'functions164.htm', 'functions165.htm', 'functions166.htm', 'functions167.htm', 'functions168.htm', 'functions169.htm', 'functions170.htm', 'functions171.htm', 'functions172.htm', 'functions173.htm', 'functions174.htm', 'functions175.htm', 'functions176.htm', 'functions177.htm', 'functions178.htm', 'functions179.htm', 'functions182.htm', 'functions183.htm', 'functions184.htm', 'functions185.htm', 'functions186.htm', 'functions187.htm', 'functions190.htm', 'functions191.htm', 'functions192.htm', 'functions193.htm', 'functions194.htm', 'functions195.htm', 'functions196.htm', 'functions198.htm', 'functions199.htm', 'functions200.htm', 'functions202.htm', 'functions203.htm', 'functions204.htm', 'functions205.htm', 'functions206.htm', 'functions207.htm', 'functions208.htm', 'functions209.htm', 'functions210.htm', 'functions211.htm', 'functions212.htm', 'functions213.htm', 'functions214.htm', 'functions215.htm', 'functions216.htm', 'functions217.htm', 'functions218.htm', 'functions219.htm', 'functions220.htm', 'functions221.htm', 'functions222.htm', 'functions223.htm', 'functions224.htm', 'functions225.htm', 'functions226.htm', 'functions227.htm', 'functions228.htm', 'functions229.htm'
];

jush.links2.oracle = /(\b)(ALTER\s+CLUSTER|(ALTER\s+DATABASE)|(ALTER\s+DIMENSION)|(ALTER\s+DISKGROUP)|(ALTER\s+FUNCTION)|(ALTER\s+INDEX)|(ALTER\s+INDEXTYPE)|(ALTER\s+JAVA)|(ALTER\s+MATERIALIZED\s+VIEW)|(ALTER\s+MATERIALIZED\s+VIEW\s+LOG)|(ALTER\s+OPERATOR)|(ALTER\s+OUTLINE)|(ALTER\s+PACKAGE)|(ALTER\s+PROCEDURE)|(ALTER\s+PROFILE)|(ALTER\s+RESOURCE\s+COST)|(ALTER\s+ROLE)|(ALTER\s+ROLLBACK\s+SEGMENT)|(ALTER\s+SEQUENCE)|(ALTER\s+SESSION)|(ALTER\s+SYSTEM)|(ALTER\s+TABLE)|(ALTER\s+TABLESPACE)|(ALTER\s+TRIGGER)|(ALTER\s+TYPE)|(ALTER\s+USER)|(ALTER\s+VIEW)|(ANALYZE)|(ASSOCIATE\s+STATISTICS)|(AUDIT)|(CALL)|(COMMENT)|(COMMIT)|(CREATE\s+CLUSTER)|(CREATE\s+CONTEXT)|(CREATE\s+CONTROLFILE)|(CREATE\s+DATABASE)|(CREATE\s+DATABASE\s+LINK)|(CREATE\s+DIMENSION)|(CREATE\s+DIRECTORY)|(CREATE\s+DISKGROUP)|(CREATE\s+FUNCTION)|(CREATE\s+INDEX)|(CREATE\s+INDEXTYPE)|(CREATE\s+JAVA)|(CREATE\s+LIBRARY)|(CREATE\s+MATERIALIZED\s+VIEW)|(CREATE\s+MATERIALIZED\s+VIEW\s+LOG)|(CREATE\s+OPERATOR)|(CREATE\s+OUTLINE)|(CREATE\s+PACKAGE)|(CREATE\s+PACKAGE\s+BODY)|(CREATE\s+PFILE)|(CREATE\s+PROCEDURE)|(CREATE\s+PROFILE)|(CREATE\s+RESTORE\s+POINT)|(CREATE\s+ROLE)|(CREATE\s+ROLLBACK\s+SEGMENT)|(CREATE\s+SCHEMA)|(CREATE\s+SEQUENCE)|(CREATE\s+SPFILE)|(CREATE\s+SYNONYM)|(CREATE\s+TABLE)|(CREATE\s+TABLESPACE)|(CREATE\s+TRIGGER)|(CREATE\s+TYPE)|(CREATE\s+TYPE\s+BODY)|(CREATE\s+USER)|(CREATE\s+VIEW)|(DELETE)|(DISASSOCIATE\s+STATISTICS)|(DROP\s+CLUSTER)|(DROP\s+CONTEXT)|(DROP\s+DATABASE)|(DROP\s+DATABASE\s+LINK)|(DROP\s+DIMENSION)|(DROP\s+DIRECTORY)|(DROP\s+DISKGROUP)|(DROP\s+FUNCTION)|(DROP\s+INDEX)|(DROP\s+INDEXTYPE)|(DROP\s+JAVA)|(DROP\s+LIBRARY)|(DROP\s+MATERIALIZED\s+VIEW)|(DROP\s+MATERIALIZED\s+VIEW\s+LOG)|(DROP\s+OPERATOR)|(DROP\s+OUTLINE)|(DROP\s+PACKAGE)|(DROP\s+PROCEDURE)|(DROP\s+PROFILE)|(DROP\s+RESTORE\s+POINT)|(DROP\s+ROLE)|(DROP\s+ROLLBACK\s+SEGMENT)|(DROP\s+SEQUENCE)|(DROP\s+SYNONYM)|(DROP\s+TABLE)|(DROP\s+TABLESPACE)|(DROP\s+TRIGGER)|(DROP\s+TYPE)|(DROP\s+TYPE\s+BODY)|(DROP\s+USER)|(DROP\s+VIEW)|(EXPLAIN\s+PLAN)|(FLASHBACK\s+DATABASE)|(FLASHBACK\s+TABLE)|(GRANT)|(INSERT)|(LOCK\s+TABLE)|(MERGE)|(NOAUDIT)|(PURGE)|(RENAME)|(REVOKE)|(ROLLBACK)|(SAVEPOINT)|(SELECT)|(SET\s+CONSTRAINTS?)|(SET\s+ROLE)|(SET\s+TRANSACTION)|(TRUNCATE)|(UPDATE)|(abs)|(acos)|(add_months)|(appendchildxml)|(asciistr)|(ascii)|(asin)|(atan)|(atan2)|(avg)|(bfilename)|(bin_to_num)|(bitand)|(cardinality)|(cast)|(ceil)|(chartorowid)|(chr)|(cluster_id)|(cluster_probability)|(cluster_set)|(coalesce)|(collect)|(compose)|(concat)|(convert)|(corr)|(corr_s)|(corr_k)|(cos)|(cosh)|(count)|(covar_pop)|(covar_samp)|(cume_dist)|(current_date)|(current_timestamp)|(cv)|(dbtimezone)|(decode)|(decompose)|(deletexml)|(dense_rank)|(depth)|(deref)|(dump)|(empty_[bc]lob)|(existsnode)|(exp)|(extract)|(extractvalue)|(feature_id)|(feature_set)|(feature_value)|(first)|(first_value)|(floor)|(from_tz)|(greatest)|(group_id)|(grouping)|(grouping_id)|(hextoraw)|(initcap)|(insertchildxml)|(insertxmlbefore)|(instr)|(iteration_number)|(lag)|(last)|(last_day)|(last_value)|(lead)|(least)|(length)|(ln)|(lnnvl)|(localtimestamp)|(log)|(lower)|(lpad)|(ltrim)|(make_ref)|(max)|(median)|(min)|(mod)|(months_between)|(nanvl)|(nchr)|(new_time)|(next_day)|(nls_charset_decl_len)|(nls_charset_id)|(nls_charset_name)|(nls_initcap)|(nls_lower)|(nlssort)|(nls_upper)|(ntile)|(nullif)|(numtodsinterval)|(numtoyminterval)|(nvl)|(nvl2)|(ora_hash)|(path)|(percent_rank)|(percentile_cont)|(percentile_disc)|(power)|(powermultiset)|(powermultiset_by_cardinality)|(prediction)|(prediction_cost)|(prediction_details)|(prediction_probability)|(prediction_set)|(presentnnv)|(presentv)|(previous)|(rank)|(ratio_to_report)|(rawtohex)|(rawtonhex)|(ref)|(reftohex)|(regexp_instr)|(regexp_replace)|(regexp_substr)|(regr_(?:slope|intercept|count|r2|avgx|avgy|sxx|syy|sxy))|(remainder)|(replace)|(round)|(row_number)|(rowidtochar)|(rowidtonchar)|(rpad)|(rtrim)|(scn_to_timestamp)|(sessiontimezone)|(set)|(sign)|(sin)|(sinh)|(soundex)|(sqrt)|(stats_binomial_test)|(stats_crosstab)|(stats_f_test)|(stats_ks_test)|(stats_mode)|(stats_mw_test)|(stats_one_way_anova)|(stats_t_test_one)|(stats_t_test_paired)|(stats_t_test_indepu?)|(stats_wsr_test)|(stddev)|(stddev_pop)|(stddev_samp)|(substr)|(sum)|(sys_connect_by_path)|(sys_context)|(sys_dburigen)|(sys_extract_utc)|(sys_guid)|(sys_typeid)|(sys_xmlagg)|(sys_xmlgen)|(sysdate)|(systimestamp)|(tan)|(tanh)|(timestamp_to_scn)|(to_binary_double)|(to_binary_float)|(to_char)|(to_clob)|(to_date)|(to_dsinterval)|(to_lob)|(to_multi_byte)|(to_nchar)|(to_nclob)|(to_number)|(to_single_byte)|(to_timestamp)|(to_timestamp_tz)|(to_yminterval)|(translate)|(treat)|(trim)|(trunc)|(tz_offset)|(uid)|(unistr)|(updatexml)|(upper)|(user)|(userenv)|(value)|(var_pop)|(var_samp)|(variance)|(vsize)|(width_bucket)|(xmlagg)|(xmlcdata)|(xmlcolattval)|(xmlcomment)|(xmlconcat)|(xmlelement)|(xmlforest)|(xmlparse)|(xmlpi)|(xmlquery)|(xmlroot)|(xmlsequence)|(xmlserialize)|(xmltable)|(xmltransform))(\b)/gi; // collisions: IDENTITY, extract, round, to_char, to_nchar, translate, trunc



jush.tr.pgsql = { sql_apo: /'/, sqlite_quo: /"/, pgsql_eot: /\$/, one: /--/, com_nest: /\/\*/, pgsql_pgsqlset: /(\b)(SHOW|SET)(\s+)/i, num: jush.num }; // standard_conforming_strings=off
jush.tr.pgsql_eot = { pgsql_eot2: /([a-z]\w*)?\$/i, _1: /()/ };
jush.tr.pgsql_eot2 = { }; // pgsql_eot2._2 to be set in pgsql_eot handler
jush.tr.pgsql_pgsqlset = { sql_apo: /'/, sqlite_quo: /"/, pgsql_eot: /\$/, one: /--/, com_nest: /\/\*/, num: jush.num, _1: /;|$/ };
jush.tr.pgsqlset = { _0: /$/ };

jush.urls.pgsql_pgsqlset = 'https://www.postgresql.org/docs/current/static/$key';
jush.urls.pgsql = ['https://www.postgresql.org/docs/current/static/$key',
	'sql-$1.html', 'sql-$1.html', 'sql-alteropclass.html', 'sql-createopclass.html', 'sql-dropopclass.html',
	'functions-datetime.html', 'functions-info.html', 'functions-logical.html', 'functions-comparison.html', 'functions-matching.html', 'functions-conditional.html', 'functions-subquery.html',
	'',
	'functions-math.html', 'functions-string.html', 'functions-binarystring.html', 'functions-formatting.html', 'functions-datetime.html', 'functions-geometry.html', 'functions-net.html', 'functions-sequence.html', 'functions-array.html', 'functions-aggregate.html', 'functions-srf.html', 'functions-info.html', 'functions-admin.html'
];
jush.urls.pgsqlset = ['https://www.postgresql.org/docs/current/static/runtime-config-$key.html#GUC-$1',
	'autovacuum', 'client', 'compatible', 'connection', 'custom', 'developer', 'file-locations', 'locks', 'logging', 'preset', 'query', 'resource', 'statistics', 'wal'
];

jush.links.pgsql_pgsqlset = { 'sql-$val.html': /.+/ };

jush.links2.pgsql = /(\b)(COMMIT\s+PREPARED|CREATE\s+ACCESS\s+METHOD|DROP\s+ACCESS\s+METHOD|DROP\s+OWNED|PREPARE\s+TRANSACTION|REASSIGN\s+OWNED|RELEASE\s+SAVEPOINT|ROLLBACK\s+PREPARED|SECURITY\s+LABEL|SET\s+CONSTRAINTS|SET\s+ROLE|SET\s+SESSION\s+AUTHORIZATION|SET\s+TRANSACTION|START\s+TRANSACTION|(ABORT|ALTER\s+AGGREGATE|ALTER\s+COLLATION|ALTER\s+CONVERSION|ALTER\s+DATABASE|ALTER\s+DEFAULT\s+PRIVILEGES|ALTER\s+DOMAIN|ALTER\s+EVENT\s+TRIGGER|ALTER\s+EXTENSION|ALTER\s+FOREIGN\s+DATA\s+WRAPPER|ALTER\s+FOREIGN\s+TABLE|ALTER\s+FUNCTION|ALTER\s+GROUP|ALTER\s+INDEX|ALTER\s+LANGUAGE|ALTER\s+LARGE\s+OBJECT|ALTER\s+MATERIALIZED\s+VIEW|ALTER\s+OPERATOR|ALTER\s+POLICY|ALTER\s+PROCEDURE|ALTER\s+PUBLICATION|ALTER\s+ROLE|ALTER\s+ROUTINE|ALTER\s+RULE|ALTER\s+SCHEMA|ALTER\s+SEQUENCE|ALTER\s+SERVER|ALTER\s+STATISTICS|ALTER\s+SUBSCRIPTION|ALTER\s+SYSTEM|ALTER\s+TABLE|ALTER\s+TABLESPACE|ALTER\s+TRIGGER|ALTER\s+TYPE|ALTER\s+USER(?:\s+MAPPING)?|ALTER\s+VIEW|ANALYZE|BEGIN|CALL|CHECKPOINT|CLOSE|CLUSTER|COMMENT|COMMIT|COPY|CREATE\s+AGGREGATE|CREATE\s+CAST|CREATE\s+COLLATION|CREATE\s+CONVERSION|CREATE\s+DATABASE|CREATE\s+DOMAIN|CREATE\s+EVENT\s+TRIGGER|CREATE\s+EXTENSION|CREATE\s+FOREIGN\s+DATA\s+WRAPPER|CREATE\s+FOREIGN\s+TABLE|CREATE\s+FUNCTION|CREATE\s+GROUP|CREATE\s+INDEX|CREATE\s+LANGUAGE|CREATE\s+MATERIALIZED\s+VIEW|CREATE\s+OPERATOR|CREATE\s+POLICY|CREATE\s+PROCEDURE|CREATE\s+PUBLICATION|CREATE\s+ROLE|CREATE\s+RULE|CREATE\s+SCHEMA|CREATE\s+SEQUENCE|CREATE\s+SERVER|CREATE\s+STATISTICS|CREATE\s+SUBSCRIPTION|CREATE\s+TABLE(?:\s+AS)?|CREATE\s+TABLESPACE|CREATE\s+TRANSFORM|CREATE\s+TRIGGER|CREATE\s+TYPE|CREATE\s+USER(?:\s+MAPPING)?|CREATE\s+VIEW|DEALLOCATE|DECLARE|DELETE|DISCARD|DO|DROP\s+AGGREGATE|DROP\s+CAST|DROP\s+COLLATION|DROP\s+CONVERSION|DROP\s+DATABASE|DROP\s+DOMAIN|DROP\s+EVENT\s+TRIGGER|DROP\s+EXTENSION|DROP\s+FOREIGN\s+DATA\s+WRAPPER|DROP\s+FOREIGN\s+TABLE|DROP\s+FUNCTION|DROP\s+GROUP|DROP\s+INDEX|DROP\s+LANGUAGE|DROP\s+MATERIALIZED\s+VIEW|DROP\s+OPERATOR|DROP\s+POLICY|DROP\s+PROCEDURE|DROP\s+PUBLICATION|DROP\s+ROLE|DROP\s+ROUTINE|DROP\s+RULE|DROP\s+SCHEMA|DROP\s+SEQUENCE|DROP\s+SERVER|DROP\s+STATISTICS|DROP\s+SUBSCRIPTION|DROP\s+TABLE|DROP\s+TABLESPACE|DROP\s+TRANSFORM|DROP\s+TRIGGER|DROP\s+TYPE|DROP\s+USER(?:\s+MAPPING)?|DROP\s+VIEW|END|EXECUTE|EXPLAIN|FETCH|GRANT|IMPORT\s+FOREIGN\s+SCHEMA|INSERT|LISTEN|LOAD|LOCK|MERGE|MOVE|NOTIFY|PREPARE|REFRESH\s+MATERIALIZED\s+VIEW|REINDEX|RESET|REVOKE|ROLLBACK(?:\s+TO)?|SAVEPOINT|SELECT|SELECT\s+INTO|SET|SHOW|TRUNCATE|UNLISTEN|UPDATE|VACUUM|VALUES)|(ALTER\s+OPERATOR\s+CLASS)|(CREATE\s+OPERATOR\s+CLASS)|(DROP\s+OPERATOR\s+CLASS)|(current_date|current_time|current_timestamp|localtime|localtimestamp|AT\s+TIME\s+ZONE)|(current_user|session_user|user)|(AND|NOT|OR)|(BETWEEN)|(LIKE|SIMILAR\s+TO)|(CASE|WHEN|THEN|ELSE|coalesce|nullif|greatest|least)|(EXISTS|IN|ANY|SOME|ALL)|(ANALYSE|ARRAY|AS|ASC|ASYMMETRIC|AUTHORIZATION|BINARY|BOTH|CAST|CHECK|COLLATE|COLLATION|COLUMN|CONCURRENTLY|CONSTRAINT|CREATE|CROSS|CURRENT_CATALOG|CURRENT_DATE|CURRENT_ROLE|CURRENT_SCHEMA|CURRENT_TIME|CURRENT_TIMESTAMP|CURRENT_USER|DEFAULT|DEFERRABLE|DESC|DISTINCT|EXCEPT|FALSE|FOR|FOREIGN|FREEZE|FROM|FULL|GROUP|HAVING|ILIKE|INITIALLY|INNER|INTERSECT|INTO|IS|ISNULL|JOIN|LATERAL|LEADING|LEFT|LIMIT|LOCALTIME|LOCALTIMESTAMP|NATURAL|NOTNULL|NULL|OFFSET|ON|ONLY|ORDER|OUTER|OVERLAPS|PLACING|PRIMARY|REFERENCES|RETURNING|RIGHT|SESSION_USER|SIMILAR|SYMMETRIC|SYSTEM_USER|TABLE|TABLESAMPLE|TO|TRAILING|TRUE|UNION|UNIQUE|USER|USING|VARIADIC|VERBOSE|WHERE|WINDOW|WITH))\b|\b(abs|cbrt|ceil|ceiling|degrees|exp|floor|ln|log|mod|pi|power|radians|random|round|setseed|sign|sqrt|trunc|width_bucket|acos|asin|atan|atan2|cos|cot|sin|tan|(bit_length|char_length|convert|lower|octet_length|overlay|position|substring|trim|upper|ascii|btrim|chr|decode|encode|initcap|length|lpad|ltrim|md5|pg_client_encoding|quote_ident|quote_literal|regexp_replace|repeat|replace|rpad|rtrim|split_part|strpos|substr|to_ascii|to_hex|translate)|(get_bit|get_byte|set_bit|set_byte|md5)|(to_char|to_date|to_number|to_timestamp)|(age|clock_timestamp|date_part|date_trunc|extract|isfinite|justify_days|justify_hours|justify_interval|now|statement_timestamp|timeofday|transaction_timestamp)|(area|center|diameter|height|isclosed|isopen|npoints|pclose|popen|radius|width|box|circle|lseg|path|point|polygon)|(abbrev|broadcast|family|host|hostmask|masklen|netmask|network|set_masklen|text|trunc)|(currval|nextval|setval)|(array_append|array_cat|array_dims|array_lower|array_prepend|array_to_string|array_upper|string_to_array)|(avg|bit_and|bit_or|bool_and|bool_or|count|every|max|min|sum|corr|covar_pop|covar_samp|regr_avgx|regr_avgy|regr_count|regr_intercept|regr_r2|regr_slope|regr_sxx|regr_sxy|regr_syy|stddev|stddev_pop|stddev_samp|variance|var_pop|var_samp)|(generate_series)|(current_database|current_schema|current_schemas|inet_client_addr|inet_client_port|inet_server_addr|inet_server_port|pg_my_temp_schema|pg_is_other_temp_schema|pg_postmaster_start_time|version|has_database_privilege|has_function_privilege|has_language_privilege|has_schema_privilege|has_table_privilege|has_tablespace_privilege|pg_has_role|pg_conversion_is_visible|pg_function_is_visible|pg_operator_is_visible|pg_opclass_is_visible|pg_table_is_visible|pg_type_is_visible|format_type|pg_get_constraintdef|pg_get_expr|pg_get_indexdef|pg_get_ruledef|pg_get_serial_sequence|pg_get_triggerdef|pg_get_userbyid|pg_get_viewdef|pg_tablespace_databases|col_description|obj_description|shobj_description)|(current_setting|set_config|pg_cancel_backend|pg_reload_conf|pg_rotate_logfile|pg_start_backup|pg_stop_backup|pg_switch_xlog|pg_current_xlog_location|pg_current_xlog_insert_location|pg_xlogfile_name_offset|pg_xlogfile_name|pg_column_size|pg_database_size|pg_relation_size|pg_size_pretty|pg_tablespace_size|pg_total_relation_size|pg_ls_dir|pg_read_file|pg_stat_file|pg_advisory_lock|pg_advisory_lock_shared|pg_try_advisory_lock|pg_try_advisory_lock_shared|pg_advisory_unlock|pg_advisory_unlock_shared|pg_advisory_unlock_all))(\s*\(|$)/gi; // collisions: IN, ANY, SOME, ALL (array), trunc, md5, abbrev
jush.links2.pgsqlset = /(\b)(autovacuum|log_autovacuum_min_duration|autovacuum_max_workers|autovacuum_naptime|autovacuum_vacuum_threshold|autovacuum_analyze_threshold|autovacuum_vacuum_scale_factor|autovacuum_analyze_scale_factor|autovacuum_freeze_max_age|autovacuum_vacuum_cost_delay|autovacuum_vacuum_cost_limit|(search_path|default_tablespace|temp_tablespaces|check_function_bodies|default_transaction_isolation|default_transaction_read_only|session_replication_role|statement_timeout|vacuum_freeze_table_age|vacuum_freeze_min_age|xmlbinary|xmloption|datestyle|intervalstyle|timezone|timezone_abbreviations|extra_float_digits|client_encoding|lc_messages|lc_monetary|lc_numeric|lc_time|default_text_search_config|dynamic_library_path|gin_fuzzy_search_limit|local_preload_libraries)|(add_missing_from|array_nulls|backslash_quote|default_with_oids|escape_string_warning|regex_flavor|sql_inheritance|standard_conforming_strings|synchronize_seqscans|transform_null_equals)|(listen_addresses|port|max_connections|superuser_reserved_connections|unix_socket_directory|unix_socket_group|unix_socket_permissions|bonjour_name|tcp_keepalives_idle|tcp_keepalives_interval|tcp_keepalives_count|authentication_timeout|ssl|ssl_renegotiation_limit|ssl_ciphers|password_encryption|krb_server_keyfile|krb_srvname|krb_caseins_users|db_user_namespace)|(custom_variable_classes)|(allow_system_table_mods|debug_assertions|ignore_system_indexes|post_auth_delay|pre_auth_delay|trace_notify|trace_sort|wal_debug|zero_damaged_pages)|(data_directory|config_file|hba_file|ident_file|external_pid_file)|(deadlock_timeout|max_locks_per_transaction)|(log_destination|logging_collector|log_directory|log_filename|log_rotation_age|log_rotation_size|log_truncate_on_rotation|syslog_facility|syslog_ident|silent_mode|client_min_messages|log_min_messages|log_error_verbosity|log_min_error_statement|log_min_duration_statement|log_checkpoints|log_connections|log_disconnections|log_duration|log_hostname|log_line_prefix|log_lock_waits|log_statement|log_temp_files|log_timezone)|(block_size|integer_datetimes|lc_collate|lc_ctype|max_function_args|max_identifier_length|max_index_keys|segment_size|server_encoding|server_version|server_version_num|wal_block_size|wal_segment_size)|(enable_bitmapscan|enable_hashagg|enable_hashjoin|enable_indexscan|enable_mergejoin|enable_nestloop|enable_seqscan|enable_sort|enable_tidscan|seq_page_cost|random_page_cost|cpu_tuple_cost|cpu_index_tuple_cost|cpu_operator_cost|effective_cache_size|geqo|geqo_threshold|geqo_effort|geqo_pool_size|geqo_generations|geqo_selection_bias|default_statistics_target|constraint_exclusion|cursor_tuple_fraction|from_collapse_limit|join_collapse_limit)|(shared_buffers|temp_buffers|max_prepared_transactions|work_mem|maintenance_work_mem|max_stack_depth|max_files_per_process|shared_preload_libraries|vacuum_cost_delay|vacuum_cost_page_hit|vacuum_cost_page_miss|vacuum_cost_page_dirty|vacuum_cost_limit|bgwriter_delay|bgwriter_lru_maxpages|bgwriter_lru_multiplier|effective_io_concurrency)|(track_activities|track_activity_query_size|track_counts|track_functions|update_process_title|stats_temp_directory)|(fsync|synchronous_commit|wal_sync_method|full_page_writes|wal_buffers|wal_writer_delay|commit_delay|commit_siblings|checkpoint_segments|checkpoint_timeout|checkpoint_completion_target|checkpoint_warning|archive_mode|archive_command|archive_timeout))(\b)/gi;



(function () {
	var sql_function = 'mysql_db_query|mysql_query|mysql_unbuffered_query|mysqli_master_query|mysqli_multi_query|mysqli_query|mysqli_real_query|mysqli_rpl_query_type|mysqli_send_query|mysqli_stmt_prepare';
	var sqlite_function = 'sqlite_query|sqlite_unbuffered_query|sqlite_single_query|sqlite_array_query|sqlite_exec';
	var pgsql_function = 'pg_prepare|pg_query|pg_query_params|pg_send_prepare|pg_send_query|pg_send_query_params';
	var mssql_function = 'mssql_query|sqlsrv_prepare|sqlsrv_query';
	var oracle_function = 'oci_parse';
	var php_function = 'eval|create_function|assert|classkit_method_add|classkit_method_redefine|runkit_function_add|runkit_function_redefine|runkit_lint|runkit_method_add|runkit_method_redefine'
		+ '|array_filter|array_map|array_reduce|array_walk|array_walk_recursive|call_user_func|call_user_func_array|ob_start|sqlite_create_function|is_callable' // callback parameter with possible call of builtin function
	;
	var php_class = /AllowDynamicProperties|Attribute|Deprecated|Override|Closure|Error|ErrorException|Exception|Fiber|FiberError|InternalIterator|ReturnTypeWillChange|SensitiveParameter|SensitiveParameterValue|WeakReference|ArgumentCountError|ArithmeticError|ArrayAccess|AssertionError|BackedEnum|ClosedGeneratorException|CompileError|Countable|DivisionByZeroError|Generator|Iterator|IteratorAggregate|ParseError|__PHP_Incomplete_Class|RequestParseBodyException|Serializable|stdClass|Stringable|Throwable|Traversable|TypeError|UnhandledMatchError|UnitEnum|ValueError|WeakMap|DateInterval|DatePeriod|DatePeriod|DateTime|DateError|DateException|DateInvalidOperationException|DateInvalidTimeZoneException|DateMalformedIntervalStringException|DateMalformedPeriodStringException|DateMalformedStringException|DateObjectError|DateRangeError|DateTimeImmutable|DateTimeInterface|DateTimeZone|Directory|HashContext|JsonException|JsonSerializable|Random\\Engine\\Mt19937|Random\\Engine\\PcgOneseq128XslRr64|Random\\Engine\\Xoshiro256StarStar|Random\\Randomizer|Random\\BrokenRandomEngineError|Random\\CryptoSafeEngine|Random\\Engine\\Secure|Random\\Engine|Random\\RandomError|Random\\RandomException|ReflectionAttribute|ReflectionClass|ReflectionClassConstant|ReflectionConstant|ReflectionEnum|ReflectionEnumBackedCase|ReflectionEnumUnitCase|ReflectionExtension|ReflectionFiber|ReflectionFunction|ReflectionGenerator|ReflectionMethod|ReflectionMethod|ReflectionObject|ReflectionParameter|ReflectionProperty|ReflectionReference|ReflectionZendExtension|Reflection|ReflectionException|ReflectionFunctionAbstract|ReflectionIntersectionType|ReflectionNamedType|ReflectionType|ReflectionUnionType|Reflector|AppendIterator|ArrayIterator|ArrayObject|CachingIterator|CallbackFilterIterator|DirectoryIterator|FilesystemIterator|FilterIterator|GlobIterator|InfiniteIterator|IteratorIterator|LimitIterator|MultipleIterator|NoRewindIterator|ParentIterator|RecursiveCachingIterator|RecursiveCallbackFilterIterator|RecursiveDirectoryIterator|RecursiveFilterIterator|RecursiveIteratorIterator|RecursiveRegexIterator|RecursiveTreeIterator|RegexIterator|SplFileInfo|SplFileObject|SplFixedArray|SplTempFileObject|BadFunctionCallException|BadMethodCallException|DomainException|EmptyIterator|InvalidArgumentException|LengthException|LogicException|OuterIterator|OutOfBoundsException|OutOfRangeException|OverflowException|RangeException|RecursiveArrayIterator|RecursiveIterator|RuntimeException|SeekableIterator|SplDoublyLinkedList|SplHeap|SplMaxHeap|SplMinHeap|SplObjectStorage|SplObserver|SplPriorityQueue|SplQueue|SplStack|SplSubject|UnderflowException|UnexpectedValueException|streamWrapper|php_user_filter|StreamBucket|BcMath\\Number|com|COMPersistHelper|dotnet|variant|com_exception|com_safearray_proxy|Dba\\Connection|FFI|FFI\\CData|FFI\\CType|FFI\\Exception|FFI\\ParserException|FFI|finfo|FTP\\Connection|GdFont|GdImage|Collator|IntlBreakIterator|IntlCalendar|IntlGregorianCalendar|IntlGregorianCalendar|IntlGregorianCalendar|IntlRuleBasedBreakIterator|IntlTimeZone|Spoofchecker|Transliterator|UConverter|IntlDateFormatter|IntlChar|IntlCodePointBreakIterator|IntlDatePatternGenerator|IntlException|IntlIterator|IntlPartsIterator|Locale|MessageFormatter|Normalizer|NumberFormatter|ResourceBundle|PDO|PDOException|PDORow|PDOStatement|Phar|PharData|PharFileInfo|PharException|SysvMessageQueue|SysvSemaphore|SysvSharedMemory|SessionHandler|SessionHandlerInterface|SessionIdInterface|SessionUpdateTimestampHandlerInterface|Shmop|AddressInfo|Socket|SQLite3|SQLite3Result|SQLite3Stmt|SQLite3Exception|PhpToken|DeflateContext|InflateContext|CURLStringFile|CURLFile|CurlHandle|CurlMultiHandle|CurlShareHandle|CurlSharePersistentHandle|DOMAttr|DOMCdataSection|DOMComment|DOMDocument|DOMDocumentFragment|DOMElement|DOMEntityReference|DOMImplementation|DOMProcessingInstruction|DOMText|DOMXPath|DOMCharacterData|DOMChildNode|DOMDocumentType|DOMEntity|DOMException|DOMNamedNodeMap|DOMNameSpaceNode|DOMNode|DOMNodeList|DOMNotation|DOMParentNode|Dom\\Attr|Dom\\CDATASection|Dom\\CharacterData|Dom\\ChildNode|Dom\\Comment|Dom\\Document|Dom\\DocumentFragment|Dom\\DocumentType|Dom\\DtdNamedNodeMap|Dom\\Element|Dom\\Entity|Dom\\EntityReference|Dom\\HTMLCollection|Dom\\HTMLDocument|Dom\\HTMLElement|Dom\\Implementation|Dom\\NamedNodeMap|Dom\\NamespaceInfo|Dom\\Node|Dom\\NodeList|Dom\\Notation|Dom\\ParentNode|Dom\\ProcessingInstruction|Dom\\Text|Dom\\TokenList|Dom\\XMLDocument|Dom\\XPath|EnchantBroker|EnchantDictionary|GMP|LDAP\\Connection|LDAP\\Result|LDAP\\ResultEntry|LibXMLError|mysqli_result|mysqli_stmt|mysqli_warning|mysqli|mysqli_driver|mysqli_sql_exception|OpenSSLAsymmetricKey|OpenSSLCertificate|OpenSSLCertificateSigningRequest|Pdo\\Dblib|Pdo\\Firebird|Pdo\\Mysql|Pdo\\Odbc|Pdo\\Pgsql|Pdo\\Sqlite|PgSql\\Connection|PgSql\\Lob|PgSql\\Result|SimpleXMLElement|SimpleXMLIterator|SNMP|SNMPException|SoapClient|SoapFault|SoapHeader|SoapParam|SoapServer|SoapVar|SodiumException|tidy|tidyNode|XMLParser|XMLReader|XMLWriter|XSLTProcessor|ZipArchive/;

	jush.tr.php = { php_echo: /=/, php2: /()/ };
	jush.tr.php2 = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_doc: /\/\*\*/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_new: /(\b)(new|instanceof|extends|class|implements|interface)(\b\s*)/i, php_met: /()([\w\u007F-\uFFFF\\]+)(::)/, php_fun: /()(\bfunction\b|->|::)(\s*)/i, php_php: new RegExp('(\\b)(' + php_function + ')(\\s*\\(|$)', 'i'), php_sql: new RegExp('(\\b)(' + sql_function + ')(\\s*\\(|$)', 'i'), php_sqlite: new RegExp('(\\b)(' + sqlite_function + ')(\\s*\\(|$)', 'i'), php_pgsql: new RegExp('(\\b)(' + pgsql_function + ')(\\s*\\(|$)', 'i'), php_oracle: new RegExp('(\\b)(' + oracle_function + ')(\\s*\\(|$)', 'i'), php_echo: /(\b)(echo|print)\b/i, php_halt: /(\b)(__halt_compiler)(\s*\(\s*\)|$)/i, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, num: jush.num, php_phpini: /(\b)(ini_get|ini_set)(\s*\(|$)/i, php_http: /(\b)(header)(\s*\(|$)/i, php_mail: /(\b)(mail)(\s*\(|$)/i, _2: /\?>|<\/script>/i }; //! matches ::echo
	jush.tr.php_quo_var = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_new: /(\b)(new|instanceof|extends|class|implements|interface)(\b\s*)/i, php_met: /()([\w\u007F-\uFFFF\\]+)(::)/, php_fun: /()(\bfunction\b|->|::)(\s*)/i, php_php: new RegExp('(\\b)(' + php_function + ')(\\s*\\(|$)', 'i'), php_sql: new RegExp('(\\b)(' + sql_function + ')(\\s*\\(|$)', 'i'), php_sqlite: new RegExp('(\\b)(' + sqlite_function + ')(\\s*\\(|$)', 'i'), php_pgsql: new RegExp('(\\b)(' + pgsql_function + ')(\\s*\\(|$)', 'i'), php_oracle: new RegExp('(\\b)(' + oracle_function + ')(\\s*\\(|$)', 'i'), _1: /}/ };
	jush.tr.php_echo = { php_quo: /b?"/i, php_apo: /b?'/i, php_bac: /`/, php_one: /\/\/|#/, php_com: /\/\*/, php_eot: /<<<[ \t]*/, php_new: /(\b)(new|instanceof|extends|class|implements|interface)(\b\s*)/i, php_met: /()([\w\u007F-\uFFFF\\]+)(::)/, php_fun: /()(\bfunction\b|->|::)(\s*)/i, php_php: new RegExp('(\\b)(' + php_function + ')(\\s*\\(|$)', 'i'), php_sql: new RegExp('(\\b)(' + sql_function + ')(\\s*\\(|$)', 'i'), php_sqlite: new RegExp('(\\b)(' + sqlite_function + ')(\\s*\\(|$)', 'i'), php_pgsql: new RegExp('(\\b)(' + pgsql_function + ')(\\s*\\(|$)', 'i'), php_oracle: new RegExp('(\\b)(' + oracle_function + ')(\\s*\\(|$)', 'i'), php_echo: /\(/, php_var: /()(\$[\w\u007F-\uFFFF]+)()/, num: jush.num, php_phpini: /(\b)(ini_get|ini_set)(\s*\(|$)/i, _1: /\)|;|(?=\?>|<\/script>)/i };
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
	jush.urls.php_mssql = 'https://msdn.microsoft.com/library/$key.aspx';
	jush.urls.php_oracle = 'https://www.php.net/$key.$val';
	jush.urls.php_echo = 'https://www.php.net/$key.$val';
	jush.urls.php_phpini = 'https://www.php.net/$key.$val';
	jush.urls.php_http = 'https://www.php.net/$key.$val';
	jush.urls.php_mail = 'https://www.php.net/$key.$val';
	jush.urls.php_met = 'https://www.php.net/$key';
	jush.urls.php_halt = 'https://www.php.net/$key.halt-compiler';
	jush.urls.php2 = ['https://www.php.net/$key',
		'function.$1', 'control-structures.alternative-syntax', 'control-structures.$1', 'control-structures.do.while', 'control-structures.foreach', 'control-structures.switch', 'keyword.class', 'language.constants.magic', 'language.exceptions', 'language.oop5.$1', 'language.oop5.cloning', 'language.oop5.constants', 'language.oop5.visibility', 'language.operators.logical', 'language.variables.scope#language.variables.scope.$1', 'language.namespaces', 'language.oop5.traits', 'language.generators.syntax#control-structures.yield', 'language.generators.syntax#control-structures.yield.from', 'language.types.callable', 'functions.arrow', 'language.oop5.traits#language.oop5.traits.conflict', 'control-structures.match', 'language.oop5.properties#language.oop5.properties.readonly-properties', 'language.types.$1', 'language.types.integer', 'language.types.boolean', 'language.types.singleton', 'language.types.relative-class-types', 'language.types.enumerations', 'language.types.numeric-strings',
		'function.$1'
	];
	jush.urls.php_new = ['https://www.php.net/$key',
		'class.$1', 'language.types.object#language.types.object.casting', 'reserved.classes#reserved.classes.standard', 'language.oop5.paamayim-nekudotayim'
	];
	jush.urls.php_fun = ['https://www.php.net/$key',
		'language.oop5.autoload', 'language.oop5.decon#language.oop5.decon.constructor', 'language.oop5.decon#language.oop5.decon.destructor', 'language.oop5.overloading#language.oop5.overloading.methods', 'language.oop5.overloading#language.oop5.overloading.members', 'language.oop5.magic#language.oop5.magic.sleep', 'language.oop5.magic#language.oop5.magic.serialize', 'language.oop5.magic#language.oop5.magic.tostring', 'language.oop5.magic#language.oop5.magic.invoke', 'language.oop5.magic#language.oop5.magic.set-state', 'language.oop5.cloning'
	];
	jush.urls.phpini = ['https://www.php.net/$key',
		'ini.core#ini.$1', 'errorfunc.configuration#ini.$1', 'outcontrol.configuration#ini.$1', 'info.configuration#ini.$1', 'datetime.configuration#ini.$1', 'readline.configuration#ini.$1', 'phar.configuration#ini.$1', 'zlib.configuration#ini.$1', 'mcrypt.configuration#ini.$1', 'odbc.configuration#ini.$1', 'pdo.configuration#ini.$1', 'pdo-mysql.configuration#ini.$1', 'pdo-odbc.configuration#ini.$1', 'ibase.configuration#ini.$1', 'fbsql.configuration#ini.$1', 'ifx.configuration#ini.$1', 'msql.configuration#ini.$1', 'mssql.configuration#ini.$1', 'mysql.configuration#ini.$1', 'mysqli.configuration#ini.$1', 'oci8.configuration#ini.$1', 'pgsql.configuration#ini.$1', 'sqlite3.configuration#ini.$1', 'sybase.configuration#ini.$1', 'filesystem.configuration#ini.$1', 'mime-magic.configuration#ini.$1', 'iconv.configuration#ini.$1', 'intl.configuration#ini.$1', 'mbstring.configuration#ini.$1', 'exif.configuration#ini.$1', 'image.configuration#ini.$1', 'mail.configuration#ini.$1', 'bc.configuration#ini.$1', 'sem.configuration#ini.$1', 'misc.configuration#ini.$1', 'tidy.configuration#ini.$1', 'curl.configuration#ini.$1', 'ldap.configuration#ini.$1', 'network.configuration#ini.$1', 'apache.configuration#ini.$1', 'nsapi.configuration#ini.$1', 'session.configuration#ini.$1', 'pcre.configuration#ini.$1', 'filter.configuration#ini.$1', 'var.configuration#ini.$1', 'soap.configuration#ini.$1', 'com.configuration#ini.$1',
		'https://www.hardened-php.net/suhosin/configuration.html#$1'
	];
	jush.urls.php_doc = ['https://manual.phpdoc.org/HTMLSmartyConverter/HandS/phpDocumentor/tutorial_tags.$key.pkg.html',
		'$1', '', 'inline$1'
	];
	jush.urls.mail = ['https://tools.ietf.org/html/rfc2076#section-3.$key',
		'2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '13', '14', '15', '16'
	];

	jush.links.php_new = {
		'https://www.php.net/language.oop5.basic#language.oop5.basic.$val': /^(class|new|extends)$/i,
		'https://www.php.net/language.oop5.interfaces#language.oop5.interfaces.$val': /^(implements|interface)$/i,
		'https://www.php.net/language.operators.type': /^instanceof$/i
	};
	jush.links.php_met = {
		'language.oop5.paamayim-nekudotayim': /^(self|parent|static)$/i,
		'class.$val': new RegExp('^(' + php_class.source + ')$', 'i')
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
	jush.links.php_mssql = { 'https://www.php.net/function.$val': /^mssql_query$/i, 'cc296181': /^sqlsrv_prepare$/i, 'cc296184': /^sqlsrv_query$/i };
	jush.links.php_oracle = { 'function': new RegExp('^' + oracle_function + '$', 'i') };
	jush.links.php_phpini = { 'function': /^(ini_get|ini_set)$/i };
	jush.links.php_http = { 'function': /^header$/i };
	jush.links.php_mail = { 'function': /^mail$/i };
	jush.links.php_echo = { 'function': /^(echo|print)$/i };
	jush.links.php_halt = { 'function': /^__halt_compiler$/i };

	jush.links2.php2 = /(\b)((?:return|(?:include|require)(?:_once)?|(end(?:for|foreach|if|switch|while|declare))|(break|continue|declare|else|elseif|for|foreach|if|switch|while|goto)|(do)|(as)|(case|default)|(var)|(__(?:CLASS|FILE|FUNCTION|LINE|METHOD|PROPERTY|DIR|NAMESPACE|TRAIT)__)|(catch|throw|try|finally)|(abstract|final)|(clone)|(const)|(private|protected|public)|(and|x?or)|(global|static)|(namespace|use)|(trait)|(yield)|(from)|(callable)|(fn)|(insteadof)|(match)|(readonly)|(array|float|string|null|void|iterable|mixed|never|object|resource)|(int)|(bool)|(true|false)|(self|parent)|(enum)|(numeric))\b|(array_all|array_any|array_change_key_case|array_chunk|array_column|array_combine|array_count_values|array_diff_assoc|array_diff_key|array_diff_uassoc|array_diff_ukey|array_diff|array_fill_keys|array_fill|array_filter|array_find_key|array_find|array_flip|array_intersect_assoc|array_intersect_key|array_intersect_uassoc|array_intersect_ukey|array_intersect|array_is_list|array_key_exists|array_key_first|array_key_last|array_keys|array_keys|array_map|array_merge_recursive|array_merge|array_multisort|array_pad|array_pop|array_product|array_push|array_rand|array_reduce|array_replace_recursive|array_replace|array_reverse|array_search|array_shift|array_slice|array_splice|array_sum|array_udiff_assoc|array_udiff_uassoc|array_udiff|array_uintersect_assoc|array_uintersect_uassoc|array_uintersect|array_unique|array_unshift|array_values|array_walk_recursive|array_walk|array|arsort|asort|compact|count|current|each|end|extract|in_array|key_exists|key|krsort|ksort|list|natcasesort|natsort|next|pos|prev|range|reset|rsort|shuffle|sizeof|sort|uasort|uksort|usort|class_alias|class_exists|enum_exists|get_called_class|get_class_methods|get_class_vars|get_class|get_declared_classes|get_declared_interfaces|get_declared_traits|get_mangled_object_vars|get_object_vars|get_parent_class|interface_exists|is_a|is_subclass_of|method_exists|property_exists|trait_exists|date_interval_create_from_date_string|date_add|date_create_from_format|date_modify|date_date_set|date_isodate_set|date_time_set|date_timestamp_set|date_timezone_set|date_sub|date_create_immutable|date_create_immutable_from_format|date_diff|date_format|date_offset_get|date_timestamp_get|date_timezone_get|timezone_open|timezone_location_get|timezone_name_get|timezone_offset_get|timezone_transitions_get|timezone_abbreviations_list|checkdate|date_create_immutable|date_create|date_default_timezone_get|date_default_timezone_set|date_parse_from_format|date_parse|date_sun_info|date_sunrise|date_sunset|date|dom\\import_simplexml|getdate|gettimeofday|gmdate|gmmktime|gmstrftime|idate|localtime|microtime|mktime|strftime|strptime|strtotime|time|timezone_name_from_abbr|timezone_version_get|chdir|chroot|closedir|dir|getcwd|opendir|readdir|rewinddir|scandir|debug_backtrace|debug_print_backtrace|error_clear_last|error_get_last|error_log|error_reporting|restore_error_handler|restore_exception_handler|set_error_handler|set_exception_handler|trigger_error|user_error|escapeshellarg|escapeshellcmd|exec|passthru|proc_close|proc_get_status|proc_nice|proc_open|proc_terminate|shell_exec|system|basename|chgrp|chmod|chown|clearstatcache|copy|delete|dirname|disk_free_space|disk_total_space|diskfreespace|fclose|fdatasync|feof|fflush|fgetc|fgetcsv|fgets|fgetss|file_exists|file_get_contents|file_put_contents|file|fileatime|filectime|filegroup|fileinode|filemtime|fileowner|fileperms|filesize|filetype|flock|fnmatch|fopen|fpassthru|fputcsv|fputs|fread|fscanf|fseek|fstat|fsync|ftell|ftruncate|fwrite|glob|is_dir|is_executable|is_file|is_link|is_readable|is_uploaded_file|is_writable|is_writeable|lchgrp|lchown|link|linkinfo|lstat|mkdir|move_uploaded_file|parse_ini_file|parse_ini_string|pathinfo|pclose|popen|readfile|readlink|realpath_cache_get|realpath_cache_size|realpath|rename|rewind|rmdir|set_file_buffer|stat|symlink|tempnam|tmpfile|touch|umask|unlink|fastcgi_finish_request|fpm_get_status|call_user_func_array|call_user_func|create_function|forward_static_call_array|forward_static_call|func_get_arg|func_get_args|func_num_args|function_exists|get_defined_functions|register_shutdown_function|register_tick_function|unregister_tick_function|hash_algos|hash_copy|hash_equals|hash_file|hash_final|hash_hkdf|hash_hmac_algos|hash_hmac_file|hash_hmac|hash_init|hash_pbkdf2|hash_update_file|hash_update_stream|hash_update|hash|assert_options|assert|cli_get_process_title|cli_set_process_title|dl|extension_loaded|gc_collect_cycles|gc_disable|gc_enable|gc_enabled|gc_mem_caches|gc_status|get_cfg_var|get_current_user|get_defined_constants|get_extension_funcs|get_include_path|get_included_files|get_loaded_extensions|get_magic_quotes_gpc|get_magic_quotes_runtime|get_required_files|get_resources|getenv|getlastmod|getmygid|getmyinode|getmypid|getmyuid|getopt|getrusage|ini_alter|ini_get_all|ini_get|ini_parse_quantity|ini_restore|ini_set|memory_get_peak_usage|memory_get_usage|memory_reset_peak_usage|php_ini_loaded_file|php_ini_scanned_files|php_sapi_name|php_uname|phpcredits|phpinfo|phpversion|putenv|restore_include_path|set_include_path|set_time_limit|sys_get_temp_dir|version_compare|zend_thread_id|zend_version|json_decode|json_encode|json_last_error_msg|json_last_error|json_validate|ezmlm_hash|mail|abs|acos|acosh|asin|asinh|atan|atan2|atanh|base_convert|bindec|ceil|cos|cosh|decbin|dechex|decoct|deg2rad|exp|expm1|fdiv|floor|fmod|fpow|hexdec|hypot|intdiv|is_finite|is_infinite|is_nan|log|log10|log1p|max|max|min|min|octdec|pi|pow|rad2deg|sin|sinh|sqrt|tan|tanh|connection_aborted|connection_status|constant|define|defined|die|eval|exit|get_browser|highlight_file|highlight_string|hrtime|ignore_user_abort|pack|php_strip_whitespace|sapi_windows_cp_conv|sapi_windows_cp_get|sapi_windows_cp_is_utf8|sapi_windows_cp_set|sapi_windows_generate_ctrl_event|sapi_windows_set_ctrl_handler|sapi_windows_vt100_support|show_source|sleep|sys_getloadavg|time_nanosleep|time_sleep_until|uniqid|unpack|usleep|checkdnsrr|closelog|dns_check_record|dns_get_mx|dns_get_record|fsockopen|gethostbyaddr|gethostbyname|gethostbynamel|gethostname|getmxrr|getprotobyname|getprotobynumber|getservbyname|getservbyport|header_register_callback|header_remove|header|headers_list|headers_sent|http_clear_last_response_headers|http_get_last_response_headers|http_response_code|inet_ntop|inet_pton|ip2long|long2ip|net_get_interfaces|openlog|pfsockopen|request_parse_body|setcookie|setcookie|setrawcookie|setrawcookie|socket_get_status|socket_set_blocking|socket_set_timeout|syslog|opcache_compile_file|opcache_get_configuration|opcache_get_status|opcache_invalidate|opcache_is_script_cached|opcache_reset|flush|ob_clean|ob_end_clean|ob_end_flush|ob_flush|ob_get_clean|ob_get_contents|ob_get_flush|ob_get_length|ob_get_level|ob_get_status|ob_implicit_flush|ob_list_handlers|ob_start|output_add_rewrite_var|output_reset_rewrite_vars|password_algos|password_get_info|password_hash|password_needs_rehash|password_verify|preg_filter|preg_grep|preg_last_error_msg|preg_last_error|preg_match_all|preg_match|preg_quote|preg_replace_callback_array|preg_replace_callback|preg_replace|preg_split|getrandmax|lcg_value|mt_getrandmax|mt_rand|mt_rand|mt_srand|rand|rand|random_bytes|random_int|srand|class_implements|class_parents|class_uses|iterator_apply|iterator_count|iterator_to_array|spl_autoload_call|spl_autoload_extensions|spl_autoload_functions|spl_autoload_register|spl_autoload_unregister|spl_autoload|spl_classes|spl_object_hash|spl_object_id|stream_bucket_append|stream_bucket_make_writeable|stream_bucket_new|stream_bucket_prepend|stream_context_create|stream_context_get_default|stream_context_get_options|stream_context_get_params|stream_context_set_default|stream_context_set_option|stream_context_set_options|stream_context_set_params|stream_copy_to_stream|stream_filter_append|stream_filter_prepend|stream_filter_register|stream_filter_remove|stream_get_contents|stream_get_filters|stream_get_line|stream_get_meta_data|stream_get_transports|stream_get_wrappers|stream_is_local|stream_isatty|stream_register_wrapper|stream_resolve_include_path|stream_select|stream_set_blocking|stream_set_chunk_size|stream_set_read_buffer|stream_set_timeout|stream_set_write_buffer|stream_socket_accept|stream_socket_client|stream_socket_enable_crypto|stream_socket_get_name|stream_socket_pair|stream_socket_recvfrom|stream_socket_sendto|stream_socket_server|stream_socket_shutdown|stream_supports_lock|stream_wrapper_register|stream_wrapper_restore|stream_wrapper_unregister|addcslashes|addslashes|bin2hex|chop|chr|chunk_split|convert_cyr_string|convert_uudecode|convert_uuencode|count_chars|crc32|crypt|echo|explode|fprintf|get_html_translation_table|hebrev|hebrevc|hex2bin|html_entity_decode|htmlentities|htmlspecialchars_decode|htmlspecialchars|implode|implode|implode|join|lcfirst|levenshtein|localeconv|ltrim|md5_file|md5|metaphone|money_format|nl_langinfo|nl2br|number_format|ord|parse_str|print|printf|quoted_printable_decode|quoted_printable_encode|quotemeta|rtrim|setlocale|setlocale|sha1_file|sha1|similar_text|soundex|sprintf|sscanf|str_contains|str_decrement|str_ends_with|str_getcsv|str_increment|str_ireplace|str_pad|str_repeat|str_replace|str_rot13|str_shuffle|str_split|str_starts_with|str_word_count|strcasecmp|strchr|strcmp|strcoll|strcspn|strip_tags|stripcslashes|stripos|stripslashes|stristr|strlen|strnatcasecmp|strnatcmp|strncasecmp|strncmp|strpbrk|strpos|strrchr|strrev|strripos|strrpos|strspn|strstr|strtok|strtok|strtolower|strtoupper|strtr|strtr|substr_compare|substr_count|substr_replace|substr|trim|ucfirst|ucwords|utf8_decode|utf8_encode|vfprintf|vprintf|vsprintf|wordwrap|base64_decode|base64_encode|get_headers|get_meta_tags|http_build_query|parse_url|rawurldecode|rawurlencode|urldecode|urlencode|boolval|debug_zval_dump|doubleval|empty|floatval|get_debug_type|get_defined_vars|get_resource_id|get_resource_type|gettype|intval|is_array|is_bool|is_callable|is_countable|is_double|is_float|is_int|is_integer|is_iterable|is_long|is_null|is_numeric|is_object|is_real|is_resource|is_scalar|is_string|isset|print_r|serialize|settype|strval|unserialize|unset|var_dump|var_export|apache_child_terminate|apache_get_modules|apache_get_version|apache_getenv|apache_lookup_uri|apache_note|apache_request_headers|apache_response_headers|apache_setenv|getallheaders|virtual|bcadd|bcceil|bccomp|bcdiv|bcdivmod|bcfloor|bcmod|bcmul|bcpow|bcpowmod|bcscale|bcscale|bcsqrt|bcsub|cal_days_in_month|cal_from_jd|cal_info|cal_to_jd|easter_date|easter_days|frenchtojd|gregoriantojd|jddayofweek|jdmonthname|jdtofrench|jdtogregorian|jdtojewish|jdtojulian|jdtounix|jewishtojd|juliantojd|unixtojd|com_create_guid|com_event_sink|com_get_active_object|com_load_typelib|com_message_pump|com_print_typeinfo|variant_abs|variant_add|variant_and|variant_cast|variant_cat|variant_cmp|variant_date_from_timestamp|variant_date_to_timestamp|variant_div|variant_eqv|variant_fix|variant_get_type|variant_idiv|variant_imp|variant_int|variant_mod|variant_mul|variant_neg|variant_not|variant_or|variant_pow|variant_round|variant_set_type|variant_set|variant_sub|variant_xor|ctype_alnum|ctype_alpha|ctype_cntrl|ctype_digit|ctype_graph|ctype_lower|ctype_print|ctype_punct|ctype_space|ctype_upper|ctype_xdigit|dba_close|dba_delete|dba_exists|dba_fetch|dba_fetch|dba_firstkey|dba_handlers|dba_insert|dba_key_split|dba_list|dba_nextkey|dba_open|dba_optimize|dba_popen|dba_replace|dba_sync|exif_imagetype|exif_read_data|exif_tagname|exif_thumbnail|read_exif_data|finfo_buffer|finfo_close|finfo_file|finfo_open|finfo_set_flags|mime_content_type|filter_has_var|filter_id|filter_input_array|filter_input|filter_list|filter_var_array|filter_var|ftp_alloc|ftp_append|ftp_cdup|ftp_chdir|ftp_chmod|ftp_close|ftp_connect|ftp_delete|ftp_exec|ftp_fget|ftp_fput|ftp_get_option|ftp_get|ftp_login|ftp_mdtm|ftp_mkdir|ftp_mlsd|ftp_nb_continue|ftp_nb_fget|ftp_nb_fput|ftp_nb_get|ftp_nb_put|ftp_nlist|ftp_pasv|ftp_put|ftp_pwd|ftp_quit|ftp_raw|ftp_rawlist|ftp_rename|ftp_rmdir|ftp_set_option|ftp_site|ftp_size|ftp_ssl_connect|ftp_systype|iconv_get_encoding|iconv_mime_decode_headers|iconv_mime_decode|iconv_mime_encode|iconv_set_encoding|iconv_strlen|iconv_strpos|iconv_strrpos|iconv_substr|iconv|ob_iconv_handler|gd_info|getimagesize|getimagesizefromstring|image_type_to_extension|image_type_to_mime_type|image2wbmp|imageaffine|imageaffinematrixconcat|imageaffinematrixget|imagealphablending|imageantialias|imagearc|imageavif|imagebmp|imagechar|imagecharup|imagecolorallocate|imagecolorallocatealpha|imagecolorat|imagecolorclosest|imagecolorclosestalpha|imagecolorclosesthwb|imagecolordeallocate|imagecolorexact|imagecolorexactalpha|imagecolormatch|imagecolorresolve|imagecolorresolvealpha|imagecolorset|imagecolorsforindex|imagecolorstotal|imagecolortransparent|imageconvolution|imagecopy|imagecopymerge|imagecopymergegray|imagecopyresampled|imagecopyresized|imagecreate|imagecreatefromavif|imagecreatefrombmp|imagecreatefromgd|imagecreatefromgd2|imagecreatefromgd2part|imagecreatefromgif|imagecreatefromjpeg|imagecreatefrompng|imagecreatefromstring|imagecreatefromtga|imagecreatefromwbmp|imagecreatefromwebp|imagecreatefromxbm|imagecreatefromxpm|imagecreatetruecolor|imagecrop|imagecropauto|imagedashedline|imagedestroy|imageellipse|imagefill|imagefilledarc|imagefilledellipse|imagefilledpolygon|imagefilledpolygon|imagefilledrectangle|imagefilltoborder|imagefilter|imageflip|imagefontheight|imagefontwidth|imageftbbox|imagefttext|imagegammacorrect|imagegd|imagegd2|imagegetclip|imagegetinterpolation|imagegif|imagegrabscreen|imagegrabwindow|imageinterlace|imageistruecolor|imagejpeg|imagelayereffect|imageline|imageloadfont|imageopenpolygon|imageopenpolygon|imagepalettecopy|imagepalettetotruecolor|imagepng|imagepolygon|imagepolygon|imagerectangle|imageresolution|imagerotate|imagesavealpha|imagescale|imagesetbrush|imagesetclip|imagesetinterpolation|imagesetpixel|imagesetstyle|imagesetthickness|imagesettile|imagestring|imagestringup|imagesx|imagesy|imagetruecolortopalette|imagettfbbox|imagettftext|imagetypes|imagewbmp|imagewebp|imagexbm|iptcembed|iptcparse|jpeg2wbmp|png2wbmp|collator_compare|collator_create|collator_get_attribute|collator_get_error_code|collator_get_error_message|collator_get_locale|collator_get_sort_key|collator_get_strength|collator_set_attribute|collator_set_strength|collator_sort_with_sort_keys|datefmt_format|datefmt_format_object|datefmt_get_calendar|datefmt_get_datetype|datefmt_get_error_code|datefmt_get_error_message|datefmt_get_locale|datefmt_get_pattern|datefmt_get_timetype|datefmt_get_timezone_id|datefmt_get_calendar_object|datefmt_get_timezone|datefmt_is_lenient|datefmt_localtime|datefmt_parse|datefmt_set_calendar|datefmt_set_lenient|datefmt_set_pattern|datefmt_set_timezone|intl_error_name|intl_get_error_code|intl_get_error_message|intl_is_failure|grapheme_extract|grapheme_str_split|grapheme_stripos|grapheme_stristr|grapheme_strlen|grapheme_strpos|grapheme_strripos|grapheme_strrpos|grapheme_strstr|grapheme_substr|idn_to_ascii|idn_to_utf8|intl_get_error_code|intl_get_error_message|intlcal_add|intlcal_after|intlcal_before|intlcal_clear|intlcal_create_instance|intlcal_equals|intlcal_field_difference|intlcal_from_date_time|intlcal_get|intlcal_get_actual_maximum|intlcal_get_actual_minimum|intlcal_get_available_locales|intlcal_get_day_of_week_type|intlcal_get_error_code|intlcal_get_error_message|intlcal_get_first_day_of_week|intlcal_get_greatest_minimum|intlcal_get_keyword_values_for_locale|intlcal_get_least_maximum|intlcal_get_locale|intlcal_get_maximum|intlcal_get_minimal_days_in_first_week|intlcal_get_minimum|intlcal_get_now|intlcal_get_repeated_wall_time_option|intlcal_get_skipped_wall_time_option|intlcal_get_time|intlcal_get_time_zone|intlcal_get_type|intlcal_get_weekend_transition|intlcal_in_daylight_time|intlcal_is_equivalent_to|intlcal_is_lenient|intlcal_is_set|intlcal_is_weekend|intlcal_roll|intlcal_set|intlcal_set|intlcal_set_first_day_of_week|intlcal_set_lenient|intlcal_set_minimal_days_in_first_week|intlcal_set_repeated_wall_time_option|intlcal_set_skipped_wall_time_option|intlcal_set_time|intlcal_set_time_zone|intlcal_to_date_time|intltz_count_equivalent_ids|intltz_create_default|intltz_create_enumeration|intltz_create_time_zone|intltz_create_time_zone_id_enumeration|intltz_from_date_time_zone|intltz_get_canonical_id|intltz_get_dst_savings|intltz_get_equivalent_id|intltz_get_error_code|intltz_get_error_message|intltz_get_gmt|intltz_get_id|intltz_get_id_for_windows_id|intltz_get_offset|intltz_get_raw_offset|intltz_get_region|intltz_get_tz_data_version|intltz_get_unknown|intltz_get_windows_id|intltz_has_same_rules|intltz_to_date_time_zone|intltz_use_daylight_time|locale_accept_from_http|locale_compose|locale_filter_matches|locale_get_all_variants|locale_get_default|locale_get_display_language|locale_get_display_name|locale_get_display_region|locale_get_display_script|locale_get_display_variant|locale_get_keywords|locale_get_primary_language|locale_get_region|locale_get_script|locale_lookup|locale_parse|locale_set_default|msgfmt_create|msgfmt_format_message|msgfmt_format|msgfmt_get_error_code|msgfmt_get_error_message|msgfmt_get_locale|msgfmt_get_pattern|msgfmt_parse_message|msgfmt_parse|msgfmt_set_pattern|numfmt_create|numfmt_format_currency|numfmt_get_attribute|numfmt_get_error_code|numfmt_get_error_message|numfmt_get_locale|numfmt_get_pattern|numfmt_get_symbol|numfmt_get_text_attribute|numfmt_parse_currency|numfmt_set_attribute|numfmt_set_pattern|numfmt_set_symbol|numfmt_set_text_attribute|resourcebundle_count|resourcebundle_create|resourcebundle_get_error_code|resourcebundle_get_error_message|resourcebundle_get|resourcebundle_locales|transliterator_create_inverse|transliterator_get_error_code|transliterator_get_error_message|transliterator_list_ids|transliterator_transliterate|mb_check_encoding|mb_chr|mb_convert_case|mb_convert_encoding|mb_convert_kana|mb_convert_variables|mb_decode_mimeheader|mb_decode_numericentity|mb_detect_encoding|mb_detect_order|mb_encode_mimeheader|mb_encode_numericentity|mb_encoding_aliases|mb_ereg_match|mb_ereg_replace_callback|mb_ereg_replace|mb_ereg_search_getpos|mb_ereg_search_getregs|mb_ereg_search_init|mb_ereg_search_pos|mb_ereg_search_regs|mb_ereg_search_setpos|mb_ereg_search|mb_ereg|mb_eregi_replace|mb_eregi|mb_get_info|mb_http_input|mb_http_output|mb_internal_encoding|mb_language|mb_lcfirst|mb_list_encodings|mb_ltrim|mb_ord|mb_output_handler|mb_parse_str|mb_preferred_mime_name|mb_regex_encoding|mb_regex_set_options|mb_rtrim|mb_scrub|mb_send_mail|mb_split|mb_str_pad|mb_str_split|mb_strcut|mb_strimwidth|mb_stripos|mb_stristr|mb_strlen|mb_strpos|mb_strrchr|mb_strrichr|mb_strripos|mb_strrpos|mb_strstr|mb_strtolower|mb_strtoupper|mb_strwidth|mb_substitute_character|mb_substr_count|mb_substr|mb_trim|mb_ucfirst|mhash_count|mhash_get_block_size|mhash_get_hash_name|mhash_keygen_s2k|mhash|pcntl_alarm|pcntl_async_signals|pcntl_errno|pcntl_exec|pcntl_fork|pcntl_get_last_error|pcntl_getcpuaffinity|pcntl_getpriority|pcntl_rfork|pcntl_setcpuaffinity|pcntl_setpriority|pcntl_signal_dispatch|pcntl_signal_get_handler|pcntl_signal|pcntl_sigprocmask|pcntl_sigtimedwait|pcntl_sigwaitinfo|pcntl_strerror|pcntl_unshare|pcntl_wait|pcntl_waitid|pcntl_waitpid|pcntl_wexitstatus|pcntl_wifexited|pcntl_wifsignaled|pcntl_wifstopped|pcntl_wstopsig|pcntl_wtermsig|pdo_drivers|phpdbg_break_file|phpdbg_break_function|phpdbg_break_method|phpdbg_break_next|phpdbg_clear|phpdbg_color|phpdbg_end_oplog|phpdbg_exec|phpdbg_get_executable|phpdbg_prompt|phpdbg_start_oplog|posix_access|posix_ctermid|posix_eaccess|posix_errno|posix_fpathconf|posix_get_last_error|posix_getcwd|posix_getegid|posix_geteuid|posix_getgid|posix_getgrgid|posix_getgrnam|posix_getgroups|posix_getlogin|posix_getpgid|posix_getpgrp|posix_getpid|posix_getppid|posix_getpwnam|posix_getpwuid|posix_getrlimit|posix_getsid|posix_getuid|posix_initgroups|posix_isatty|posix_kill|posix_mkfifo|posix_mknod|posix_pathconf|posix_setegid|posix_seteuid|posix_setgid|posix_setpgid|posix_setrlimit|posix_setsid|posix_setuid|posix_strerror|posix_sysconf|posix_times|posix_ttyname|posix_uname|ftok|msg_get_queue|msg_queue_exists|msg_receive|msg_remove_queue|msg_send|msg_set_queue|msg_stat_queue|sem_acquire|sem_get|sem_release|sem_remove|shm_attach|shm_detach|shm_get_var|shm_has_var|shm_put_var|shm_remove_var|shm_remove|session_abort|session_cache_expire|session_cache_limiter|session_commit|session_create_id|session_decode|session_destroy|session_encode|session_gc|session_get_cookie_params|session_id|session_module_name|session_name|session_regenerate_id|session_register_shutdown|session_reset|session_save_path|session_set_cookie_params|session_set_cookie_params|session_set_save_handler|session_set_save_handler|session_start|session_status|session_unset|session_write_close|shmop_close|shmop_delete|shmop_open|shmop_read|shmop_size|shmop_write|socket_accept|socket_addrinfo_bind|socket_addrinfo_connect|socket_addrinfo_explain|socket_addrinfo_lookup|socket_atmark|socket_bind|socket_clear_error|socket_close|socket_cmsg_space|socket_connect|socket_create_listen|socket_create_pair|socket_create|socket_export_stream|socket_get_option|socket_getopt|socket_getpeername|socket_getsockname|socket_import_stream|socket_last_error|socket_listen|socket_read|socket_recv|socket_recvfrom|socket_recvmsg|socket_select|socket_send|socket_sendmsg|socket_sendto|socket_set_block|socket_set_nonblock|socket_set_option|socket_setopt|socket_shutdown|socket_strerror|socket_write|socket_wsaprotocol_info_export|socket_wsaprotocol_info_import|socket_wsaprotocol_info_release|token_get_all|token_name|deflate_add|deflate_init|gzclose|gzcompress|gzdecode|gzdeflate|gzencode|gzeof|gzfile|gzgetc|gzgets|gzgetss|gzinflate|gzopen|gzpassthru|gzputs|gzread|gzrewind|gzseek|gztell|gzuncompress|gzwrite|inflate_get_read_len|inflate_get_status|inflate_add|inflate_init|ob_gzhandler|readgzfile|zlib_decode|zlib_encode|zlib_get_coding_type|bzclose|bzcompress|bzdecompress|bzerrno|bzerror|bzerrstr|bzflush|bzopen|bzread|bzwrite|curl_file_create|curl_close|curl_copy_handle|curl_errno|curl_error|curl_escape|curl_exec|curl_getinfo|curl_init|curl_multi_add_handle|curl_multi_close|curl_multi_errno|curl_multi_exec|curl_multi_getcontent|curl_multi_info_read|curl_multi_init|curl_multi_remove_handle|curl_multi_select|curl_multi_setopt|curl_multi_strerror|curl_pause|curl_reset|curl_setopt_array|curl_setopt|curl_share_close|curl_share_errno|curl_share_init_persistent|curl_share_init|curl_share_setopt|curl_share_strerror|curl_strerror|curl_unescape|curl_upkeep|curl_version|dom_import_simplexml|enchant_broker_describe|enchant_broker_dict_exists|enchant_broker_free_dict|enchant_broker_free|enchant_broker_get_dict_path|enchant_broker_get_error|enchant_broker_init|enchant_broker_list_dicts|enchant_broker_request_dict|enchant_broker_request_pwl_dict|enchant_broker_set_dict_path|enchant_broker_set_ordering|enchant_dict_add_to_personal|enchant_dict_add_to_session|enchant_dict_add|enchant_dict_check|enchant_dict_describe|enchant_dict_get_error|enchant_dict_is_added|enchant_dict_is_in_session|enchant_dict_quick_check|enchant_dict_store_replacement|enchant_dict_suggest|_|bind_textdomain_codeset|bindtextdomain|dcgettext|dcngettext|dgettext|dngettext|gettext|ngettext|textdomain|gmp_abs|gmp_add|gmp_and|gmp_binomial|gmp_clrbit|gmp_cmp|gmp_com|gmp_div_q|gmp_div_qr|gmp_div_r|gmp_div|gmp_divexact|gmp_export|gmp_fact|gmp_gcd|gmp_gcdext|gmp_hamdist|gmp_import|gmp_init|gmp_intval|gmp_invert|gmp_jacobi|gmp_kronecker|gmp_lcm|gmp_legendre|gmp_mod|gmp_mul|gmp_neg|gmp_nextprime|gmp_or|gmp_perfect_power|gmp_perfect_square|gmp_popcount|gmp_pow|gmp_powm|gmp_prob_prime|gmp_random_bits|gmp_random_range|gmp_random_seed|gmp_random|gmp_root|gmp_rootrem|gmp_scan0|gmp_scan1|gmp_setbit|gmp_sign|gmp_sqrt|gmp_sqrtrem|gmp_strval|gmp_sub|gmp_testbit|gmp_xor|ldap_8859_to_t61|ldap_add_ext|ldap_add|ldap_bind_ext|ldap_bind|ldap_close|ldap_compare|ldap_connect_wallet|ldap_connect|ldap_connect|ldap_control_paged_result_response|ldap_control_paged_result|ldap_count_entries|ldap_count_references|ldap_delete_ext|ldap_delete|ldap_dn2ufn|ldap_err2str|ldap_errno|ldap_error|ldap_escape|ldap_exop_passwd|ldap_exop_refresh|ldap_exop_sync|ldap_exop_whoami|ldap_exop|ldap_explode_dn|ldap_first_attribute|ldap_first_entry|ldap_first_reference|ldap_free_result|ldap_get_attributes|ldap_get_dn|ldap_get_entries|ldap_get_option|ldap_get_values_len|ldap_get_values|ldap_list|ldap_mod_add_ext|ldap_mod_add|ldap_mod_del_ext|ldap_mod_del|ldap_mod_replace_ext|ldap_mod_replace|ldap_modify_batch|ldap_modify|ldap_next_attribute|ldap_next_entry|ldap_next_reference|ldap_parse_exop|ldap_parse_reference|ldap_parse_result|ldap_read|ldap_rename_ext|ldap_rename|ldap_sasl_bind|ldap_search|ldap_set_option|ldap_set_rebind_proc|ldap_sort|ldap_start_tls|ldap_t61_to_8859|ldap_unbind|libxml_clear_errors|libxml_disable_entity_loader|libxml_get_errors|libxml_get_external_entity_loader|libxml_get_last_error|libxml_set_external_entity_loader|libxml_set_streams_context|libxml_use_internal_errors|mysqli_execute|mysqli_get_client_stats|mysqli_get_links_stats|mysqli_report|mysqli_affected_rows|mysqli_autocommit|mysqli_begin_transaction|mysqli_change_user|mysqli_character_set_name|mysqli_close|mysqli_commit|mysqli_connect_errno|mysqli_connect_error|mysqli_connect|mysqli_debug|mysqli_dump_debug_info|mysqli_errno|mysqli_error_list|mysqli_error|mysqli_execute_query|mysqli_field_count|mysqli_get_charset|mysqli_get_client_info|mysqli_get_client_version|mysqli_get_connection_stats|mysqli_get_host_info|mysqli_get_proto_info|mysqli_get_server_info|mysqli_get_server_version|mysqli_get_warnings|mysqli_info|mysqli_init|mysqli_insert_id|mysqli_kill|mysqli_more_results|mysqli_multi_query|mysqli_next_result|mysqli_options|mysqli_ping|mysqli_poll|mysqli_prepare|mysqli_query|mysqli_real_connect|mysqli_real_escape_string|mysqli_real_query|mysqli_reap_async_query|mysqli_refresh|mysqli_release_savepoint|mysqli_rollback|mysqli_savepoint|mysqli_select_db|mysqli_set_charset|mysqli_sqlstate|mysqli_ssl_set|mysqli_stat|mysqli_stmt_init|mysqli_store_result|mysqli_thread_id|mysqli_thread_safe|mysqli_use_result|mysqli_warning_count|mysqli_embedded_server_end|mysqli_embedded_server_start|mysqli_report|mysqli_field_tell|mysqli_data_seek|mysqli_fetch_all|mysqli_fetch_array|mysqli_fetch_assoc|mysqli_fetch_column|mysqli_fetch_field_direct|mysqli_fetch_field|mysqli_fetch_fields|mysqli_fetch_object|mysqli_fetch_row|mysqli_num_fields|mysqli_field_seek|mysqli_free_result|mysqli_fetch_lengths|mysqli_num_rows|mysqli_stmt_affected_rows|mysqli_stmt_attr_get|mysqli_stmt_attr_set|mysqli_stmt_bind_param|mysqli_stmt_bind_result|mysqli_stmt_close|mysqli_stmt_data_seek|mysqli_stmt_errno|mysqli_stmt_error_list|mysqli_stmt_error|mysqli_stmt_execute|mysqli_stmt_fetch|mysqli_stmt_field_count|mysqli_stmt_free_result|mysqli_stmt_get_result|mysqli_stmt_get_warnings|mysqli_stmt_insert_id|mysqli_stmt_more_results|mysqli_stmt_next_result|mysqli_stmt_num_rows|mysqli_stmt_param_count|mysqli_stmt_prepare|mysqli_stmt_reset|mysqli_stmt_result_metadata|mysqli_stmt_send_long_data|mysqli_stmt_sqlstate|mysqli_stmt_store_result|openssl_cipher_iv_length|openssl_cipher_key_length|openssl_cms_decrypt|openssl_cms_encrypt|openssl_cms_read|openssl_cms_sign|openssl_cms_verify|openssl_csr_export_to_file|openssl_csr_export|openssl_csr_get_public_key|openssl_csr_get_subject|openssl_csr_new|openssl_csr_sign|openssl_decrypt|openssl_dh_compute_key|openssl_digest|openssl_encrypt|openssl_error_string|openssl_free_key|openssl_get_cert_locations|openssl_get_cipher_methods|openssl_get_curve_names|openssl_get_md_methods|openssl_get_privatekey|openssl_get_publickey|openssl_open|openssl_pbkdf2|openssl_pkcs12_export_to_file|openssl_pkcs12_export|openssl_pkcs12_read|openssl_pkcs7_decrypt|openssl_pkcs7_encrypt|openssl_pkcs7_read|openssl_pkcs7_sign|openssl_pkcs7_verify|openssl_pkey_derive|openssl_pkey_export_to_file|openssl_pkey_export|openssl_pkey_free|openssl_pkey_get_details|openssl_pkey_get_private|openssl_pkey_get_public|openssl_pkey_new|openssl_private_decrypt|openssl_private_encrypt|openssl_public_decrypt|openssl_public_encrypt|openssl_random_pseudo_bytes|openssl_seal|openssl_sign|openssl_spki_export_challenge|openssl_spki_export|openssl_spki_new|openssl_spki_verify|openssl_verify|openssl_x509_check_private_key|openssl_x509_checkpurpose|openssl_x509_export_to_file|openssl_x509_export|openssl_x509_fingerprint|openssl_x509_free|openssl_x509_parse|openssl_x509_read|openssl_x509_verify|pg_affected_rows|pg_cancel_query|pg_client_encoding|pg_close|pg_connect_poll|pg_connect|pg_connection_busy|pg_connection_reset|pg_connection_status|pg_consume_input|pg_convert|pg_copy_from|pg_copy_to|pg_dbname|pg_delete|pg_end_copy|pg_escape_bytea|pg_escape_identifier|pg_escape_literal|pg_escape_string|pg_execute|pg_fetch_all_columns|pg_fetch_all|pg_fetch_array|pg_fetch_assoc|pg_fetch_object|pg_fetch_result|pg_fetch_result|pg_fetch_row|pg_field_is_null|pg_field_is_null|pg_field_name|pg_field_num|pg_field_prtlen|pg_field_prtlen|pg_field_size|pg_field_table|pg_field_type_oid|pg_field_type|pg_flush|pg_free_result|pg_get_notify|pg_get_pid|pg_get_result|pg_host|pg_insert|pg_last_error|pg_last_notice|pg_last_oid|pg_lo_close|pg_lo_create|pg_lo_create|pg_lo_export|pg_lo_import|pg_lo_open|pg_lo_read_all|pg_lo_read|pg_lo_seek|pg_lo_tell|pg_lo_truncate|pg_lo_unlink|pg_lo_write|pg_meta_data|pg_num_fields|pg_num_rows|pg_options|pg_parameter_status|pg_pconnect|pg_ping|pg_port|pg_prepare|pg_put_line|pg_query_params|pg_query|pg_result_error_field|pg_result_error|pg_result_memory_size|pg_result_seek|pg_result_status|pg_select|pg_send_execute|pg_send_prepare|pg_send_query_params|pg_send_query|pg_set_chunked_rows_size|pg_set_client_encoding|pg_set_error_context_visibility|pg_set_error_verbosity|pg_socket|pg_trace|pg_transaction_status|pg_tty|pg_unescape_bytea|pg_untrace|pg_update|pg_version|readline_add_history|readline_callback_handler_install|readline_callback_handler_remove|readline_callback_read_char|readline_clear_history|readline_completion_function|readline_info|readline_list_history|readline_on_new_line|readline_read_history|readline_redisplay|readline_write_history|readline|snmp_get_quick_print|snmp_get_valueretrieval|snmp_read_mib|snmp_set_enum_print|snmp_set_oid_numeric_print|snmp_set_oid_output_format|snmp_set_quick_print|snmp_set_valueretrieval|snmp2_get|snmp2_getnext|snmp2_real_walk|snmp2_set|snmp2_walk|snmp3_get|snmp3_getnext|snmp3_real_walk|snmp3_set|snmp3_walk|snmpget|snmpgetnext|snmprealwalk|snmpset|snmpwalk|snmpwalkoid|is_soap_fault|use_soap_error_handler|sodium_add|sodium_base642bin|sodium_bin2base64|sodium_bin2hex|sodium_compare|sodium_crypto_aead_aegis128l_decrypt|sodium_crypto_aead_aegis128l_encrypt|sodium_crypto_aead_aegis128l_keygen|sodium_crypto_aead_aegis256_decrypt|sodium_crypto_aead_aegis256_encrypt|sodium_crypto_aead_aegis256_keygen|sodium_crypto_aead_aes256gcm_decrypt|sodium_crypto_aead_aes256gcm_encrypt|sodium_crypto_aead_aes256gcm_is_available|sodium_crypto_aead_aes256gcm_keygen|sodium_crypto_aead_chacha20poly1305_decrypt|sodium_crypto_aead_chacha20poly1305_encrypt|sodium_crypto_aead_chacha20poly1305_ietf_decrypt|sodium_crypto_aead_chacha20poly1305_ietf_encrypt|sodium_crypto_aead_chacha20poly1305_ietf_keygen|sodium_crypto_aead_chacha20poly1305_keygen|sodium_crypto_aead_xchacha20poly1305_ietf_decrypt|sodium_crypto_aead_xchacha20poly1305_ietf_encrypt|sodium_crypto_aead_xchacha20poly1305_ietf_keygen|sodium_crypto_auth_keygen|sodium_crypto_auth_verify|sodium_crypto_auth|sodium_crypto_box_keypair_from_secretkey_and_publickey|sodium_crypto_box_keypair|sodium_crypto_box_open|sodium_crypto_box_publickey_from_secretkey|sodium_crypto_box_publickey|sodium_crypto_box_seal_open|sodium_crypto_box_seal|sodium_crypto_box_secretkey|sodium_crypto_box_seed_keypair|sodium_crypto_box|sodium_crypto_core_ristretto255_add|sodium_crypto_core_ristretto255_from_hash|sodium_crypto_core_ristretto255_is_valid_point|sodium_crypto_core_ristretto255_random|sodium_crypto_core_ristretto255_scalar_add|sodium_crypto_core_ristretto255_scalar_complement|sodium_crypto_core_ristretto255_scalar_invert|sodium_crypto_core_ristretto255_scalar_mul|sodium_crypto_core_ristretto255_scalar_negate|sodium_crypto_core_ristretto255_scalar_random|sodium_crypto_core_ristretto255_scalar_reduce|sodium_crypto_core_ristretto255_scalar_sub|sodium_crypto_core_ristretto255_sub|sodium_crypto_generichash_final|sodium_crypto_generichash_init|sodium_crypto_generichash_keygen|sodium_crypto_generichash_update|sodium_crypto_generichash|sodium_crypto_kdf_derive_from_key|sodium_crypto_kdf_keygen|sodium_crypto_kx_client_session_keys|sodium_crypto_kx_keypair|sodium_crypto_kx_publickey|sodium_crypto_kx_secretkey|sodium_crypto_kx_seed_keypair|sodium_crypto_kx_server_session_keys|sodium_crypto_pwhash_scryptsalsa208sha256_str_verify|sodium_crypto_pwhash_scryptsalsa208sha256_str|sodium_crypto_pwhash_scryptsalsa208sha256|sodium_crypto_pwhash_str_needs_rehash|sodium_crypto_pwhash_str_verify|sodium_crypto_pwhash_str|sodium_crypto_pwhash|sodium_crypto_scalarmult_base|sodium_crypto_scalarmult_ristretto255_base|sodium_crypto_scalarmult_ristretto255|sodium_crypto_scalarmult|sodium_crypto_secretbox_keygen|sodium_crypto_secretbox_open|sodium_crypto_secretbox|sodium_crypto_secretstream_xchacha20poly1305_init_pull|sodium_crypto_secretstream_xchacha20poly1305_init_push|sodium_crypto_secretstream_xchacha20poly1305_keygen|sodium_crypto_secretstream_xchacha20poly1305_pull|sodium_crypto_secretstream_xchacha20poly1305_push|sodium_crypto_secretstream_xchacha20poly1305_rekey|sodium_crypto_shorthash_keygen|sodium_crypto_shorthash|sodium_crypto_sign_detached|sodium_crypto_sign_ed25519_pk_to_curve25519|sodium_crypto_sign_ed25519_sk_to_curve25519|sodium_crypto_sign_keypair_from_secretkey_and_publickey|sodium_crypto_sign_keypair|sodium_crypto_sign_open|sodium_crypto_sign_publickey_from_secretkey|sodium_crypto_sign_publickey|sodium_crypto_sign_secretkey|sodium_crypto_sign_seed_keypair|sodium_crypto_sign_verify_detached|sodium_crypto_sign|sodium_crypto_stream_keygen|sodium_crypto_stream_xchacha20_keygen|sodium_crypto_stream_xchacha20_xor_ic|sodium_crypto_stream_xchacha20_xor|sodium_crypto_stream_xchacha20|sodium_crypto_stream_xor|sodium_crypto_stream|sodium_hex2bin|sodium_increment|sodium_memcmp|sodium_memzero|sodium_pad|sodium_unpad|ob_tidyhandler|tidy_access_count|tidy_config_count|tidy_error_count|tidy_get_output|tidy_warning_count|tidy_get_body|tidy_clean_repair|tidy_diagnose|tidy_get_error_buffer|tidy_get_config|tidy_get_html_ver|tidy_getopt|tidy_get_opt_doc|tidy_get_release|tidy_get_status|tidy_get_head|tidy_get_html|tidy_is_xhtml|tidy_is_xml|tidy_parse_file|tidy_parse_string|tidy_repair_file|tidy_repair_string|tidy_get_root|odbc_autocommit|odbc_binmode|odbc_close_all|odbc_close|odbc_columnprivileges|odbc_columns|odbc_commit|odbc_connect|odbc_connection_string_is_quoted|odbc_connection_string_quote|odbc_connection_string_should_quote|odbc_cursor|odbc_data_source|odbc_do|odbc_error|odbc_errormsg|odbc_exec|odbc_execute|odbc_fetch_array|odbc_fetch_into|odbc_fetch_object|odbc_fetch_row|odbc_field_len|odbc_field_name|odbc_field_num|odbc_field_precision|odbc_field_scale|odbc_field_type|odbc_foreignkeys|odbc_free_result|odbc_gettypeinfo|odbc_longreadlen|odbc_next_result|odbc_num_fields|odbc_num_rows|odbc_pconnect|odbc_prepare|odbc_primarykeys|odbc_procedurecolumns|odbc_procedures|odbc_result_all|odbc_result|odbc_rollback|odbc_setoption|odbc_specialcolumns|odbc_statistics|odbc_tableprivileges|odbc_tables|xml_error_string|xml_get_current_byte_index|xml_get_current_column_number|xml_get_current_line_number|xml_get_error_code|xml_parse_into_struct|xml_parse|xml_parser_create_ns|xml_parser_create|xml_parser_free|xml_parser_get_option|xml_parser_set_option|xml_set_character_data_handler|xml_set_default_handler|xml_set_element_handler|xml_set_end_namespace_decl_handler|xml_set_external_entity_ref_handler|xml_set_notation_decl_handler|xml_set_object|xml_set_processing_instruction_handler|xml_set_start_namespace_decl_handler|xml_set_unparsed_entity_decl_handler|xmlwriter_end_attribute|xmlwriter_end_cdata|xmlwriter_end_comment|xmlwriter_end_document|xmlwriter_end_dtd|xmlwriter_end_dtd_attlist|xmlwriter_end_dtd_element|xmlwriter_end_dtd_entity|xmlwriter_end_element|xmlwriter_end_pi|xmlwriter_flush|xmlwriter_full_end_element|xmlwriter_open_memory|xmlwriter_open_uri|xmlwriter_output_memory|xmlwriter_set_indent|xmlwriter_set_indent_string|xmlwriter_start_attribute|xmlwriter_start_attribute_ns|xmlwriter_start_cdata|xmlwriter_start_comment|xmlwriter_start_document|xmlwriter_start_dtd|xmlwriter_start_dtd_attlist|xmlwriter_start_dtd_element|xmlwriter_start_dtd_entity|xmlwriter_start_element|xmlwriter_start_element_ns|xmlwriter_start_pi|xmlwriter_text|xmlwriter_write_attribute|xmlwriter_write_attribute_ns|xmlwriter_write_cdata|xmlwriter_write_comment|xmlwriter_write_dtd|xmlwriter_write_dtd_attlist|xmlwriter_write_dtd_element|xmlwriter_write_dtd_entity|xmlwriter_write_element|xmlwriter_write_element_ns|xmlwriter_write_pi|xmlwriter_write_raw|zip_close|zip_entry_close|zip_entry_compressedsize|zip_entry_compressionmethod|zip_entry_filesize|zip_entry_name|zip_entry_open|zip_entry_read|zip_open|zip_read)(\s*\(|$))/gi; // collisions: while
	jush.links2.php_new = new RegExp('(\\b)(' + php_class.source + '|(stdClass)|(__PHP_Incomplete_Class)|(self|parent|static))(\\b)', 'i');
	jush.links2.php_fun = /(\b)(__autoload|(__construct)|(__destruct)|(__call|__callStatic)|(__get|__set|__isset|__unset)|(__sleep|__wakeup)|(__serialize|__unserialize)|(__toString)|(__invoke)|(__set_state)|(__clone))(\b)/i; //! link interfaces method inside class
	jush.links2.phpini = /((?:^|\n)\s*)(allow_call_time_pass_reference|always_populate_raw_post_data|arg_separator\.input|arg_separator\.output|asp_tags|auto_append_file|auto_globals_jit|auto_prepend_file|cgi\.check_shebang_line|cgi\.fix_pathinfo|cgi\.force_redirect|cgi\.redirect_status_env|cgi\.rfc2616_headers|default_charset|default_mimetype|detect_unicode|disable_classes|disable_functions|doc_root|expose_php|extension|extension_dir|fastcgi\.impersonate|file_uploads|gpc_order|include_path|memory_limit|open_basedir|post_max_size|precision|realpath_cache_size|realpath_cache_ttl|register_argc_argv|register_globals|register_long_arrays|request_order|serialize_precision|short_open_tag|sql\.safe_mode|track_vars|upload_max_filesize|max_file_uploads|upload_tmp_dir|user_dir|variables_order|y2k_compliance|zend\.ze1_compatibility_mode|zend\.multibyte|zend_extension|zend_extension_debug|zend_extension_debug_ts|zend_extension_ts|(error_reporting|display_errors|display_startup_errors|log_errors|log_errors_max_len|ignore_repeated_errors|ignore_repeated_source|report_memleaks|track_errors|html_errors|xmlrpc_errors|xmlrpc_error_number|docref_root|docref_ext|error_prepend_string|error_append_string|error_log)|(output_buffering|output_handler|implicit_flush)|(assert\.active|assert\.bail|assert\.warning|assert\.callback|assert\.quiet_eval|enable_dl|max_execution_time|max_input_time|max_input_nesting_level|max_input_vars|magic_quotes_gpc|magic_quotes_runtime|zend\.enable_gc)|(date\.default_latitude|date\.default_longitude|date\.sunrise_zenith|date\.sunset_zenith|date\.timezone)|(cli\.pager|cli\.prompt)|(phar\.readonly|phar\.require_hash|phar\.extract_list|phar\.cache_list)|(zlib\.output_compression|zlib\.output_compression_level|zlib\.output_handler)|(mcrypt\.algorithms_dir|mcrypt\.modes_dir)|(odbc\.default_db *|odbc\.default_user *|odbc\.default_pw *|odbc\.allow_persistent|odbc\.check_persistent|odbc\.max_persistent|odbc\.max_links|odbc\.defaultlrl|odbc\.defaultbinmode|odbc\.default_cursortype)|(pdo\.dsn\..*)|(pdo_mysql\.default_socket|pdo_mysql\.debug)|(pdo_odbc\.connection_pooling|pdo_odbc\.db2_instance_name)|(ibase\.allow_persistent|ibase\.max_persistent|ibase\.max_links|ibase\.default_db|ibase\.default_user|ibase\.default_password|ibase\.default_charset|ibase\.timestampformat|ibase\.dateformat|ibase\.timeformat)|(fbsql\.allow_persistent|fbsql\.generate_warnings|fbsql\.autocommit|fbsql\.max_persistent|fbsql\.max_links|fbsql\.max_connections|fbsql\.max_results|fbsql\.batchSize|fbsql\.default_host|fbsql\.default_user|fbsql\.default_password|fbsql\.default_database|fbsql\.default_database_password)|(ifx\.allow_persistent|ifx\.max_persistent|ifx\.max_links|ifx\.default_host|ifx\.default_user|ifx\.default_password|ifx\.blobinfile|ifx\.textasvarchar|ifx\.byteasvarchar|ifx\.charasvarchar|ifx\.nullformat)|(msql\.allow_persistent|msql\.max_persistent|msql\.max_links)|(mssql\.allow_persistent|mssql\.max_persistent|mssql\.max_links|mssql\.min_error_severity|mssql\.min_message_severity|mssql\.compatability_mode|mssql\.connect_timeout|mssql\.timeout|mssql\.textsize|mssql\.textlimit|mssql\.batchsize|mssql\.datetimeconvert|mssql\.secure_connection|mssql\.max_procs|mssql\.charset)|(mysql\.allow_local_infile|mysql\.allow_persistent|mysql\.max_persistent|mysql\.max_links|mysql\.trace_mode|mysql\.default_port|mysql\.default_socket|mysql\.default_host|mysql\.default_user|mysql\.default_password|mysql\.connect_timeout)|(mysqli\.allow_local_infile|mysqli\.allow_persistent|mysqli\.max_persistent|mysqli\.max_links|mysqli\.default_port|mysqli\.default_socket|mysqli\.default_host|mysqli\.default_user|mysqli\.default_pw|mysqli\.reconnect|mysqli\.cache_size)|(oci8\.connection_class|oci8\.default_prefetch|oci8\.events|oci8\.max_persistent|oci8\.old_oci_close_semantics|oci8\.persistent_timeout|oci8\.ping_interval|oci8\.privileged_connect|oci8\.statement_cache_size)|(pgsql\.allow_persistent|pgsql\.max_persistent|pgsql\.max_links|pgsql\.auto_reset_persistent|pgsql\.ignore_notice|pgsql\.log_notice)|(sqlite3\.extension_dir)|(sybase\.allow_persistent|sybase\.max_persistent|sybase\.max_links|sybase\.interface_file |sybase\.min_error_severity|sybase\.min_message_severity|sybase\.compatability_mode|magic_quotes_sybase|sybct\.allow_persistent|sybct\.max_persistent|sybct\.max_links|sybct\.min_server_severity|sybct\.min_client_severity|sybct\.hostname|sybct\.deadlock_retry_count)|(allow_url_fopen|allow_url_include|user_agent|default_socket_timeout|from|auto_detect_line_endings)|(mime_magic\.debug|mime_magic\.magicfile)|(iconv\.input_encoding|iconv\.output_encoding|iconv\.internal_encoding)|(intl\.default_locale)|(mbstring\.language|mbstring\.detect_order|mbstring\.http_input|mbstring\.http_output|mbstring\.internal_encoding|mbstring\.script_encoding|mbstring\.substitute_character|mbstring\.func_overload|mbstring\.encoding_translation|mbstring\.strict_detection)|(exif\.encode_unicode|exif\.decode_unicode_motorola|exif\.decode_unicode_intel|exif\.encode_jis|exif\.decode_jis_motorola|exif\.decode_jis_intel)|(gd\.jpeg_ignore_warning)|(mail\.add_x_header|mail\.log|SMTP|smtp_port|sendmail_from|sendmail_path)|(bcmath\.scale)|(sysvshm\.init_mem)|(ignore_user_abort|highlight\.string|highlight\.comment|highlight\.keyword|highlight\.bg|highlight\.default|highlight\.html|browscap)|(tidy\.default_config|tidy\.clean_output)|(curl\.cainfo)|(ldap\.max_links)|(define_syslog_variables)|(engine|child_terminate|last_modified|xbithack)|(nsapi\.read_timeout)|(session\.save_path|session\.name|session\.save_handler|session\.auto_start|session\.gc_probability|session\.gc_divisor|session\.gc_maxlifetime|session\.serialize_handler|session\.cookie_lifetime|session\.cookie_path|session\.cookie_domain|session\.cookie_secure|session\.cookie_httponly|session\.use_cookies|session\.use_only_cookies|session\.referer_check|session\.entropy_file|session\.entropy_length|session\.cache_limiter|session\.cache_expire|session\.use_trans_sid|session\.bug_compat_42|session\.bug_compat_warn|session\.hash_function|session\.hash_bits_per_character|url_rewriter\.tags|session\.upload_progress\.enabled|session\.upload_progress\.cleanup|session\.upload_progress\.prefix|session\.upload_progress\.name|session\.upload_progress\.freq|session\.upload_progress\.min_freq)|(pcre\.backtrack_limit|pcre\.recursion_limit)|(filter\.default|filter\.default_flags)|(unserialize_callback_func)|(soap\.wsdl_cache_enabled|soap\.wsdl_cache_dir|soap\.wsdl_cache_ttl|soap\.wsdl_cache|soap\.wsdl_cache_limit)|(com\.allow_dcom|com\.autoregister_typelib|com\.autoregister_verbose|com\.autoregister_casesensitive|com\.code_page|com\.typelib_file)|(suhosin\.[-a-z0-9_.]+))(\b)/gi;
	jush.links2.php_doc = /(^[ \t]*|\n\s*\*\s*|(?={))(@(?:abstract|access|author|category|copyright|deprecated|example|final|filesource|global|ignore|internal|license|link|method|name|package|param|property|return|see|since|static|staticvar|subpackage|todo|tutorial|uses|var|version)|(@(?:exception|throws))|(\{@(?:example|id|internal|inheritdoc|link|source|toc|tutorial)))(\b)/g;
	jush.links2.mail = /(^|\n|\\n)(Return-Path|Received|Path|DL-Expansion-History-Indication|(MIME-Version|Control|Also-Control|Original-Encoded-Information-Types|Alternate-Recipient|Disclose-Recipients|Content-Disposition)|(From|Approved|Sender|To|Cc|Bcc|For-Handling|For-Comment|Newsgroups|Apparently-To|Distribution|Fax|Telefax|Phone|Mail-System-Version|Mailer|Originating-Client|X-Mailer|X-Newsreader)|(Reply-To|Followup-To|Errors-To|Return-Receipt-To|Prevent-NonDelivery-Report|Generate-Delivery-Report|Content-Return|X400-Content-Return)|(Message-ID|Content-ID|Content-Base|Content-Location|In-Reply-To|References|See-Also|Obsoletes|Supersedes|Article-Updates|Article-Names)|(Keywords|Subject|Comments|Content-Description|Organization|Organisation|Summary|Content-Identifier)|(Delivery-Date|Date|Expires|Expiry-Date|Reply-By)|(Priority|Precedence|Importance|Sensitivity|Incomplete-Copy)|(Language|Content-Language)|(Content-Length|Lines)|(Conversion|Content-Conversion|Conversion-With-Loss)|(Content-Type|Content-SGML-Entity|Content-Transfer-Encoding|Message-Type|Encoding)|(Resent-Reply-To|Resent-From|Resent-Sender|Resent-From|Resent-Date|Resent-To|Resent-cc|Resent-bcc|Resent-Message-ID)|(Content-MD5|Xref)|(Fcc|Auto-Forwarded|Discarded-X400-IPMS-Extensions|Discarded-X400-MTS-Extensions|Status))(:|$)/gi;
})();



jush.tr.simpledb = { sqlite_apo: /'/, sqlite_quo: /"/, bac: /`/ };

jush.urls.simpledb = ['https://docs.aws.amazon.com/AmazonSimpleDB/latest/DeveloperGuide/$key.html',
	'QuotingRulesSelect', 'CountingDataSelect', 'SortingDataSelect', 'SimpleQueriesSelect', 'UsingSelectOperators', 'RangeValueQueriesSelect', ''
];

jush.links2.simpledb = /(\b)(select|limit|(count)|(order\s+by|asc|desc)|(where)|(between|like|is|in)|(every)|(or|and|not|from|null|intersection))(\b)/gi;



jush.tr.sql = { one: /-- |#|--(?=\n|$)/, com_code: /\/\*![0-9]*|\*\//, com: /\/\*/, sql_sqlset: /(\s*)(SET)(\s+|$)(?!NAMES\b|CHARACTER\b|PASSWORD\b|(?:GLOBAL\s+|SESSION\s+)?TRANSACTION\b|@[^@]|NEW\.|OLD\.)/i, sql_code: /()/ };
jush.tr.sql_code = { sql_apo: /'/, sql_quo: /"/, bac: /`/, one: /-- |#|--(?=\n|$)/, com_code: /\/\*![0-9]*|\*\//, com: /\/\*/, sql_var: /\B@/, num: jush.num, _1: /;|\b(THEN|ELSE|LOOP|REPEAT|DO)\b/i };
jush.tr.sql_sqlset = { one: /-- |#|--(?=\n|$)/, com: /\/\*/, sqlset_val: /=/, _1: /;|$/ };
jush.tr.sqlset_val = { sql_apo: /'/, sql_quo: /"/, bac: /`/, one: /-- |#|--(?=\n|$)/, com: /\/\*/, _1: /,/, _2: /;|$/, num: jush.num }; //! comma can be inside function call
jush.tr.sqlset = { _0: /$/ }; //! jump from SHOW VARIABLES LIKE ''
jush.tr.sqlstatus = { _0: /$/ }; //! jump from SHOW STATUS LIKE ''
jush.tr.com_code = { _1: /()/ };

jush.urls.sql_sqlset = 'https://dev.mysql.com/doc/mysql/en/$key';
jush.urls.sql = ['https://dev.mysql.com/doc/mysql/en/$key',
	'alter-event.html', 'alter-table.html', 'alter-view.html', 'analyze-table.html', 'create-event.html', 'create-function.html', 'create-procedure.html', 'create-index.html', 'create-table.html', 'create-trigger.html', 'create-view.html', 'drop-index.html', 'drop-table.html', 'begin-end.html', 'optimize-table.html', 'repair-table.html', 'set-transaction.html', 'show-columns.html', 'show-engines.html', 'show-index.html', 'show-processlist.html', 'show-status.html', 'show-tables.html', 'show-variables.html',
	'$1.html', '$1-statement.html', 'if-statement.html', 'repeat-statement.html', 'truncate-table.html', 'commit.html', 'savepoints.html', 'lock-tables.html', 'charset-connection.html', 'insert-on-duplicate.html', 'fulltext-search.html', 'example-auto-increment.html',
	'comparison-operators.html#operator_$1', 'comparison-operators.html#function_$1', 'any-in-some-subqueries.html', 'all-subqueries.html', 'exists-and-not-exists-subqueries.html', 'group-by-modifiers.html', 'string-functions.html#operator_$1', 'string-comparison-functions.html#operator_$1', 'regexp.html#operator_$1', 'regexp.html#operator_regexp', 'logical-operators.html#operator_$1', 'control-flow-functions.html#operator_$1', 'arithmetic-functions.html#operator_$1', 'cast-functions.html#operator_$1', 'date-and-time-functions.html#function_$1', 'date-and-time-functions.html#function_date-add',
	'', // keywords without link
	'numeric-type-syntax.html', 'date-and-time-type-syntax.html', 'string-type-syntax.html', 'mysql-spatial-datatypes.html',
	'mathematical-functions.html#function_$1', 'information-functions.html#function_$1',
	'$1-storage-engine.html', 'merge-storage-engine.html',
	'partitioning-range.html', 'partitioning-list.html', 'partitioning-columns.html', 'partitioning-hash.html', 'partitioning-linear-hash.html', 'partitioning-key.html',
	'comparison-operators.html#function_$1', 'control-flow-functions.html#function_$1', 'string-functions.html#function_$1', 'string-comparison-functions.html#function_$1', 'mathematical-functions.html#function_$1', 'date-and-time-functions.html#function_$1', 'cast-functions.html#function_$1', 'xml-functions.html#function_$1', 'bit-functions.html#function_$1', 'encryption-functions.html#function_$1', 'information-functions.html#function_$1', 'miscellaneous-functions.html#function_$1', 'group-by-functions.html#function_$1',
	'functions-to-convert-geometries-between-formats.html#function_asbinary',
	'functions-to-convert-geometries-between-formats.html#function_astext',
	'functions-for-testing-spatial-relations-between-geometric-objects.html#function_$1',
	'functions-that-create-new-geometries-from-existing-ones.html#function_$1',
	'geometry-property-functions.html#function_$1',
	'gis-wkt-functions.html#function_st-$1',
	'row-subqueries.html',
	'fulltext-search.html#function_match'
];
jush.urls.sqlset = ['https://dev.mysql.com/doc/mysql/en/$key',
	'innodb-parameters.html#sysvar_$1',
	'mysql-cluster-program-options-mysqld.html#option_mysqld_$1', 'mysql-cluster-replication-conflict-resolution.html#option_mysqld_$1', 'mysql-cluster-replication-schema.html', 'mysql-cluster-replication-starting.html', 'mysql-cluster-system-variables.html#sysvar_$1',
	'replication-options-binary-log.html#option_mysqld_$1', 'replication-options-binary-log.html#sysvar_$1', 'replication-options-master.html#sysvar_$1', 'replication-options-slave.html#option_mysqld_log-slave-updates', 'replication-options-slave.html#option_mysqld_$1', 'replication-options-slave.html#sysvar_$1', 'replication-options.html#option_mysqld_$1',
	'server-options.html#option_mysqld_big-tables', 'server-options.html#option_mysqld_$1',
	'server-system-variables.html#sysvar_$1', // previously server-session-variables
	'server-system-variables.html#sysvar_low_priority_updates', 'server-system-variables.html#sysvar_max_join_size', 'server-system-variables.html#sysvar_$1',
	'ssl-options.html#option_general_$1'
];
jush.urls.sqlstatus = ['https://dev.mysql.com/doc/mysql/en/$key',
	'server-status-variables.html#statvar_Com_xxx',
	'server-status-variables.html#statvar_$1'
];

jush.links.sql_sqlset = { 'set-statement.html': /.+/ };

jush.links2.sql = /(\b)(ALTER(?:\s+DEFINER\s*=\s*\S+)?\s+EVENT|(ALTER(?:\s+ONLINE|\s+OFFLINE)?(?:\s+IGNORE)?\s+TABLE)|(ALTER(?:\s+ALGORITHM\s*=\s*(?:UNDEFINED|MERGE|TEMPTABLE))?(?:\s+DEFINER\s*=\s*\S+)?(?:\s+SQL\s+SECURITY\s+(?:DEFINER|INVOKER))?\s+VIEW)|(ANALYZE(?:\s+NO_WRITE_TO_BINLOG|\s+LOCAL)?\s+TABLE)|(CREATE(?:\s+DEFINER\s*=\s*\S+)?\s+EVENT)|(CREATE(?:\s+DEFINER\s*=\s*\S+)?\s+FUNCTION)|(CREATE(?:\s+DEFINER\s*=\s*\S+)?\s+PROCEDURE)|(CREATE(?:\s+ONLINE|\s+OFFLINE)?(?:\s+UNIQUE|\s+FULLTEXT|\s+SPATIAL)?\s+INDEX)|(CREATE(?:\s+TEMPORARY)?\s+TABLE)|(CREATE(?:\s+DEFINER\s*=\s*\S+)?\s+TRIGGER)|(CREATE(?:\s+OR\s+REPLACE)?(?:\s+ALGORITHM\s*=\s*(?:UNDEFINED|MERGE|TEMPTABLE))?(?:\s+DEFINER\s*=\s*\S+)?(?:\s+SQL\s+SECURITY\s+(?:DEFINER|INVOKER))?\s+VIEW)|(DROP(?:\s+ONLINE|\s+OFFLINE)?\s+INDEX)|(DROP(?:\s+TEMPORARY)?\s+TABLE)|(END)|(OPTIMIZE(?:\s+NO_WRITE_TO_BINLOG|\s+LOCAL)?\s+TABLE)|(REPAIR(?:\s+NO_WRITE_TO_BINLOG|\s+LOCAL)?\s+TABLE)|(SET(?:\s+GLOBAL|\s+SESSION)?\s+TRANSACTION\s+ISOLATION\s+LEVEL)|(SHOW(?:\s+FULL)?\s+COLUMNS)|(SHOW(?:\s+STORAGE)?\s+ENGINES)|(SHOW\s+(?:INDEX|INDEXES|KEYS))|(SHOW(?:\s+FULL)?\s+PROCESSLIST)|(SHOW(?:\s+GLOBAL|\s+SESSION)?\s+STATUS)|(SHOW(?:\s+FULL)?\s+TABLES)|(SHOW(?:\s+GLOBAL|\s+SESSION)?\s+VARIABLES)|(ALTER\s+(?:DATABASE|SCHEMA)|ALTER\s+LOGFILE\s+GROUP|ALTER\s+SERVER|ALTER\s+TABLESPACE|BACKUP\s+TABLE|CACHE\s+INDEX|CALL|CHANGE\s+MASTER\s+TO|CHECK\s+TABLE|CHECKSUM\s+TABLE|CREATE\s+(?:DATABASE|SCHEMA)|CREATE\s+LOGFILE\s+GROUP|CREATE\s+SERVER|CREATE\s+TABLESPACE|CREATE\s+USER|DELETE|DESCRIBE|DO|DROP\s+(?:DATABASE|SCHEMA)|DROP\s+EVENT|DROP\s+FUNCTION|DROP\s+PROCEDURE|DROP\s+LOGFILE\s+GROUP|DROP\s+SERVER|DROP\s+TABLESPACE|DROP\s+TRIGGER|DROP\s+USER|DROP\s+VIEW|EXPLAIN|FLUSH|GRANT|HANDLER|HELP|INSERT|INSTALL\s+PLUGIN|JOIN|KILL|LOAD\s+DATA\s+FROM\s+MASTER|LOAD\s+DATA|LOAD\s+INDEX|LOAD\s+XML|PURGE\s+MASTER\s+LOGS|RENAME\s+(?:DATABASE|SCHEMA)|RENAME\s+TABLE|RENAME\s+USER|REPLACE|RESET\s+MASTER|RESET\s+SLAVE|RESIGNAL|RESTORE\s+TABLE|REVOKE|SELECT|SET\s+PASSWORD|SHOW\s+AUTHORS|SHOW\s+BINARY\s+LOGS|SHOW\s+BINLOG\s+EVENTS|SHOW\s+CHARACTER\s+SET|SHOW\s+COLLATION|SHOW\s+CONTRIBUTORS|SHOW\s+CREATE\s+(?:DATABASE|SCHEMA)|SHOW\s+CREATE\s+TABLE|SHOW\s+CREATE\s+VIEW|SHOW\s+(?:DATABASE|SCHEMA)S|SHOW\s+ENGINE|SHOW\s+ERRORS|SHOW\s+GRANTS|SHOW\s+MASTER\s+STATUS|SHOW\s+OPEN\s+TABLES|SHOW\s+PLUGINS|SHOW\s+PRIVILEGES|SHOW\s+SCHEDULER\s+STATUS|SHOW\s+SLAVE\s+HOSTS|SHOW\s+SLAVE\s+STATUS|SHOW\s+TABLE\s+STATUS|SHOW\s+TRIGGERS|SHOW\s+WARNINGS|SHOW|SIGNAL|START\s+SLAVE|STOP\s+SLAVE|UNINSTALL\s+PLUGIN|UNION|UPDATE|USE)|(LOOP|LEAVE|ITERATE|WHILE)|(IF|ELSEIF)|(REPEAT|UNTIL)|(TRUNCATE(?:\s+TABLE)?)|(START\s+TRANSACTION|BEGIN|COMMIT|ROLLBACK)|(SAVEPOINT|ROLLBACK\s+TO\s+SAVEPOINT)|((?:UN)?LOCK\s+TABLES?)|(SET\s+NAMES|SET\s+CHARACTER\s+SET)|(ON\s+DUPLICATE\s+KEY\s+UPDATE)|(IN\s+BOOLEAN\s+MODE|IN\s+NATURAL\s+LANGUAGE\s+MODE|WITH\s+QUERY\s+EXPANSION)|(AUTO_INCREMENT)|(IS|IS\s+NULL)|(BETWEEN|NOT\s+BETWEEN|IN|NOT\s+IN)|(ANY|SOME)|(ALL)|(EXISTS|NOT\s+EXISTS)|(WITH\s+ROLLUP)|(SOUNDS\s+LIKE)|(LIKE|NOT\s+LIKE)|(NOT\s+REGEXP|REGEXP)|(RLIKE)|(NOT|AND|OR|XOR)|(CASE)|(DIV)|(BINARY)|(CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|LOCALTIME|LOCALTIMESTAMP|UTC_DATE|UTC_TIME|UTC_TIMESTAMP)|(INTERVAL)|(ACCESSIBLE|ADD|ALTER|ANALYZE|AS|ASC|ASENSITIVE|BEFORE|BOTH|BY|CASCADE|CHANGE|CHARACTER|CHECK|CLOSE|COLLATE|COLUMN|CONDITION|CONSTRAINT|CONTINUE|CONVERT|CREATE|CROSS|CURSOR|DATABASE|DATABASES|DAY_HOUR|DAY_MICROSECOND|DAY_MINUTE|DAY_SECOND|DECLARE|DEFAULT|DELAYED|DESC|DETERMINISTIC|DISTINCT|DISTINCTROW|DROP|DUAL|EACH|ELSE|ENCLOSED|ESCAPED|EXIT|FALSE|FETCH|FLOAT4|FLOAT8|FOR|FORCE|FOREIGN|FROM|FULLTEXT|GROUP|HAVING|HIGH_PRIORITY|HOUR_MICROSECOND|HOUR_MINUTE|HOUR_SECOND|IGNORE|INDEX|INFILE|INNER|INOUT|INSENSITIVE|INT1|INT2|INT3|INT4|INT8|INTO|KEY|KEYS|LEADING|LEFT|LIMIT|LINEAR|LINES|LOAD|LOCK|LONG|LOW_PRIORITY|MASTER_SSL_VERIFY_SERVER_CERT|MATCH|MIDDLEINT|MINUTE_MICROSECOND|MINUTE_SECOND|MODIFIES|NATURAL|NO_WRITE_TO_BINLOG|NULL|OFFSET|ON|OPEN|OPTIMIZE|OPTION|OPTIONALLY|ORDER|OUT|OUTER|OUTFILE|PRECISION|PRIMARY|PROCEDURE|PURGE|RANGE|READ|READS|READ_WRITE|REFERENCES|RELEASE|RENAME|REQUIRE|RESTRICT|RETURN|RIGHT|SCHEMA|SCHEMAS|SECOND_MICROSECOND|SENSITIVE|SEPARATOR|SPATIAL|SPECIFIC|SQL|SQLEXCEPTION|SQLSTATE|SQLWARNING|SQL_BIG_RESULT|SQL_CALC_FOUND_ROWS|SQL_SMALL_RESULT|SSL|STARTING|STRAIGHT_JOIN|TABLE|TERMINATED|THEN|TO|TRAILING|TRIGGER|TRUE|UNDO|UNIQUE|UNLOCK|UNSIGNED|USAGE|USING|VALUES|VARCHARACTER|VARYING|WHEN|WHERE|WITH|WRITE|XOR|YEAR_MONTH|ZEROFILL))\b(?!\()|\b(bit|tinyint|bool|boolean|smallint|mediumint|int|integer|bigint|float|double\s+precision|double|real|decimal|dec|numeric|fixed|(date|datetime|timestamp|time|year)|(char|varchar|binary|varbinary|tinyblob|tinytext|blob|text|mediumblob|mediumtext|longblob|longtext|enum|set)|(geometry|point|linestring|polygon|multipoint|multilinestring|multipolygon|geometrycollection)|(mod)|(CURRENT_USER)|(InnoDB|MyISAM|MEMORY|CSV|ARCHIVE|BLACKHOLE|MERGE|FEDERATED)|(MRG_MyISAM)|(PARTITION\s+BY\s+RANGE)|(PARTITION\s+BY\s+LIST)|(PARTITION\s+BY\s+COLUMNS)|(PARTITION\s+BY\s+HASH)|(PARTITION\s+BY\s+LINEAR\s+HASH)|(PARTITION\s+BY(?:\s+LINEAR)?\s+KEY))\b|\b(coalesce|greatest|isnull|interval|least|(if|ifnull|nullif)|(ascii|bin|bit_length|char|char_length|character_length|concat|concat_ws|conv|elt|export_set|field|find_in_set|format|hex|insert|instr|lcase|left|length|load_file|locate|lower|lpad|ltrim|make_set|mid|oct|octet_length|ord|position|quote|repeat|replace|reverse|right|rpad|rtrim|soundex|sounds_like|space|substr|substring|substring_index|trim|ucase|unhex|upper)|(strcmp)|(abs|acos|asin|atan|atan2|ceil|ceiling|cos|cot|crc32|degrees|exp|floor|ln|log|log2|log10|pi|pow|power|radians|rand|round|sign|sin|sqrt|tan|truncate)|(adddate|addtime|convert_tz|curdate|curtime|date|datediff|date_add|date_format|date_sub|day|dayname|dayofmonth|dayofweek|dayofyear|extract|from_days|from_unixtime|get_format|hour|last_day|makedate|maketime|microsecond|minute|month|monthname|now|period_add|period_diff|quarter|second|sec_to_time|str_to_date|subdate|subtime|sysdate|time|timediff|timestamp|timestampadd|timestampdiff|time_format|time_to_sec|to_days|to_seconds|unix_timestamp|week|weekday|weekofyear|year|yearweek)|(cast|convert)|(extractvalue|updatexml)|(bit_count)|(aes_encrypt|aes_decrypt|compress|decode|encode|des_decrypt|des_encrypt|encrypt|md5|old_password|password|sha|sha1|uncompress|uncompressed_length)|(benchmark|charset|coercibility|collation|connection_id|database|found_rows|last_insert_id|row_count|schema|session_user|system_user|user|version)|(default|get_lock|inet_aton|inet_ntoa|is_free_lock|is_used_lock|master_pos_wait|name_const|release_lock|sleep|uuid|uuid_short|values)|(avg|bit_and|bit_or|bit_xor|count|count_distinct|group_concat|min|max|std|stddev|stddev_pop|stddev_samp|sum|var_pop|var_samp|variance)|(asbinary|aswkb)|(astext|aswkt)|(mbrcontains|mbrdisjoint|mbrequal|mbrintersects|mbroverlaps|mbrtouches|mbrwithin|contains|crosses|disjoint|equals|intersects|overlaps|touches|within)|(buffer|convexhull|difference|intersection|symdifference)|(dimension|envelope|geometrytype|srid|boundary|isempty|issimple|x|y|endpoint|glength|numpoints|pointn|startpoint|isring|isclosed|area|exteriorring|interiorringn|numinteriorrings|centroid|geometryn|numgeometries)|(geomcollfromtext|geomfromtext|linefromtext|mlinefromtext|mpointfromtext|mpolyfromtext|pointfromtext|polyfromtext|bdmpolyfromtext|bdpolyfromtext|geomcollfromwkb|geomfromwkb|linefromwkb|mlinefromwkb|mpointfromwkb|mpolyfromwkb|pointfromwkb|polyfromwkb|bdmpolyfromwkb|bdpolyfromwkb|geometrycollection|linestring|multilinestring|multipoint|multipolygon|point|polygon)|(row)|(match|against))(\s*\(|$)/gi; // collisions: char, set, union(), allow parenthesis - IN, ANY, ALL, SOME, NOT, AND, OR, XOR
jush.links2.sqlset = /(\b)(ignore_builtin_innodb|innodb_adaptive_hash_index|innodb_additional_mem_pool_size|innodb_autoextend_increment|innodb_autoinc_lock_mode|innodb_buffer_pool_awe_mem_mb|innodb_buffer_pool_size|innodb_commit_concurrency|innodb_concurrency_tickets|innodb_data_file_path|innodb_data_home_dir|innodb_doublewrite|innodb_fast_shutdown|innodb_file_io_threads|innodb_file_per_table|innodb_flush_log_at_trx_commit|innodb_flush_method|innodb_force_recovery|innodb_checksums|innodb_lock_wait_timeout|innodb_locks_unsafe_for_binlog|innodb_log_arch_dir|innodb_log_archive|innodb_log_buffer_size|innodb_log_file_size|innodb_log_files_in_group|innodb_log_group_home_dir|innodb_max_dirty_pages_pct|innodb_max_purge_lag|innodb_mirrored_log_groups|innodb_open_files|innodb_rollback_on_timeout|innodb_stats_on_metadata|innodb_support_xa|innodb_sync_spin_loops|innodb_table_locks|innodb_thread_concurrency|innodb_thread_sleep_delay|innodb_use_legacy_cardinality_algorithm|(ndb[-_]batch[-_]size)|(ndb[-_]log[-_]update[-_]as[-_]write|ndb_log_updated_only)|(ndb_log_orig)|(slave[-_]allow[-_]batching)|(have_ndbcluster|multi_range_count|ndb_autoincrement_prefetch_sz|ndb_cache_check_time|ndb_extra_logging|ndb_force_send|ndb_use_copying_alter_table|ndb_use_exact_count|ndb_wait_connected)|(log[-_]bin[-_]trust[-_]function[-_]creators|log[-_]bin)|(binlog_cache_size|max_binlog_cache_size|max_binlog_size|sync_binlog)|(auto_increment_increment|auto_increment_offset)|(ndb_log_empty_epochs)|(log[-_]slave[-_]updates|report[-_]host|report[-_]password|report[-_]port|report[-_]user|slave[-_]net[-_]timeout|slave[-_]skip[-_]errors)|(init_slave|rpl_recovery_rank|slave_compressed_protocol|slave_exec_mode|slave_transaction_retries|sql_slave_skip_counter)|(master[-_]bind|slave[-_]load[-_]tmpdir|server[-_]id)|(sql_big_tables)|(basedir|big[-_]tables|binlog[-_]format|collation[-_]server|datadir|debug|delay[-_]key[-_]write|engine[-_]condition[-_]pushdown|event[-_]scheduler|general[-_]log|character[-_]set[-_]filesystem|character[-_]set[-_]server|character[-_]sets[-_]dir|init[-_]file|language|large[-_]pages|log[-_]error|log[-_]output|log[-_]queries[-_]not[-_]using[-_]indexes|log[-_]slow[-_]queries|log[-_]warnings|log|low[-_]priority[-_]updates|memlock|min[-_]examined[-_]row[-_]limit|old[-_]passwords|open[-_]files[-_]limit|pid[-_]file|port|safe[-_]show[-_]database|secure[-_]auth|secure[-_]file[-_]priv|skip[-_]external[-_]locking|skip[-_]networking|skip[-_]show[-_]database|slow[-_]query[-_]log|socket|sql[-_]mode|tmpdir|version)|(autocommit|error_count|foreign_key_checks|identity|insert_id|last_insert_id|profiling|profiling_history_size|rand_seed1|rand_seed2|sql_auto_is_null|sql_big_selects|sql_buffer_result|sql_log_bin|sql_log_off|sql_log_update|sql_notes|sql_quote_show_create|sql_safe_updates|sql_warnings|timestamp|unique_checks|warning_count)|(sql_low_priority_updates)|(sql_max_join_size)|(automatic_sp_privileges|back_log|bulk_insert_buffer_size|collation_connection|collation_database|completion_type|concurrent_insert|connect_timeout|date_format|datetime_format|default_week_format|delayed_insert_limit|delayed_insert_timeout|delayed_queue_size|div_precision_increment|expire_logs_days|flush|flush_time|ft_boolean_syntax|ft_max_word_len|ft_min_word_len|ft_query_expansion_limit|ft_stopword_file|general_log_file|group_concat_max_len|have_archive|have_blackhole_engine|have_compress|have_crypt|have_csv|have_dynamic_loading|have_example_engine|have_federated_engine|have_geometry|have_innodb|have_isam|have_merge_engine|have_openssl|have_partitioning|have_query_cache|have_raid|have_row_based_replication|have_rtree_keys|have_ssl|have_symlink|hostname|character_set_client|character_set_connection|character_set_database|character_set_results|character_set_system|init_connect|interactive_timeout|join_buffer_size|keep_files_on_create|key_buffer_size|key_cache_age_threshold|key_cache_block_size|key_cache_division_limit|large_page_size|lc_time_names|license|local_infile|locked_in_memory|log_bin|long_query_time|lower_case_file_system|lower_case_table_names|max_allowed_packet|max_connect_errors|max_connections|max_delayed_threads|max_error_count|max_heap_table_size|max_insert_delayed_threads|max_join_size|max_length_for_sort_data|max_prepared_stmt_count|max_relay_log_size|max_seeks_for_key|max_sort_length|max_sp_recursion_depth|max_tmp_tables|max_user_connections|max_write_lock_count|myisam_data_pointer_size|myisam_max_sort_file_size|myisam_recover_options|myisam_repair_threads|myisam_sort_buffer_size|myisam_stats_method|myisam_use_mmap|named_pipe|net_buffer_length|net_read_timeout|net_retry_count|net_write_timeout|new|old|optimizer_prune_level|optimizer_search_depth|optimizer_switch|plugin_dir|preload_buffer_size|prepared_stmt_count|protocol_version|pseudo_thread_id|query_alloc_block_size|query_cache_limit|query_cache_min_res_unit|query_cache_size|query_cache_type|query_cache_wlock_invalidate|query_prealloc_size|range_alloc_block_size|read_buffer_size|read_only|read_rnd_buffer_size|relay_log_purge|relay_log_space_limit|shared_memory|shared_memory_base_name|slow_launch_time|slow_query_log_file|sort_buffer_size|sql_select_limit|storage_engine|sync_frm|system_time_zone|table_cache|table_definition_cache|table_lock_wait_timeout|table_open_cache|table_type|thread_cache_size|thread_concurrency|thread_handling|thread_stack|time_format|time_zone|timed_mutexes|tmp_table_size|transaction_alloc_block_size|transaction_prealloc_size|tx_isolation|updatable_views_with_limit|version_comment|version_compile_machine|version_compile_os|wait_timeout)|(ssl[-_]ca|ssl[-_]capath|ssl[-_]cert|ssl[-_]cipher|ssl[-_]key))((?!-)\b)/gi;
jush.links2.sqlstatus = /()(Com_.+|(.+))()/gi;



jush.tr.sqlite = { sqlite_apo: /'/, sqlite_quo: /"/, bra: /\[/, bac: /`/, one: /--/, com: /\/\*/, sql_var: /[:@$]/, sqlite_sqliteset: /(\b)(PRAGMA)(\s+)/i, num: jush.num };
jush.tr.sqlite_sqliteset = { sqlite_apo: /'/, sqlite_quo: /"/, bra: /\[/, bac: /`/, one: /--/, com: /\/\*/, num: jush.num, _1: /;|$/ };
jush.tr.sqliteset = { _0: /$/ };
jush.tr.sqlitestatus = { _0: /$/ };

jush.urls.sqlite_sqliteset = 'https://www.sqlite.org/$key';
jush.urls.sqlite = ['https://www.sqlite.org/$key',
	'lang_$1.html', 'lang_createvtab.html', 'lang_transaction.html',
	'lang_createindex.html', 'lang_createtable.html', 'lang_createtrigger.html', 'lang_createview.html',
	'',
	'lang_expr.html#$1', 'lang_corefunc.html#$1', 'lang_datefunc.html#$1', 'lang_aggfunc.html#$1'
];
jush.urls.sqliteset = ['https://www.sqlite.org/pragma.html#$key',
	'pragma_$1'
];
jush.urls.sqlitestatus = ['https://www.sqlite.org/compile.html#$key',
	'$1'
];

jush.links.sqlite_sqliteset = { 'pragma.html': /.+/ };

jush.links2.sqlite = /(\b)(ALTER\s+TABLE|ANALYZE|ATTACH|COPY|DELETE|DETACH|DROP\s+INDEX|DROP\s+TABLE|DROP\s+TRIGGER|DROP\s+VIEW|EXPLAIN|INSERT|CONFLICT|REINDEX|REPLACE|SELECT|UPDATE|TRANSACTION|VACUUM|(CREATE\s+VIRTUAL\s+TABLE)|(BEGIN|COMMIT|ROLLBACK)|(CREATE(?:\s+UNIQUE)?\s+INDEX)|(CREATE(?:\s+TEMP|\s+TEMPORARY)?\s+TABLE)|(CREATE(?:\s+TEMP|\s+TEMPORARY)?\s+TRIGGER)|(CREATE(?:\s+TEMP|\s+TEMPORARY)?\s+VIEW)|(ABORT|ACTION|ADD|AFTER|ALL|AS|ASC|AUTOINCREMENT|BEFORE|BY|CASCADE|CHECK|COLUMN|CONSTRAINT|CROSS|CURRENT_DATE|CURRENT_TIME|CURRENT_TIMESTAMP|DATABASE|DEFAULT|DEFERRABLE|DEFERRED|DESC|DISTINCT|EACH|END|EXCEPT|EXCLUSIVE|FAIL|FOR|FOREIGN|FROM|FULL|GROUP|HAVING|IF|IGNORE|IMMEDIATE|INDEXED|INITIALLY|INNER|INSTEAD|INTERSECT|INTO|IS|JOIN|KEY|LEFT|LIMIT|NATURAL|NO|NOT|NOTNULL|NULL|OF|OFFSET|ON|ORDER|OUTER|PLAN|PRAGMA|PRIMARY|QUERY|RAISE|REFERENCES|RELEASE|RENAME|RESTRICT|RIGHT|ROW|SAVEPOINT|SET|TEMPORARY|TO|UNION|UNIQUE|USING|VALUES|WHERE)|(like|glob|regexp|match|escape|isnull|isnotnull|between|exists|case|when|then|else|cast|collate|in|and|or|not))\b|\b(abs|coalesce|glob|ifnull|hex|last_insert_rowid|length|like|load_extension|lower|nullif|quote|random|randomblob|round|soundex|sqlite_version|substr|typeof|upper|(date|time|datetime|julianday|strftime)|(avg|count|max|min|sum|total))(\s*\(|$)/gi; // collisions: min, max, end, like, glob
jush.links2.sqliteset = /(\b)(auto_vacuum|cache_size|case_sensitive_like|count_changes|default_cache_size|empty_result_callbacks|encoding|foreign_keys|full_column_names|fullfsync|incremental_vacuum|journal_mode|journal_size_limit|legacy_file_format|locking_mode|page_size|max_page_count|read_uncommitted|recursive_triggers|reverse_unordered_selects|secure_delete|short_column_names|synchronous|temp_store|temp_store_directory|collation_list|database_list|foreign_key_list|freelist_count|index_info|index_list|page_count|table_info|schema_version|compile_options|integrity_check|quick_check|parser_trace|vdbe_trace|vdbe_listing)(\b)/gi;
jush.links2.sqlitestatus = /()(.+)()/g;



jush.textarea = (function () {
	//! IE sometimes inserts empty <p> in start of a string when newline is entered inside
	
	function findSelPos(pre) {
		var sel = getSelection();
		if (sel.rangeCount) {
			var range = sel.getRangeAt(0);
			return findPosition(pre, range.startContainer, range.startOffset);
		}
	}

	function findPosition(el, container, offset) {
		var pos = { pos: 0 };
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
			for (var i = 0; i < offset; i++) {
				findPositionRecurse(child.childNodes[i], container, offset, pos);
			}
			return true;
		} else {
			if (/^(br|div)$/i.test(child.tagName)) {
				pos.pos++;
			}
			for (var i = 0; i < child.childNodes.length; i++) {
				if (findPositionRecurse(child.childNodes[i], container, offset, pos)) {
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
			for (var i = 0; i < child.childNodes.length; i++) {
				if (/^br$/i.test(child.childNodes[i].tagName)) {
					if (!pos.pos) {
						return { container: child, offset: i };
					}
					pos.pos--;
					if (!pos.pos && i == child.childNodes.length - 1) { // last invisible <br>
						return { container: child, offset: i };
					}
				} else {
					var result = findOffsetRecurse(child.childNodes[i], pos);
					if (result) {
						return result;
					}
				}
			}
		}
	}
	
	function setSelPos(pre, pos) {
		if (pos) {
			var start = findOffset(pre, pos);
			if (start) {
				var range = document.createRange();
				range.setStart(start.container, start.offset);
				var sel = getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			}
		}
	}

	function setText(pre, text, end) {
		var lang = 'txt';
		if (text.length < 1e4) { // highlighting is slow with most languages
			var match = /(^|\s)(?:jush|language)-(\S+)/.exec(pre.jushTextarea.className);
			lang = (match ? match[2] : 'htm');
		}
		var html = jush.highlight(lang, text).replace(/\n/g, '<br>');
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
			var isUndo = (event.keyCode == 90); // 90 - z
			var isRedo = (event.keyCode == 89 || (event.keyCode == 90 && event.shiftKey)); // 89 - y
			if (isUndo || isRedo) {
				if (isRedo) {
					if (this.jushUndoPos + 1 < this.jushUndo.length) {
						this.jushUndoPos++;
						var undo = this.jushUndo[this.jushUndoPos];
						setText(this, undo.text, undo.end)
					}
				} else if (this.jushUndoPos >= 0) {
					this.jushUndoPos--;
					var undo = this.jushUndo[this.jushUndoPos] || { html: '', text: '' };
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
	openAc = false;
	closeAutocomplete();

	function findState(node) {
		let match;
		while (node && !(match = (node.className || '').match(/(^|\s)jush-(?!op\b)(\w+)/))) {
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
				openAutocomplete(pre);
			}
		}
	}
	
	function setLastPos(pre) {
		if (pre.lastPos === undefined) {
			pre.lastPos = findSelPos(pre);
		}
	}
	
	var forceNewUndo = true;
	
	function highlight(pre) {
		var start = pre.lastPos;
		pre.lastPos = undefined;
		var innerHTML = pre.innerHTML;
		if (innerHTML != pre.lastHTML) {
			var end = findSelPos(pre);
			innerHTML = innerHTML.replace(/<br>((<\/[^>]+>)*<\/?div>)(?!$)/gi, function (all, rest) {
				if (end) {
					end--;
				}
				return rest;
			});
			pre.innerHTML = innerHTML
				.replace(/^<br\b[^>]*>$/i, '') // Mac OS: Firefox, Chrome
				.replace(/<(br|div)\b[^>]*>/gi, '\n') // Firefox, Chrome
				.replace(/&nbsp;(<\/[pP]\b)/g, '$1') // IE
				.replace(/<\/p\b[^>]*>($|<p\b[^>]*>)/gi, '\n') // IE
				.replace(/(&nbsp;)+$/gm, '') // Chrome for some users
			;
			setText(pre, pre.textContent.replace(/\u00A0/g, ' '), end);
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
		highlight(this);
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
		pre.style.border = '1px inset #ccc';
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



jush.tr.txt = { php: jush.php };
