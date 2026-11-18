'use strict';

const meta = require.main.require('./src/meta');
const routeHelpers = require.main.require('./src/routes/helpers');

const SETTINGS_KEY = 'swipe-to-read';
const plugin = {};

plugin.init = async function ({ router }) {
	routeHelpers.setupAdminPageRoute(router, '/admin/plugins/swipe-to-read', (req, res) => {
		res.render('admin/plugins/swipe-to-read', { title: 'Swipe to Read' });
	});
};

plugin.addAdminNavigation = async function (header) {
	header.plugins.push({
		route: '/plugins/swipe-to-read',
		icon: 'fa-hand-pointer-o',
		name: 'Swipe to Read',
	});
	return header;
};

// מעביר את ההגדרות לצד הלקוח דרך window.config.swipeToRead
plugin.getConfig = async function (config) {
	const s = (await meta.settings.get(SETTINGS_KEY)) || {};
	const threshold = parseInt(s.threshold, 10);
	config.swipeToRead = {
		threshold: (threshold >= 10 && threshold <= 90 ? threshold : 35) / 100,
		scope: s.scope === 'all' ? 'all' : 'unread',
	};
	return config;
};

module.exports = plugin;
