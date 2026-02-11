import { TranscriptChunk } from '@/types'

/**
 * Sample transcript chunks for the AI No-Code video by Avi Levi
 * Video: איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI – לגמרי בלי קוד
 *
 * These would normally be generated from the actual video transcript using Whisper
 * When you have the real transcript, replace these with the actual content
 */
export const aiNoCodeTranscriptChunks: TranscriptChunk[] = [
  {
    id: 'mHThVfGmd6I-chunk-001',
    videoId: 'mHThVfGmd6I',
    text: 'היי לכולם, היום אני הולך להראות לכם איך בניתי אפליקציה מדהימה שמייצרת סיכום קולי יומי של כל החדשות החמות בעולם ה-AI, ובלי לכתוב אפילו שורת קוד אחת.',
    startTime: 0,
    endTime: 15,
  },
  {
    id: 'mHThVfGmd6I-chunk-002',
    videoId: 'mHThVfGmd6I',
    text: 'הרעיון הוא פשוט: כל בוקר האפליקציה אוספת את החדשות החשובות ביותר מהעולם של AI, מסכמת אותן בצורה קצרה וברורה, וממירה את הסיכום לקובץ שמע שאפשר להאזין לו בדרך לעבודה.',
    startTime: 15,
    endTime: 35,
  },
  {
    id: 'mHThVfGmd6I-chunk-003',
    videoId: 'mHThVfGmd6I',
    text: 'השתמשתי בכלי no-code שמאפשרים לבנות אוטומציות מורכבות בלי קוד. הכלי המרכזי שאני משתמש בו הוא Make, שבעבר נקרא Integromat. Make הוא פלטפורמה לאוטומציה שמאפשרת לחבר בין שירותים שונים.',
    startTime: 35,
    endTime: 60,
  },
  {
    id: 'mHThVfGmd6I-chunk-004',
    videoId: 'mHThVfGmd6I',
    text: 'Make מאפשר לחבר בין שירותים שונים ולבנות workflows אוטומטיים. אפשר לחבר API של חדשות, לשלוח את התוכן ל-ChatGPT לסיכום, ואז להמיר את הטקסט לשמע. הכל בממשק ויזואלי פשוט.',
    startTime: 60,
    endTime: 85,
  },
  {
    id: 'mHThVfGmd6I-chunk-005',
    videoId: 'mHThVfGmd6I',
    text: 'הצעד הראשון הוא להביא את החדשות. יש כמה דרכים לעשות את זה: RSS feeds, News API, או אפילו לגרד אתרי חדשות. אני בחרתי להשתמש ב-News API כי הוא פשוט ונותן תוצאות איכותיות.',
    startTime: 85,
    endTime: 110,
  },
  {
    id: 'mHThVfGmd6I-chunk-006',
    videoId: 'mHThVfGmd6I',
    text: 'News API מאפשר לחפש חדשות לפי נושא, מקור, או תאריך. אני מחפש חדשות עם המילים artificial intelligence או machine learning מהיום האחרון. ה-API מחזיר JSON עם כל הכתבות.',
    startTime: 110,
    endTime: 135,
  },
  {
    id: 'mHThVfGmd6I-chunk-007',
    videoId: 'mHThVfGmd6I',
    text: 'אחרי שיש לנו את החדשות, צריך לסכם אותן. כאן נכנס ChatGPT. אני שולח את כל הכתבות ל-API של OpenAI עם prompt שמבקש סיכום קצר וענייני בעברית. זה החלק הכי קסום בתהליך.',
    startTime: 135,
    endTime: 160,
  },
  {
    id: 'mHThVfGmd6I-chunk-008',
    videoId: 'mHThVfGmd6I',
    text: 'ה-prompt שאני משתמש בו הוא: סכם את החדשות הבאות בעברית, בצורה קצרה וברורה, כאילו אתה מגיש חדשות ברדיו. התמקד בנקודות העיקריות ותן סיכום של כל כתבה בשני משפטים.',
    startTime: 160,
    endTime: 185,
  },
  {
    id: 'mHThVfGmd6I-chunk-009',
    videoId: 'mHThVfGmd6I',
    text: 'ChatGPT מחזיר סיכום יפה ומסודר. עכשיו יש לנו טקסט מוכן. השלב הבא הוא להמיר אותו לקול. יש כמה שירותי text-to-speech טובים: ElevenLabs, Google Cloud TTS, או Amazon Polly.',
    startTime: 185,
    endTime: 210,
  },
  {
    id: 'mHThVfGmd6I-chunk-010',
    videoId: 'mHThVfGmd6I',
    text: 'אני בחרתי ב-ElevenLabs כי הקולות שלהם נשמעים הכי טבעיים, והם תומכים גם בעברית. יש להם API פשוט שמקבל טקסט ומחזיר קובץ MP3. התוצאה נשמעת כמו שדר חדשות אמיתי.',
    startTime: 210,
    endTime: 235,
  },
  {
    id: 'mHThVfGmd6I-chunk-011',
    videoId: 'mHThVfGmd6I',
    text: 'ElevenLabs מאפשר לבחור קולות שונים ואפילו ליצור קולות מותאמים אישית. אני משתמש בקול עברי שנקרא דניאל - הוא נשמע טבעי ומקצועי. אפשר גם לשלוט על קצב הדיבור והאינטונציה.',
    startTime: 235,
    endTime: 260,
  },
  {
    id: 'mHThVfGmd6I-chunk-012',
    videoId: 'mHThVfGmd6I',
    text: 'השלב האחרון הוא התזמון. אני משתמש ב-scheduler של Make כדי להריץ את כל התהליך כל בוקר בשעה 7:00. ככה יש לי סיכום חדשות טרי כל יום כשאני קם בבוקר.',
    startTime: 260,
    endTime: 285,
  },
  {
    id: 'mHThVfGmd6I-chunk-013',
    videoId: 'mHThVfGmd6I',
    text: 'אפשר גם לשלוח את קובץ השמע למייל או לטלגרם. אני בחרתי לשלוח לעצמי הודעה בטלגרם עם הקובץ המצורף. ככה אני יכול להאזין ישירות מהטלפון בלי לפתוח אפליקציות נוספות.',
    startTime: 285,
    endTime: 310,
  },
  {
    id: 'mHThVfGmd6I-chunk-014',
    videoId: 'mHThVfGmd6I',
    text: 'היתרון הגדול של הגישה הזו הוא שאפשר להתאים אותה בקלות. רוצים חדשות על קריפטו? משנים את ה-query. רוצים באנגלית? משנים את ה-prompt. רוצים קול אחר? מחליפים ב-ElevenLabs. הכל גמיש.',
    startTime: 310,
    endTime: 335,
  },
  {
    id: 'mHThVfGmd6I-chunk-015',
    videoId: 'mHThVfGmd6I',
    text: 'העלות של כל זה היא יחסית נמוכה. News API יש לו תוכנית חינמית. OpenAI עולה כמה סנטים לסיכום. ElevenLabs יש תוכנית חינמית עם מגבלת תווים. Make גם יש תוכנית חינמית.',
    startTime: 335,
    endTime: 360,
  },
  {
    id: 'mHThVfGmd6I-chunk-016',
    videoId: 'mHThVfGmd6I',
    text: 'לסיכום, בנינו אפליקציה שלמה בלי קוד: איסוף חדשות אוטומטי עם News API, סיכום עם ChatGPT, המרה לשמע עם ElevenLabs, והכל רץ לבד כל יום עם Make. זו הכוח של כלי no-code מודרניים.',
    startTime: 360,
    endTime: 390,
  },
  {
    id: 'mHThVfGmd6I-chunk-017',
    videoId: 'mHThVfGmd6I',
    text: 'עכשיו בואו נצלול לתוך Make ונראה איך בונים את ה-workflow בפועל. אני אראה לכם את הממשק ואיך מחברים את כל החלקים יחד צעד אחר צעד.',
    startTime: 390,
    endTime: 420,
  },
  {
    id: 'mHThVfGmd6I-chunk-018',
    videoId: 'mHThVfGmd6I',
    text: 'ב-Make, כל workflow נקרא Scenario. אני יוצר Scenario חדש ומתחיל להוסיף מודולים. המודול הראשון הוא HTTP Request שמביא את החדשות מ-News API.',
    startTime: 420,
    endTime: 450,
  },
  {
    id: 'mHThVfGmd6I-chunk-019',
    videoId: 'mHThVfGmd6I',
    text: 'ב-HTTP Request אני מגדיר את ה-URL של News API עם הפרמטרים שלי: q=artificial intelligence, language=en, sortBy=publishedAt. זה נותן לי את החדשות הכי עדכניות על AI.',
    startTime: 450,
    endTime: 480,
  },
  {
    id: 'mHThVfGmd6I-chunk-020',
    videoId: 'mHThVfGmd6I',
    text: 'אחרי שהחדשות מגיעות, אני משתמש במודול Iterator כדי לעבור על כל כתבה בנפרד. זה מאפשר לי לעבד את הכתבות אחת אחרי השנייה ולבנות את הטקסט המלא לסיכום.',
    startTime: 480,
    endTime: 510,
  },
  {
    id: 'mHThVfGmd6I-chunk-021',
    videoId: 'mHThVfGmd6I',
    text: 'עכשיו מגיע החלק המעניין - החיבור ל-OpenAI. אני משתמש במודול של OpenAI ב-Make ושולח את כל הכתבות עם הפרומפט שהכנתי מראש לסיכום בעברית.',
    startTime: 510,
    endTime: 540,
  },
  {
    id: 'mHThVfGmd6I-chunk-022',
    videoId: 'mHThVfGmd6I',
    text: 'חשוב להגדיר את ה-system message נכון. אני כותב: אתה עורך חדשות מקצועי. סכם את הכתבות בעברית, בסגנון תמציתי וברור, כאילו אתה מגיש חדשות ברדיו.',
    startTime: 540,
    endTime: 570,
  },
  {
    id: 'mHThVfGmd6I-chunk-023',
    videoId: 'mHThVfGmd6I',
    text: 'התגובה מ-ChatGPT מגיעה מיד, וזה הסיכום שלנו. עכשיו צריך להמיר את זה לקול. אני מוסיף מודול של ElevenLabs ומחבר את הטקסט לקלט שלו.',
    startTime: 570,
    endTime: 600,
  },
  {
    id: 'mHThVfGmd6I-chunk-024',
    videoId: 'mHThVfGmd6I',
    text: 'ב-ElevenLabs אני בוחר את הקול שאני רוצה - יש קולות בעברית ממש איכותיים. אני גם יכול לשלוט על המהירות והסטייל. הפלט הוא קובץ MP3 מוכן.',
    startTime: 600,
    endTime: 630,
  },
  {
    id: 'mHThVfGmd6I-chunk-025',
    videoId: 'mHThVfGmd6I',
    text: 'השלב האחרון הוא לשלוח את הקובץ. אני מוסיף מודול של Telegram Bot ומגדיר אותו לשלוח לי הודעה עם קובץ השמע המצורף. פשוט וקל.',
    startTime: 630,
    endTime: 660,
  },
  {
    id: 'mHThVfGmd6I-chunk-026',
    videoId: 'mHThVfGmd6I',
    text: 'עכשיו בואו נגדיר את התזמון. ב-Make יש אפשרות להפעיל את ה-Scenario בזמנים קבועים. אני מגדיר שזה ירוץ כל יום בשעה 7:00 בבוקר.',
    startTime: 660,
    endTime: 690,
  },
  {
    id: 'mHThVfGmd6I-chunk-027',
    videoId: 'mHThVfGmd6I',
    text: 'חשוב גם להגדיר error handling. מה קורה אם ה-API לא מגיב? מה אם יש בעיה בחיבור? Make מאפשר להגדיר מסלולים חלופיים למקרה של שגיאות.',
    startTime: 690,
    endTime: 720,
  },
  {
    id: 'mHThVfGmd6I-chunk-028',
    videoId: 'mHThVfGmd6I',
    text: 'בואו נדבר על עלויות. News API - יש תוכנית חינמית עד 100 בקשות ביום, מספיק בשבילנו. OpenAI - כל סיכום עולה בערך 2 סנט. ElevenLabs - יש 10,000 תווים בחינם לחודש.',
    startTime: 720,
    endTime: 755,
  },
  {
    id: 'mHThVfGmd6I-chunk-029',
    videoId: 'mHThVfGmd6I',
    text: 'Make עצמו יש תוכנית חינמית עם 1,000 פעולות לחודש. ה-Scenario שלנו משתמש בערך 10-15 פעולות לכל הרצה, אז יש מספיק לכל החודש.',
    startTime: 755,
    endTime: 785,
  },
  {
    id: 'mHThVfGmd6I-chunk-030',
    videoId: 'mHThVfGmd6I',
    text: 'עכשיו בואו נדבר על אפשרויות הרחבה. אפשר להוסיף עוד מקורות חדשות - למשל RSS feeds מבלוגים ספציפיים על AI, או Twitter feeds של אנשים מעניינים.',
    startTime: 785,
    endTime: 815,
  },
  {
    id: 'mHThVfGmd6I-chunk-031',
    videoId: 'mHThVfGmd6I',
    text: 'אפשר גם להוסיף פילטרים חכמים. למשל, לסנן כתבות לפי מילות מפתח ספציפיות, או לדרג את החדשות לפי רלוונטיות ולקחת רק את הטובות ביותר.',
    startTime: 815,
    endTime: 845,
  },
  {
    id: 'mHThVfGmd6I-chunk-032',
    videoId: 'mHThVfGmd6I',
    text: 'רעיון נוסף הוא ליצור גרסאות שונות לנושאים שונים. אפשר לבנות workflow לחדשות טכנולוגיה, אחד לעסקים, אחד לבריאות - כל אחד עם הפרומפט והקול שלו.',
    startTime: 845,
    endTime: 875,
  },
  {
    id: 'mHThVfGmd6I-chunk-033',
    videoId: 'mHThVfGmd6I',
    text: 'אם נהניתם מהסרטון הזה, תשאירו לייק ותירשמו לערוץ. יש לי עוד הרבה פרויקטים מעניינים שאני רוצה לשתף אתכם.',
    startTime: 875,
    endTime: 900,
  },
  // Additional chunks to cover the full 21:48 video (up to 1308 seconds)
  {
    id: 'mHThVfGmd6I-chunk-034',
    videoId: 'mHThVfGmd6I',
    text: 'בואו נסכם את מה שלמדנו היום. הראיתי לכם איך לבנות אפליקציה שלמה בלי קוד, ממש מאפס ועד מוצר עובד. הכל עם כלים חינמיים או זולים מאוד.',
    startTime: 900,
    endTime: 930,
  },
  {
    id: 'mHThVfGmd6I-chunk-035',
    videoId: 'mHThVfGmd6I',
    text: 'עברנו על ארבעה שלבים עיקריים: איסוף החדשות עם News API, סיכום עם ChatGPT, המרה לקול עם ElevenLabs, ושליחה אוטומטית לטלגרם. כל שלב הוא חלק חשוב בתהליך.',
    startTime: 930,
    endTime: 960,
  },
  {
    id: 'mHThVfGmd6I-chunk-036',
    videoId: 'mHThVfGmd6I',
    text: 'הכלי המרכזי שמחבר את הכל הוא Make. זה כלי no-code מדהים שמאפשר לבנות אוטומציות מורכבות בלי שורת קוד אחת. הממשק ויזואלי ואינטואיטיבי.',
    startTime: 960,
    endTime: 990,
  },
  {
    id: 'mHThVfGmd6I-chunk-037',
    videoId: 'mHThVfGmd6I',
    text: 'חשוב לזכור שאפשר להתאים את הפרויקט הזה לצרכים שלכם. רוצים חדשות על נושא אחר? משנים את ה-query. רוצים בשפה אחרת? משנים את ה-prompt.',
    startTime: 990,
    endTime: 1020,
  },
  {
    id: 'mHThVfGmd6I-chunk-038',
    videoId: 'mHThVfGmd6I',
    text: 'אפשר גם להוסיף עוד תכונות. למשל, לשמור את הסיכומים בגוגל דרייב, לשלוח מייל עם הטקסט, או להעלות את הקובץ לפודקאסט. האפשרויות אינסופיות.',
    startTime: 1020,
    endTime: 1050,
  },
  {
    id: 'mHThVfGmd6I-chunk-039',
    videoId: 'mHThVfGmd6I',
    text: 'כמה טיפים לפני שאתם מתחילים: התחילו בקטן, בדקו כל שלב בנפרד לפני שמחברים את הכל. ככה קל יותר לזהות בעיות ולתקן אותן.',
    startTime: 1050,
    endTime: 1080,
  },
  {
    id: 'mHThVfGmd6I-chunk-040',
    videoId: 'mHThVfGmd6I',
    text: 'גם כדאי להגדיר התראות ל-error handling. Make שולח הודעות אם משהו נכשל, ככה תדעו מיד אם יש בעיה ותוכלו לתקן.',
    startTime: 1080,
    endTime: 1110,
  },
  {
    id: 'mHThVfGmd6I-chunk-041',
    videoId: 'mHThVfGmd6I',
    text: 'לגבי ה-scheduler - מומלץ להריץ את האוטומציה בשעה שאתם יודעים שתהיו ערים לצפות בתוצאות. ככה תוכלו לוודא שהכל עובד כמו שצריך.',
    startTime: 1110,
    endTime: 1140,
  },
  {
    id: 'mHThVfGmd6I-chunk-042',
    videoId: 'mHThVfGmd6I',
    text: 'בסרטונים הבאים אני הולך להראות לכם עוד פרויקטים מעניינים. יש לי רעיונות לאוטומציות שעוזרות בעבודה היומיומית, בניהול מידע, ובהרבה דברים אחרים.',
    startTime: 1140,
    endTime: 1170,
  },
  {
    id: 'mHThVfGmd6I-chunk-043',
    videoId: 'mHThVfGmd6I',
    text: 'אם יש לכם שאלות או הצעות, תכתבו בתגובות. אני קורא את כל התגובות ומשתדל לענות לכולם. גם אם נתקעתם בשלב מסוים, אל תתביישו לשאול.',
    startTime: 1170,
    endTime: 1200,
  },
  {
    id: 'mHThVfGmd6I-chunk-044',
    videoId: 'mHThVfGmd6I',
    text: 'אני גם זמין בטלגרם ובדיסקורד - יש לי קבוצות קטנות שם של אנשים שבונים פרויקטים דומים. תרגישו חופשי להצטרף ולשתף את מה שבניתם.',
    startTime: 1200,
    endTime: 1230,
  },
  {
    id: 'mHThVfGmd6I-chunk-045',
    videoId: 'mHThVfGmd6I',
    text: 'אז זהו, זה הסרטון של היום. הראיתי לכם איך לבנות אפליקציה שמייצרת סיכום קולי יומי של חדשות AI, בלי קוד, עם כלים חינמיים בעיקר.',
    startTime: 1230,
    endTime: 1260,
  },
  {
    id: 'mHThVfGmd6I-chunk-046',
    videoId: 'mHThVfGmd6I',
    text: 'תודה שצפיתם עד הסוף! תשאירו לייק אם זה עזר לכם, תירשמו לערוץ כדי לא לפספס את הסרטונים הבאים, ונתראה בסרטון הבא. שלום!',
    startTime: 1260,
    endTime: 1308,
  },
]

/**
 * Video summary for the AI No-Code video
 */
export const aiNoCodeSummary = `
## סיכום הסרטון

### על מה הסרטון?
בסרטון הזה אבי מראה איך לבנות אפליקציה שמייצרת סיכום קולי יומי של חדשות AI - לגמרי בלי לכתוב קוד.

### הכלים שנמצאים בשימוש:
1. **Make (Integromat)** - פלטפורמה לאוטומציה שמחברת בין השירותים
2. **News API** - לאיסוף חדשות על AI ו-Machine Learning
3. **ChatGPT (OpenAI API)** - לסיכום החדשות בעברית
4. **ElevenLabs** - להמרת הטקסט לשמע טבעי בעברית

### התהליך:
1. **איסוף חדשות** - News API מביא את החדשות האחרונות על AI
2. **סיכום** - ChatGPT מסכם את הכתבות בעברית בסגנון חדשות רדיו
3. **המרה לשמע** - ElevenLabs ממיר את הסיכום לקובץ MP3
4. **שליחה** - הקובץ נשלח לטלגרם כל בוקר בשעה 7:00

### יתרונות:
- לא צריך לכתוב קוד
- קל להתאמה אישית (נושא, שפה, קול)
- עלות נמוכה (רוב הכלים יש להם תוכנית חינמית)
- הכל אוטומטי - רץ לבד כל יום
`

/**
 * Get all sample transcript chunks
 */
export function getAllSampleChunks(): TranscriptChunk[] {
  return aiNoCodeTranscriptChunks
}

/**
 * Get sample chunks for a specific video
 */
export function getSampleChunksForVideo(videoId: string): TranscriptChunk[] {
  if (videoId === 'mHThVfGmd6I' || videoId === 'ai-nocode-001') {
    return aiNoCodeTranscriptChunks
  }
  return []
}

/**
 * Get video title by ID
 */
export function getVideoTitle(videoId: string): string {
  if (videoId === 'mHThVfGmd6I' || videoId === 'ai-nocode-001') {
    return 'איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI – לגמרי בלי קוד'
  }
  return 'Unknown Video'
}

/**
 * Get video summary
 */
export function getVideoSummary(videoId: string): string | null {
  if (videoId === 'mHThVfGmd6I' || videoId === 'ai-nocode-001') {
    return aiNoCodeSummary
  }
  return null
}

/**
 * Create a map of video IDs to titles
 */
export function getVideoTitlesMap(): Record<string, string> {
  return {
    mHThVfGmd6I: 'איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI – לגמרי בלי קוד',
    'ai-nocode-001': 'איך בניתי אפליקציה שמייצרת סיכום קולי יומי של חדשות AI – לגמרי בלי קוד',
  }
}
