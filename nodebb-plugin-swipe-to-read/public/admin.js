'use strict';

define('admin/plugins/swipe-to-read', ['settings', 'alerts'], function (Settings, alerts) {
	const ACP = {};

	ACP.init = function () {
		const form = $('.swipe-to-read-settings');
		Settings.load('swipe-to-read', form);

		$('#save').on('click', function () {
			Settings.save('swipe-to-read', form, function () {
				alerts.success('[[swipe-to-read:saved]]');
			});
		});
	};

	return ACP;
});
