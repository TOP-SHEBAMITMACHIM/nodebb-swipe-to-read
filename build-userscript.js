'use strict';

// בונה את סקריפט המשתמש מאותו קוד ליבה שהתוסף משתמש בו.
// הרצה: node build-userscript.js

const fs = require('fs');
const path = require('path');

const core = fs.readFileSync(path.join(__dirname, 'nodebb-plugin-swipe-to-read', 'public', 'swipe-core.js'), 'utf8');
const pkg = require('./nodebb-plugin-swipe-to-read/package.json');

const header = `// ==UserScript==
// @name         NodeBB – החלקה לסימון כנקרא
// @namespace    nodebb-swipe-to-read
// @version      ${pkg.version}
// @description  בעמוד "לא נקראו" בפורום NodeBB: החלקת נושא הצידה מסמנת אותו כנקרא
// @match        https://mitmachim.top/*
// @homepageURL  https://github.com/TOP-SHEBAMITMACHIM/nodebb-swipe-to-read
// @downloadURL  https://raw.githubusercontent.com/TOP-SHEBAMITMACHIM/nodebb-swipe-to-read/main/userscript/nodebb-swipe-to-read.user.js
// @updateURL    https://raw.githubusercontent.com/TOP-SHEBAMITMACHIM/nodebb-swipe-to-read/main/userscript/nodebb-swipe-to-read.user.js
// @grant        none
// @inject-into  page
// @run-at       document-end
// ==/UserScript==

// לפורום NodeBB נוסף: מוסיפים שורת @match עם הכתובת שלו, למשל:  // @match https://forum.example.com/*

/* ---------- הגדרות ---------- */
const USER_OPTIONS = {
	threshold: 0.35, // כמה צריך להחליק (0.1–0.9 מרוחב השורה)
	scope: 'unread', // 'unread' = רק בעמוד /unread,  'all' = כל נושא לא-נקרא בכל רשימה
	alertTimeout: 3000, // כמה זמן (מ"ש) מוצגת ההתראה "הנושא סומן כנקרא"
};
`;

const boot = `
/* ---------- הפעלה ---------- */
(function () {
	'use strict';
	function isNodeBB() {
		return !!(window.config && typeof window.config.relative_path === 'string' && window.app && window.ajaxify);
	}
	function boot() {
		if (isNodeBB()) {
			window.SwipeToRead.init(USER_OPTIONS);
			return true;
		}
		return false;
	}
	if (!boot()) {
		window.addEventListener('load', boot, { once: true });
	}
}());
`;

const out = header + '\n' + core + boot;
const outDir = path.join(__dirname, 'userscript');
fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(path.join(outDir, 'nodebb-swipe-to-read.user.js'), out);
console.log('built userscript/nodebb-swipe-to-read.user.js');
