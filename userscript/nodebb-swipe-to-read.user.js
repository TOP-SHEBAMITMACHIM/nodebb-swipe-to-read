// ==UserScript==
// @name         NodeBB – החלקה לסימון כנקרא
// @namespace    nodebb-swipe-to-read
// @version      1.2.0
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
	lang: '', // שפת הטקסטים: '' = לפי שפת המשתמש בפורום, או קוד כמו 'he', 'en', 'ar', 'ru'
};

/*!
 * Swipe-to-Read core
 * משותף לתוסף NodeBB ולסקריפט המשתמש (userscript).
 * החלקה של נושא לא-נקרא הצידה מסמנת אותו כנקרא.
 */
(function (root) {
	'use strict';

	if (root.SwipeToRead) {
		return;
	}

	const ROW_SEL = '[component="category/topic"]';
	const EDGE_GUARD = 24; // px מקצה המסך שבהם לא מתחילים גרירה במגע
	const IGNORE_SEL ='input, button, select, textarea, label, [component="topic/select"], .dropdown-menu, [data-bs-toggle]';

	const DEFAULTS = {
		threshold: 0.35, // חלק מרוחב השורה שצריך לגרור כדי לסמן
		scope: 'unread', // 'unread' = רק בעמוד "לא נקראו", 'all' = כל נושא לא-נקרא בכל רשימה
		alertTimeout: 3000, // כמה זמן (מ"ש) מוצגת ההתראה "הנושא סומן כנקרא"
		lang: '', // ריק = לפי שפת המשתמש בפורום
	};

	/* ---------- תרגומים ---------- */
	// [action, done, error, successTitle, errorTitle]
	// successTitle/errorTitle משמשים רק אם מודול ההתראות של NodeBB לא זמין (אחרת NodeBB מתרגם בעצמו).
	const STRINGS = {
		en: ['Mark as read', 'Topic marked as read', 'Could not mark the topic as read', 'Success', 'Error'],
		he: ['סמן כנקרא', 'הנושא סומן כנקרא', 'לא ניתן לסמן את הנושא כנקרא', 'הצלחה', 'שגיאה'],
		ar: ['تحديد كمقروء', 'تم تحديد الموضوع كمقروء', 'تعذّر تحديد الموضوع كمقروء', 'نجاح', 'خطأ'],
		fa: ['علامت‌گذاری به‌عنوان خوانده‌شده', 'موضوع خوانده‌شده علامت خورد', 'علامت‌گذاری موضوع ممکن نشد', 'موفق', 'خطا'],
		ru: ['Отметить как прочитанное', 'Тема отмечена как прочитанная', 'Не удалось отметить тему как прочитанную', 'Успешно', 'Ошибка'],
		uk: ['Позначити як прочитане', 'Тему позначено як прочитану', 'Не вдалося позначити тему як прочитану', 'Успіх', 'Помилка'],
		fr: ['Marquer comme lu', 'Sujet marqué comme lu', 'Impossible de marquer le sujet comme lu', 'Succès', 'Erreur'],
		de: ['Als gelesen markieren', 'Thema als gelesen markiert', 'Thema konnte nicht als gelesen markiert werden', 'Erfolg', 'Fehler'],
		es: ['Marcar como leído', 'Tema marcado como leído', 'No se pudo marcar el tema como leído', 'Éxito', 'Error'],
		it: ['Segna come letto', 'Discussione segnata come letta', 'Impossibile segnare la discussione come letta', 'Successo', 'Errore'],
		pt: ['Marcar como lido', 'Tópico marcado como lido', 'Não foi possível marcar o tópico como lido', 'Sucesso', 'Erro'],
		nl: ['Markeren als gelezen', 'Onderwerp gemarkeerd als gelezen', 'Kon het onderwerp niet als gelezen markeren', 'Gelukt', 'Fout'],
		pl: ['Oznacz jako przeczytane', 'Temat oznaczony jako przeczytany', 'Nie udało się oznaczyć tematu jako przeczytanego', 'Sukces', 'Błąd'],
		tr: ['Okundu olarak işaretle', 'Konu okundu olarak işaretlendi', 'Konu okundu olarak işaretlenemedi', 'Başarılı', 'Hata'],
		ja: ['既読にする', 'トピックを既読にしました', 'トピックを既読にできませんでした', '成功', 'エラー'],
		ko: ['읽음으로 표시', '주제를 읽음으로 표시했습니다', '주제를 읽음으로 표시할 수 없습니다', '성공', '오류'],
		'zh-CN': ['标记为已读', '主题已标记为已读', '无法将主题标记为已读', '成功', '错误'],
		'zh-TW': ['標記為已讀', '主題已標記為已讀', '無法將主題標記為已讀', '成功', '錯誤'],
	};
	const LABEL_KEYS = ['action', 'done', 'error', 'successTitle', 'errorTitle'];

	// "en-GB" → en, "pt-BR" → pt, "zh-CN" נשאר zh-CN. שפה לא מוכרת → אנגלית.
	function resolveLang(code) {
		code = String(code || '').replace('_', '-');
		if (STRINGS[code]) {
			return code;
		}
		const base = code.split('-')[0].toLowerCase();
		if (base === 'zh') {
			return /tw|hk|hant/i.test(code) ? 'zh-TW' : 'zh-CN';
		}
		return STRINGS[base] ? base : 'en';
	}

	function getLabels(lang) {
		const arr = STRINGS[resolveLang(lang)];
		const out = {};
		LABEL_KEYS.forEach((k, i) => { out[k] = arr[i]; });
		return out;
	}

	function detectLang() {
		const cfg = root.config || {};
		return cfg.userLang || cfg.defaultLang || document.documentElement.lang || navigator.language || 'en';
	}

	let options = null;
	let api = null;
	let st = null; // מצב הגרירה הנוכחית

	/* ---------- תקשורת עם השרת ---------- */

	function emit(event, data) {
		return new Promise((resolve, reject) => {
			const s = root.socket;
			if (!s || typeof s.emit !== 'function') {
				reject(new Error('no-socket'));
				return;
			}
			s.emit(event, data, err => (err ? reject(err) : resolve()));
		});
	}

	function apiCall(method, path) {
		const cfg = root.config || {};
		return fetch((cfg.relative_path || '') + '/api/v3' + path, {
			method: method,
			credentials: 'same-origin',
			headers: { 'x-csrf-token': cfg.csrf_token || '' },
		}).then((res) => {
			if (!res.ok) {
				throw new Error('HTTP ' + res.status);
			}
		});
	}

	const defaultApi = {
		markRead: tid => emit('topics.markAsRead', [tid]).catch(() => apiCall('PUT', '/topics/' + tid + '/read')),
	};

	/* ---------- עזרים ---------- */

	const wait = ms => new Promise(r => setTimeout(r, ms));

	function isUnreadPage() {
		const d = root.ajaxify && root.ajaxify.data;
		return document.body.classList.contains('page-unread') ||
			!!(d && d.template && d.template.unread);
	}

	function isEligible(row) {
		if (!row.getAttribute('data-tid')) {
			return false;
		}
		if (isUnreadPage()) {
			return true;
		}
		return options.scope === 'all' && row.classList.contains('unread');
	}

	function injectCss() {
		if (document.getElementById('str-style')) {
			return;
		}
		const touchSel = options.scope === 'all' ?
			'body.page-unread ' + ROW_SEL + ', ' + ROW_SEL + '.unread' :
			'body.page-unread ' + ROW_SEL;
		// כל הצבעים, הפינות והגופנים נלקחים ממשתני Bootstrap של ערכת העיצוב של הפורום,
		// כך שהעיצוב מתאים את עצמו לכל סקין (כולל מצב כהה) בלי הגדרה נוספת.
		const css = `
${touchSel} { touch-action: pan-y; }
.str-dragging { position: relative; z-index: 2; user-select: none; -webkit-user-select: none; cursor: grabbing;
	background: var(--bs-body-bg, #fff); border-radius: var(--bs-border-radius-lg, .5rem);
	box-shadow: var(--bs-box-shadow, 0 .5rem 1rem rgba(0,0,0,.15)), 0 0 0 1px var(--bs-border-color, #e9ecef); }
.str-anim { transition: transform .26s cubic-bezier(.2,.8,.2,1), opacity .26s ease, box-shadow .26s ease; }
.str-spring { transition: transform .38s cubic-bezier(.34,1.45,.64,1), box-shadow .26s ease; }
.str-bg { position: absolute; z-index: 1; display: flex; align-items: center; gap: .625rem; padding: 0 1.25rem;
	box-sizing: border-box; direction: ltr; overflow: hidden; white-space: nowrap; pointer-events: none; opacity: 0;
	background: var(--bs-success-bg-subtle, #d1e7dd); color: var(--bs-success-text-emphasis, #0a3622);
	border-radius: var(--bs-border-radius-lg, .5rem); font-family: var(--bs-body-font-family, inherit);
	font-size: .875rem; font-weight: 600; transition: background-color .2s ease, color .2s ease; }
.str-bg[data-side="left"] { flex-direction: row; }
.str-bg[data-side="right"] { flex-direction: row-reverse; }
.str-bg .str-icon { flex: none; display: inline-flex; align-items: center; justify-content: center;
	width: 2.25rem; height: 2.25rem; border-radius: 50%; font-size: 1rem;
	background: var(--bs-body-bg, #fff); color: var(--bs-success, #198754);
	transform: scale(calc(.6 + .4 * var(--str-p, 0)));
	transition: transform .2s cubic-bezier(.3,1.6,.5,1), background-color .2s ease, color .2s ease; }
.str-bg .str-label { unicode-bidi: isolate; opacity: var(--str-p, 0); }
.str-bg.str-ready { background: var(--bs-success, #198754); color: #fff; }
.str-bg.str-ready .str-icon { transform: scale(1.12); }
.str-collapse { overflow: hidden !important; transition: height .24s ease, padding .24s ease, margin .24s ease, opacity .24s ease !important; }
@media (prefers-reduced-motion: reduce) {
	.str-anim, .str-spring, .str-collapse, .str-bg, .str-bg .str-icon { transition: none !important; }
}
`;
		const style = document.createElement('style');
		style.id = 'str-style';
		style.textContent = css;
		document.head.appendChild(style);
	}

	/* ---------- הודעה – התראה רגילה של NodeBB ---------- */

	let toastId = null;
	let toastTimer = null;
	let alertsModule; // undefined = עוד לא נטען, false = לא זמין

	// מודול ההתראות של הפורום עצמו – אותו מודול שמציג "הצלחה" / "שגיאה" בכל האתר.
	function loadAlerts() {
		if (alertsModule !== undefined) {
			return Promise.resolve(alertsModule);
		}
		let p;
		if (root.app && typeof root.app.require === 'function') {
			p = root.app.require('alerts');
		} else if (typeof root.require === 'function') {
			p = new Promise((res) => { root.require(['alerts'], res, () => res(false)); });
		} else {
			p = Promise.resolve(false);
		}
		return Promise.resolve(p).then((m) => {
			alertsModule = (m && typeof m.alert === 'function') ? m : false;
			return alertsModule;
		}, () => {
			alertsModule = false;
			return false;
		});
	}

	function escapeHtml(s) {
		return String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
	}

	function getTray() {
		let tray = document.querySelector('[component="toaster/tray"]');
		if (!tray) {
			tray = document.createElement('div');
			tray.setAttribute('component', 'toaster/tray');
			tray.className = 'alert-window fixed-bottom mb-5 mb-md-2 me-2 me-md-5 ms-auto';
			tray.style.cssText = 'width:300px; z-index:1090;';
			document.body.appendChild(tray);
		}
		return tray;
	}

	function removeAlert(id) {
		if (alertsModule) {
			alertsModule.remove(id);
			return;
		}
		const el = document.getElementById('alert_button_' + id);
		if (el) {
			el.classList.remove('show');
			setTimeout(() => el.remove(), 200);
		}
	}

	// גיבוי למקרה שמודול ההתראות לא זמין: אותו מבנה HTML בדיוק כמו התראה של NodeBB.
	function fallbackAlert(id, type, title, messageHtml, timeout) {
		const el = document.createElement('div');
		el.id = 'alert_button_' + id;
		el.setAttribute('role', 'alert');
		el.setAttribute('component', 'toaster/toast');
		el.className = 'alert alert-dismissible alert-' + type + ' fade';
		el.innerHTML =
			'<div class="alert-progress position-absolute top-0 start-0 bottom-0 h-100 z-0" style="opacity:.1"></div>' +
			'<div class="d-flex flex-wrap gap-2 position-relative"><div class="d-flex flex-column gap-2">' +
			'<strong>' + escapeHtml(title) + '</strong><p class="m-0">' + messageHtml + '</p></div></div>' +
			'<button type="button" class="btn-close" aria-label="close"></button>';
		el.querySelector('.btn-close').addEventListener('click', () => removeAlert(id));
		getTray().prepend(el);
		const bar = el.querySelector('.alert-progress');
		requestAnimationFrame(() => requestAnimationFrame(() => {
			el.classList.add('show');
			bar.style.transition = 'width ' + timeout + 'ms linear';
			bar.classList.add('animate');
		}));
	}

	function closeToast() {
		if (!toastId) {
			return;
		}
		clearTimeout(toastTimer);
		const id = toastId;
		toastId = null;
		removeAlert(id);
	}

	function showToast(msg, type) {
		closeToast();
		const isError = type === 'error';
		const id = 'swipe-to-read-' + Date.now();
		const messageHtml = escapeHtml(msg);
		toastId = id;
		toastTimer = setTimeout(closeToast, options.alertTimeout);

		loadAlerts().then((mod) => {
			if (toastId !== id) {
				return; // ההודעה כבר הוחלפה/נסגרה
			}
			const nbType = isError ? 'danger' : 'success';
			if (mod) {
				mod.alert({
					alert_id: id,
					type: nbType,
					title: isError ? '[[global:alert.error]]' : '[[global:alert.success]]',
					message: messageHtml,
					timeout: options.alertTimeout,
				});
			} else {
				fallbackAlert(id, nbType, isError ? options.labels.errorTitle : options.labels.successTitle, messageHtml, options.alertTimeout);
			}
		});
	}

	/* ---------- גרירה ---------- */

	function suppressNextClick() {
		const handler = (e) => {
			e.preventDefault();
			e.stopPropagation();
			e.stopImmediatePropagation();
			remove();
		};
		const remove = () => root.removeEventListener('click', handler, true);
		root.addEventListener('click', handler, true);
		setTimeout(remove, 400);
	}

	function startDrag() {
		const row = st.row;
		const parent = row.parentElement;
		st.dragging = true;
		st.width = row.offsetWidth || 1;
		st.parentPos = parent.style.position;
		st.parentOverflow = parent.style.overflowX;
		if (getComputedStyle(parent).position === 'static') {
			parent.style.position = 'relative';
		}
		parent.style.overflowX = 'clip';
		try { row.setPointerCapture(st.id); } catch (e) { /* ignore */ }
		if (root.getSelection) {
			root.getSelection().removeAllRanges();
		}
		row.classList.add('str-dragging');

		const bg = document.createElement('div');
		bg.className = 'str-bg';
		bg.setAttribute('aria-hidden', 'true');
		bg.style.top = row.offsetTop + 'px';
		bg.style.left = row.offsetLeft + 'px';
		bg.style.width = row.offsetWidth + 'px';
		bg.style.height = row.offsetHeight + 'px';
		bg.innerHTML = '<span class="str-icon"><i class="fa fa-fw fa-check"></i></span><span class="str-label"></span>';
		const label = bg.querySelector('.str-label');
		label.textContent = options.labels.action;
		label.dir = 'auto'; // עברית/ערבית מימין לשמאל, שאר השפות משמאל לימין
		parent.insertBefore(bg, row);
		st.bg = bg;
	}

	function render() {
		const limit = st.width * options.threshold;
		const abs = Math.abs(st.dx);
		const ready = abs >= limit;
		st.row.style.transform = 'translateX(' + st.dx + 'px)';
		st.bg.setAttribute('data-side', st.dx > 0 ? 'left' : 'right');
		st.bg.style.opacity = String(Math.min(1, abs / 24));
		st.bg.style.setProperty('--str-p', String(Math.min(1, abs / limit).toFixed(3)));
		st.bg.classList.toggle('str-ready', ready);
		// רטט קצר בנייד ברגע שעוברים את הסף
		if (ready && !st.wasReady && navigator.vibrate) {
			try { navigator.vibrate(12); } catch (e) { /* ignore */ }
		}
		st.wasReady = ready;
	}

	function cleanup(s) {
		const parent = s.row.parentElement || (s.bg && s.bg.parentElement);
		if (s.bg) {
			s.bg.remove();
		}
		if (parent) {
			parent.style.position = s.parentPos || '';
			parent.style.overflowX = s.parentOverflow || '';
		}
		s.row.classList.remove('str-dragging', 'str-anim', 'str-spring');
	}

	function resetRow(row) {
		['transform', 'opacity', 'height', 'paddingTop', 'paddingBottom', 'marginTop', 'marginBottom', 'transition', 'transitionDuration'].forEach((p) => {
			row.style[p] = '';
		});
		row.classList.remove('str-dragging', 'str-anim', 'str-spring', 'str-collapse', 'str-busy');
	}

	async function snapBack(s) {
		// חזרה עם קפיצה קטנה, כמו גומייה
		s.row.classList.add('str-spring');
		s.row.style.transform = '';
		if (s.bg) {
			s.bg.classList.remove('str-ready');
			s.bg.style.transition = 'opacity .2s ease';
			s.bg.style.opacity = '0';
		}
		await wait(380);
		cleanup(s);
		resetRow(s.row);
	}

	function refreshIfEmpty() {
		if (isUnreadPage() && !document.querySelector(ROW_SEL) && root.ajaxify && typeof root.ajaxify.refresh === 'function') {
			root.ajaxify.refresh();
		}
	}

	async function dismiss(s) {
		const row = s.row;
		const tid = row.getAttribute('data-tid');
		const dir = s.dx >= 0 ? 1 : -1;
		const request = api.markRead(tid).then(() => true, (err) => {
			console.warn('[swipe-to-read] markRead failed', err);
			return false;
		});

		// השורה ממשיכה לצאת במהירות של האצבע: הנפה מהירה = יציאה מהירה
		const remaining = Math.max(0, s.width - Math.abs(s.dx));
		const speed = Math.max(Math.abs(s.v), 1.2); // px/ms
		const dur = Math.round(Math.min(240, Math.max(110, remaining / speed)));
		row.classList.add('str-busy', 'str-anim');
		row.style.transitionDuration = dur + 'ms';
		row.style.transform = 'translateX(' + (dir * s.width) + 'px)';
		row.style.opacity = '0';
		s.bg.style.opacity = '1';
		s.bg.classList.add('str-ready');
		await wait(dur);
		row.style.transitionDuration = '';

		// כיווץ הגובה כדי שהשורות הבאות יעלו בצורה חלקה
		cleanup(s);
		row.style.height = row.offsetHeight + 'px';
		row.classList.add('str-collapse');
		void row.offsetHeight;
		row.style.height = '0px';
		row.style.paddingTop = '0px';
		row.style.paddingBottom = '0px';
		row.style.marginTop = '0px';
		row.style.marginBottom = '0px';

		const [ok] = await Promise.all([request, wait(230)]);
		if (!ok) {
			resetRow(row);
			showToast(options.labels.error, 'error');
			return;
		}

		row.remove();
		resetRow(row);
		emitEvent('marked', { tid: tid, row: row });

		showToast(options.labels.done);
		refreshIfEmpty();
	}

	function emitEvent(name, data) {
		if (root.jQuery) {
			root.jQuery(root).trigger('action:swipeToRead.' + name, data);
		}
	}

	/* ---------- מאזיני אירועים ---------- */

	function onDown(e) {
		if (st || !e.isPrimary || (e.pointerType === 'mouse' && e.button !== 0)) {
			return;
		}
		const row = e.target.closest && e.target.closest(ROW_SEL);
		if (!row || row.classList.contains('str-busy') || e.target.closest(IGNORE_SEL) || !isEligible(row)) {
			return;
		}
		// באנדרואיד החלקה מקצה המסך היא מחוות "חזור" של המערכת – לא מתחילים שם גרירה
		if (e.pointerType !== 'mouse' && (e.clientX < EDGE_GUARD || e.clientX > root.innerWidth - EDGE_GUARD)) {
			return;
		}
		const now = performance.now();
		st = { row: row, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, lastX: e.clientX, lastT: now, v: 0, dragging: false };
	}

	function onMove(e) {
		if (!st || e.pointerId !== st.id) {
			return;
		}
		const dx = e.clientX - st.x0;
		const dy = e.clientY - st.y0;
		if (!st.dragging) {
			if (Math.abs(dy) > 10 && Math.abs(dy) >= Math.abs(dx)) {
				st = null;
				return;
			}
			if (Math.abs(dx) > 12 && Math.abs(dx) > Math.abs(dy) * 1.5) {
				startDrag();
			} else {
				return;
			}
		}
		e.preventDefault();
		const now = performance.now();
		const dt = now - st.lastT;
		if (dt > 0) {
			// מהירות מוחלקת – פחות רגישה לקפיצות בין אירועי מגע בודדים
			const inst = (e.clientX - st.lastX) / dt;
			st.v = st.v ? 0.6 * inst + 0.4 * st.v : inst;
		}
		st.lastX = e.clientX;
		st.lastT = now;
		st.dx = dx;
		render();
	}

	function onUp(e) {
		if (!st || e.pointerId !== st.id) {
			return;
		}
		const s = st;
		st = null;
		if (!s.dragging) {
			return;
		}
		suppressNextClick();
		// אם האצבע עצרה לפני ששוחררה – אין "הנפה"
		if (performance.now() - s.lastT > 90) {
			s.v = 0;
		}
		const abs = Math.abs(s.dx);
		const sameDir = Math.sign(s.v) === Math.sign(s.dx);
		// "הנפה" מהירה מספיקה גם בלי להגיע לסף, אבל רק אחרי מרחק מינימלי
		const flick = Math.abs(s.v) > 0.8 && abs > Math.max(80, s.width * 0.2) && sameDir;
		// התחרטות: עבר את הסף אבל משך חזרה במהירות לפני ששחרר
		const changedMind = !sameDir && Math.abs(s.v) > 0.4;
		if ((abs >= s.width * options.threshold && !changedMind) || flick) {
			dismiss(s);
		} else {
			snapBack(s);
		}
	}

	function onCancel(e) {
		if (!st || e.pointerId !== st.id) {
			return;
		}
		const s = st;
		st = null;
		if (s.dragging) {
			snapBack(s);
		}
	}

	/* ---------- API ציבורי ---------- */

	function init(userOptions) {
		if (options) {
			return root.SwipeToRead;
		}
		userOptions = userOptions || {};
		options = Object.assign({}, DEFAULTS, userOptions);
		options.labels = Object.assign(getLabels(options.lang || detectLang()), userOptions.labels || {});
		options.threshold = Math.min(0.9, Math.max(0.1, Number(options.threshold) || DEFAULTS.threshold));
		api = Object.assign({}, defaultApi, userOptions.api || {});

		injectCss();
		document.addEventListener('pointerdown', onDown, { passive: true });
		document.addEventListener('pointermove', onMove, { passive: false });
		document.addEventListener('pointerup', onUp);
		document.addEventListener('pointercancel', onCancel);
		document.addEventListener('dragstart', (e) => { if (st) { e.preventDefault(); } });
		// בזמן גרירה אופקית נועלים גלילה אנכית, כדי שהדפדפן בנייד לא "יחטוף" את המחווה באמצע
		document.addEventListener('touchmove', (e) => { if (st && st.dragging && e.cancelable) { e.preventDefault(); } }, { passive: false });
		loadAlerts();
		if (root.jQuery) {
			root.jQuery(root).on('action:ajaxify.start', () => closeToast());
		}
		return root.SwipeToRead;
	}

	root.SwipeToRead = { init: init, version: '1.2.0', languages: Object.keys(STRINGS), getLabels: getLabels };
}(typeof window !== 'undefined' ? window : this));

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
