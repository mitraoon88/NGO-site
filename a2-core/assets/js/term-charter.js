/**
 * TERM CHARTER — editor-side guard, layer 3 of 3.
 *
 * The enforcement ladder (inc/terms.php explains why there are three):
 *
 *   1. `wp_insert_post_data`  — server-side, cannot be bypassed, but cannot stop
 *                               the write either: it restores the previous body.
 *   2. `a2/v1/term-charter`   — the CI lint, so a violation fails a build.
 *   3. this file              — the editor sees the problem as they type, which
 *                               is the only place a violation is cheap to fix.
 *
 * DELIBERATE LIMITS
 * -----------------
 * • This never blocks typing. Turning off the publish button mid-sentence is how
 *   editors learn to hate a CMS, and it teaches them nothing about *why*.
 * • It therefore cannot be the only defence. It is the third of three.
 * • Word-boundary matching, case-insensitive, on the block's text content. It
 *   does not read attributes, so an alt="" or a heading anchor is not scanned —
 *   the server-side scan covers the saved body, and the CI scan covers the whole
 *   file tree.
 *
 * Wired through a SlotFill in the post sidebar plus a notice list under the
 * title, using only public `wp.*` APIs so it survives a WordPress upgrade.
 */
(function (wp) {
	'use strict';

	if (!wp || !wp.plugins || !wp.data || !wp.element) {
		return;
	}

	var __ = wp.i18n.__;
	var el = wp.element.createElement;
	var registerPlugin = wp.plugins.registerPlugin;
	var PluginPostStatusInfo = wp.editPost && wp.editPost.PluginPostStatusInfo;
	var useSelect = wp.data.useSelect;

	/**
	 * Injected by PHP via wp_localize_script — the same rules the server uses, so
	 * there is one source of truth (A2\Core\terms\charter()).
	 */
	var rules = (window.A2TermCharter && window.A2TermCharter.terms) || [];

	/** Build a matcher once per rule rather than per keystroke. */
	var compiled = rules.map(function (rule) {
		return {
			block: !!rule.block,
			match: rule.match,
			replace: rule.replace,
			why: rule.why,
			ref: rule.ref,
			re: new RegExp('\\b' + rule.match.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'gi')
		};
	});

	function scan(text) {
		var hits = [];
		compiled.forEach(function (rule) {
			rule.re.lastIndex = 0;
			if (rule.re.test(text)) {
				hits.push(rule);
			}
		});
		return hits;
	}

	/** Flatten every block's text content, ignoring blocks that carry no prose. */
	function textOf(blocks) {
		var chunks = [];
		blocks.forEach(function (block) {
			if (block.attributes && typeof block.attributes.content === 'string') {
				chunks.push(block.attributes.content.replace(/<[^>]*>/g, ' '));
			}
			if (block.attributes && typeof block.attributes.caption === 'string') {
				chunks.push(block.attributes.caption.replace(/<[^>]*>/g, ' '));
			}
			if (block.innerBlocks && block.innerBlocks.length) {
				chunks.push(textOf(block.innerBlocks));
			}
		});
		return chunks.join(' ');
	}

	function CharterPanel() {
		var state = useSelect(function (select) {
			return {
				blocks: select('core/block-editor').getBlocks(),
				title: select('core/editor').getEditedPostAttribute('title') || ''
			};
		}, []);

		var text = (state.title + ' ' + textOf(state.blocks)).trim();
		if (!text) {
			return null;
		}

		var hits = scan(text);
		if (!hits.length) {
			return el(
				'div',
				{ className: 'a2-charter a2-charter--clean' },
				el('p', null, '\u2713 ' + __('No term-charter issues.', 'a2-core'))
			);
		}

		return el(
			'div',
			{ className: 'a2-charter' },
			el(
				'p',
				{ className: 'a2-charter__head' },
				hits.some(function (h) { return h.block; })
					? __('This post uses a blocked term and cannot publish as written.', 'a2-core')
					: __('This post uses a discouraged term.', 'a2-core')
			),
			el(
				'ul',
				{ className: 'a2-charter__list' },
				hits.map(function (h) {
					return el(
						'li',
						{ key: h.match, className: h.block ? 'is-block' : 'is-warn' },
						el('strong', null, h.match),
						' \u2192 ',
						el('em', null, h.replace || __('(remove)', 'a2-core')),
						el('br'),
						el('span', { className: 'a2-charter__why' }, h.why),
						h.ref ? el('span', { className: 'a2-charter__ref' }, ' ' + h.ref) : null
					);
				})
			)
		);
	}

	/** The publish-blocking summary in the sidebar. */
	function SidebarNotice() {
		var state = useSelect(function (select) {
			return {
				blocks: select('core/block-editor').getBlocks(),
				title: select('core/editor').getEditedPostAttribute('title') || ''
			};
		}, []);

		var text = (state.title + ' ' + textOf(state.blocks)).trim();
		var blocking = text ? scan(text).filter(function (h) { return h.block; }) : [];

		if (!blocking.length) {
			return null;
		}

		return el(
			PluginPostStatusInfo,
			{ className: 'a2-charter-sidebar' },
			el(
				'p',
				null,
				wp.i18n.sprintf(
					/* translators: %d: number of blocked terms */
					wp.i18n._n('%d blocked term', '%d blocked terms', blocking.length, 'a2-core'),
					blocking.length
				),
				' \u2014 ',
				__('see the Term charter panel.', 'a2-core')
			)
		);
	}

	/** Register the document panel (block editor, WP 5.6+). */
	if (wp.editPost && wp.editPost.PluginDocumentSettingPanel) {
		var Panel = function () {
			return el(
				wp.editPost.PluginDocumentSettingPanel,
				{ name: 'a2-term-charter', title: __('Term charter', 'a2-core'), className: 'a2-charter-panel' },
				el(CharterPanel, null)
			);
		};
		registerPlugin('a2-term-charter-panel', { render: Panel });
	}

	if (PluginPostStatusInfo) {
		registerPlugin('a2-term-charter-sidebar', { render: SidebarNotice });
	}
})(window.wp);
