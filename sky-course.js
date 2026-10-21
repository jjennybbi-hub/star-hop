/* The learning pathway. Six tiers, one idea at a time. Lesson ids are stable so saved progress survives reordering. */
const COURSE = [
{
  tier:'Tier 1', tierName:'Get your bearings',
  tierNote:'How the sky is laid out, how it moves, and how to measure it with your hand.',
  lessons:[
  {
    id:'l1', title:'Which way am I looking?', mins:2,
    goal:'Learn the two numbers that describe any spot in the sky.',
    steps:[
      { say:'Stand outside and you are standing under a dome. Every star sits somewhere on that dome.',
        set:{ stage:{az:180,alt:35,fov:110}, layers:{figures:false,labels:'none',dso:false}, speed:0 } },
      { say:'Two numbers pin down any spot. The first is the <b>compass direction</b> — N, E, S, W along the horizon. Drag the sky left and right; watch the letters at the bottom change.',
        sayXR:'Two numbers pin down any spot. The first is the <b>compass direction</b>. Turn around: the letters N, E, S and W on the horizon are your directions — your real ones, once you have calibrated north.',
        sayVR:'Two numbers pin down any spot. The first is the <b>compass direction</b>. Turn slowly on the spot and watch the strip at the top of the screen: that is your real north, east, south and west, wherever you are standing.',
        set:{ layers:{horizon:true,cardinals:true} } },
      { say:'The second is <b>altitude</b>: how high above the horizon. 0° is the horizon. 90° is straight up — that point is called the <b>zenith</b>.',
        set:{ stage:{az:180,alt:60,fov:100}, layers:{altgrid:true} } },
      { say:'That is the whole coordinate system. "South, 40° up" is a complete instruction for where to look. This app shows both numbers in the bar at the bottom.',
        sayXR:'That is the whole coordinate system. "South, 40° up" is a complete instruction for where to look — and it is exactly how every stop on Tonight\'s tour tells you where to turn.',
        sayVR:'That is the whole coordinate system. "South, 40° up" is a complete instruction for where to look. The compass strip gives you the first number; the small figure above the crosshair gives you the second.',
        set:{ layers:{altgrid:false} } }
    ],
    check:{ kind:'choice', ask:'A star is at altitude 90°. Where do you look?',
      options:[{text:'Straight up, over your head',ok:true},{text:'On the northern horizon'},{text:'Halfway up in the east'}],
      hint:'90° is as high as it gets.' }
  },
  {
    id:'l2', title:'The sky turns — one star does not', mins:3,
    goal:'Find the one fixed point everything else rotates around.',
    steps:[
      { say:'The Earth spins. From down here it looks like the whole sky is turning instead. Everything rises in the east and sets in the west.',
        set:{ stage:{az:90,alt:30,fov:100,north:true}, layers:{figures:true,labels:'bright'}, speed:600 } },
      { say:'Now look north. Here nothing rises or sets — the stars go round in circles. Watch for a moment.',
        set:{ stage:{az:0,alt:45,fov:100,north:true}, speed:600 } },
      { say:'They are all circling one point: the <b>north celestial pole</b>. It is the direction Earth\'s axis points. And there happens to be a reasonably bright star sitting almost exactly there.',
        set:{ mark:['umi-alp'], speed:600 } },
      { say:'That star is <b>Polaris</b>, the Pole Star. It stays put all night, every night. Whenever you can see Polaris, you know which way is north.',
        set:{ mark:['umi-alp'], speed:0, layers:{labels:'named'} } }
    ],
    check:{ kind:'find', targets:['umi-alp'], ask:'Click the star that stays still.', hint:'It is the centre of all those circles, due north.' }
  },
  {
    id:'l16', title:'Your hand is a ruler', mins:3,
    goal:'Measure the sky with the one instrument you always carry.',
    steps:[
      { say:'Stretch your arm out straight and make a fist. At arm\'s length, a fist covers about <b>10°</b> of sky. This works for almost everybody — longer arms come with bigger hands.',
        set:{ stage:{target:'umi-alp', north:true, fov:95, also:['uma-bet','uma-alp']}, ruler:true, layers:{labels:'named',figures:true} } },
      { say:'The rest of your hand is a ruler too. <b>Little finger 1°. Thumb 2°. Three fingers 5°. Fist 10°. Spread hand, thumb to little finger, 20°.</b> The scale in the bottom corner draws each one at the zoom you are using right now.',
        sayXR:'The rest of your hand is a ruler too. <b>Little finger 1°. Thumb 2°. Three fingers 5°. Fist 10°. Spread hand, thumb to little finger, 20°.</b> Hold a fist out now, controller and all: it covers the same patch of sky in here as it does outside.',
        set:{ ruler:true } },
      { say:'A free fact to test it on: <b>Polaris always sits as high above the horizon as your latitude.</b> In {place} that is {lat}° — {latFists}. The ladder shows it fist by fist.',
        set:{ ruler:true, ladder:'umi-alp', mark:['umi-alp'], look:{fov:110} } },
      { say:'Gaps between stars work the same way. The two stars at the front of the Big Dipper\'s bowl are 5° apart — three fingers. From there to Polaris is about 28° — roughly three fists. Press the <b>ruler button</b> at the bottom of the screen and click any two stars to measure them yourself.',
        sayXR:'Gaps between stars work the same way. The two stars at the front of the Big Dipper\'s bowl are 5° apart — three fingers. From there to Polaris is about 28° — roughly three fists. Hold your fist up and step along the line to check.',
        set:{ ruler:true, asterism:'dipper', hop:{chain:['uma-bet','uma-alp','umi-alp'], label:'≈ 3 fists'}, look:{fov:115} } }
    ],
    check:{ kind:'choice', ask:'You measure Polaris at about 5 fists above the horizon. Roughly what latitude are you at?',
      options:[{text:'About 50°',ok:true},{text:'About 5°'},{text:'About 90°'}],
      hint:'One fist is 10°, and Polaris\'s height equals your latitude.' }
  }]
},
{
  tier:'Tier 2', tierName:'The northern anchors',
  tierNote:'Four patterns. Learn these and you can find almost everything else by pointing from them.',
  lessons:[
  {
    id:'l4', title:'The Big Dipper', mins:3,
    goal:'Recognise the seven-star saucepan that never sets.',
    steps:[
      { say:'This is the pattern to learn first. Seven stars: a bowl of four, and a handle of three. It looks like a saucepan.',
        set:{ stage:{target:'uma-eps'}, asterism:'dipper', layers:{figures:false,labels:'none'} } },
      { say:'Names, west to east: <b>Dubhe</b> and <b>Merak</b> make the far edge of the bowl, then <b>Phecda</b> and <b>Megrez</b>. The handle is <b>Alioth</b>, <b>Mizar</b>, <b>Alkaid</b>.',
        set:{ asterism:'dipper', layers:{labels:'named'} } },
      { say:'Look hard at the middle of the handle. <b>Mizar</b> has a faint companion, <b>Alcor</b>, right beside it. If you can split them by eye, your eyesight is fine and the air is steady.',
        set:{ asterism:'dipper', mark:['uma-zet','uma-alc'], zoom:12 } },
      { say:'From anywhere north of about 40° latitude, the Dipper never sets. It just swings round the pole — high in spring evenings, low in autumn. Same seven stars, different angle.',
        set:{ asterism:'dipper', zoom:100, speed:3000 } }
    ],
    check:{ kind:'find', targets:['uma-alp','uma-bet','uma-gam','uma-del','uma-eps','uma-zet','uma-eta'], ask:'Click any star of the Big Dipper.', hint:'Seven stars, saucepan shape.' }
  },
  {
    id:'l5', title:'The Pointers', mins:2,
    goal:'Your first star hop: Dipper to Polaris.',
    steps:[
      { say:'The two stars at the end of the bowl — <b>Merak</b> then <b>Dubhe</b> — are called the Pointers. They do exactly what the name says.',
        set:{ stage:{target:'uma-alp', also:['umi-alp']}, asterism:'dipper', mark:['uma-bet','uma-alp'], layers:{labels:'named'} } },
      { say:'Draw a line from Merak through Dubhe, and carry it on about <b>five times</b> the gap between them. You land on Polaris.',
        set:{ asterism:'dipper', hop:{chain:['uma-bet','uma-alp','umi-alp'], label:'×5 the gap'}, zoom:90 } },
      { say:'That is a <b>star hop</b> — using stars you know to find ones you do not. It is the whole trick of learning the sky. Everything from here is more of these.',
        set:{ asterism:'dipper', hop:{chain:['uma-bet','uma-alp','umi-alp'], label:'×5 the gap'} } },
      { say:'Polaris is the end of the <b>Little Dipper</b>\'s handle — a fainter, more bent version of the big one. From a city you may only see Polaris and the two bowl stars, Kochab and Pherkad.',
        set:{ asterism:'littledipper', layers:{labels:'named'} } }
    ],
    check:{ kind:'find', targets:['umi-alp'], ask:'Labels off. Hop from the Pointers and click Polaris.', hint:'Merak → Dubhe → carry on five gap-lengths.', hideLabels:true }
  },
  {
    id:'l6', title:'Cassiopeia, the W', mins:2,
    goal:'Find north when the Dipper is out of sight.',
    steps:[
      { say:'Five bright stars in a lopsided <b>W</b>. Sometimes it sits as an M — depends on the time of night.',
        set:{ stage:{target:'cas-alp', also:['umi-alp']}, asterism:'w', layers:{labels:'named'} } },
      { say:'Cassiopeia sits on the <b>opposite side of Polaris from the Big Dipper</b>. When one is high, the other is low. Between them, one is always up.',
        set:{ asterism:'w', mark:['umi-alp','uma-eps'], look:{az:0,alt:50,fov:120} } },
      { say:'So in autumn, when the Dipper is scraping the northern horizon, use the W instead: the deeper half of the W points roughly at Polaris.',
        set:{ hop:{chain:['cas-eps','cas-del','umi-alp'], label:'towards the pole'}, asterism:'w' } }
    ],
    check:{ kind:'find', targets:['cas-alp','cas-bet','cas-gam','cas-del','cas-eps'], ask:'Click any star of the W.', hint:'Five stars, zigzag, across the pole from the Dipper.', hideLabels:true }
  },
  {
    id:'l7', title:'Arc to Arcturus, spike to Spica', mins:3,
    goal:'Use the Dipper\'s handle to reach two first-magnitude stars.',
    steps:[
      { say:'The Dipper\'s handle is curved. Keep that curve going away from the bowl — "follow the <b>arc</b>".',
        set:{ stage:{target:'boo-alp', also:['uma-eta','uma-eps','vir-alp']}, asterism:'dipper', layers:{labels:'named'} } },
      { say:'The arc runs straight into <b>Arcturus</b>: a big orange star, the brightest in the northern sky. Orange is the giveaway — it is an ageing star, cooler than the Sun.',
        set:{ hop:{chain:['uma-eps','uma-zet','uma-eta','boo-alp'], label:'arc to Arcturus', curve:0.35}, mark:['boo-alp'] } },
      { say:'Do not stop. Carry the same line on by about the same distance again and you hit <b>Spica</b> — "spike to Spica". Spica is blue-white, hot and young. Hold them both in view and the colour difference is obvious.',
        set:{ hop:{chain:['boo-alp','vir-alp'], label:'spike to Spica'}, mark:['boo-alp','vir-alp'], look:{fov:110} } },
      { say:'Arcturus also sits at the bottom of <b>Boötes</b>, a big kite shape. Once you have the kite, you have that whole region of spring sky.',
        set:{ figures:['boo'], layers:{figures:true} } }
    ],
    check:{ kind:'find', targets:['boo-alp'], ask:'Follow the arc. Click Arcturus.', hint:'Off the end of the curved handle — the bright orange one.', hideLabels:true }
  }]
},
{
  tier:'Tier 3', tierName:'How the sky behaves',
  tierNote:'Why some nights show more, and why the stars change with the seasons.',
  lessons:[
  {
    id:'l3', title:'Bright, brighter, brightest', mins:2,
    goal:'Read the magnitude scale — the one number attached to every star.',
    steps:[
      { say:'Every star has a brightness number called <b>magnitude</b>. The scale is backwards on purpose: <b>smaller means brighter</b>.',
        set:{ stage:{target:'ori-alp'}, layers:{figures:true,labels:'bright'} } },
      { say:'Magnitude 1 stars are the showpieces — about 20 of them in the whole sky. Magnitude 6 is the faintest a good eye can see from truly dark countryside. Sirius is so bright it goes negative: −1.5.',
        set:{ mark:['cma-alp'] } },
      { say:'City lights wash out the faint end. Drag the <b>Sky darkness</b> slider in the Sky tab from city to countryside and watch stars appear. That is the single biggest thing that changes what you can see.',
        sayXR:'City lights wash out the faint end. In mixed reality, the <b>Stars shown</b> buttons on the menu do the same job: Bright is roughly a city sky, All is dark countryside. That is the single biggest thing that changes what you can see.',
        set:{ limit:4.0 } },
      { say:'Here is a dark rural sky. Same stars, nothing changed but the air glow. This is what you are aiming for on a trip out of town.',
        set:{ limit:6.2 } }
    ],
    check:{ kind:'choice', ask:'Which star is brighter: magnitude 1 or magnitude 4?',
      options:[{text:'Magnitude 1',ok:true},{text:'Magnitude 4'},{text:'They are the same'}],
      hint:'Smaller number, brighter star.' }
  },
  {
    id:'l17', title:'Why there are winter stars', mins:3,
    goal:'Understand why the evening sky changes month by month.',
    steps:[
      { say:'Look at the same patch of sky at the same clock time every night and it slowly slides west — about <b>one degree a night</b>. The clock below is locked to one hour; only the date is changing.',
        sayXR:'Look at the same patch of sky at the same clock time every night and it slowly slides west — about <b>one degree a night</b>. The clock on the menu is locked to one hour; only the date is changing.',
        set:{ stage:{target:'ori-alp'}, layers:{figures:true,labels:'named'}, speed:-1 } },
      { say:'Over a couple of months Orion slides from high in the south to setting in the west, and new patterns climb up in the east to replace it. Nothing is wrong with the stars: <b>Earth is travelling round the Sun</b>, so our night side faces a different direction in space each month.',
        set:{ speed:-1, look:{fov:135} } },
      { say:'The same thing measured with a clock: every star rises about <b>4 minutes earlier each night</b> — 2 hours earlier each month. So the "winter stars" are just the ones that are high in the evening in winter. Get up before dawn in October and they are already waiting for you.',
        set:{ speed:0 } },
      { say:'That is why the lessons ahead are grouped by season, and why this app sometimes jumps to a different month: it is taking you to an evening when that pattern is well placed.',
        set:{ speed:0 } }
    ],
    check:{ kind:'choice', ask:'A star is due south at 10 pm tonight. Around what time will it be due south one month from now?',
      options:[{text:'About 8 pm',ok:true},{text:'About midnight'},{text:'Still at 10 pm'}],
      hint:'Everything rises 4 minutes earlier each night. Thirty nights × 4 minutes = ?' }
  }]
},
{
  tier:'Tier 4', tierName:"Winter's showpiece",
  tierNote:'Orion is the best signpost in the sky. From its belt you can reach half the bright stars of winter.',
  lessons:[
  {
    id:'l8', title:'Orion', mins:3,
    goal:'Learn the one pattern everybody can find.',
    steps:[
      { say:'Three equally bright stars in a short, perfectly straight row. Nothing else in the sky looks like that. That is <b>Orion\'s Belt</b>.',
        set:{ stage:{target:'ori-eps'}, asterism:'belt', layers:{figures:false,labels:'none'} } },
      { say:'Above the belt, two shoulders. <b>Betelgeuse</b> on the left is noticeably orange-red. <b>Bellatrix</b> on the right is white.',
        set:{ figures:['ori'], layers:{figures:true,labels:'named'}, mark:['ori-alp','ori-gam'] } },
      { say:'Below, two knees: brilliant blue-white <b>Rigel</b>, and <b>Saiph</b>. Look at Betelgeuse and Rigel one after the other — red versus blue. That is a temperature difference of about 9,000 degrees.',
        set:{ figures:['ori'], mark:['ori-bet','ori-kap'] } },
      { say:'Hanging below the belt is a short line of fainter stars — the <b>sword</b>. The middle "star" is fuzzy. It is not a star at all: it is the <b>Orion Nebula</b>, a cloud of gas where new stars are being born right now.',
        set:{ figures:['ori'], layers:{dso:true}, mark:['m42'], zoom:22 } }
    ],
    check:{ kind:'find', targets:['ori-alp'], ask:'Click Betelgeuse — the red shoulder.', hint:'Top left of the four corner stars, and the orange one.', hideLabels:true }
  },
  {
    id:'l9', title:'The Belt points both ways', mins:3,
    goal:'Three more bright stars, free, from a line you already know.',
    steps:[
      { say:'The Belt is a straight line, and a straight line has two ends. Follow it <b>down and to the left</b>.',
        set:{ stage:{target:'ori-eps', also:['cma-alp','tau-alp','m45']}, asterism:'belt', layers:{labels:'named'} } },
      { say:'You run straight into <b>Sirius</b> — the brightest star in the entire night sky. You cannot mistake it. Low down it flashes red and green like an aircraft light; that is our atmosphere splitting its light.',
        set:{ hop:{chain:['ori-del','ori-zet','cma-alp'], label:'down-left to Sirius'}, mark:['cma-alp'] } },
      { say:'Now go the other way — <b>up and to the right</b>. First you meet orange <b>Aldebaran</b>, the eye of Taurus the bull, sitting at the point of a V of stars.',
        set:{ hop:{chain:['ori-zet','ori-del','tau-alp'], label:'up-right to Aldebaran'}, mark:['tau-alp'] } },
      { say:'Keep going the same way and you reach the <b>Pleiades</b> — a tight little knot of stars, often mistaken for the Little Dipper. Most people see six; the sharp-eyed see seven or more.',
        set:{ hop:{chain:['tau-alp','m45'], label:'and on to the Pleiades'}, mark:['m45'], layers:{dso:true}, zoom:35 } }
    ],
    check:{ kind:'find', targets:['cma-alp'], ask:'Follow the Belt down-left. Click Sirius.', hint:'The brightest star in the sky — you literally cannot pick the wrong one.', hideLabels:true }
  },
  {
    id:'l10', title:'The Winter Hexagon', mins:3,
    goal:'Tie six bright winter stars into a single shape.',
    steps:[
      { say:'Winter evenings hand you more first-magnitude stars than any other season. They form a huge ring around Orion.',
        set:{ stage:{target:'ori-alp', also:['cma-alp','cmi-alp','gem-bet','aur-alp','tau-alp','ori-bet']}, look:{fov:130}, asterism:'hexagon', layers:{labels:'named'} } },
      { say:'Start at <b>Rigel</b> and go anticlockwise: Rigel → <b>Sirius</b> → <b>Procyon</b> → <b>Pollux</b> → <b>Capella</b> → <b>Aldebaran</b> → back to Rigel.',
        set:{ asterism:'hexagon', hop:{chain:['ori-bet','cma-alp','cmi-alp','gem-bet','aur-alp','tau-alp','ori-bet'], label:'the Hexagon'} } },
      { say:'Betelgeuse sits inside it, off-centre. Betelgeuse with Sirius and Procyon makes a neat equilateral <b>Winter Triangle</b> inside the bigger ring.',
        set:{ asterism:'wintertri', mark:['ori-alp','cma-alp','cmi-alp'] } },
      { say:'Above Pollux sits its twin <b>Castor</b>. Pollux is the brighter and more orange of the two. That pair is Gemini.',
        set:{ figures:['gem'], layers:{figures:true}, mark:['gem-alp','gem-bet'] } }
    ],
    check:{ kind:'find', targets:['aur-alp'], ask:'Click Capella — the Hexagon\'s highest corner.', hint:'Yellow, very bright, nearly overhead on a winter evening.', hideLabels:true }
  }]
},
{
  tier:'Tier 5', tierName:"Summer's showpiece",
  tierNote:'The opposite half of the year, and the view straight into our own galaxy.',
  lessons:[
  {
    id:'l11', title:'The Summer Triangle', mins:3,
    goal:'Three bright stars that own the summer sky.',
    steps:[
      { say:'Look up on a summer evening and three bright stars stand out in an obvious big triangle, nearly overhead.',
        set:{ stage:{target:'lyr-alp', also:['aql-alp','cyg-alp']}, look:{fov:120}, asterism:'summer', layers:{labels:'named'} } },
      { say:'<b>Vega</b> is the brightest and highest — brilliant blue-white. <b>Deneb</b> is the faintest of the three, but only because it is 2,600 light years away; it is really the most luminous star you will ever see with your eyes.',
        set:{ asterism:'summer', mark:['lyr-alp','cyg-alp'] } },
      { say:'<b>Altair</b> is the low one, with a fainter star on each side like a row of three. That little row is how you confirm it.',
        set:{ asterism:'summer', mark:['aql-alp','aql-bet','aql-gam'], zoom:30 } },
      { say:'Deneb is the tail of <b>Cygnus the swan</b>, which is also a big cross flying down the Milky Way. Once you see the cross, you can never un-see it.',
        set:{ figures:['cyg'], layers:{figures:true,milkyway:true}, look:{fov:80} } }
    ],
    check:{ kind:'find', targets:['lyr-alp'], ask:'Click Vega — the brightest corner of the Triangle.', hint:'Highest of the three, and the most piercingly white.', hideLabels:true }
  },
  {
    id:'l12', title:'The Scorpion and the galaxy', mins:3,
    goal:'Find the Milky Way\'s centre, and the sky\'s other red giant.',
    steps:[
      { say:'Low in the south on a summer evening: a bright red star with two fainter ones flanking it, and a long curve of stars trailing below into a hook. That is <b>Scorpius</b> — one of the few constellations that actually looks like its name.',
        set:{ stage:{target:'sco-alp', also:['sgr-sig','sco-lam']}, figures:['sco'], layers:{figures:true,labels:'named'} } },
      { say:'The red heart is <b>Antares</b>. The name means "rival of Mars" — when Mars passes nearby, they are genuinely hard to tell apart.',
        set:{ figures:['sco'], mark:['sco-alp'] } },
      { say:'To the left of the scorpion sits a shape like a <b>teapot</b>, spout pointing back at it. That is the bright half of Sagittarius.',
        set:{ asterism:'teapot', layers:{labels:'named'} } },
      { say:'Steam rising from the teapot\'s spout is the <b>Milky Way</b> at its thickest — you are looking straight at the centre of our galaxy, 26,000 light years away. From a dark site this is the best patch of sky there is.',
        set:{ asterism:'teapot', layers:{milkyway:true,dso:true}, look:{fov:90} } }
    ],
    check:{ kind:'find', targets:['sco-alp'], ask:'Click Antares — the Scorpion\'s red heart.', hint:'The brightest star in the curve, and distinctly orange-red.', hideLabels:true }
  }]
},
{
  tier:'Tier 6', tierName:'Beyond the fixed stars',
  tierNote:'Things that move, things that are not stars, and the half of the sky you may never have seen.',
  lessons:[
  {
    id:'l13', title:'The wanderers', mins:3,
    goal:'Tell a planet from a star, tonight, with no equipment.',
    steps:[
      { say:'The stars keep the same patterns for your whole life. A handful of bright objects do not — they wander through the constellations. The Greek word for wanderer is <i>planetes</i>.',
        set:{ stage:{planets:true}, layers:{planets:true,ecliptic:true,labels:'named'} } },
      { say:'Two easy tells. First: <b>planets do not twinkle.</b> Stars are points and the air makes them flicker; planets are tiny discs and hold steady.',
        set:{ layers:{planets:true} } },
      { say:'Second: they all sit on one line across the sky, the <b>ecliptic</b> — shown here in gold. It is the plane of the solar system, seen edge-on from inside. The Sun and Moon travel it too.',
        set:{ layers:{ecliptic:true,planets:true}, look:{fov:120} } },
      { say:'Watch: here are several weeks of motion. The stars stay locked; the planets slide along. Jupiter and Saturn crawl. Venus and Mercury stay close to the Sun, so you only catch them near dawn or dusk.',
        set:{ layers:{planets:true,ecliptic:true}, speed:90000 } }
    ],
    check:{ kind:'planet', ask:'Click any planet currently above the horizon.', hint:'Steady, bright, sitting on the gold ecliptic line. Use the Tonight tab if you are stuck.' }
  },
  {
    id:'l14', title:'Things that are not stars', mins:3,
    goal:'Find the four deep-sky objects your naked eye can honestly see.',
    steps:[
      { say:'A few smudges in the sky are not stars. With no equipment at all, four are worth knowing.',
        set:{ stage:{target:'m45'}, layers:{dso:true,labels:'named'} } },
      { say:'The <b>Pleiades</b>: a real cluster of hot young stars, 444 light years away, born together about 100 million years ago. Look slightly to the side of it and more stars appear — that is averted vision, and it works on everything faint.',
        set:{ mark:['m45'], zoom:25 } },
      { say:'The <b>Orion Nebula</b>, in the sword: a stellar nursery 1,300 light years off. To the eye it is a fuzzy star; through any binoculars it turns into a glowing cloud.',
        set:{ stage:{target:'m42'}, mark:['m42'], zoom:20 } },
      { say:'The <b>Andromeda Galaxy</b>: a faint oval, and the most distant object a human eye can see unaided — 2.5 million light years. Hop from Mirach in Andromeda, two faint stars north. You are looking at a trillion suns.',
        set:{ stage:{target:'m31', also:['and-bet']}, hop:{chain:['and-bet','and-mu','and-nu','m31'], label:'Mirach → two hops north'}, mark:['m31'], zoom:30 } }
    ],
    check:{ kind:'find', targets:['m31'], ask:'Click the Andromeda Galaxy.', hint:'Off the end of the Mirach hop, above the Andromeda chain.', hideLabels:true }
  },
  {
    id:'l15', title:'The southern sky', mins:3,
    goal:'The patterns you only get below the equator.',
    steps:[
      { say:'Half the sky never rises from Europe, most of Asia or North America. If you live up north, the app now takes you somewhere far enough south to see it.',
        set:{ stage:{target:'cru-alp', also:['cen-alp','cen-bet']}, figures:['cru','cen'], layers:{figures:true,labels:'named'} } },
      { say:'The <b>Southern Cross</b> is small — much smaller than people expect — and has a red star, <b>Gacrux</b>, at the top. There is a bigger, fainter "False Cross" nearby with no red star. That is the giveaway.',
        set:{ asterism:'southerncross', mark:['cru-gam'], zoom:35 } },
      { say:'Beside it sit two bright stars in a line, the <b>Pointers</b>: Hadar, and <b>Alpha Centauri</b> — the nearest star system to the Sun, just 4.4 light years away.',
        set:{ asterism:'pointers', mark:['cen-alp','cen-bet'], zoom:60 } },
      { say:'There is no south pole star. To find south: run a line down the long axis of the Cross about four and a half times, and drop straight down to the horizon from there.',
        set:{ hop:{chain:['cru-gam','cru-alp'], label:'×4.5 the long axis → due south'}, asterism:'southerncross', look:{fov:100} } },
      { say:'Two more southern-only sights: the <b>Magellanic Clouds</b>, a pair of small galaxies orbiting ours. They look exactly like torn-off pieces of the Milky Way.',
        set:{ layers:{dso:true,milkyway:true}, mark:['lmc','smc'], look:{az:180,alt:45,fov:120} } }
    ],
    check:{ kind:'find', targets:['cru-alp','cru-bet','cru-gam','cru-del'], ask:'Click any star of the Southern Cross.', hint:'The small one, with the red star at the top. Not the bigger False Cross.', hideLabels:true }
  }]
}
];

/* Random drills for Test mode, drawn from what the course has covered. */
const DRILL_POOL = [
  { id:'cma-alp', name:'Sirius' }, { id:'ori-alp', name:'Betelgeuse' }, { id:'ori-bet', name:'Rigel' },
  { id:'boo-alp', name:'Arcturus' }, { id:'lyr-alp', name:'Vega' }, { id:'aur-alp', name:'Capella' },
  { id:'cmi-alp', name:'Procyon' }, { id:'tau-alp', name:'Aldebaran' }, { id:'vir-alp', name:'Spica' },
  { id:'sco-alp', name:'Antares' }, { id:'psa-alp', name:'Fomalhaut' }, { id:'gem-bet', name:'Pollux' },
  { id:'gem-alp', name:'Castor' }, { id:'cyg-alp', name:'Deneb' }, { id:'aql-alp', name:'Altair' },
  { id:'leo-alp', name:'Regulus' }, { id:'umi-alp', name:'Polaris' }, { id:'uma-alp', name:'Dubhe' },
  { id:'uma-eta', name:'Alkaid' }, { id:'cas-alp', name:'Schedar' }, { id:'ori-eps', name:'Alnilam' },
  { id:'and-alp', name:'Alpheratz' }, { id:'peg-bet', name:'Scheat' }, { id:'crb-alp', name:'Alphecca' },
  { id:'cen-alp', name:'Alpha Centauri' }, { id:'cru-gam', name:'Gacrux' }, { id:'car-alp', name:'Canopus' },
  { id:'eri-alp', name:'Achernar' }, { id:'gru-alp', name:'Alnair' }, { id:'hya-alp', name:'Alphard' },
  { id:'m45', name:'the Pleiades' }, { id:'m42', name:'the Orion Nebula' }, { id:'m31', name:'the Andromeda Galaxy' }
];

/* ===========================================================================
   For people who know nothing yet: a first lesson that starts from zero, a practical night-out
   lesson, checkpoints that mix what came before, and — for every lesson — a recap, something to
   try under the real sky, the objects it teaches, pictures, and more than one question.
   =========================================================================== */
const NEW_LESSONS = {
  l0: {
    id:'l0', title:'What’s up there?', mins:3,
    goal:'Learn the five words that everything else in this course is built on.',
    steps:[
      { say:'Look up on a clear night and everything you see is one of a few kinds of thing. Learn five words and the rest of this course will make sense.',
        set:{ stage:{target:'ori-eps', also:['cma-alp']}, look:{fov:115}, layers:{figures:false,labels:'none',planets:true,dso:false,milkyway:true} } },
      { say:'Almost every point of light is a <b>star</b>: a sun, like ours, so far away it shrinks to a dot. The brightest one here is Sirius. Its light has been travelling for 8½ years to reach you — it is 8½ <b>light years</b> away. A light year is a distance, not a time.',
        set:{ mark:['cma-alp'], layers:{labels:'bright'} } },
      { say:'A <b>constellation</b> is a picture people drew between stars — a dot-to-dot, like this hunter, Orion. The stars in it are usually nowhere near each other. They only line up from where we stand.',
        fig:'what', set:{ figures:['ori'], layers:{figures:true,labels:'named'} } },
      { say:'A few bright "stars" are really <b>planets</b> — worlds of our own solar system, much closer, that slowly wander between the constellations. And on a dark night, the faint glowing band across the sky is the <b>Milky Way</b>: the rest of our own galaxy, seen from inside.',
        set:{ layers:{planets:true,milkyway:true,labels:'named'} } },
      { say:'The good news: you need no telescope. Everything in this course can be seen with your eyes alone — much of it even from a city.',
        set:{ layers:{labels:'named'} } }
    ],
    checks:[
      { kind:'choice', ask:'What is a star?', options:[{text:'A sun, very far away',ok:true},{text:'A planet that glows'},{text:'A small light quite close to Earth'}], hint:'Our Sun is one of them — just much nearer.' },
      { kind:'choice', ask:'The stars in a constellation are…', options:[{text:'Usually at very different distances — they only look close together',ok:true},{text:'Tied together by gravity'},{text:'All exactly the same distance away'}], hint:'Remember the side view in the picture.' }
    ],
    recap:['Stars are faraway suns. A light year is a distance: how far light travels in a year.','Constellations are pictures we draw; their stars are usually far apart in space.','Planets wander among the stars. The Milky Way is our galaxy, seen from inside.'],
    tonight:'Go outside after dark for two minutes. Hold out your fist and count the stars inside it. Remember the number — you will beat it later.',
    teaches:['cma-alp','con:ori']
  },
  l18: {
    id:'l18', title:'Your first night out', mins:3,
    goal:'Everything you need to make a real first night under the sky work.',
    steps:[
      { say:'You can now find north, the Big Dipper, the W and Arcturus. That is plenty for a first night outside. Here is how to make it go well.',
        set:{ stage:{az:0,alt:35,fov:110,north:true}, layers:{figures:true,labels:'named'} } },
      { say:'<b>Give your eyes 20 minutes.</b> In the dark they slowly become far more sensitive — but one glance at a white screen undoes it. Outside, use this app in <b>Red mode</b> (top of the screen).',
        fig:'darkeyes', set:{} },
      { say:'<b>Pick your night.</b> Clear, and ideally with no bright Moon up — it washes out faint stars. The Tonight tab shows the Moon and when it gets fully dark. Cloudy? Use the Sky window or a headset: the stars are still there.',
        set:{} },
      { say:'<b>Pick your spot.</b> Get out of direct light — a dark corner of a garden beats a lit street, and a park beats both. Dress warmer than you think: you will be standing still.',
        set:{} },
      { say:'<b>Start with what you know.</b> Face north. Find the Dipper or the W, hop to Polaris, then arc to Arcturus if it is up. After that, just look around and let the patterns come to you.',
        set:{ asterism:'dipper' } }
    ],
    checks:[
      { kind:'choice', ask:'Halfway through, you check your phone with its screen on bright white. What happens?', options:[{text:'Your night vision resets — the 20 minutes start again',ok:true},{text:'Nothing at all'},{text:'Your eyes get better at seeing faint stars'}], hint:'Look at the picture: what does white light do to the curve?' },
      { kind:'choice', ask:'Which is the best night for seeing faint stars?', options:[{text:'A clear night with no bright Moon, away from streetlights',ok:true},{text:'A full-Moon night — the sky is brighter'},{text:'Any night, standing under a streetlight'}], hint:'Light from anywhere — Moon or lamps — hides faint stars.' }
    ],
    recap:['Twenty minutes of darkness makes your eyes far more sensitive; white light undoes it.','Choose a clear night with no bright Moon, away from lights.','Start from a pattern you know, then hop outward.'],
    tonight:'If tonight is clear: turn on Red mode, go outside, wait 20 minutes without looking at a bright screen, then find Polaris.',
    teaches:[]
  },
  cp2: {
    id:'cp2', title:'Checkpoint: the northern sky', mins:3, checkpoint:true,
    goal:'Find the Big Dipper, Polaris and the W with the labels off.',
    steps:[
      { say:'Time to see what stuck. The labels are off. Find each one the way you learned it — and use a hint if you need one; that is what they are for.',
        set:{ stage:{target:'uma-alp', also:['umi-alp','cas-alp']}, look:{fov:120}, layers:{figures:false,labels:'named'} } }
    ],
    checks:[
      { kind:'find', targets:['uma-alp','uma-bet','uma-gam','uma-del','uma-eps','uma-zet','uma-eta'], ask:'Click any star of the Big Dipper.', hint:'Seven stars in a saucepan shape.', hideLabels:true, credit:'ast:dipper', pattern:{asterism:'dipper'} },
      { kind:'find', targets:['umi-alp'], ask:'Now Polaris, the star that never moves.', hint:'Merak, then Dubhe, then about five times that gap.', hideLabels:true, pattern:{asterism:'dipper', hop:{chain:['uma-bet','uma-alp','umi-alp'], label:'×5 the gap'}} },
      { kind:'find', targets:['cas-alp','cas-bet','cas-gam','cas-del','cas-eps'], ask:'And any star of the W, Cassiopeia.', hint:'Across Polaris from the Dipper.', hideLabels:true, credit:'ast:w', pattern:{asterism:'w'} }
    ],
    recap:['You can find the Big Dipper, Polaris and Cassiopeia with no help.'],
    tonight:'Try the same three outside: Dipper, Polaris, W. Time yourself.',
    teaches:[]
  },
  cp4: {
    id:'cp4', title:'Checkpoint: winter stars', mins:3, checkpoint:true,
    goal:'Find Orion and the bright stars around it, labels off.',
    steps:[
      { say:'Winter’s showpiece, labels off. Start from the Belt every time — it is the key to all of them.',
        set:{ stage:{target:'ori-eps', also:['cma-alp','tau-alp','aur-alp']}, look:{fov:125}, layers:{figures:false,labels:'named'} } }
    ],
    checks:[
      { kind:'find', targets:['ori-alp'], ask:'Click Betelgeuse, Orion’s red shoulder.', hint:'Above the Belt, on the left, and orange.', hideLabels:true, credit:'ast:belt', pattern:{figures:['ori']} },
      { kind:'find', targets:['cma-alp'], ask:'Now Sirius.', hint:'Follow the Belt down and to the left.', hideLabels:true, pattern:{hop:{chain:['ori-del','ori-zet','cma-alp'], label:'down-left'}} },
      { kind:'find', targets:['tau-alp'], ask:'Now Aldebaran, the eye of the Bull.', hint:'Follow the Belt the other way: up and to the right.', hideLabels:true, pattern:{hop:{chain:['ori-zet','ori-del','tau-alp'], label:'up-right'}} },
      { kind:'find', targets:['aur-alp'], ask:'Last one: Capella.', hint:'The highest corner of the Winter Hexagon — very bright and yellowish.', hideLabels:true, pattern:{asterism:'hexagon'} }
    ],
    recap:['From the Belt you can reach Sirius, Aldebaran and the whole Winter Hexagon.'],
    tonight:'On a winter evening, do all four from the Belt in under a minute.',
    teaches:[]
  },
  cp5: {
    id:'cp5', title:'Checkpoint: summer stars', mins:2, checkpoint:true,
    goal:'Find the three corners of the Summer Triangle, labels off.',
    steps:[
      { say:'The summer sky, labels off. Find the big triangle first, then name its corners.',
        set:{ stage:{target:'lyr-alp', also:['aql-alp','cyg-alp']}, look:{fov:125}, layers:{figures:false,labels:'named'} } }
    ],
    checks:[
      { kind:'find', targets:['lyr-alp'], ask:'Click Vega.', hint:'The brightest and highest corner.', hideLabels:true, credit:'ast:summer', pattern:{asterism:'summer'} },
      { kind:'find', targets:['aql-alp'], ask:'Now Altair.', hint:'The lowest corner, with a fainter star on each side.', hideLabels:true, pattern:{asterism:'summer'} },
      { kind:'find', targets:['cyg-alp'], ask:'And Deneb.', hint:'The faintest corner — the tail of the Swan, in the Milky Way.', hideLabels:true, pattern:{asterism:'cross'} }
    ],
    recap:['You can find the Summer Triangle and name all three corners.'],
    tonight:'On a summer evening, find the Triangle, then trace the Northern Cross down the Milky Way from Deneb.',
    teaches:[]
  }
};
/* Where the new lessons go: [tier, lesson id, place it after this id (null = first)] */
const NEW_PLACES = [['Tier 1','l0',null], ['Tier 2','cp2','l7'], ['Tier 2','l18','cp2'], ['Tier 4','cp4','l10'], ['Tier 5','cp5','l12']];

const LESSON_EXTRA = {
  l1: { figs:{2:'dome'},
    checks:[
      { kind:'look', ask:'Show me "south, about 4 fists up": turn the view to face south and look about 40° up.', az:180, alt:40, tolAz:20, tolAlt:12,
        hint:'Drag the sky sideways until the S on the horizon is in the middle, then drag upward. The bar at the bottom shows which way you face and how high you look.',
        hintVR:'Turn your body until the strip at the top shows S, then tilt up about four fists.' },
      { kind:'choice', ask:'A star is at altitude 90°. Where do you look?', options:[{text:'Straight up, over your head',ok:true},{text:'On the northern horizon'},{text:'Halfway up in the east'}], hint:'90° is as high as it gets.' }
    ],
    recap:['Any spot in the sky is two numbers: a compass direction and a height.','Height — altitude — runs from 0° at the horizon to 90° at the zenith, straight overhead.'],
    tonight:'Outside, point to the zenith, then to the horizon in each of the four directions. Ten seconds, and the idea is yours for good.' },
  l2: { figs:{2:'axis'},
    checks:[
      { kind:'choice', ask:'Through the night, the stars…', options:[{text:'Rise in the east and set in the west',ok:true},{text:'Rise in the west and set in the east'},{text:'Stay exactly where they are'}], hint:'Just like the Sun.' },
      { kind:'find', targets:['umi-alp'], ask:'Click the star that stays still.', hint:'It is the centre of all those circles, due north.', credit:'umi-alp' }
    ],
    recap:['The sky seems to turn because Earth spins.','Everything circles the celestial pole. Polaris sits almost exactly on it, so it stays put.','Stars rise in the east and set in the west.'],
    tonight:'Note where a bright star is, then look again an hour later. It will have moved about 15° west — a fist and a half.',
    teaches:['umi-alp'] },
  l16: { figs:{1:'hand'},
    recap:['At arm’s length: little finger 1°, thumb 2°, three fingers 5°, fist 10°, spread hand 20°.','Polaris always sits as high as your latitude.'],
    tonight:'Next time you see the Moon, hold out your little finger: it covers the whole Moon. The Moon is only half a degree wide.' },
  l4: { recap:['Seven stars: a bowl of four and a handle of three.','From mid-northern places it never sets — it just swings round the pole through the night and the year.'],
    tonight:'After dark, face north and find the saucepan. In autumn evenings it sits low; in spring it is high overhead.',
    teaches:['ast:dipper','uma-alp','uma-bet','uma-zet','uma-eta'] },
  l5: { recap:['Merak, then Dubhe, then about five times that gap: Polaris.','Using stars you know to find new ones is called star hopping.'],
    tonight:'Do the hop for real: Merak, Dubhe, five gaps on. Check the distance with your fists — about three.',
    teaches:['ast:littledipper','umi-alp'] },
  l6: { recap:['Cassiopeia is a W (or an M) of five stars.','It sits opposite the Big Dipper, across Polaris — one of the two is always up.'],
    tonight:'If the Dipper is low, turn the other way past Polaris and look for the W.',
    teaches:['ast:w','cas-alp'] },
  l7: { recap:['Follow the curve of the Dipper’s handle: arc to Arcturus, then spike on to Spica.','Colour tells temperature: orange Arcturus is cooler, blue-white Spica is hotter.'],
    tonight:'On spring and early-summer evenings, arc to Arcturus — the brightest star in that part of the sky.',
    teaches:['boo-alp','vir-alp','con:boo'] },
  l3: { figs:{1:'mags'},
    checks:[
      { kind:'choice', ask:'Which star is brighter: magnitude 1 or magnitude 4?', options:[{text:'Magnitude 1',ok:true},{text:'Magnitude 4'},{text:'They are the same'}], hint:'Smaller number, brighter star.' },
      { kind:'choice', ask:'What single thing changes most how many stars you can see?', options:[{text:'How dark the sky is where you stand',ok:true},{text:'How good your eyesight is'},{text:'The time of year'}], hint:'Think city versus countryside.' }
    ],
    recap:['Magnitude: smaller number means brighter.','A city sky shows stars to about magnitude 3; dark countryside past 6 — about ten times as many.'],
    tonight:'Count the stars in your fist-sized patch from Lesson 1 again, this time somewhere darker. Compare.',
    teaches:['cma-alp'] },
  l17: { figs:{1:'orbit'},
    recap:['Each night every star rises about 4 minutes earlier — 2 hours earlier each month.','"Winter stars" are simply the ones high in the evening in winter.'],
    tonight:'Note what is due south at 9 pm tonight. In a month, the same star will be there at about 7 pm.' },
  l8: { recap:['Three stars in a short straight row: Orion’s Belt.','Betelgeuse (orange-red) and Rigel (blue-white) sit at opposite corners.','The fuzzy middle of the sword is the Orion Nebula.'],
    tonight:'On a winter evening find the Belt first — nothing else in the sky looks like it.',
    teaches:['ast:belt','ori-alp','ori-bet','m42','con:ori'] },
  l9: { checks:[
      { kind:'find', targets:['cma-alp'], ask:'Follow the Belt down-left. Click Sirius.', hint:'The brightest star in the sky — you cannot pick the wrong one.', hideLabels:true },
      { kind:'find', targets:['tau-alp'], ask:'Now follow it the other way. Click Aldebaran.', hint:'Up and to the right from the Belt; orange, at the point of a V of stars.', hideLabels:true, pattern:{hop:{chain:['ori-zet','ori-del','tau-alp'], label:'up-right'}} }
    ],
    recap:['Belt down-left: Sirius, the brightest star of the night.','Belt up-right: Aldebaran, then on to the Pleiades.'],
    tonight:'Find the Belt, then do both hops.',
    teaches:['cma-alp','tau-alp','m45'] },
  l10: { recap:['Six bright stars ring Orion: Rigel, Sirius, Procyon, Pollux, Capella, Aldebaran.','Betelgeuse, Sirius and Procyon make the Winter Triangle.'],
    tonight:'Trace the Hexagon with your finger, starting and ending at Rigel.',
    teaches:['ast:hexagon','ast:wintertri','cmi-alp','gem-bet','gem-alp','aur-alp'] },
  l11: { checks:[
      { kind:'find', targets:['lyr-alp'], ask:'Click Vega — the brightest corner of the Triangle.', hint:'Highest of the three, and the most piercingly white.', hideLabels:true, credit:'ast:summer' },
      { kind:'choice', ask:'Deneb looks fainter than Vega. Why?', options:[{text:'It is far more distant — about 100 times farther',ok:true},{text:'It is a smaller, dimmer star'},{text:'Clouds in space are in the way'}], hint:'Deneb is really one of the most luminous stars you can see.' }
    ],
    recap:['Vega, Deneb and Altair form the Summer Triangle.','Deneb tops the Northern Cross, lying along the Milky Way.'],
    tonight:'On a summer evening, look nearly overhead for the Triangle.',
    teaches:['ast:summer','ast:cross','lyr-alp','cyg-alp','aql-alp'] },
  l12: { recap:['Antares is the Scorpion’s red heart.','The Teapot in Sagittarius points to the centre of our galaxy.'],
    tonight:'On a summer evening, look low in the south for the red star with a hook of stars beneath it.',
    teaches:['sco-alp','ast:teapot','con:sco'] },
  l13: { figs:{2:'ecliptic'},
    checks:[
      { kind:'choice', ask:'Which of these is the best clue that a bright "star" is really a planet?', options:[{text:'It shines steadily and sits near the ecliptic',ok:true},{text:'It twinkles a lot'},{text:'It is very faint'}], hint:'Planets are tiny discs, so they twinkle less — and they keep to one line.' },
      { kind:'planet', ask:'Click any planet currently above the horizon.', hint:'Steady, bright, sitting on the gold ecliptic line. Use the Tonight tab if you are stuck.' }
    ],
    recap:['Planets shine steadily and slowly move against the stars.','The Sun, Moon and planets all keep to one line: the ecliptic.'],
    tonight:'Open the Tonight tab: it lists every planet up right now, and which way to face.' },
  l14: { recap:['The Pleiades: a young star cluster.','The Orion Nebula: a nursery where stars are being born.','The Andromeda Galaxy: 2.5 million light years — the farthest thing your eyes can see.'],
    tonight:'From a dark site, find the Andromeda Galaxy — then look slightly to one side of it and watch it grow.',
    teaches:['m45','m42','m31'] },
  l15: { recap:['The Southern Cross is small, with red Gacrux at the top.','The Pointers, Alpha and Beta Centauri, lead to it. There is no south pole star.'],
    tonight:'If you are ever south of the equator, find the Cross and the Pointers on your first clear night.',
    teaches:['ast:southerncross','cru-alp','cru-gam','cen-alp','cen-bet'] }
};

/* Plain-language meanings. Words with auto:false are listed but not underlined in lessons. */
const GLOSSARY = [
  { term:'star', auto:false, def:'A sun like ours, so far away it looks like a point of light.' },
  { term:'light year', def:'A distance, not a time: how far light travels in one year — about 9.5 trillion kilometres.' },
  { term:'constellation', def:'A pattern of stars that people have named — a dot-to-dot picture. There are 88 official ones, covering the whole sky.' },
  { term:'asterism', def:'A well-known star pattern that is not one of the 88 official constellations — the Big Dipper is part of the Great Bear.' },
  { term:'planet', auto:false, def:'A world that orbits the Sun, as Earth does. Planets look like bright stars but slowly wander among the constellations.' },
  { term:'Milky Way', def:'Our galaxy. From a dark site it shows as a faint glowing band across the sky — billions of stars too far away to see one by one.' },
  { term:'galaxy', def:'A vast family of hundreds of billions of stars. We live in one: the Milky Way.' },
  { term:'horizon', def:'The line all around you where the sky meets the ground.' },
  { term:'zenith', def:'The point in the sky directly over your head.' },
  { term:'altitude', def:'How high something is above the horizon, in degrees: 0° on the horizon, 90° straight overhead.' },
  { term:'compass direction', def:'Which way along the horizon you are facing: north, east, south or west.' },
  { term:'Pole Star', def:'Polaris: the star almost exactly above Earth’s North Pole, so it barely moves all night.' },
  { term:'celestial pole', def:'The point in the sky that Earth’s axis points at. The whole sky seems to turn around it.' },
  { term:'magnitude', def:'A star’s brightness number. Smaller means brighter: 1 is very bright, 6 is the faintest you can see from a dark site.' },
  { term:'light pollution', def:'Glow from streetlights and buildings that brightens the sky and hides faint stars.' },
  { term:'ecliptic', def:'The path across the sky that the Sun, Moon and planets all follow, because the solar system is flat.' },
  { term:'star hop', def:'Finding a star you don’t know by stepping to it from stars you do know.' },
  { term:'nebula', def:'A cloud of gas and dust in space — sometimes a place where new stars are being born.' },
  { term:'cluster', def:'A group of stars that were born together and still travel together.' },
  { term:'averted vision', def:'Looking slightly to one side of something faint: the edge of your eye sees better in the dark than the centre.' },
  { term:'dark adaptation', def:'Your eyes slowly becoming more sensitive in the dark — about 20 minutes to get most of the way.' },
  { term:'degree', def:'The unit for measuring angles in the sky. A fist at arm’s length covers about 10°; the whole sky from horizon to zenith is 90°.' },
  { term:'latitude', def:'How far north or south of the equator you are, in degrees. It sets which stars you can see.' },
  { term:'supergiant', def:'An enormous, very bright star near the end of its life. Betelgeuse and Rigel are two.' },
  { term:'twinkle', def:'The flicker of starlight caused by moving air above you. Planets twinkle much less than stars.' },
  { term:'Moon phase', def:'How much of the Moon’s sunlit half faces us — new, crescent, quarter, gibbous, full and back, every 29½ days.' },
  { term:'circumpolar', def:'Close enough to the pole that it never sets — it just circles round all night.' }
];

(function enrichCourse() {
  for (const tier of COURSE) for (const L of tier.lessons) {
    const x = LESSON_EXTRA[L.id];
    if (x) {
      if (x.figs) for (const [i, f] of Object.entries(x.figs)) if (L.steps[+i]) L.steps[+i].fig = f;
      if (x.checks) L.checks = x.checks;
      if (x.recap) L.recap = x.recap;
      if (x.tonight) L.tonight = x.tonight;
      if (x.teaches) L.teaches = x.teaches;
    }
  }
  for (const [tierName, id, after] of NEW_PLACES) {
    const tier = COURSE.find(t => t.tier === tierName), L = NEW_LESSONS[id];
    if (!tier || !L) continue;
    const i = after ? tier.lessons.findIndex(l => l.id === after) + 1 : 0;
    tier.lessons.splice(i, 0, L);
  }
  for (const tier of COURSE) for (const L of tier.lessons) {
    if (!L.checks) L.checks = L.check ? [L.check] : [];
    L.check = L.checks[0];                                   // older code paths still read .check
  }
  COURSE[0].tierNote = 'Start here if you know nothing at all: what is up there, how the sky is laid out, and how it moves.';
  COURSE[1].tierNote = 'Four patterns that find almost everything else — then a checkpoint, and your first real night outside.';
})();
