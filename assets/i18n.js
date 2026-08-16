/* ═══════════════════════════════════════════════════════════════
   Sugar Sugar Camp — ระบบสลับภาษา ไทย ↔ English (i18n.js)
   - ค่าเริ่มต้น: ภาษาไทย · สลับด้วยปุ่มลอย 🌐 มุมล่างซ้ายทุกหน้า
   - เก็บค่าที่เลือกใน localStorage (key: ssc_lang) ใช้ร่วมกันทุกหน้า
   - โหมด EN: แปลข้อความบนหน้าจอด้วยพจนานุกรมวลี + กติกา regex
     (วันที่ พ.ศ.→ค.ศ., จำนวนตัว/คืน/กรง ฯลฯ) ผ่าน MutationObserver
     จึงครอบคลุมทั้ง HTML static และ UI ที่ JavaScript วาดใหม่
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';

var LS_KEY = 'ssc_lang';
var lang = 'th';
try { if (localStorage.getItem(LS_KEY) === 'en') lang = 'en'; } catch(e){}
window.SSC_LANG = lang;

function setLang(l){
  try { localStorage.setItem(LS_KEY, l === 'en' ? 'en' : 'th'); } catch(e){}
  location.reload();
}
window.SSC_I18N = { lang: lang, setLang: setLang };

/* ── ปุ่มสลับภาษา (แสดงทุกภาษา) ─────────────────────────────── */
function injectToggle(){
  if (document.getElementById('ssc-lang-toggle')) return;
  var btn = document.createElement('button');
  btn.id = 'ssc-lang-toggle';
  btn.type = 'button';
  btn.setAttribute('aria-label', lang === 'en' ? 'เปลี่ยนเป็นภาษาไทย' : 'Switch to English');
  btn.innerHTML = lang === 'en' ? '🌐 ไทย' : '🌐 EN';
  btn.style.cssText = [
    'position:fixed','bottom:18px','left:18px','z-index:9999',
    'font-family:inherit','font-size:13px','font-weight:600',
    'padding:9px 16px','border-radius:999px','cursor:pointer',
    'background:#FDF9F2','color:#2A1810','border:1.5px solid rgba(74,51,38,.25)',
    'box-shadow:0 4px 14px rgba(42,24,16,.18)','letter-spacing:.02em'
  ].join(';');
  btn.onmouseenter = function(){ btn.style.background = '#2A1810'; btn.style.color = '#FDF9F2'; };
  btn.onmouseleave = function(){ btn.style.background = '#FDF9F2'; btn.style.color = '#2A1810'; };
  btn.onclick = function(){ setLang(lang === 'en' ? 'th' : 'en'); };
  document.body.appendChild(btn);
}
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', injectToggle);
else injectToggle();

if (lang !== 'en') return;   // โหมดไทย = ไม่ต้องแปลอะไร จบแค่ปุ่ม

/* ════════════════ โหมด English เท่านั้นจากจุดนี้ ════════════════ */
document.documentElement.setAttribute('lang','en');

var THAI_RE = /[฀-๿]/;

/* ── เดือน/ปี ไทย → อังกฤษ (พ.ศ. → ค.ศ.) ──────────────────── */
var TH_MONTHS = {
  'มกราคม':'January','กุมภาพันธ์':'February','มีนาคม':'March','เมษายน':'April',
  'พฤษภาคม':'May','มิถุนายน':'June','กรกฎาคม':'July','สิงหาคม':'August',
  'กันยายน':'September','ตุลาคม':'October','พฤศจิกายน':'November','ธันวาคม':'December',
  'ม.ค.':'Jan','ก.พ.':'Feb','มี.ค.':'Mar','เม.ย.':'Apr','พ.ค.':'May','มิ.ย.':'Jun',
  'ก.ค.':'Jul','ส.ค.':'Aug','ก.ย.':'Sep','ต.ค.':'Oct','พ.ย.':'Nov','ธ.ค.':'Dec'
};
function reEsc(s){ return s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'); }
var MONTH_ALT = Object.keys(TH_MONTHS).sort(function(a,b){return b.length-a.length;})
  .map(reEsc).join('|');
var DATE_RE = new RegExp('(\\d{1,2})\\s+('+MONTH_ALT+')\\s+(\\d{2,4})','g');
function ceYear(y){
  y = parseInt(y,10);
  if (y < 100) return 1957 + y;        // ปี พ.ศ. แบบย่อ 2 หลัก (69 → 2026)
  if (y >= 2400) return y - 543;       // ปี พ.ศ. เต็ม (2569 → 2026)
  return y;
}
function plural(n, one, many){ return parseInt(n,10) === 1 ? one : many; }

/* ── กติกา regex (ทำงานก่อนพจนานุกรม — จับตัวเลข+หน่วย/วันที่) ── */
var REGEX_RULES = [
  [DATE_RE, function(m,d,mo,y){ return d+' '+TH_MONTHS[mo]+' '+ceYear(y); }],
  [/เมื่อสักครู่/g, 'just now'],
  [/(\d+)\s*วินาทีที่แล้ว/g, '$1 sec ago'],
  [/(\d+)\s*นาทีที่แล้ว/g, '$1 min ago'],
  [/(\d+)\s*ชม\.ที่แล้ว/g, '$1 hr ago'],
  [/(\d+)\s*วันที่แล้ว/g, '$1 days ago'],
  [/ชูการ์\s*(\d+)\s*ตัว/g, function(m,n){ return n+' '+plural(n,'glider','gliders'); }],
  [/(\d+)\s*ตัว(?![฀-๿])/g, function(m,n){ return n+' '+plural(n,'glider','gliders'); }],
  [/(\d+)\s*คืน(?![฀-๿])/g, function(m,n){ return n+' '+plural(n,'night','nights'); }],
  [/(\d+)\s*กรง(?![฀-๿])/g, function(m,n){ return n+' '+plural(n,'cage','cages'); }],
  [/(\d+)\s*บ้าน(?![฀-๿])/g, function(m,n){ return n+' '+plural(n,'cage','cages'); }],
  [/(\d+)\s*ครั้ง(?![฀-๿])/g, function(m,n){ return n+' '+plural(n,'visit','visits'); }],
  [/(\d+)\s*รายการ(?![฀-๿])/g, function(m,n){ return n+' '+plural(n,'item','items'); }],
  [/(\d+)\s*ลูกค้า/g, function(m,n){ return n+' '+plural(n,'customer','customers'); }],
  [/(\d+)\s*การจอง/g, function(m,n){ return n+' '+plural(n,'booking','bookings'); }],
  [/(\d+)\s*บาท(?![฀-๿])/g, '$1 THB'],
  [/(\d{1,2}[:.]\d{2})\s*น\./g, '$1'],
  [/กรงว่าง\s+(\d+)/g, 'Free cages $1'],
  [/ว่าง\s+(\d+)/g, '$1 free'],
  [/\/\s*ตัว(?![฀-๿])/g, '/ glider'],
  [/(\d+)\s*เข้า(?![฀-๿])/g, '$1 in'],
  [/(\d+)\s*ออก(?![฀-๿])/g, '$1 out'],
  [/(\d+)\s*วัน(?![฀-๿])/g, function(m,n){ return n+' '+plural(n,'day','days'); }]
];

/* ── EXACT: แปลเมื่อข้อความทั้ง node ตรงกับ key (กันคำสั้นชนคำอื่น) ── */
var EXACT = {
  // <title> ของแต่ละหน้า
  'จองที่พัก · Sugar Sugar Camp 🐿':'Book a Stay · Sugar Sugar Camp 🐿',
  'จองคิวสปา · Sugar Sugar Camp 💅':'Spa Booking · Sugar Sugar Camp 💅',
  'ระบบข้อมูลลูกค้า · Sugar Sugar Camp 🐿':'Customer Database · Sugar Sugar Camp 🐿',
  // ป้าย/ปุ่มสั้นที่ต้อง match ทั้ง node เท่านั้น
  'ปิด':'Close', '✕ ปิด':'✕ Close', 'ลบ':'Delete', '🗑 ลบ':'🗑 Delete',
  'แก้ไข':'Edit', '✎ แก้ไข':'✎ Edit', 'ยกเลิก':'Cancel', 'วันนี้':'Today',
  'ห้อง':'Room', 'กรง':'cages', 'ตัว':'glider(s)', 'ถึง':'to',
  'เวลา':'Time', 'วันที่':'Date', 'สถานะ':'Status', 'จำนวน':'Count',
  'บริการ':'Service', 'ทั้งหมด':'All', 'หลัก':'Primary', 'สำรอง':'BACKUP',
  'ว่าง':'Free', 'เต็ม':'Full', 'มีคิวแล้ว':'Taken', 'รอตอบ':'PENDING',
  'เช้า':'AM', 'เย็น':'PM', '👁 เช้า':'👁 AM', '👁 เย็น':'👁 PM',
  '✓ ใช้':'✓ Apply', 'ใช้':'Apply',
  'ยืนยัน':'CONFIRMED', 'คิว':'', 'เสร็จ':'DONE', 'สิ้น':'',
  'โทร':'Phone', 'เจ้าของ':'Owner', 'ลูกค้า':'Customer', 'น้อง':'Glider',
  'หมายเหตุ':'Notes', 'บันทึก':'Notes', '💾 บันทึก':'💾 Save', '✓ บันทึก':'✓ Save',
  'เข้าพัก':'Stay', '📅 เข้าพัก':'📅 Stay', '🏠 ห้อง':'🏠 Room',
  '👤 เจ้าของ':'👤 Owner', '👤 ลูกค้า':'👤 Customer', '🐿 น้อง':'🐿 Glider(s)',
  '🐿 จำนวน':'🐿 Count', '📞 โทร':'📞 Phone', '📝 หมายเหตุ':'📝 Notes',
  'ซึ่ง':'which is ', 'และ':'and', 'ออก':'out', 'เข้า':'in'
};

/* ── SUB: แทนที่วลี (ยาว→สั้น) ภายในข้อความผสม ─────────────── */
var SUB = {};
function add(map){ for (var k in map) SUB[k] = map[k]; }

/* ── คำที่ใช้ร่วมกันหลายหน้า ── */
add({
  'ที่พักสำหรับชูการ์ไกลเดอร์ตัวโปรดของคุณ':'Boarding for your beloved sugar glider',
  'ตัดเล็บ & ทำสปาสำหรับชูการ์ไกลเดอร์ตัวโปรดของคุณ':'Nail trims & spa for your beloved sugar glider',
  'ตัดเล็บ & ทำสปาชูการ์ไกลเดอร์':'Sugar glider nail trim & spa',
  'ที่พักชูการ์ไกลเดอร์':'Sugar Glider Boarding',
  'ชูการ์ไกลเดอร์':'sugar glider',
  'ชื่อน้องชูการ์ฯ':'Glider name(s)',
  'ชื่อเจ้าของ':'Owner name',
  'เบอร์โทร':'Phone',
  'เบอร์สำรอง':'Alt. phone',
  'จำนวนน้องชูก้า':'Glider count',
  'จำนวนน้อง':'No. of gliders',
  'เช่น คุณสมหญิง':'e.g. Jane',
  'เช่น โมจิ, ลาเต้, มะปราง…':'e.g. Mochi, Latte…',
  'เช่น โมจิ, ลาเต้…':'e.g. Mochi, Latte…',
  '(ถ้ามี)':'(optional)',
  'วันเช็คอิน':'Check-in date',
  'วันเช็คเอาท์':'Check-out date',
  'เช็คอินวันนี้:':'Check-ins today:',
  'เช็คเอาท์วันนี้:':'Check-outs today:',
  'เช็คอินพรุ่งนี้:':'Check-ins tomorrow:',
  'เช็คเอาท์พรุ่งนี้:':'Check-outs tomorrow:',
  'เช็คอินวันนี้':'Check-ins today',
  'เช็คเอาท์วันนี้':'Check-outs today',
  'เช็คอิน':'Check-in',
  'เช็คเอาท์':'Check-out',
  'ระยะเวลา':'Duration',
  'หมายเหตุถึงทางร้าน':'Notes to us',
  'เลขที่อ้างอิง':'Ref',
  'เลขอ้างอิง':'Ref',
  'อ้างอิง':'Ref',
  'น้องชูการ์':'Glider(s)',
  'กรุณาใส่ชื่อเจ้าของ':'Please enter the owner name',
  'กรุณาใส่เบอร์โทร เพื่อให้ทางร้านติดต่อยืนยันได้':'Please enter a phone number so we can contact you',
  'กรุณาใส่เบอร์โทร':'Please enter a phone number',
  'วันเช็คเอาท์ต้องอยู่หลังวันเช็คอิน':'Check-out must be after check-in',
  'หมดเวลา — เชื่อมต่อไม่ได้':'Timed out — cannot connect',
  'เชื่อมต่อระบบร้านไม่ได้':'Cannot reach the shop system',
  'ส่งไม่สำเร็จ':'Send failed',
  'ล้มเหลว':'failed',
  '⏳ กำลังส่งคำขอ…':'⏳ Sending…',
  'ส่งคำขอไม่สำเร็จ:':'Failed to send request:',
  '— ลองอีกครั้ง หรือติดต่อทางร้านโดยตรงค่ะ':'— please try again or contact us directly',
  'แคปหน้าจอนี้แล้วส่งให้ทางร้าน หรือติดต่อได้ที่':'Screenshot this page and send it to us, or contact us at',
  'คำขอของคุณถูกส่งถึงทางร้านแล้ว':'Your request has been sent to us',
  'ทางเบอร์โทรหรือ LINE ที่ให้ไว้ค่ะ':'via the phone number or LINE you provided',
  'ทางร้านจะตรวจสอบและ':"We'll review it and ",
  'ติดต่อกลับเพื่อยืนยันการจอง':'contact you to confirm your booking',
  'ติดต่อกลับเพื่อยืนยันคิว':'contact you to confirm your slot',
  '📌 หมายเหตุ:':'📌 Note:'
});

/* ── booking.html ── */
add({
  '— แบบฟอร์มขอจองที่พักสำหรับน้องชูการ์ไกลเดอร์ —':'— Boarding request form for your sugar glider —',
  'ส่งคำขอจองเรียบร้อย!':'Booking request sent!',
  'ส่งคำขอเพิ่มอีกรายการ':'Send another request',
  'ทางร้านตรวจสอบ':'We review it',
  'ส่งคำขอจอง':'Send booking request',
  'ขอจองที่พัก':'Request a stay',
  'กรอกข้อมูลและเลือกวันเข้าพัก — ทางร้านจะติดต่อกลับเพื่อยืนยันอีกครั้งค่ะ 🐿':"Fill in your details and choose your dates — we'll contact you to confirm 🐿",
  'อาหาร, นิสัย, ของใช้, บริการรับ-ส่ง…':'Food, habits, belongings, pick-up service…',
  'การส่งแบบฟอร์มนี้เป็น "คำขอจอง" เท่านั้น ยังไม่ใช่การยืนยันการจอง':'Submitting this form is a booking request only — not yet a confirmed booking',
  'ทางร้านจะตรวจสอบกรงว่างและติดต่อกลับทางเบอร์โทร/LINE เพื่อยืนยันอีกครั้งค่ะ 💕':"We'll check availability and contact you via phone/LINE to confirm 💕",
  '🏠 กรงสำรอง:':'🏠 Backup cages:',
  'ช่วงที่กรงหลักเต็ม ทางร้านอาจจัดน้องเข้าพัก':'When the main cages are full, your glider may stay in a ',
  'ทางร้านจะแจ้งให้ทราบก่อนยืนยันการจองค่ะ':"we'll let you know before confirming your booking",
  'ไม่ใช่กรง Stainless และไม่มีกล้องไว้ดูน้องชูก้า':'not a stainless cage and has no camera',
  'กรุณาเลือกวันเช็คอินและเช็คเอาท์':'Please select check-in and check-out dates',
  'วันเช็คอินต้องไม่ย้อนหลัง':'Check-in cannot be in the past',
  'ช่วงที่เลือกเหลือกรงว่างประมาณ':'Selected dates: approx.',
  'ช่วงที่เลือกมีกรงว่างประมาณ':'Selected dates: approx.',
  '— รีบจองเลยค่ะ (ทางร้านยืนยันอีกครั้ง)':'available — book soon! (subject to confirmation)',
  '(ทางร้านยืนยันอีกครั้งค่ะ)':'available (subject to confirmation)',
  'ช่วงที่เลือก':'Selected dates ',
  'อาจเต็ม':'may be full',
  'มีจองแล้ว':'already booked:',
  '— ส่งคำขอได้ ทางร้านจะเช็คและแจ้งผลอีกครั้งค่ะ':"— you can still send a request and we'll confirm",
  '📎 ส่งหลักฐานการจอง / สอบถามเพิ่มเติม':'📎 Send booking proof / more questions'
});

/* ── spa.html ── */
add({
  '— แบบฟอร์มจองคิวตัดเล็บ & ทำสปาสำหรับน้องชูการ์ไกลเดอร์ —':'— Nail trim & spa booking form for your sugar glider —',
  'เลือกวัน-เวลา':'Pick date & time',
  'ยืนยันคิวแล้ว':'Slot confirmed',
  'ยืนยันคิว':'Slot confirmed',
  'จองคิวสปา 💅':'Book a spa slot 💅',
  'เลือกบริการ วัน และช่วงเวลา (สลอตละ 1 ชั่วโมง) — ทางร้านจะติดต่อกลับเพื่อยืนยันคิวค่ะ 🐿':"Choose a service, date and time (1-hour slots) — we'll contact you to confirm 🐿",
  'ตัดเล็บ + ทำสปา':'Nail trim + spa',
  'ตัดเล็บ+ทำสปา':'Nail trim + spa',
  'ตัดเล็บ & ทำสปา สำหรับน้องน่ารัก':'Nail trim & spa for your cuties',
  'ตัดเล็บ & ทำสปา':'Nail trim & spa',
  'ตัดเล็บ':'Nail trim',
  'บาท / ตัว':'THB / glider',
  'บาท/ตัว':'THB/glider',
  '/ตัว':'/glider',
  '/คืน':'/night',
  'เลือกบริการ':'Select service',
  'เลือกวันและเวลา':'Select date & time',
  '⏳ กำลังโหลดตารางคิวจากทางร้าน…':'⏳ Loading available slots…',
  '😴 ขณะนี้ยังไม่เปิดรับจองคิวสปา':'😴 Spa booking is currently closed',
  'ติดต่อสอบถามทางร้านได้ที่ LINE @sugarsugarcamp หรือโทร 097-994-6355 ค่ะ':'Contact us on LINE @sugarsugarcamp or call 097-994-6355',
  '🔄 โหลดใหม่':'🔄 Reload',
  '🔄 ลองอีกครั้ง':'🔄 Try again',
  'โหลดตารางคิวไม่สำเร็จ':'Failed to load slots',
  '🕐 สลอตละ 1 ชั่วโมง · รับ 1 คิวต่อสลอต — สลอตสีจางคือมีคิวแล้วค่ะ':'🕐 1-hour slots · 1 booking per slot — faded slots are taken',
  'ค่าบริการประมาณ':'estimated cost',
  'ค่าบริการโดยประมาณ':'Estimated cost',
  '(ชำระที่ร้านค่ะ)':'(pay at the shop)',
  '(ชำระที่ร้าน)':'(pay at the shop)',
  '— ชำระที่ร้านค่ะ':'— pay at the shop',
  'นิสัยน้อง, สิ่งที่ต้องระวัง, มารับ-ส่งเอง…':"Glider's habits, things to watch, self drop-off/pick-up…",
  'ส่งคำขอจองคิว':'Send slot request',
  'การส่งแบบฟอร์มนี้เป็น "คำขอจองคิว" เท่านั้น ยังไม่ใช่การยืนยันคิว':'Submitting this form is a slot request only — not yet confirmed',
  'ทางร้านจะตรวจสอบและติดต่อกลับทางเบอร์โทร/LINE เพื่อยืนยันอีกครั้งค่ะ 💕':"We'll review and contact you via phone/LINE to confirm 💕",
  '💰 ค่าบริการ:':'💰 Prices:',
  'ส่งคำขอจองคิวเรียบร้อย!':'Slot request sent!',
  '📎 สอบถามเพิ่มเติม / แจ้งเปลี่ยนเวลา':'📎 Questions / reschedule',
  'จองคิวเพิ่มอีกรายการ':'Book another slot',
  'กรุณาเลือกวันและช่วงเวลาที่ต้องการจอง':'Please select a date and time slot',
  'ช่วงเวลานี้ไม่เปิดรับจองแล้ว กรุณาเลือกเวลาใหม่ค่ะ':'This time slot is no longer available — please pick another',
  'ขออภัยค่ะ สลอตนี้เพิ่งมีผู้จองไป กรุณาเลือกเวลาใหม่ค่ะ':'Sorry, this slot was just booked — please pick another time',
  '(1 ชม./คิว)':'(1 hr/slot)',
  '(1 ชม.)':'(1 hr)',
  'จองคิวสปา':'Spa booking'
});

/* ── วัน (ย่อ) — เดือนถูกจัดการใน DATE_RE / TH_MONTHS แล้ว ── */
add({
  'จ.–ศ.':'Mon–Fri','ส.–อา.':'Sat–Sun','ทุกวัน':'Every day',
  'อา.':'Sun','จ.':'Mon','อ.':'Tue','พฤ.':'Thu','พ.':'Wed','ศ.':'Fri','ส.':'Sat',
  'ม.ค.':'Jan','ก.พ.':'Feb','มี.ค.':'Mar','เม.ย.':'Apr','พ.ค.':'May','มิ.ย.':'Jun',
  'ก.ค.':'Jul','ส.ค.':'Aug','ก.ย.':'Sep','ต.ค.':'Oct','พ.ย.':'Nov','ธ.ค.':'Dec'
});

/* ── customer.html ── */
add({
  'กลับหน้าหลัก':'Back to dashboard',
  'ระบบข้อมูลลูกค้า · Customer Database':'Customer Database',
  'ระบบข้อมูลลูกค้า':'Customer database',
  'กำลังเริ่มต้น...':'Starting…',
  'เลือก Calendar ที่จะดึงประวัติการเข้าพัก':'Choose calendars to pull stay history from',
  'เลือก Calendar':'Select calendars',
  'ตั้งค่าการเชื่อมต่อ':'Connection settings',
  'เชื่อมต่อ Google Sheet และ Calendar':'Connect Google Sheet and Calendar',
  'ออกจากระบบแล้ว — Sign-in ใหม่เพื่อใช้งาน':'Signed out — sign in again to continue',
  'ออกจากระบบแล้ว':'Signed out',
  'ออกจากระบบ':'Sign out',
  'ลูกค้าทั้งหมด':'Total customers',
  'การจองจาก Sheet':'Bookings from Sheet',
  'Events ใน Calendar':'Calendar events',
  'ค้นหาลูกค้า':'Search customers',
  'ค้นหาด้วยชื่อเจ้าของ / ชื่อน้องชูก้า / เบอร์โทร...':'Search by owner / glider name / phone…',
  'ลูกค้าประจำ (3+ ครั้ง)':'Regulars (3+ visits)',
  'มาใหม่ (3 เดือน)':'Recent (3 months)',
  'หลายตัว (3+ ตัว)':'Multi (3+ gliders)',
  'รายละเอียดลูกค้า':'Customer details',
  'สร้างที่':'Create at',
  'เพิ่ม Authorized JavaScript origins:':'Add Authorized JavaScript origins:',
  'สำหรับโหลด Sheet — สร้างที่ Credentials → Create API Key':'For loading the Sheet — create at Credentials → Create API Key',
  'เปิด API:':'Enable APIs:',
  'ID ของไฟล์ Sugar Sugar Camp (การตอบกลับ)':'File ID of the Sugar Sugar Camp responses sheet',
  'ชื่อ Sheet (Tab)':'Sheet name (tab)',
  'เลือกทั้งหมด':'Select all',
  'ยกเลิกทั้งหมด':'Clear all',
  'เฉพาะ Sugar เท่านั้น':'Sugar only',
  'กำลังโหลดรายการ Calendar...':'Loading calendars…',
  'ยังไม่ได้โหลดรายการ Calendar':'Calendars not loaded yet',
  '✅ ดึงประวัติ':'✅ Pull history',
  'กรุณาตั้งค่า OAuth Client ID และ API Key ก่อน':'Please set the OAuth Client ID and API Key first',
  'ต้องตั้งค่าก่อนใช้งาน':'Setup required',
  'กดปุ่ม "ตั้งค่า" ด้านบน แล้วใส่ OAuth Client ID และ API Key':'Tap "Settings" above and enter your OAuth Client ID and API Key',
  'รอ Google Identity Services โหลด...':'Waiting for Google Identity Services…',
  'Sign-in ผิดพลาด:':'Sign-in error:',
  'กรุณา Sign-in ด้วย Google เพื่อดึงข้อมูล':'Please sign in with Google to load data',
  'ยินดีต้อนรับ':'Welcome',
  'กด "Sign in with Google" เพื่อเชื่อมต่อ Sheet และ Calendar ของคุณ':'Tap "Sign in with Google" to connect your Sheet and Calendar',
  'กด Sign-in เพื่อใช้งานต่อ':'Sign in to continue',
  'Session หมดอายุ — กรุณา Sign-in ใหม่':'Session expired — please sign in again',
  'Session หมดอายุ':'Session expired',
  'กด "Sign in with Google" เพื่อใช้งานต่อ':'Tap "Sign in with Google" to continue',
  'Init Auth ผิดพลาด:':'Auth init error:',
  'กำลังโหลดข้อมูลจาก Google Sheet...':'Loading data from Google Sheet…',
  'โหลด Sheet ผิดพลาด:':'Failed to load Sheet:',
  'โหลด Calendar list ผิดพลาด:':'Failed to load the calendar list:',
  '(ยังไม่ได้เลือก Calendar)':'(no calendars selected)',
  'กำลังดึง events จาก':'Fetching events from',
  'ดึง events':'Fetching events',
  'กำลัง match events กับลูกค้า...':'Matching events to customers…',
  'เสร็จ ·':'Done ·',
  'จาก Sheet ·':'from Sheet ·',
  'calendars โหลดไม่ได้':'calendars failed to load',
  'ไม่พบลูกค้า':'No customers found',
  'ลองค้นหาด้วยคำอื่น หรือปรับตัวกรอง':'Try a different search or filter',
  'แสดง 200 จาก':'Showing 200 of',
  '— ค้นหาเพื่อกรองให้แคบลง':'— refine your search to narrow down',
  '🐿️ น้องชูก้า':'🐿️ Gliders',
  'น้องชูก้าทั้งหมด':'All gliders',
  'ครั้งล่าสุด':'Last visit',
  'จำนวนครั้งทั้งหมด':'Total visits',
  'ประวัติการจอง (จากแบบฟอร์ม) —':'Booking history (from form) —',
  'ฟอร์มจอง':'Booking form',
  'ไม่มีข้อมูล':'No data',
  'ประวัติการเข้าพัก (จาก Google Calendar) —':'Stay history (from Google Calendar) —',
  'ไม่พบ event ที่ match ใน Calendar ที่เลือก':'No matching events in the selected calendars',
  'ตรงชื่อน้อง':'Glider match',
  'ตรงเบอร์':'Phone match',
  'ตรงชื่อ':'Name match',
  '→ เปิดใน Google Calendar':'→ Open in Google Calendar',
  '(จากปฏิทิน)':'(from calendar)'
});

/* ── dashboard: หัวหน้า/แบนเนอร์/สถิติ/แท็บ ── */
add({
  'กำลังซิงก์…':'Syncing…',
  'ซิงก์ล้มเหลว':'Sync failed',
  'ซิงก์ล่าสุด':'Last sync',
  'ซิงก์แล้ว':'Synced',
  'ยังไม่ได้เชื่อมต่อ Apps Script — ไปตั้งค่าก่อน':'Apps Script not connected — set it up first',
  'ยังไม่ได้เชื่อมต่อ':'Not connected',
  'วันนี้ · Today':'Today',
  '⚠ ยังไม่ได้ตั้งค่า Apps Script URL':'⚠ Apps Script URL not set',
  'ข้อมูลบันทึกเฉพาะในเครื่องนี้ ไม่ Sync Calendar':'Data is saved on this device only — no Calendar sync',
  'วิธีแก้ถาวร:':'Permanent fix:',
  'เปิดไฟล์ .html ด้วย Notepad++ แล้วใส่ URL ใน APPS_SCRIPT_URL':'Open the .html file and set APPS_SCRIPT_URL',
  'ตั้งค่าตอนนี้':'Set up now',
  'ลิงก์จองสปาสำหรับลูกค้า':'Customer spa booking link',
  'ลิงก์จองสำหรับลูกค้า':'Customer booking link',
  'แชร์ให้ลูกค้าตรวจสอบห้องว่างและส่งคำขอจองได้เลย':'Share with customers to check availability and send booking requests',
  'แชร์ให้ลูกค้าจองคิวตัดเล็บ/ทำสปา — เลือกวันและสลอตเวลา':'Share for nail trim / spa bookings — pick a date and time slot',
  '(เปิดจากโฟลเดอร์เดียวกัน)':'(open from the same folder)',
  'ดูตัวอย่าง':'Preview',
  'คัดลอกลิงก์แล้ว — แชร์ให้ลูกค้าได้เลยค่ะ':'Link copied — share it with your customers',
  'คัดลอกลิงก์จองสปาแล้ว — แชร์ให้ลูกค้าได้เลยค่ะ':'Spa link copied — share it with your customers',
  'คัดลอกลิงก์':'Copy link',
  'ตั้งเวลารับจองสปา':'Set spa booking hours',
  'ตั้งเวลารับ':'Set hours',
  'คำขอจองรออนุมัติ':'Booking requests pending',
  'ลูกค้าส่งคำขอผ่านลิงก์จอง — กด ✓ เพื่อเลือกกรงและลงจองจริง หรือ ✕ เพื่อปฏิเสธ':'Requests from the booking link — tap ✓ to assign a cage and book, or ✕ to decline',
  'รีเฟรช':'Refresh',
  'คิวสปารออนุมัติ':'Spa queue pending',
  'ลูกค้าจองคิวตัดเล็บ/ทำสปาผ่านลิงก์ — กด ✓ เพื่อยืนยันคิว หรือ ✕ เพื่อปฏิเสธ':'Spa requests from the link — tap ✓ to confirm or ✕ to decline',
  'คิวสปาที่อนุมัติแล้ว':'Approved spa queue',
  'กรงว่าง':'Free cages',
  'จากทั้งหมด':'of',
  'กรงที่เข้าพักอยู่:':'Cages occupied:',
  'กรงที่เข้าพัก':'Occupied cages',
  'กรงเข้าพัก':'occupied',
  'ชูการ์วันนี้':'Gliders today',
  'ตัว เข้าพักอยู่':'staying now',
  'ยังไม่มีน้อง':'none yet',
  'สถานะห้องวันนี้':'Room status today',
  'สถานะห้องตามวันที่เลือก':'Room status on selected date',
  'สถานะห้อง':'Rooms',
  'ปฏิทินห้องพัก':'Room calendar',
  'ปฏิทิน':'Calendar',
  'รายการจองทั้งหมด':'All bookings',
  'รายการจอง':'Bookings',
  'สรุปเตรียมอาหาร':'Food prep summary',
  'คิดเงินสปา':'Spa billing',
  'เพิ่มการจองแรก':'Add first booking',
  'เพิ่มการจองใหม่':'New booking',
  'เพิ่มการจอง':'Add booking',
  'แจ้งเตือน LINE · 2 รอบต่อวัน':'LINE alerts · twice daily',
  'พรุ่งนี้':'Tomorrow',
  'ส่งเช้า 06:00':'Send AM 06:00',
  'ส่งเย็น 18:00':'Send PM 18:00'
});

/* ── dashboard: มุมมองห้อง/ปฏิทิน/รายการจอง ── */
add({
  'ห้องว่างพร้อมรองรับ':'Available',
  'มีการจองในช่วงนี้แล้ว':'Already booked for these dates',
  'ห้องนี้มีการจองในช่วงนี้แล้ว':'This room is already booked for these dates',
  'ห้องว่าง':'Vacant',
  'มีน้องเข้าพัก':'Occupied',
  'แตะห้อง · ดูรายละเอียด / จอง':'Tap a room · details / book',
  'กรงสำรอง 35 กรง':'35 backup cages',
  'กรงสำรองที่มีน้องเข้าพัก':'Occupied backup cages',
  '▲ ซ่อนกรงสำรองที่ว่าง':'▲ Hide vacant backup cages',
  '▲ ซ่อนกรงสำรอง':'▲ Hide backup cages',
  'ซ่อนกรงสำรองว่างอยู่':'hiding vacant backup:',
  'ดูกรงทั้งหมด':'Show all cages',
  '(รวมกรงสำรอง':'(incl. backup',
  'แจ้งลูกค้าให้ทราบตอนจองด้วยนะคะ':'please inform the customer when booking',
  'กรุณาแจ้งลูกค้าให้ทราบก่อนยืนยันการจองนะคะ':'please inform the customer before confirming',
  'เลือกกรงสำรอง:':'Backup cage selected:',
  'กรงสำรอง':'backup cage',
  'สำรอง-':'BK-',
  'กรงเจ้าของ #':'Owner cage #',
  'กรงลูกค้า':'Guest cages',
  'กรงทั้งหมด':'Total cages',
  'ชูการ์รวม (ตัว)':'Total gliders',
  'นับจำนวนกรงตามจำนวนตัว เพื่อเตรียมผลไม้/อาหารของแต่ละกรง':'Cage count by gliders per cage — for daily fruit/food prep',
  '= กรงชูการ์ของเจ้าของ':"= owner's glider cages",
  '— นับรวมทุกวัน)':'— counted every day)',
  'ยังไม่มีกรงที่ต้องเตรียมอาหาร':'No cages to prepare food for',
  'รวมกรงเจ้าของ':'incl. owner cages',
  'คัดลอกข้อความ':'Copy text',
  '✓ คัดลอกแล้ว!':'✓ Copied!',
  '✓ คัดลอกแล้ว':'✓ Copied',
  'กำลังจะมา':'Upcoming',
  'เข้าพักอยู่':'Staying',
  'ผ่านไปแล้ว':'Past',
  'ยังไม่มีการจอง':'No bookings yet',
  'ไม่พบรายการที่ตรงกัน':'No matches found',
  'เริ่มต้นโดยการเพิ่มการจองแรก':'Start by adding your first booking',
  'ลองเปลี่ยนคำค้นหาดูนะ':'Try a different search',
  'ค้นหาชื่อเจ้าของ, ชื่อน้อง, เบอร์…':'Search owner, glider, phone…',
  'รออนุมัติ':'Awaiting approval',
  'ส่งเมื่อ':'Sent',
  'อนุมัติ — เลือกกรงและลงจองจริง':'Approve — pick a cage and book',
  'ปฏิเสธคำขอจองสปา':'Decline spa request',
  'ปฏิเสธคำขอจอง':'Decline booking request',
  'ปฏิเสธคำขอแล้ว':'Request declined',
  'ปฏิเสธคำขอของ':'Decline the request from',
  'ปฏิเสธคำขอ':'Decline request',
  'ปฏิเสธคิวของ':'Decline the slot for',
  'อนุมัติคิวนี้':'Approve this slot',
  'ออกใบยืนยันคิว — บันทึกรูปส่งให้ลูกค้า':'Issue confirmation slip — save as image for the customer',
  'คิดเงินคิวนี้ — เปิดเครื่องคิดเงินพร้อมข้อมูลคิว':'Bill this queue — opens the calculator with queue info',
  'สปาเสร็จสิ้น — ปิดคิวนี้ออกจากรายการ':'Spa done — close this queue',
  'ยกเลิกคิวนี้ — สลอตจะเปิดให้จองใหม่':'Cancel — the slot reopens for booking',
  'ดึงข้อมูลล่าสุดจาก Google Sheets':'Pull latest from Google Sheets',
  'ออกใบยืนยัน':'Issue confirmation'
});

/* ── dashboard: ฟอร์มจอง/รายละเอียด/ลบ ── */
add({
  'แก้ไขการจอง':'Edit booking',
  'แก้ไขรายละเอียดด้านล่าง':'Edit the details below',
  'กรอกข้อมูลเพื่อจองที่พักให้กับน้องชูการ์ฯ':'Fill in the details to book a stay',
  'ประเภทห้อง':'Room type',
  'ประเภทกรง':'Cage type',
  '(หลัก ':'(main ',
  '+ สำรอง ':'+ backup ',
  'เลือกหมายเลขกรงหลัก (สีแดง = ไม่ว่าง)':'Select a main cage (red = unavailable)',
  'เลือกกรง Grand Suite':'Select a Grand Suite',
  'บันทึกเพิ่มเติม':'Additional notes',
  'อาหาร, นิสัย, ของใช้…':'Food, habits, belongings…',
  'บันทึกการแก้ไข':'Save changes',
  'ยืนยันการจอง':'Confirm booking',
  'กรุณาเลือกหมายเลขห้อง':'Please select a room number',
  'ลูกค้าเดิม — แตะเพื่อเติมข้อมูล':'Returning customer — tap to autofill',
  'เคยพัก':'stayed',
  '· ล่าสุด':'· last',
  'เติมข้อมูลลูกค้าเดิม:':'Autofilled returning customer:',
  'มากับน้อง':'With',
  'ใบยืนยันการจองที่พัก':'Booking Confirmation',
  'ใบยืนยันคิวสปา':'Spa Slot Confirmation',
  'ใบยืนยัน':'Confirmation slip',
  'ยืนยันการลบ':'Confirm deletion',
  'ลบการจองของ':'Delete the booking for',
  'ยกเลิกคิวสปา':'Cancel spa slot',
  'ยกเลิกคิวของ':'Cancel the slot for',
  'ยกเลิกคิวแล้ว — สลอตเปิดให้จองใหม่ได้':'Slot cancelled — reopened for booking',
  'ยกเลิกไม่สำเร็จ:':'Cancel failed:',
  'ไม่ยกเลิก':'Keep slot',
  'ยืนยันยกเลิกคิว':'Confirm cancellation',
  'อนุมัติคิวสปาเรียบร้อย':'Spa slot approved',
  'อนุมัติคิวสปา':'Approve spa slot',
  'ยืนยันคิวของ':'Confirm the slot for',
  'ยืนยันอนุมัติ':'Confirm approval',
  'ยืนยันปฏิเสธ':'Confirm decline',
  'สปาเสร็จสิ้น':'Spa completed',
  'ปิดคิวของ':'Close the queue for',
  'คิวจะหายจากรายการนี้ แต่ข้อมูลยังเก็บอยู่ในชีต SpaRequests เป็นประวัติ (สถานะ "done") — ถ้ายังไม่ได้คิดเงิน กดปุ่ม 💰 ก่อนนะคะ':'It will disappear from this list but stays in the SpaRequests sheet as history ("done"). If not billed yet, tap 💰 first',
  'เสร็จสิ้น ปิดคิว':'Done — close queue',
  'ปิดคิวเรียบร้อย — ขอบคุณที่ใช้บริการค่ะ 🌸':'Queue closed — thank you! 🌸',
  'ปิดคิวไม่สำเร็จ:':'Close failed:',
  'สลอตนี้จะกลับมาว่างให้ลูกค้าอื่นจองได้อีกครั้ง — อย่าลืมติดต่อแจ้งลูกค้าด้วยนะคะ':'This slot will reopen for others — remember to inform the customer',
  'ระบบจะบันทึกสถานะใน Sheet — อย่าลืมติดต่อแจ้งลูกค้าด้วยนะคะ':'The status will be saved to the Sheet — remember to inform the customer',
  'ระบบจะบันทึกสถานะใน Sheet — อย่าลืมติดต่อยืนยันกับลูกค้าด้วยนะคะ':'The status will be saved to the Sheet — remember to confirm with the customer',
  'กำลังอนุมัติคำขอของ':'Approving the request from',
  '— เลือกหมายเลขกรง แล้วกด "ยืนยันการจอง"':'— pick a cage number then tap "Confirm booking"',
  'อนุมัติคำขอและลงจองเรียบร้อย':'Request approved and booked',
  'ลงจองแล้ว แต่บันทึกสถานะคำขอไม่สำเร็จ:':'Booked, but failed to update the request status:'
});

/* ── dashboard: ตารางสปา / ตั้งค่า / LINE ── */
add({
  'กำลังโหลดตารางจาก Google Sheets…':'Loading schedule from Google Sheets…',
  'ตั้งเวลาเปิดรับตามวันจริงทีละสัปดาห์ — สลอตละ 1 ชม. (1 คิว/สลอต)':'Set open hours per actual date, week by week — 1-hour slots (1 booking/slot)',
  'วันไหนไม่ติ๊ก = ปิดรับ ไม่เปิดคิว':'Unchecked days = closed, no slots',
  '— ตั้งหลายสัปดาห์ได้ แล้วกดบันทึกครั้งเดียว':'— set several weeks, then save once',
  'ก่อนหน้า':'Prev',
  'ถัดไป':'Next',
  'ตั้งเร็วทั้งสัปดาห์นี้':'Quick set this week',
  'ปิดทั้งสัปดาห์':'Close whole week',
  'วันในสัปดาห์นี้':'Days this week',
  '· วันนี้':'· today',
  '💡 หน้าจองลูกค้าแสดงเฉพาะวันที่เปิดรับล่วงหน้า 30 วัน — สัปดาห์ไหนยังไม่ได้ตั้ง ลูกค้าจะจองไม่ได้จนกว่าทางร้านจะมาตั้งเวลาค่ะ':'💡 Customers only see open dates up to 30 days ahead — weeks not yet set cannot be booked until you set them',
  'บันทึกตารางเปิดรับสปาลง Google Sheets แล้ว':'Spa schedule saved to Google Sheets',
  'บันทึกตาราง':'Save schedule',
  'เวลาปิดต้องอยู่หลังเวลาเปิด':'Closing time must be after opening time',
  '⏳ กำลังบันทึก…':'⏳ Saving…',
  'บันทึกไม่สำเร็จ:':'Save failed:',
  'โหลดการตั้งค่าไม่สำเร็จ:':'Failed to load settings:',
  '— ถ้าเพิ่งอัปเดตระบบ อย่าลืม Deploy Apps Script ใหม่':'— if you just updated, remember to re-deploy Apps Script',
  'การเชื่อมต่อ Google':'Google connection',
  'สำรองข้อมูลขึ้น Google Sheets และซิงก์เป็น Event ใน Google Calendar อัตโนมัติ':'Back up to Google Sheets and sync to Google Calendar automatically',
  '✓ เชื่อมต่อแล้ว':'✓ Connected',
  'เชื่อมต่อล้มเหลว':'Connection failed',
  'Sync ล้มเหลว — ตรวจสอบตามลำดับนี้:':'Sync failed — check in this order:',
  'ตรวจสอบ URL':'Check the URL',
  'ต้องลงท้ายด้วย':'must end with',
  'ตรวจเวอร์ชัน':'Check the version',
  'กดปุ่ม 🔍 ด้านล่าง — ต้องแสดง':'tap 🔍 below — it should show',
  'พร้อมใช้งาน':'ready',
  'สีเขียว':'in green',
  'ข้อผิดพลาด:':'Error:',
  'ตั้งค่า:':'Set:',
  'วาง URL ที่ได้จากการ Deploy Apps Script (ดูคู่มือด้านล่าง)':'Paste the URL from your Apps Script deployment (see the guide below)',
  'ทดสอบ Sync':'Test sync',
  'ดึงข้อมูลจาก Sheet':'Pull from Sheet',
  '📘 คู่มือการตั้งค่า (ทำครั้งเดียว · ~3 นาที)':'📘 Setup guide (one-time · ~3 min)',
  'คัดลอกโค้ด':'Copy code',
  'ข้อมูลถูกเก็บในบัญชี Google ของคุณเอง · ไม่ส่งออกไปที่ไหน':'Data stays in your own Google account · nothing is sent elsewhere',
  'และปฏิทิน':'and calendar',
  'จะถูกสร้างอัตโนมัติ':'are created automatically',
  'ชีต':'Sheet',
  '📲 แจ้งเตือน LINE · 2 รอบต่อวัน (06:00 + 18:00)':'📲 LINE alerts · twice daily (06:00 + 18:00)',
  '🌅 06:00 — สรุปเช้า':'🌅 06:00 — Morning summary',
  '🌆 18:00 — แจ้งล่วงหน้า':'🌆 18:00 — Evening preview',
  'สรุปเช้าวันนี้':'Morning summary for today',
  'แจ้งล่วงหน้าพรุ่งนี้':'Tomorrow preview for',
  'สรุปเช้า ·':'Morning summary ·',
  'แจ้งล่วงหน้า · พรุ่งนี้':'Preview · tomorrow',
  'สรุปเช้า':'Morning summary',
  'แจ้งล่วงหน้า':'Evening preview',
  'พักต่อเนื่อง:':'Staying on:',
  'พักต่อเนื่อง':'Staying on',
  'ชูการ์ทั้งหมด:':'Total gliders:',
  'ชูการ์คืนนี้:':'Gliders tonight:',
  'Sugar คืนนี้':'gliders tonight',
  'จำนวน Sugar':'glider count',
  'เข้าวันนี้:':'Arriving today:',
  'ออกวันนี้:':'Leaving today:',
  'เข้าพรุ่งนี้:':'Arriving tomorrow:',
  'ออกพรุ่งนี้:':'Leaving tomorrow:',
  'ไม่ระบุ':'Unnamed',
  'ตัวอย่างข้อความ LINE':'LINE message preview',
  'ข้อความนี้สร้างจากข้อมูลในเครื่องนี้':'This preview is generated from data on this device',
  'เมื่อส่งจริง Apps Script จะอ่านข้อมูลล่าสุดจาก Google Sheets':'The actual message uses the latest data from Google Sheets',
  'ส่งทันที':'Send now',
  '👁 ดูข้อความเช้า':'👁 Preview AM',
  '👁 ดูข้อความเย็น':'👁 Preview PM',
  '🌅 ทดสอบส่งเช้า':'🌅 Test send AM',
  '🌆 ทดสอบส่งเย็น':'🌆 Test send PM',
  'ส่ง LINE เช้า':'Send AM LINE',
  'ส่ง LINE เย็น':'Send PM LINE',
  '⏳ กำลังส่ง…':'⏳ Sending…',
  'ส่งเข้า LINE สำเร็จ':'Sent to LINE',
  'ส่ง LINE ไม่สำเร็จ:':'LINE send failed:',
  '⚠ ตั้งค่า Apps Script URL ด้านบนก่อน จึงจะใช้ส่ง LINE ได้':'⚠ Set the Apps Script URL above first to enable LINE sending',
  'สถานะ:':'Status:',
  'มีข้อมูล':'',
  'ในเครื่องนี้':'on this device',
  'เวอร์ชัน Apps Script:':'Apps Script version:',
  'ยังไม่ได้ตรวจ':'not checked yet',
  '🔍 ตรวจ':'🔍 Check',
  'กำลังตรวจ...':'Checking…',
  '— พร้อมใช้งาน':'— ready',
  '✓ เชื่อมต่อสำเร็จ — พร้อมใช้งาน':'✓ Connected — ready',
  '⚠ เชื่อมต่อได้ แต่ตรวจเวอร์ชันไม่ได้':'⚠ Connected, but could not check the version',
  'บันทึกการตั้งค่าแล้ว · URL พร้อมใช้งาน':'Settings saved · URL ready',
  'เปิดใน Browser Tab':'Open in a browser tab',
  '🔗 เปิดใน Tab ใหม่':'🔗 Open in a new tab',
  '✓ เปิด tab แล้ว — Apps Script กำลังทำงาน':'✓ Tab opened — Apps Script is running',
  'หมดเวลา (20 วิ) — ตรวจสอบ URL และ Apps Script':'Timed out (20s) — check the URL and Apps Script',
  'หมดเวลา (20 วิ)':'Timed out (20s)',
  'เชื่อมต่อ Apps Script ไม่ได้ — ตรวจสอบ URL หรือ Deploy ใหม่':'Cannot reach Apps Script — check the URL or redeploy',
  'เชื่อมต่อ Apps Script ไม่ได้':'Cannot reach Apps Script',
  'ยังไม่ได้ตั้งค่า URL':'URL not set',
  'Apps Script ตอบกลับว่าล้มเหลว':'Apps Script returned an error',
  '✓ Sync สำเร็จ · อัปเดต':'✓ Sync complete · updated',
  '· ข้าม':'· skipped',
  'รายการที่ไม่เปลี่ยน':'unchanged',
  '✓ ดึงข้อมูล':'✓ Pulled',
  'รายการสำเร็จ':'items successfully',
  '⚠ ยังมีข้อมูลค้างที่ยังไม่ได้ Sync — ข้ามการดึงเพื่อกันข้อมูลหาย':'⚠ Unsynced changes pending — skipped the pull to prevent data loss',
  'อัปเดตคำขอจองแล้ว · รออนุมัติ':'Booking requests updated · pending',
  'โหลดคำขอจองไม่สำเร็จ:':'Failed to load booking requests:',
  'อัปเดตคิวสปาแล้ว · รออนุมัติ':'Spa queue updated · pending',
  'โหลดคิวสปาไม่สำเร็จ:':'Failed to load the spa queue:'
});

/* ── dashboard: เช็คเอาท์ / ใบเสร็จ / สลิป ── */
add({
  'Check Out & คิดเงิน':'Check-out & Billing',
  'สรุปค่าใช้จ่ายก่อนส่งน้องกลับบ้าน 🐿':'Total up the stay before your glider heads home 🐿',
  'จำนวนคืน':'Nights',
  'น้องชูการ์':'Gliders',
  'ค่าพักเริ่มต้น':'Base stay cost',
  'ค่าพักรวม':'Stay total',
  'รวมบิลหลายกรง':'Merge bills (multiple cages)',
  'ถ้าน้องครอบครัวเดียวกันพักแยกหลายกรงช่วงเดียวกัน ติ๊กเลือกกรงเพิ่มด้านล่าง เพื่อออกใบเสร็จรวมใบเดียวได้เลยค่ะ (แสดงเฉพาะกรงที่พักตรงช่วง':'If one family stayed in several cages during the same period, tick the extra cages below to issue one combined receipt (showing only cages that overlap',
  'และคิดเงินเฉพาะคืนในช่วงนี้)':'and billing only the nights within this period)',
  '⏱ คิดเฉพาะคืนที่ตรงกับบิลนี้ (พักจริง':'⏱ Billing only the nights within this bill (full stay',
  'เจ้าของเดียวกัน':'same owner',
  'รวมแล้ว +':'merged +',
  'ส่วนลด & บริการเสริม':'Discounts & extras',
  'ส่วนลด (%)':'Discount (%)',
  'ส่วนลด (฿)':'Discount (฿)',
  'ส่วนลด':'Discount',
  'ค่าบริการรับ-ส่ง (฿)':'Pick-up/delivery fee (฿)',
  'ค่าบริการรับ-ส่ง':'Pick-up/delivery fee',
  'ค่ารับ-ส่ง':'Pick-up/delivery',
  'ค่าใช้จ่ายอื่นๆ':'Other charges',
  '+ เพิ่มรายการ':'+ Add item',
  'เช่น ค่าจิ้งหรีด':'e.g. cricket snacks',
  'เช่น ฝากยา, ข้าวโพด...':'e.g. medicine, corn…',
  'สรุปค่าใช้จ่าย':'Cost summary',
  'รายละเอียดค่าใช้จ่าย':'Charges',
  'รวมทั้งหมด':'Grand total',
  'ยอดรวมทั้งหมด':'Grand total',
  'ยอดชำระทั้งหมด':'Total due',
  'ออกใบเสร็จ':'Issue receipt',
  'ใบเสร็จรับเงิน':'Receipt',
  'เลขที่':'No.',
  'ออก:':'Issued:',
  'ออกใบยืนยัน:':'Issued:',
  'ช่องทางการชำระเงิน':'Payment',
  'ธนาคารกสิกรไทย':'Kasikorn Bank',
  'สแกน QR ด้วยแอปธนาคารได้เลย':'Scan the QR with your banking app',
  'ขอบคุณที่ไว้ใจ Sugar Sugar Camp 🐾':'Thank you for trusting Sugar Sugar Camp 🐾',
  'น้องๆ ได้รับการดูแลด้วยความรักตลอดการพัก — แล้วพบกันใหม่นะคะ 🌿💕':'Your gliders were cared for with love — see you again soon 🌿💕',
  'ดูแลด้วยความรักและใส่ใจทุกตัว 🌿':'Cared for with love, every single one 🌿',
  'น้องทั้งหมด':'Total gliders:',
  '· ขอบคุณที่ใช้บริการค่ะ 🐾':'· thank you! 🐾',
  '🌸 แล้วพาน้องมาสวยหล่อกันใหม่นะคะ 🌸':'🌸 Come back to look fabulous again soon 🌸',
  'แล้วพาน้องมาสวยหล่อกันนะคะ 🌸':'See you at the spa! 🌸',
  'รายการบริการ':'Services',
  'ชื่อลูกค้า (ไม่บังคับ)':'Customer name (optional)',
  'สรุปค่าบริการ':'Service summary',
  'กรุณาเลือกบริการก่อนนะคะ 🐾':'Please select a service first 🐾',
  'วันนัดหมาย':'Appointment',
  'ยืนยันแล้ว':'Confirmed',
  'เสร็จสิ้น':'Completed',
  'กด "บันทึกรูป" — บนมือถือจะแสดงรูปให้แตะค้างเพื่อบันทึกลง Photos แล้วส่งให้ลูกค้าทาง LINE ได้เลย':'Tap "Save image" — on mobile, press and hold the image to save to Photos, then send it via LINE',
  'กด "บันทึกรูป" — บนมือถือจะแสดงรูปให้แตะค้างเพื่อบันทึกลง Photos ได้เลย':'Tap "Save image" — on mobile, press and hold the image to save to Photos',
  '👆 แตะค้างที่รูปด้านล่าง แล้วเลือก "เพิ่มลงในรูปภาพ"':'👆 Press and hold the image below, then choose "Add to Photos"',
  'รูปจะถูกบันทึกลง Photos ของ iPhone ทันที — ส่งต่อทาง LINE ได้เลย':'It will be saved to your Photos — ready to share via LINE',
  '⬇ ดาวน์โหลดเป็นไฟล์':'⬇ Download as file',
  '⏳ กำลังสร้างรูป…':'⏳ Creating image…',
  '⬇ บันทึกรูป':'⬇ Save image',
  '✓ บันทึกรูปสำเร็จ — ส่งให้ลูกค้าได้เลยค่ะ':'✓ Image saved — ready to send',
  '⚠ ไม่สามารถบันทึกได้ — ลอง screenshot แทนค่ะ':'⚠ Could not save — try a screenshot instead',
  '⚠ โหลด library ไม่ได้ — ลอง screenshot แทนค่ะ':'⚠ Could not load the library — try a screenshot instead'
});

/* ── คำสั้นทั่วไป (แทนที่ท้ายสุด) ── */
add({
  'ตั้งค่า':'Settings',
  'ชื่อน้อง':'Glider name',
  'ทางร้าน':'the shop',
  'ชูการ์':'gliders',
  'ลูกค้า':'customer'
});

/* ── สร้างรายการ key เรียงยาว→สั้น ─────────────────────────── */
var SUB_KEYS = Object.keys(SUB).sort(function(a,b){ return b.length - a.length; });

function translateString(s){
  if (!s || !THAI_RE.test(s)) return s;
  var trimmed = s.trim();
  if (Object.prototype.hasOwnProperty.call(EXACT, trimmed))
    return s.replace(trimmed, EXACT[trimmed]);
  var out = s;
  for (var i = 0; i < REGEX_RULES.length; i++)
    out = out.replace(REGEX_RULES[i][0], REGEX_RULES[i][1]);
  for (var j = 0; j < SUB_KEYS.length; j++){
    if (!THAI_RE.test(out)) break;
    var k = SUB_KEYS[j];
    if (out.indexOf(k) !== -1) out = out.split(k).join(SUB[k]);
  }
  return out;
}
window.SSC_I18N.t = translateString;

/* ── เดินแปลทั้ง DOM ────────────────────────────────────────── */
var SKIP_TAGS = { SCRIPT:1, STYLE:1, NOSCRIPT:1, TEXTAREA:1, CODE:1 };
var ATTRS = ['placeholder','title','alt','aria-label'];

function skipEl(el){
  if (SKIP_TAGS[el.nodeName]) return true;
  if (el.classList && el.classList.contains('codebx')) return true;
  return false;
}
function translateTextNode(n){
  var v = n.nodeValue;
  if (!v || !THAI_RE.test(v)) return;
  var t = translateString(v);
  if (t !== v) n.nodeValue = t;
}
function translateAttrs(el){
  for (var i = 0; i < ATTRS.length; i++){
    var a = ATTRS[i], v = el.getAttribute && el.getAttribute(a);
    if (v && THAI_RE.test(v)){
      var t = translateString(v);
      if (t !== v) el.setAttribute(a, t);
    }
  }
}
function walk(node){
  if (node.nodeType === 3) { translateTextNode(node); return; }
  if (node.nodeType !== 1) return;
  if (node.nodeName === 'TEXTAREA') { translateAttrs(node); return; } // แปลเฉพาะ placeholder — ไม่แตะข้อความผู้ใช้
  if (skipEl(node)) return;
  translateAttrs(node);
  var child = node.firstChild;
  while (child){
    var next = child.nextSibling;   // เผื่อ nodeValue เปลี่ยนระหว่างเดิน
    walk(child);
    child = next;
  }
}
function translateTitle(){
  if (document.title && THAI_RE.test(document.title)){
    var t = translateString(document.title);
    if (t !== document.title) document.title = t;
  }
}

/* ── observer: จับทุกอย่างที่ JS วาดเพิ่ม/แก้ทีหลัง ─────────── */
var scheduled = false;
var pending = [];
function flush(){
  scheduled = false;
  var list = pending; pending = [];
  for (var i = 0; i < list.length; i++){
    var n = list[i];
    if (!n.isConnected) continue;
    if (n.nodeType === 3){
      var p = n.parentNode;
      var inSkip = false, a = p;
      while (a && a.nodeType === 1){ if (skipEl(a)) { inSkip = true; break; } a = a.parentNode; }
      if (!inSkip) translateTextNode(n);
    } else walk(n);
  }
  translateTitle();
}
function schedule(n){
  pending.push(n);
  if (!scheduled){
    scheduled = true;
    // แปลทันทีในเฟรมเดียวกัน — กันข้อความไทยกระพริบก่อนแปล
    Promise.resolve().then(flush);
  }
}
new MutationObserver(function(muts){
  for (var i = 0; i < muts.length; i++){
    var m = muts[i];
    if (m.type === 'characterData') schedule(m.target);
    else for (var j = 0; j < m.addedNodes.length; j++) schedule(m.addedNodes[j]);
  }
}).observe(document.documentElement, { childList:true, subtree:true, characterData:true });

/* ── แปลรอบแรกเมื่อ DOM พร้อม (เผื่อ node ที่ parse ก่อน observer) ── */
function initialPass(){ walk(document.documentElement); translateTitle(); }
if (document.readyState === 'loading')
  document.addEventListener('DOMContentLoaded', initialPass);
else initialPass();

})();
