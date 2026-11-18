# Swipe to Read – החלקה לסימון כנקרא ב-NodeBB

בעמוד **"לא נקראו"** (`/unread`) מחליקים נושא ימינה או שמאלה, והוא מסומן כנקרא ונעלם מהרשימה.
אחר כך מופיעה התראת "הצלחה" רגילה של הפורום: "הנושא סומן כנקרא".

עובד במגע (נייד) ובגרירה עם עכבר (מחשב). גלילה אנכית רגילה לא נפגעת.

## מבנה

```
nodebb-plugin-swipe-to-read/     ← תוסף לשרת
  plugin.json, library.js, package.json
  public/swipe-core.js           ← קוד הליבה (משותף לתוסף ולסקריפט)
  public/client.js               ← מפעיל את הליבה עם ההגדרות מהשרת
  public/admin.js + templates/   ← עמוד הגדרות בלוח הניהול
userscript/nodebb-swipe-to-read.user.js   ← גרסת סקריפט משתמש (נבנית אוטומטית)
build-userscript.js              ← בונה את הסקריפט מתוך swipe-core.js
demo/index.html                  ← עמוד הדגמה לבדיקה מקומית
```

## התקנת התוסף (צד שרת)

```bash
cd /path/to/nodebb-plugin-swipe-to-read && npm link
cd /path/to/nodebb && npm link nodebb-plugin-swipe-to-read
./nodebb build && ./nodebb restart
```

אחר כך מפעילים אותו ב-ACP ← Extend ← Plugins.
ההגדרות נמצאות ב-ACP ← Plugins ← Swipe to Read:
- **סף החלקה**: כמה אחוז מרוחב השורה צריך לגרור (ברירת מחדל 35%)
- **היקף**: רק בעמוד `/unread`, או על כל נושא לא-נקרא בכל רשימה (קטגוריה, אחרונים וכו')

## שפות

הטקסטים של ההחלקה וההתראה מתורגמים ל-18 שפות: עברית, אנגלית, ערבית, פרסית, רוסית, אוקראינית, צרפתית, גרמנית, ספרדית, איטלקית, פורטוגזית, הולנדית, פולנית, טורקית, יפנית, קוריאנית, סינית מפושטת וסינית מסורתית.
השפה נבחרת לפי שפת המשתמש בפורום. שפה שאין לה תרגום מקבלת אנגלית.
גם עמוד ההגדרות בלוח הניהול מתורגם (קבצי `languages/`). בסקריפט אפשר לקבוע שפה ידנית ב-`USER_OPTIONS.lang`.

נבדק על NodeBB 3.x/4.x (ערכת Harmony). התוסף מסתמך על `[component="category/topic"]` עם `data-tid`.

## סקריפט משתמש (צד לקוח)

1. מתקינים Tampermonkey או Violentmonkey.
   **התקנה מהירה:** פותחים את [הקישור הזה](https://raw.githubusercontent.com/TOP-SHEBAMITMACHIM/nodebb-swipe-to-read/main/userscript/nodebb-swipe-to-read.user.js) והתוסף יציע להתקין. עדכונים יגיעו אוטומטית.
2. או ידנית: יוצרים סקריפט חדש ומדביקים את התוכן של `userscript/nodebb-swipe-to-read.user.js`.
3. הסקריפט מוגדר ל-`https://mitmachim.top/*`. לפורום NodeBB נוסף מוסיפים שורת `@match` עם הכתובת שלו.
4. אפשר לשנות את `USER_OPTIONS` בראש הסקריפט.

## איך זה מסמן כנקרא

קודם דרך ה-socket של NodeBB (`topics.markAsRead`, כמו הכפתור "סמן כנקרא" המובנה), ואם זה לא עובד,
דרך ה-API (`PUT /api/v3/topics/:tid/read`). מונה הלא-נקראים בתפריט מתעדכן מהשרת.

## פיתוח

אחרי שינוי ב-`swipe-core.js` מריצים `node build-userscript.js` כדי לעדכן את הסקריפט.
התוסף מפעיל גם אירועי jQuery: `action:swipeToRead.marked`.
