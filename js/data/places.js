// Seeded destination corridor. All figures are SIMULATED for demonstration.
// `corridor: true` marks the manually-verified corridor the scheduler solves over.
// Compact form: [id, name, script, state, lat, lon, kinds, glyph, rating,
//                visitMin, open, close, fee, slotCap, crowd, best, blurb]

const P = (id,n,sc,st,lat,lon,k,g,r,v,o,c,f,cap,cr,bt,b,corridor=false) =>
  ({ id, name:n, script:sc, state:st, lat, lon, kinds:k.split(' '), glyph:g,
     rating:r, visitMin:v, open:o, close:c, fee:f, slotCap:cap, crowd:cr,
     best:bt, blurb:b, corridor });

export const PLACES = [
  // ── KARNATAKA — the verified corridor ───────────────────────────────────
  P('blr','Bengaluru','ಬೆಂಗಳೂರು','Karnataka',12.9716,77.5946,'food culture','city',4.2,120,'06:00','22:00',0,999,.62,'Oct–Feb','Garden city, deco cinemas and the corridor’s gateway station.',true),
  P('lalbagh','Lalbagh Botanical Garden','ಲಾಲ್‌ಬಾಗ್','Karnataka',12.9507,77.5848,'nature culture','forest',4.4,75,'06:00','19:00',30,400,.55,'Oct–Feb','A 240-acre Tipu-era garden around a glass conservatory.',true),
  P('nandi','Nandi Hills','ನಂದಿ ಬೆಟ್ಟ','Karnataka',13.3702,77.6835,'nature adventure','mountain',4.3,150,'06:00','18:00',20,300,.74,'Sep–Feb','Sunrise ridge above a sea of cloud, an hour north of the city.',true),
  P('hampi','Hampi — Sacred Centre','ಹಂಪಿ','Karnataka',15.3350,76.4600,'heritage spiritual','ruins',4.9,240,'06:00','18:00',40,180,.58,'Oct–Mar','The Vijayanagara capital: boulder fields, bazaars and a river of ruins.',true),
  P('virupaksha','Virupaksha Temple','ವಿರೂಪಾಕ್ಷ','Karnataka',15.3350,76.4589,'spiritual heritage','gopuram',4.7,60,'06:00','12:30',10,220,.71,'Oct–Mar','Still-worshipped since the 7th century, under a 50m gopuram.',true),
  P('vittala','Vittala Temple & Stone Chariot','ವಿಠ್ಠಲ','Karnataka',15.3423,76.4753,'heritage culture','ruins',4.9,90,'08:30','17:30',40,120,.66,'Oct–Mar','Musical pillars and the stone chariot on the fifty-rupee note.',true),
  P('anegundi','Anegundi','ಆನೆಗುಂದಿ','Karnataka',15.3600,76.4800,'culture heritage','village',4.3,120,'07:00','18:00',0,150,.24,'Oct–Mar','Older than Hampi across the Tungabhadra; craft collectives and coracles.',true),
  P('matanga','Matanga Hill Sunset','ಮಾತಂಗ','Karnataka',15.3383,76.4650,'nature adventure','mountain',4.6,75,'05:30','18:30',0,90,.68,'Oct–Mar','The climb every traveller in Hampi makes at least once.',true),
  P('tbdam','Tungabhadra Dam','ತುಂಗಭದ್ರಾ','Karnataka',15.2586,76.3350,'nature','lake',4.0,60,'09:00','18:00',15,250,.42,'Aug–Jan','Reservoir gardens and a musical fountain at dusk.',true),
  P('badami','Badami Cave Temples','ಬಾದಾಮಿ','Karnataka',15.9195,75.6850,'heritage','cave',4.7,120,'09:00','17:30',25,140,.44,'Oct–Feb','Four Chalukyan caves cut into a red sandstone cliff above a tank.',true),
  P('aihole','Aihole','ಐಹೊಳೆ','Karnataka',16.0197,75.8814,'heritage','ruins',4.4,90,'09:00','17:30',25,100,.28,'Oct–Feb','The cradle of Indian temple architecture — 120 experiments in stone.',true),
  P('pattadakal','Pattadakal','ಪಟ್ಟದಕಲ್ಲು','Karnataka',15.9487,75.8160,'heritage spiritual','temple',4.6,90,'09:00','17:30',40,120,.36,'Oct–Feb','A UNESCO group where northern and southern temple forms meet.',true),
  P('mysuru','Mysuru Palace','ಮೈಸೂರು ಅರಮನೆ','Karnataka',12.3052,76.6552,'heritage culture','palace',4.8,120,'10:00','17:30',70,300,.79,'Sep–Feb','Indo-Saracenic state rooms; ninety-seven thousand bulbs on Sunday nights.',true),
  P('chamundi','Chamundi Hill','ಚಾಮುಂಡಿ ಬೆಟ್ಟ','Karnataka',12.2724,76.6736,'spiritual nature','temple',4.5,90,'07:30','21:00',0,200,.72,'Sep–Feb','A thousand steps, a monolithic Nandi and the whole city below.',true),
  P('srirangapatna','Srirangapatna','ಶ್ರೀರಂಗಪಟ್ಟಣ','Karnataka',12.4181,76.6947,'heritage','fort',4.3,105,'08:30','18:00',25,160,.41,'Sep–Feb','Tipu Sultan’s island fort, summer palace and river ghats.',true),
  P('belur','Belur Chennakeshava','ಬೇಲೂರು','Karnataka',13.1628,75.8600,'heritage spiritual','temple',4.7,90,'07:30','19:00',25,140,.48,'Oct–Feb','Hoysala soapstone carved to the fineness of sandalwood.',true),
  P('halebidu','Halebidu Hoysaleswara','ಹಳೇಬೀಡು','Karnataka',13.2126,75.9938,'heritage','temple',4.7,75,'06:30','18:00',25,130,.39,'Oct–Feb','Friezes of elephants, horsemen and epics wrapped around a temple.',true),
  P('shravana','Shravanabelagola','ಶ್ರವಣಬೆಳಗೊಳ','Karnataka',12.8574,76.4885,'spiritual heritage','statue',4.6,120,'06:30','18:00',0,180,.51,'Nov–Feb','618 steps barefoot to a 17-metre Bahubali carved from one rock.',true),
  P('madikeri','Madikeri & Abbey Falls','ಮಡಿಕೇರಿ','Karnataka',12.4244,75.7382,'nature food','waterfall',4.4,150,'07:00','18:00',30,220,.57,'Oct–Mar','Coffee estates, mist and a fall at the end of a plantation path.',true),
  P('dubare','Dubare Elephant Camp','ದುಬಾರೆ','Karnataka',12.3667,75.9333,'nature adventure','wildlife',4.2,120,'09:00','17:00',150,120,.49,'Oct–Mar','Forest-department camp on the Kaveri; coracles and elephant care.',true),
  P('bandipur','Bandipur National Park','ಬಂಡೀಪುರ','Karnataka',11.6600,76.6300,'nature adventure','wildlife',4.6,180,'06:00','18:00',300,90,.53,'Oct–May','Tiger reserve on the Nilgiri edge; safari windows at dawn and dusk.',true),
  P('udupi','Udupi Krishna Temple','ಉಡುಪಿ','Karnataka',13.3409,74.7421,'spiritual food','temple',4.6,75,'04:30','21:00',0,400,.69,'Oct–Feb','Darshan through the nine-holed window, and the birthplace of the masala dosa.',true),
  P('malpe','Malpe & St Mary’s Island','ಮಲ್ಪೆ','Karnataka',13.3494,74.7050,'beaches nature','beach',4.4,180,'08:00','18:00',300,150,.61,'Oct–Feb','Ferry out to columnar basalt formations six million years old.',true),
  P('gokarna','Gokarna — Om Beach','ಗೋಕರ್ಣ','Karnataka',14.5167,74.3167,'beaches spiritual','beach',4.6,210,'06:00','19:00',0,200,.64,'Oct–Feb','A pilgrimage town with a coastline shaped like a syllable.',true),
  P('jog','Jog Falls','ಜೋಗ ಜಲಪಾತ','Karnataka',14.2294,74.8125,'nature','waterfall',4.5,90,'06:00','18:00',20,250,.58,'Aug–Dec','The Sharavati drops 253 metres in four named streams.',true),

  // ── RAJASTHAN ───────────────────────────────────────────────────────────
  P('amber','Amber Fort','आमेर','Rajasthan',26.9855,75.8513,'heritage culture','fort',4.7,150,'08:00','17:30',100,300,.81,'Oct–Mar','Ramparts up a hillside, and the mirrored Sheesh Mahal within.'),
  P('hawa','Hawa Mahal','हवा महल','Rajasthan',26.9239,75.8267,'heritage','palace',4.5,45,'09:00','16:30',50,250,.86,'Oct–Mar','953 lattice windows built so the court could watch the street unseen.'),
  P('udaipur','City Palace, Udaipur','उदयपुर','Rajasthan',24.5760,73.6832,'heritage culture','palace',4.8,150,'09:30','17:30',300,280,.77,'Sep–Mar','A palace grown over four centuries above Lake Pichola.'),
  P('jaisalmer','Jaisalmer Fort','जैसलमेर','Rajasthan',26.9124,70.9128,'heritage','fort',4.7,180,'09:00','18:00',50,200,.63,'Nov–Feb','A living fort of golden sandstone rising straight out of the Thar.'),
  P('chandbaori','Chand Baori Stepwell','चाँद बावड़ी','Rajasthan',27.0074,76.6065,'heritage','stepwell',4.6,45,'08:00','18:00',25,120,.44,'Oct–Mar','3,500 steps folding thirteen storeys down into the earth.'),
  P('ranthambore','Ranthambore','रणथंभौर','Rajasthan',26.0173,76.5026,'nature adventure','wildlife',4.5,240,'06:30','18:00',1200,80,.69,'Oct–Apr','Tigers moving through the ruins of a Chauhan fort.'),
  P('thar','Sam Sand Dunes','सम','Rajasthan',26.8500,70.5000,'adventure nature','dunes',4.4,180,'15:00','21:00',500,150,.58,'Nov–Feb','Camel lines along the dune crest at the hour before dark.'),

  // ── UTTAR PRADESH / DELHI / PUNJAB ──────────────────────────────────────
  P('taj','Taj Mahal','ताजमहल','Uttar Pradesh',27.1751,78.0421,'heritage','minaret',5.0,150,'06:00','18:30',250,400,.92,'Oct–Mar','A tomb of translucent marble that changes colour with the hour.'),
  P('fatehpur','Fatehpur Sikri','फ़तेहपुर सीकरी','Uttar Pradesh',27.0940,77.6610,'heritage','fort',4.6,120,'06:00','18:00',50,220,.58,'Oct–Mar','Akbar’s red sandstone capital, abandoned within fifteen years.'),
  P('varanasi','Varanasi Ghats','वाराणसी','Uttar Pradesh',25.3109,83.0107,'spiritual culture','ghats',4.9,180,'04:00','22:00',0,500,.88,'Oct–Mar','Eighty-eight ghats, the Ganga Aarti, and a city older than history.'),
  P('sarnath','Sarnath','सारनाथ','Uttar Pradesh',25.3811,83.0244,'spiritual heritage','stupa',4.5,90,'06:00','18:00',25,180,.42,'Oct–Mar','Where the Buddha gave his first sermon; the Dhamek Stupa still stands.'),
  P('qutub','Qutub Minar','क़ुतुब मीनार','Delhi',28.5245,77.1855,'heritage','minaret',4.6,90,'07:00','17:00',35,300,.74,'Oct–Mar','A 73-metre victory tower and an iron pillar that will not rust.'),
  P('humayun','Humayun’s Tomb','हुमायूँ का मक़बरा','Delhi',28.5933,77.2507,'heritage','minaret',4.7,90,'06:00','18:00',35,260,.61,'Oct–Mar','The garden-tomb that rehearsed everything the Taj would become.'),
  P('redfort','Red Fort','लाल क़िला','Delhi',28.6562,77.2410,'heritage','fort',4.5,120,'09:30','16:30',35,350,.78,'Oct–Mar','Shahjahanabad’s citadel, and the ramparts of every Independence Day.'),
  P('golden','Golden Temple','ਹਰਿਮੰਦਰ ਸਾਹਿਬ','Punjab',31.6200,74.8765,'spiritual culture','temple',5.0,150,'00:00','23:59',0,600,.83,'Oct–Mar','Gold on water, and a langar that feeds a hundred thousand a day.'),

  // ── KERALA / TAMIL NADU / GOA ───────────────────────────────────────────
  P('alleppey','Alappuzha Backwaters','ആലപ്പുഴ','Kerala',9.4981,76.3388,'nature culture','houseboat',4.8,300,'07:00','18:00',2500,120,.66,'Sep–Mar','Kettuvallam houseboats through paddy fields below sea level.'),
  P('munnar','Munnar Tea Estates','മൂന്നാർ','Kerala',10.0889,77.0595,'nature','tea',4.7,240,'07:00','18:00',100,200,.71,'Sep–Mar','Contour-planted slopes in an impossible shade of green.'),
  P('kochi','Fort Kochi','കൊച്ചി','Kerala',9.9658,76.2422,'heritage food culture','church',4.6,180,'08:00','20:00',0,300,.64,'Oct–Mar','Chinese fishing nets, a Portuguese church and a Jewish quarter in one walk.'),
  P('periyar','Periyar, Thekkady','പെരിയാർ','Kerala',9.4620,77.2400,'nature adventure','wildlife',4.4,180,'06:00','18:00',450,110,.55,'Oct–Mar','Boat safaris on a lake made by a dam in 1895.'),
  P('varkala','Varkala Cliff','വർക്കല','Kerala',8.7379,76.7163,'beaches','beach',4.5,180,'06:00','20:00',0,200,.6,'Oct–Mar','Red laterite cliffs standing directly over the Arabian Sea.'),
  P('madurai','Meenakshi Amman Temple','மதுரை','Tamil Nadu',9.9195,78.1193,'spiritual heritage','gopuram',4.9,150,'05:00','12:30',50,400,.82,'Oct–Mar','Fourteen towers of painted figures over a temple-city within a city.'),
  P('thanjavur','Brihadeeswarar Temple','தஞ்சாவூர்','Tamil Nadu',10.7828,79.1318,'heritage spiritual','gopuram',4.8,120,'06:00','20:30',0,250,.57,'Oct–Feb','A thousand years old, and its shadow reputedly never falls to the ground.'),
  P('mahabalipuram','Mahabalipuram Shore Temple','மாமல்லபுரம்','Tamil Nadu',12.6161,80.1995,'heritage beaches','temple',4.7,120,'06:00','18:00',40,220,.66,'Nov–Feb','Pallava rock-cut monoliths standing where the surf reaches them.'),
  P('ooty','Ooty & Nilgiri Railway','ஊட்டி','Tamil Nadu',11.4102,76.6950,'nature culture','mountain',4.3,240,'07:00','18:00',200,250,.75,'Oct–Jun','A rack-and-pinion train climbing 208 curves into the Nilgiris.'),
  P('bomjesus','Basilica of Bom Jesus','बॉम जेजू','Goa',15.5009,73.9116,'heritage spiritual','church',4.6,60,'09:00','18:30',0,200,.62,'Nov–Feb','Baroque laterite, and the relics of St Francis Xavier.'),
  P('palolem','Palolem Beach','पालोलेम','Goa',15.0100,74.0233,'beaches food','beach',4.6,240,'06:00','22:00',0,300,.7,'Nov–Feb','A crescent bay closed at both ends by headland and rock.'),
  P('aguada','Fort Aguada','आगुआद','Goa',15.4926,73.7736,'heritage','lighthouse',4.3,75,'09:30','18:00',50,180,.58,'Nov–Feb','A 1612 Portuguese bastion above the Mandovi with a four-storey lighthouse.'),

  // ── MAHARASHTRA / MADHYA PRADESH / GUJARAT ──────────────────────────────
  P('ajanta','Ajanta Caves','अजिंठा','Maharashtra',20.5519,75.7033,'heritage culture','cave',4.8,210,'09:00','17:30',40,150,.6,'Nov–Mar','Thirty rock-cut viharas and the finest surviving ancient Indian painting.'),
  P('ellora','Ellora Caves','वेरूळ','Maharashtra',20.0269,75.1790,'heritage spiritual','cave',4.9,180,'08:00','17:30',40,160,.63,'Nov–Mar','Kailasa: a temple carved downward out of one piece of rock.'),
  P('gateway','Gateway of India','गेटवे ऑफ इंडिया','Maharashtra',18.9220,72.8347,'heritage culture','minaret',4.4,60,'00:00','23:59',0,500,.85,'Nov–Feb','Basalt arch on the harbour where the last British troops left.'),
  P('kaas','Kaas Plateau','कास पठार','Maharashtra',17.7200,73.8200,'nature','forest',4.5,150,'08:00','18:00',150,100,.52,'Aug–Sep','A volcanic plateau that flowers all at once for three weeks.'),
  P('khajuraho','Khajuraho','खजुराहो','Madhya Pradesh',24.8318,79.9199,'heritage culture','temple',4.7,150,'08:00','18:00',40,180,.55,'Oct–Mar','Chandela temples covered in a sculpture programme unlike any other.'),
  P('sanchi','Sanchi Stupa','साँची','Madhya Pradesh',23.4794,77.7398,'spiritual heritage','stupa',4.6,90,'06:30','18:00',40,160,.4,'Jul–Mar','Ashoka’s hemisphere and four gateways of carved narrative.'),
  P('bandhavgarh','Bandhavgarh','बांधवगढ़','Madhya Pradesh',23.6960,81.0270,'nature adventure','wildlife',4.6,240,'06:00','18:00',1500,70,.62,'Oct–Jun','The highest density of tigers of any park in India.'),
  P('ranikivav','Rani ki Vav','રાણી કી વાવ','Gujarat',23.8586,72.1017,'heritage','stepwell',4.8,75,'08:00','18:00',40,140,.45,'Oct–Mar','An inverted temple seven storeys deep, with 500 principal sculptures.'),
  P('rann','Rann of Kutch','કચ્છનું રણ','Gujarat',23.8500,69.7000,'nature culture','dunes',4.7,240,'15:00','23:00',100,250,.6,'Nov–Feb','White salt to the horizon under a full moon.'),
  P('gir','Gir National Park','ગીર','Gujarat',21.1244,70.8240,'nature','wildlife',4.5,210,'06:00','17:00',800,90,.57,'Dec–Mar','The only wild Asiatic lions left on earth.'),

  // ── WEST BENGAL / ODISHA / BIHAR / NORTH-EAST ───────────────────────────
  P('victoria','Victoria Memorial','ভিক্টোরিয়া','West Bengal',22.5448,88.3426,'heritage culture','palace',4.6,120,'10:00','18:00',30,300,.68,'Oct–Feb','Makrana marble in a Kolkata garden, now a museum of the Raj.'),
  P('kumartuli','Kumartuli','কুমোরটুলি','West Bengal',22.6003,88.3574,'culture','village',4.5,90,'08:00','18:00',0,120,.36,'Aug–Oct','Lanes where the idols for Durga Puja are built from river clay.'),
  P('darjeeling','Darjeeling & the Toy Train','দার্জিলিং','West Bengal',27.0360,88.2627,'nature culture','mountain',4.7,240,'06:00','18:00',1500,200,.72,'Oct–Dec','A 2ft-gauge railway, Kanchenjunga at dawn, and first-flush tea.'),
  P('sundarbans','Sundarbans','সুন্দরবন','West Bengal',21.9497,88.9000,'nature adventure','forest',4.6,300,'07:00','17:00',1500,80,.44,'Nov–Feb','The largest mangrove forest on earth, and the tiger that swims.'),
  P('konark','Konark Sun Temple','କୋଣାର୍କ','Odisha',19.8876,86.0945,'heritage spiritual','temple',4.8,120,'06:00','20:00',40,200,.61,'Oct–Feb','A chariot of the sun with twenty-four carved stone wheels.'),
  P('puri','Jagannath Temple, Puri','ପୁରୀ','Odisha',19.8050,85.8180,'spiritual','gopuram',4.7,120,'05:00','22:00',0,500,.8,'Oct–Feb','One of the Char Dham; a kitchen that cooks for a hundred thousand.'),
  P('bodhgaya','Mahabodhi Temple','बोधगया','Bihar',24.6961,84.9911,'spiritual heritage','stupa',4.8,120,'05:00','21:00',0,250,.6,'Oct–Mar','The descendant of the tree under which the Buddha woke.'),
  P('nalanda','Nalanda Mahavihara','नालंदा','Bihar',25.1358,85.4436,'heritage','ruins',4.5,120,'09:00','17:00',40,150,.35,'Oct–Mar','Brick ruins of a university that taught for seven hundred years.'),
  P('kaziranga','Kaziranga','কাজিৰঙা','Assam',26.5775,93.1711,'nature adventure','wildlife',4.7,240,'05:30','16:30',900,90,.5,'Nov–Apr','Two-thirds of the world’s one-horned rhinoceros in one floodplain.'),
  P('majuli','Majuli','মাজুলী','Assam',26.9500,94.1667,'culture nature','village',4.5,300,'07:00','18:00',0,80,.22,'Nov–Mar','The world’s largest river island, and its satra monasteries.'),
  P('cherrapunji','Nohkalikai & Root Bridges','সোহরা','Meghalaya',25.2700,91.7300,'nature adventure','bridge',4.8,300,'06:00','17:00',50,100,.47,'Oct–Apr','Living bridges grown from ficus roots across monsoon gorges.'),
  P('tsomgo','Tsomgo Lake','ཚོ་མགོ','Sikkim',27.3750,88.7620,'nature','lake',4.6,150,'07:00','16:00',300,120,.58,'Apr–May','A glacial lake at 3,753m that changes colour with the season.'),
  P('rumtek','Rumtek Monastery','རུམ་སྟེག','Sikkim',27.2880,88.5610,'spiritual culture','monastery',4.5,90,'06:00','18:00',10,140,.4,'Mar–May','Seat of the Karmapa, rebuilt stone for stone from Tibet.'),

  // ── HIMALAYAN NORTH ─────────────────────────────────────────────────────
  P('shimla','Shimla Ridge & Mall','शिमला','Himachal Pradesh',31.1048,77.1734,'culture nature','mountain',4.3,180,'06:00','22:00',0,400,.76,'Mar–Jun','Deodar, gabled tin roofs, and the summer capital of an empire.'),
  P('solang','Solang Valley','सोलंग','Himachal Pradesh',32.3170,77.1560,'adventure nature','mountain',4.4,210,'08:00','17:00',600,180,.69,'Dec–Feb','Paragliding in summer, a snow bowl in winter.'),
  P('keymon','Key Monastery, Spiti','की གོན་པ','Himachal Pradesh',32.2980,78.0120,'spiritual nature','monastery',4.8,120,'07:00','18:00',50,60,.31,'Jun–Sep','A thousand-year-old fort-monastery stacked up a bare hillside.'),
  P('rishikesh','Rishikesh','ऋषिकेश','Uttarakhand',30.0869,78.2676,'spiritual adventure','ghats',4.6,180,'05:00','21:00',0,300,.7,'Sep–Nov','Ganga aarti at Triveni Ghat and white water above it.'),
  P('valleyflowers','Valley of Flowers','फूलों की घाटी','Uttarakhand',30.7280,79.6050,'nature adventure','forest',4.9,360,'07:00','17:00',200,60,.4,'Jul–Aug','Three hundred alpine species flowering in a hanging valley.'),
  P('kedarnath','Kedarnath','केदारनाथ','Uttarakhand',30.7346,79.0669,'spiritual adventure','temple',4.9,240,'04:00','21:00',0,150,.74,'May–Jun','A stone shrine at 3,583m, reached on foot in sixteen kilometres.'),
  P('pangong','Pangong Tso','པང་གོང་མཚོ','Ladakh',33.7590,78.6690,'nature adventure','lake',4.9,180,'06:00','19:00',400,120,.55,'Jun–Sep','A brackish lake at 4,350m that runs from turquoise to ink.'),
  P('thiksey','Thiksey Monastery','ཐིག་སེ','Ladakh',34.0553,77.6680,'spiritual culture','monastery',4.7,90,'06:00','19:00',50,100,.45,'Jun–Sep','Twelve storeys of whitewash, and a 15m Maitreya inside.'),
  P('nubra','Nubra Valley','ནུབ་ར','Ladakh',34.6800,77.5600,'adventure nature','dunes',4.7,300,'06:00','19:00',300,90,.42,'Jun–Sep','Cold-desert dunes and Bactrian camels between two ranges.'),
  P('dallake','Dal Lake','डल झील','Jammu and Kashmir',34.1180,74.8580,'nature culture','houseboat',4.7,180,'06:00','20:00',800,250,.68,'Apr–Oct','Shikaras, floating gardens and cedar houseboats under Zabarwan.'),
  P('gulmarg','Gulmarg Gondola','गुलमर्ग','Jammu and Kashmir',34.0480,74.3800,'adventure nature','mountain',4.6,210,'09:00','17:00',1600,150,.66,'Dec–Mar','One of the highest cable cars in the world, to 3,979m.'),

  // ── SOUTH-EAST & ISLANDS ────────────────────────────────────────────────
  P('charminar','Charminar','చార్మినార్','Telangana',17.3616,78.4747,'heritage food','minaret',4.5,75,'09:00','17:30',25,250,.8,'Oct–Feb','Four minarets over the bangle bazaars of the old city.'),
  P('golconda','Golconda Fort','గోల్కొండ','Telangana',17.3833,78.4011,'heritage','fort',4.6,150,'09:00','17:30',25,200,.64,'Oct–Feb','Acoustics that carry a clap from the gate to the citadel.'),
  P('tirupati','Tirumala','తిరుమల','Andhra Pradesh',13.6833,79.3475,'spiritual','gopuram',4.8,300,'02:30','23:30',300,800,.9,'Sep–Feb','The most-visited place of worship on earth.'),
  P('araku','Araku Valley','అరకు','Andhra Pradesh',18.3273,82.8787,'nature culture','tea',4.3,240,'07:00','18:00',150,150,.44,'Oct–Mar','A coffee valley reached by a railway through forty-six tunnels.'),
  P('radhanagar','Radhanagar Beach','राधानगर','Andaman and Nicobar Islands',11.9830,92.9530,'beaches nature','beach',4.8,240,'05:00','17:00',0,150,.5,'Nov–Apr','White sand on Havelock, backed by mahua forest.'),
  P('cellular','Cellular Jail','सेलुलर जेल','Andaman and Nicobar Islands',11.6750,92.7480,'heritage culture','fort',4.5,120,'09:00','17:00',30,180,.55,'Nov–Apr','Kala Pani — seven wings of solitary cells, three still standing.'),
];

export const byId = Object.fromEntries(PLACES.map(p => [p.id, p]));

export const KINDS = [
  { id:'heritage',  label:'Heritage',  gl:'ruins' },
  { id:'nature',    label:'Nature',    gl:'forest' },
  { id:'beaches',   label:'Beaches',   gl:'beach' },
  { id:'food',      label:'Food',      gl:'village' },
  { id:'adventure', label:'Adventure', gl:'mountain' },
  { id:'spiritual', label:'Spiritual', gl:'temple' },
  { id:'culture',   label:'Culture',   gl:'palace' },
];

export const STATE_CHAR = {
  'Karnataka':            'Coast · Heritage · Western Ghats',
  'Rajasthan':            'Desert · Forts · Stepwells',
  'Kerala':               'Backwaters · Ghats · Spice',
  'Tamil Nadu':           'Temples · Coromandel · Bronze',
  'West Bengal':          'Delta · Terracotta · Letters',
  'Himachal Pradesh':     'Deodar · Ridges · Monasteries',
  'Uttar Pradesh':        'Ganga · Mughal · Pilgrimage',
  'Maharashtra':          'Rock-cut · Konkan · Deccan',
  'Goa':                  'Baroque · Beaches · Estuary',
  'Ladakh':               'Cold desert · Gompas · Passes',
  'Delhi':                'Seven cities · Ramparts · Tombs',
  'Gujarat':              'Salt · Stepwells · Lions',
  'Odisha':               'Kalinga · Chariots · Coast',
  'Madhya Pradesh':       'Stupas · Sculpture · Tigers',
  'Assam':                'Brahmaputra · Rhino · Satras',
  'Punjab':               'Rivers · Sarovar · Plains',
  'Uttarakhand':          'Char Dham · Alpine · Source',
  'Sikkim':               'Kanchenjunga · Gompas · Orchid',
  'Andhra Pradesh':       'Tirumala · Coast · Coffee',
  'Telangana':            'Qutb Shahi · Deccan · Pearls',
  'Meghalaya':            'Rain · Root bridges · Gorges',
  'Bihar':                'Bodhi · Vihara · Magadha',
  'Jammu and Kashmir':    'Vale · Chinar · Shikara',
  'Chhattisgarh':         'Bastar · Falls · Forest',
  'Jharkhand':            'Plateau · Falls · Ore',
  'Haryana':              'Sarasvati · Plains · Kurukshetra',
  'Arunachal Pradesh':    'Tawang · Frontier · Cloud',
  'Nagaland':             'Hornbill · Hills · Weave',
  'Manipur':              'Loktak · Polo · Ras',
  'Mizoram':              'Blue hills · Bamboo · Song',
  'Tripura':              'Ujjayanta · Bamboo · Neermahal',
  'Andaman and Nicobar Islands':'Coral · Kala Pani · Forest',
  'Lakshadweep':          'Atoll · Lagoon · Coir',
  'Puducherry':           'Boulevard · Franco · Sea wall',
  'Chandigarh':           'Grid · Concrete · Rock Garden',
  'Dadra and Nagar Haveli and Daman and Diu':'Portuguese · Coast · Forts',
};

// Regional script for the state name itself (atlas accent).
export const STATE_SCRIPT = {
  'Karnataka':'ಕರ್ನಾಟಕ','Kerala':'കേരളം','Tamil Nadu':'தமிழ்நாடு','Andhra Pradesh':'ఆంధ్రప్రదేశ్',
  'Telangana':'తెలంగాణ','West Bengal':'পশ্চিমবঙ্গ','Odisha':'ଓଡ଼ିଶା','Assam':'অসম','Punjab':'ਪੰਜਾਬ',
  'Gujarat':'ગુજરાત','Rajasthan':'राजस्थान','Uttar Pradesh':'उत्तर प्रदेश','Madhya Pradesh':'मध्य प्रदेश',
  'Maharashtra':'महाराष्ट्र','Bihar':'बिहार','Jharkhand':'झारखंड','Chhattisgarh':'छत्तीसगढ़',
  'Haryana':'हरियाणा','Himachal Pradesh':'हिमाचल प्रदेश','Uttarakhand':'उत्तराखण्ड','Delhi':'दिल्ली',
  'Goa':'गोंय','Sikkim':'སིཀིམ','Ladakh':'ལ་དྭགས','Jammu and Kashmir':'جموں و کشمیر',
  'Meghalaya':'মেঘালয়','Manipur':'ꯃꯅꯤꯄꯨꯔ','Nagaland':'नागालैण्ड','Mizoram':'मिज़ोरम',
  'Tripura':'ত্রিপুরা','Arunachal Pradesh':'अरुणाचल','Puducherry':'புதுச்சேரி','Chandigarh':'ਚੰਡੀਗੜ੍ਹ',
  'Lakshadweep':'ലക്ഷദ്വീപ്','Andaman and Nicobar Islands':'अंडमान','Dadra and Nagar Haveli and Daman and Diu':'દમણ',
};
