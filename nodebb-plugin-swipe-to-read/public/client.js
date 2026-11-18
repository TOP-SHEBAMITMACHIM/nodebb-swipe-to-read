'use strict';

/* globals $ */
$(document).ready(function () {
	const opts = (window.config && window.config.swipeToRead) || {};
	window.SwipeToRead.init(opts);
});
