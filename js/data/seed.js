// Demo seed. Everything here is SIMULATED for the SIH prototype.

export const USER = {
  id:'u-meera', name:'Meera Rao', phone:'+91 98•• ••4471',
  verified:true, lang:'en', avatar:'M',
  home:'Bengaluru', joined:'Jan 2026', trips:3,
};

export const GROUP = [
  { id:'u-meera', name:'Meera Rao',   role:'Organiser', avatar:'M', colour:'#9c4a2b', verified:true,  paid:2400 },
  { id:'u-arjun', name:'Arjun Nayak', role:'Member',    avatar:'A', colour:'#2f5d50', verified:true,  paid:1650 },
  { id:'u-fatima',name:'Fatima Sheikh',role:'Member',   avatar:'F', colour:'#3a4a7a', verified:true,  paid:3100 },
  { id:'u-dev',   name:'Dev Menon',   role:'Member',    avatar:'D', colour:'#7a5a1f', verified:false, paid:900  },
];

export const GUARDIAN = {
  name:'Sudha Rao', relation:'Mother', phone:'+91 94•• ••1180',
  watching:true, lastSeen:'live', consentGivenAt:'Trip start',
};

export const EMERGENCY = [
  { label:'ERSS — All emergencies', num:'112', primary:true },
  { label:'Ministry of Tourism helpline (24×7, multilingual)', num:'1800-11-1363' },
  { label:'Police', num:'100' },
  { label:'Ambulance', num:'108' },
  { label:'Women’s helpline', num:'1091' },
  { label:'Karnataka Tourism control room', num:'080-2235-2828' },
];

// Geofenced advisories the trip crosses. SIMULATED.
export const RISK_ZONES = [
  { id:'rz1', at:[15.3350,76.4600], r:2.2, level:'caution', title:'Hampi boulder fields',
    note:'Loose rock after rain. No mobile data across the Sacred Centre — cached maps only.', hours:'All day' },
  { id:'rz2', at:[15.3423,76.4753], r:1.1, level:'caution', title:'Tungabhadra river crossing',
    note:'Coracle crossings stop at dusk. Do not swim — undertow reported.', hours:'After 18:00' },
  { id:'rz3', at:[12.4244,75.7382], r:6, level:'watch', title:'Coorg ghat road',
    note:'Landslide-prone stretch on NH-275 during heavy rain.', hours:'Monsoon' },
  { id:'rz4', at:[11.6600,76.6300], r:9, level:'restricted', title:'Bandipur night traffic ban',
    note:'Highway closed to traffic 21:00–06:00 through the tiger reserve.', hours:'21:00–06:00' },
  { id:'rz5', at:[15.9195,75.6850], r:1.4, level:'caution', title:'Badami cliff steps',
    note:'Monkey activity near Cave 3. Keep food packed away.', hours:'All day' },
];

export const GUIDES = [
  { id:'g1', name:'Ravi Kumar',  at:'hampi',  langs:['Kannada','English','Hindi'], years:12,
    rate:1200, rating:4.9, jobs:214, verified:'Karnataka Tourism · KA/GD/2019/0442', specialty:'Vijayanagara epigraphy' },
  { id:'g2', name:'Shantha Devi',at:'hampi',  langs:['Kannada','English'], years:7,
    rate:900,  rating:4.8, jobs:131, verified:'Karnataka Tourism · KA/GD/2022/1180', specialty:'Anegundi craft walk' },
  { id:'g3', name:'Imran Ali',   at:'badami', langs:['Kannada','Hindi','Urdu','English'], years:9,
    rate:1000, rating:4.7, jobs:96,  verified:'ASI approved · ASI/BDM/311', specialty:'Chalukyan rock-cut' },
  { id:'g4', name:'Latha Gowda', at:'mysuru', langs:['Kannada','English','Tamil'], years:15,
    rate:1400, rating:4.9, jobs:388, verified:'Karnataka Tourism · KA/GD/2011/0087', specialty:'Wodeyar court history' },
  { id:'g5', name:'Prakash Naik',at:'gokarna',langs:['Konkani','Kannada','English'], years:5,
    rate:800,  rating:4.5, jobs:54,  verified:'Karnataka Tourism · KA/GD/2023/1904', specialty:'Coastal trail & temple' },
];

// Community scam / overcharge reports — feeds the fare band and the dept queue.
export const REPORTS = [
  { id:'r1', at:'hampi',  kind:'Overcharging', text:'Auto from Hospet station quoted ₹700 for a ₹280 run.',
    by:'u-arjun', rep:82, votes:31, status:'verified', ago:'2 days ago' },
  { id:'r2', at:'mysuru', kind:'Fake guide',   text:'Man outside Gate 2 claiming ASI ID — no licence number on the card.',
    by:'u-fatima',rep:74, votes:19, status:'verified', ago:'5 days ago' },
  { id:'r3', at:'badami', kind:'Overcharging', text:'Cave-side stall charging ₹120 for a ₹20 water bottle.',
    by:'u-dev',   rep:31, votes:4,  status:'pending',  ago:'8 hours ago' },
  { id:'r4', at:'gokarna',kind:'Safety',       text:'Unlit stretch on the Om–Kudle headland path after 19:00.',
    by:'u-meera', rep:91, votes:44, status:'verified', ago:'1 week ago' },
  { id:'r5', at:'hampi',  kind:'Misinformation',text:'Boatman says Vittala closes at 15:00 to push a private tour. It closes 17:30.',
    by:'u-arjun', rep:82, votes:12, status:'pending',  ago:'3 hours ago' },
];

// Live footfall for the department dashboard (hour → visitors). SIMULATED.
export const FOOTFALL = {
  hampi:      [12,18,64,142,231,288,306,271,198,144,166,214,268,241,178,96,41],
  virupaksha: [88,132,196,241,203,166,121,94,77,92,118,164,221,264,238,152,64],
  vittala:    [0,0,34,96,168,204,221,196,151,118,131,159,188,161,104,22,0],
  mysuru:     [0,0,0,0,74,188,296,352,381,344,301,318,366,392,341,242,118],
  badami:     [0,0,0,44,96,148,181,166,132,101,118,146,171,152,98,26,0],
};
export const FOOTFALL_HOURS = ['06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22'];

export const INCIDENTS = [
  { id:'i1', at:'hampi',   type:'SOS',        who:'Tourist · verified', status:'resolved',
    t:'Yesterday 16:42', note:'Heat exhaustion near Matanga. Responder reached in 11 min.' },
  { id:'i2', at:'gokarna', type:'Lost',       who:'Tourist · verified', status:'resolved',
    t:'2 days ago 20:10', note:'Group separated on the headland path. Guardian link used to locate.' },
  { id:'i3', at:'badami',  type:'Medical',    who:'Tourist · verified', status:'closed',
    t:'4 days ago 11:25', note:'Fall on Cave 3 steps. Local clinic, no transfer.' },
  { id:'i4', at:'mysuru',  type:'False alarm',who:'Unverified number', status:'flagged',
    t:'6 days ago 22:58', note:'SOS from an unverified device. Held in the review queue.' },
];

// Capacity slots held per place per hour (slot control for fragile sites).
export const SLOTS = {
  vittala: { cap: 120, sold: { '09':112,'10':120,'11':98,'12':61,'13':44,'14':73,'15':109,'16':120,'17':66 } },
  hampi:   { cap: 180, sold: { '07':44,'08':101,'09':166,'10':180,'11':158,'12':96,'13':71,'14':112,'15':170,'16':180,'17':121 } },
  badami:  { cap: 140, sold: { '09':58,'10':94,'11':126,'12':101,'13':72,'14':88,'15':118,'16':134,'17':61 } },
  mysuru:  { cap: 300, sold: { '10':241,'11':288,'12':300,'13':262,'14':211,'15':254,'16':298,'17':300 } },
};

export const LANGS = {
  en: { code:'en-IN', label:'English',  native:'English',
        sample:'Four days in Hampi, budget eight thousand, relaxed pace, heritage and food.' },
  hi: { code:'hi-IN', label:'Hindi',    native:'हिन्दी',
        sample:'हम्पी में चार दिन, बजट आठ हज़ार, आराम से, विरासत और खाना।' },
  kn: { code:'kn-IN', label:'Kannada',  native:'ಕನ್ನಡ',
        sample:'ಹಂಪಿಯಲ್ಲಿ ನಾಲ್ಕು ದಿನ, ಬಜೆಟ್ ಎಂಟು ಸಾವಿರ, ನಿಧಾನ ಗತಿ, ಪರಂಪರೆ ಮತ್ತು ಆಹಾರ.' },
};

export const REFERENCES = [
  'Ministry of Tourism, Government of India — India Tourism Statistics (open data)',
  'Ministry of Tourism 24×7 multilingual tourist helpline — 1800-11-1363',
  'Department of Tourism, Government of Karnataka',
  'National Emergency Response System (ERSS-112), Ministry of Home Affairs',
  'Archaeological Survey of India — monuments and online e-ticketing',
  'Vansteenwegen, Souffriau & Van Oudheusden, “The Orienteering Problem: A Survey”, EJOR 209(1), 2011',
  'Orienteering Problem benchmark instances, KU Leuven',
  'General Transit Feed Specification (GTFS)',
  'RFC 2104 — HMAC, signs the ticket QR codes',
  'RFC 6238 — TOTP, rotates the ticket codes',
  'NPCI — Unified Payments Interface (UPI) deep link specification',
  'W3C Service Workers — offline plan, tickets and maps',
];
