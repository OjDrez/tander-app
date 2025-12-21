// Form dropdown options for registration
// NOTE: This app is PHILIPPINES-ONLY

// Civil status options appropriate for seniors 60+
export const CIVIL_STATUS_OPTIONS = [
  "Single",
  "Married",
  "Widowed",
  "Separated",
  "Annulled",
];

// Philippine cities and provinces - comprehensive list
export const PHILIPPINES_CITIES = [
  // ===== METRO MANILA (NCR) =====
  "Manila",
  "Quezon City",
  "Makati",
  "Pasig",
  "Taguig",
  "Mandaluyong",
  "Pasay",
  "Parañaque",
  "Las Piñas",
  "Muntinlupa",
  "Caloocan",
  "Malabon",
  "Navotas",
  "Valenzuela",
  "Marikina",
  "San Juan",
  "Pateros",

  // ===== LUZON PROVINCES =====
  // Ilocos Region
  "Ilocos Norte",
  "Ilocos Sur",
  "La Union",
  "Pangasinan",
  "Laoag",
  "Vigan",
  "San Fernando, La Union",
  "Dagupan",
  "Urdaneta",
  "Alaminos",

  // CAR (Cordillera)
  "Abra",
  "Apayao",
  "Benguet",
  "Ifugao",
  "Kalinga",
  "Mountain Province",
  "Baguio",
  "Tabuk",

  // Cagayan Valley
  "Batanes",
  "Cagayan",
  "Isabela",
  "Nueva Vizcaya",
  "Quirino",
  "Tuguegarao",
  "Ilagan",
  "Santiago",
  "Cauayan",

  // Central Luzon
  "Aurora",
  "Bataan",
  "Bulacan",
  "Nueva Ecija",
  "Pampanga",
  "Tarlac",
  "Zambales",
  "Angeles",
  "Olongapo",
  "San Fernando, Pampanga",
  "Malolos",
  "Meycauayan",
  "San Jose del Monte",
  "Cabanatuan",
  "Gapan",
  "Palayan",
  "Tarlac City",
  "Balanga",

  // CALABARZON
  "Batangas",
  "Cavite",
  "Laguna",
  "Quezon",
  "Rizal",
  "Antipolo",
  "Batangas City",
  "Lipa",
  "Tanauan",
  "Tagaytay",
  "Bacoor",
  "Dasmariñas",
  "Imus",
  "General Trias",
  "Cavite City",
  "Biñan",
  "Cabuyao",
  "Calamba",
  "San Pablo",
  "Santa Rosa",
  "San Pedro",
  "Lucena",
  "Tayabas",

  // MIMAROPA
  "Marinduque",
  "Occidental Mindoro",
  "Oriental Mindoro",
  "Palawan",
  "Romblon",
  "Calapan",
  "Puerto Princesa",

  // Bicol Region
  "Albay",
  "Camarines Norte",
  "Camarines Sur",
  "Catanduanes",
  "Masbate",
  "Sorsogon",
  "Legazpi",
  "Naga",
  "Iriga",
  "Sorsogon City",
  "Masbate City",

  // ===== VISAYAS PROVINCES =====
  // Western Visayas
  "Aklan",
  "Antique",
  "Capiz",
  "Guimaras",
  "Iloilo",
  "Negros Occidental",
  "Iloilo City",
  "Bacolod",
  "Roxas City",
  "Kalibo",
  "San Jose de Buenavista",
  "Sagay",
  "Silay",
  "Talisay, Negros Occidental",
  "Victorias",
  "Kabankalan",
  "La Carlota",
  "Bago",
  "Cadiz",
  "San Carlos, Negros Occidental",

  // Central Visayas
  "Bohol",
  "Cebu",
  "Negros Oriental",
  "Siquijor",
  "Cebu City",
  "Mandaue",
  "Lapu-Lapu",
  "Talisay, Cebu",
  "Toledo",
  "Danao",
  "Carcar",
  "Naga, Cebu",
  "Tagbilaran",
  "Dumaguete",
  "Bais",
  "Bayawan",
  "Canlaon",
  "Guihulngan",
  "Tanjay",

  // Eastern Visayas
  "Biliran",
  "Eastern Samar",
  "Leyte",
  "Northern Samar",
  "Samar",
  "Southern Leyte",
  "Tacloban",
  "Ormoc",
  "Calbayog",
  "Catbalogan",
  "Maasin",
  "Borongan",

  // ===== MINDANAO PROVINCES =====
  // Zamboanga Peninsula
  "Zamboanga del Norte",
  "Zamboanga del Sur",
  "Zamboanga Sibugay",
  "Zamboanga City",
  "Dipolog",
  "Dapitan",
  "Pagadian",
  "Isabela City",

  // Northern Mindanao
  "Bukidnon",
  "Camiguin",
  "Lanao del Norte",
  "Misamis Occidental",
  "Misamis Oriental",
  "Cagayan de Oro",
  "Iligan",
  "Malaybalay",
  "Valencia",
  "Ozamiz",
  "Oroquieta",
  "Tangub",
  "Gingoog",
  "El Salvador",

  // Davao Region
  "Davao de Oro",
  "Davao del Norte",
  "Davao del Sur",
  "Davao Occidental",
  "Davao Oriental",
  "Davao City",
  "Tagum",
  "Panabo",
  "Digos",
  "Mati",
  "Samal",

  // SOCCSKSARGEN
  "Cotabato",
  "Sarangani",
  "South Cotabato",
  "Sultan Kudarat",
  "General Santos",
  "Koronadal",
  "Kidapawan",
  "Tacurong",

  // Caraga Region
  "Agusan del Norte",
  "Agusan del Sur",
  "Dinagat Islands",
  "Surigao del Norte",
  "Surigao del Sur",
  "Butuan",
  "Surigao City",
  "Cabadbaran",
  "Bayugan",
  "Bislig",
  "Tandag",

  // BARMM (Bangsamoro)
  "Basilan",
  "Lanao del Sur",
  "Maguindanao del Norte",
  "Maguindanao del Sur",
  "Sulu",
  "Tawi-Tawi",
  "Cotabato City",
  "Marawi",
  "Lamitan",
].sort();

// Curated hobby options for senior users (60+)
// Organized by popularity and relevance to elderly demographic
export const HOBBY_OPTIONS = [
  // Social & Community (most relevant for seniors seeking connection)
  "Socializing",
  "Volunteering",
  "Church Activities",
  "Community Events",

  // Relaxing Activities
  "Reading",
  "Watching Movies/TV",
  "Listening to Music",
  "Gardening",
  "Walking",
  "Meditation",

  // Creative & Arts
  "Painting/Drawing",
  "Photography",
  "Writing",
  "Crafts/DIY",
  "Knitting/Crocheting",
  "Playing Music",
  "Singing",
  "Dancing",

  // Food & Culinary
  "Cooking",
  "Baking",
  "Trying New Restaurants",

  // Games & Mental Activities
  "Card Games",
  "Board Games",
  "Chess/Checkers",
  "Puzzles",
  "Crosswords",

  // Physical Activities (senior-friendly)
  "Swimming",
  "Yoga/Stretching",
  "Tai Chi",
  "Golf",
  "Bowling",
  "Light Exercise",
  "Cycling",
  "Fishing",

  // Travel & Outdoors
  "Traveling",
  "Day Trips",
  "Bird Watching",
  "Nature Walks",

  // Learning
  "Learning Languages",
  "Taking Classes",
  "History",

  // Other
  "Pet Care",
  "Collecting",
  "Karaoke",
];
