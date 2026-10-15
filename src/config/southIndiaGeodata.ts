export interface SouthIndiaRegionGeo {
  name: string;
  nameTamil?: string;
  nameTelugu?: string;
  nameKannada?: string;
  nameMalayalam?: string;
  state: 'Tamil Nadu' | 'Andhra Pradesh' | 'Telangana' | 'Karnataka' | 'Kerala' | 'Puducherry';
  latitude: number;
  longitude: number;
  zoomLevel: number;
  zone?: string;
  taluks?: Record<string, { villages: string[]; latitude?: number; longitude?: number }>;
}

/**
 * Verified Geographic Coordinates for South Indian States
 */
export const SOUTH_INDIA_STATES: Record<
  string,
  { name: string; latitude: number; longitude: number; zoom: number; districts: string[] }
> = {
  'Tamil Nadu': {
    name: 'Tamil Nadu',
    latitude: 11.1271,
    longitude: 78.6569,
    zoom: 7,
    districts: [
      'Karur',
      'Thanjavur',
      'Tiruvarur',
      'Mayiladuthurai',
      'Nagapattinam',
      'Cuddalore',
      'Madurai',
      'Tiruchirappalli',
      'Pudukkottai',
      'Tiruvannamalai',
      'Villupuram',
      'Salem',
      'Coimbatore',
      'Erode',
      'Tirunelveli',
      'Dindigul',
      'Vellore',
      'Theni',
      'Dharmapuri',
      'Ariyalur',
      'Perambalur',
      'Ramanathapuram',
      'Virudhunagar',
      'Sivaganga',
      'Thoothukudi',
      'Kanyakumari',
      'Krishnagiri',
      'Namakkal',
      'Nilgiris',
      'Tirupathur',
      'Ranipet',
      'Chengalpattu',
      'Kanchipuram',
      'Tiruvallur',
      'Tenkasi',
      'Kallakurichi',
    ],
  },
  'Andhra Pradesh': {
    name: 'Andhra Pradesh',
    latitude: 15.9129,
    longitude: 79.74,
    zoom: 7,
    districts: [
      'Guntur',
      'Krishna',
      'East Godavari',
      'West Godavari',
      'Kurnool',
      'Visakhapatnam',
      'Chittoor',
      'Nellore',
      'Anantapur',
      'YSR Kadapa',
      'Prakasam',
      'Srikakulam',
      'Vizianagaram',
    ],
  },
  Telangana: {
    name: 'Telangana',
    latitude: 18.1124,
    longitude: 79.0193,
    zoom: 7,
    districts: [
      'Warangal',
      'Nalgonda',
      'Khammam',
      'Karimnagar',
      'Nizamabad',
      'Rangareddy',
      'Medak',
      'Mahabubnagar',
      'Adilabad',
      'Siddipet',
    ],
  },
  Karnataka: {
    name: 'Karnataka',
    latitude: 15.3173,
    longitude: 75.7139,
    zoom: 7,
    districts: [
      'Mandya',
      'Mysuru',
      'Hassan',
      'Belagavi',
      'Shivamogga',
      'Ballari',
      'Tumakuru',
      'Raichur',
      'Dharwad',
      'Davanagere',
      'Kolar',
      'Chikkamagaluru',
    ],
  },
  Kerala: {
    name: 'Kerala',
    latitude: 10.8505,
    longitude: 76.2711,
    zoom: 7,
    districts: [
      'Palakkad',
      'Alappuzha',
      'Thrissur',
      'Wayanad',
      'Idukki',
      'Kottayam',
      'Malappuram',
      'Kozhikode',
      'Kannur',
      'Kollam',
      'Ernakulam',
      'Thiruvananthapuram',
    ],
  },
  Puducherry: {
    name: 'Puducherry',
    latitude: 11.9416,
    longitude: 79.8083,
    zoom: 10,
    districts: ['Puducherry', 'Karaikal', 'Yanam', 'Mahe'],
  },
};

/**
 * Verified Geographic Coordinates for Agricultural Districts across South India
 */
export const SOUTH_INDIA_DISTRICTS_GEODATA: Record<string, SouthIndiaRegionGeo> = {
  // --- Tamil Nadu Districts ---
  Karur: {
    name: 'Karur',
    nameTamil: 'கரூர்',
    state: 'Tamil Nadu',
    latitude: 10.9601,
    longitude: 78.0766,
    zoomLevel: 12,
    zone: 'Western Agro-Climatic Zone (Cauvery & Amaravathi Basin)',
    taluks: {
      Karur: {
        villages: ['Thanthoni', 'Inam Karur', 'Vennamalai', 'Manmangalam', 'Nerur', 'Vangal'],
        latitude: 10.9601,
        longitude: 78.0766,
      },
      Aravakurichi: {
        villages: ['Aravakurichi', 'Pallapatti', 'Esanatham', 'Modakkur', 'Senthamangalam'],
        latitude: 10.7712,
        longitude: 77.9152,
      },
      Kulithalai: {
        villages: ['Kulithalai', 'Marudur', 'Nangavaram', 'Inungur', 'Thogaimalai'],
        latitude: 10.8934,
        longitude: 78.4182,
      },
      Krishnarayapuram: {
        villages: ['Krishnarayapuram', 'Mayanur', 'Panjapatti', 'Sengal', 'Kallapalli'],
        latitude: 10.9167,
        longitude: 78.2833,
      },
    },
  },
  Thanjavur: {
    name: 'Thanjavur',
    nameTamil: 'தஞ்சாவூர்',
    state: 'Tamil Nadu',
    latitude: 10.787,
    longitude: 79.1378,
    zoomLevel: 12,
    zone: 'Cauvery Delta Zone',
    taluks: {
      Thanjavur: {
        villages: ['Pillaiyarpatti', 'Vallam', 'Kallaperambur', 'Ramanathapuram', 'Nanjikkottai'],
        latitude: 10.787,
        longitude: 79.1378,
      },
      Kumbakonam: {
        villages: ['Dharasuram', 'Ammachattiram', 'Asur', 'Pattiswaram', 'Sakkottai'],
        latitude: 10.9602,
        longitude: 79.3845,
      },
      Papanasam: {
        villages: ['Melattur', 'Rajagiri', 'Kabisthalam', 'Saram', 'Alavandipuram'],
        latitude: 10.9238,
        longitude: 79.2741,
      },
      Thiruvaiyaru: {
        villages: ['Thiruvaiyaru', 'Kandiyur', 'Thirupanthuruthi', 'Allur', 'Kalyanapuram'],
        latitude: 10.8845,
        longitude: 79.1034,
      },
      Pattukkottai: {
        villages: ['Alivalam', 'Kalluranikkadu', 'Nadiyam', 'Palaverikadu', 'Sembalur'],
        latitude: 10.4287,
        longitude: 79.3195,
      },
      Orathanadu: {
        villages: ['Orathanadu', 'Kakkaraikkottai', 'Thondarampattu', 'Vandayariruppu'],
        latitude: 10.6274,
        longitude: 79.2568,
      },
    },
  },
  Tiruvarur: {
    name: 'Tiruvarur',
    nameTamil: 'திருவாரூர்',
    state: 'Tamil Nadu',
    latitude: 10.7725,
    longitude: 79.6365,
    zoomLevel: 12,
    zone: 'Cauvery Delta Zone',
  },
  Mayiladuthurai: {
    name: 'Mayiladuthurai',
    nameTamil: 'மயிலாடுதுறை',
    state: 'Tamil Nadu',
    latitude: 11.1018,
    longitude: 79.6522,
    zoomLevel: 12,
    zone: 'Cauvery Delta Zone',
  },
  Nagapattinam: {
    name: 'Nagapattinam',
    nameTamil: 'நாகப்பட்டினம்',
    state: 'Tamil Nadu',
    latitude: 10.7656,
    longitude: 79.8428,
    zoomLevel: 12,
    zone: 'Cauvery Delta Zone',
  },
  Madurai: {
    name: 'Madurai',
    nameTamil: 'மதுரை',
    state: 'Tamil Nadu',
    latitude: 9.9252,
    longitude: 78.1198,
    zoomLevel: 12,
    zone: 'Southern Agro-Climatic Zone',
  },
  Salem: {
    name: 'Salem',
    nameTamil: 'சேலம்',
    state: 'Tamil Nadu',
    latitude: 11.6643,
    longitude: 78.146,
    zoomLevel: 12,
    zone: 'North Western Zone',
  },
  Coimbatore: {
    name: 'Coimbatore',
    nameTamil: 'கோயம்புத்தூர்',
    state: 'Tamil Nadu',
    latitude: 11.0168,
    longitude: 76.9558,
    zoomLevel: 12,
    zone: 'Western Agro-Climatic Zone',
  },
  Erode: {
    name: 'Erode',
    nameTamil: 'ஈரோடு',
    state: 'Tamil Nadu',
    latitude: 11.341,
    longitude: 77.7172,
    zoomLevel: 12,
    zone: 'Western Agro-Climatic Zone',
  },
  Tiruchirappalli: {
    name: 'Tiruchirappalli',
    nameTamil: 'திருச்சிராப்பள்ளி',
    state: 'Tamil Nadu',
    latitude: 10.7905,
    longitude: 78.7047,
    zoomLevel: 12,
    zone: 'Cauvery Delta Zone',
  },
  Dindigul: {
    name: 'Dindigul',
    nameTamil: 'திண்டுக்கல்',
    state: 'Tamil Nadu',
    latitude: 10.3673,
    longitude: 77.9803,
    zoomLevel: 12,
    zone: 'Southern Zone',
  },
  Theni: {
    name: 'Theni',
    nameTamil: 'தேனி',
    state: 'Tamil Nadu',
    latitude: 10.0104,
    longitude: 77.4768,
    zoomLevel: 12,
    zone: 'Southern Zone',
  },
  Tirunelveli: {
    name: 'Tirunelveli',
    nameTamil: 'திருநெல்வேலி',
    state: 'Tamil Nadu',
    latitude: 8.7139,
    longitude: 77.7567,
    zoomLevel: 12,
    zone: 'Southern Zone',
  },
  Cuddalore: {
    name: 'Cuddalore',
    nameTamil: 'கடலூர்',
    state: 'Tamil Nadu',
    latitude: 11.748,
    longitude: 79.7714,
    zoomLevel: 12,
    zone: 'North Eastern Zone',
  },

  // --- Andhra Pradesh Districts ---
  Guntur: {
    name: 'Guntur',
    nameTelugu: 'గుంటూరు',
    state: 'Andhra Pradesh',
    latitude: 16.3067,
    longitude: 80.4365,
    zoomLevel: 12,
    zone: 'Krishna-Godavari Coastal Zone',
  },
  Krishna: {
    name: 'Krishna',
    nameTelugu: 'కృష్ణా',
    state: 'Andhra Pradesh',
    latitude: 16.18,
    longitude: 81.13,
    zoomLevel: 12,
    zone: 'Coastal Andhra Zone',
  },
  Kurnool: {
    name: 'Kurnool',
    nameTelugu: 'కర్నూలు',
    state: 'Andhra Pradesh',
    latitude: 15.8281,
    longitude: 78.0373,
    zoomLevel: 12,
    zone: 'Rayalaseema Scarce Rainfall Zone',
  },
  'East Godavari': {
    name: 'East Godavari',
    nameTelugu: 'తూర్పు గోదావరి',
    state: 'Andhra Pradesh',
    latitude: 17.0,
    longitude: 82.0,
    zoomLevel: 12,
    zone: 'Delta Zone',
  },

  // --- Telangana Districts ---
  Warangal: {
    name: 'Warangal',
    nameTelugu: 'వరంగల్',
    state: 'Telangana',
    latitude: 17.9689,
    longitude: 79.5941,
    zoomLevel: 12,
    zone: 'Central Telangana Zone',
  },
  Nalgonda: {
    name: 'Nalgonda',
    nameTelugu: 'నల్గొండ',
    state: 'Telangana',
    latitude: 17.0575,
    longitude: 79.2684,
    zoomLevel: 12,
    zone: 'Southern Telangana Zone',
  },
  Khammam: {
    name: 'Khammam',
    nameTelugu: 'ఖమ్మం',
    state: 'Telangana',
    latitude: 17.2473,
    longitude: 80.1514,
    zoomLevel: 12,
    zone: 'Eastern Telangana Zone',
  },

  // --- Karnataka Districts ---
  Mandya: {
    name: 'Mandya',
    nameKannada: 'ಮಂಡ್ಯ',
    state: 'Karnataka',
    latitude: 12.5218,
    longitude: 76.8951,
    zoomLevel: 12,
    zone: 'Cauvery Basin Southern Dry Zone',
  },
  Mysuru: {
    name: 'Mysuru',
    nameKannada: 'ಮೈಸೂರು',
    state: 'Karnataka',
    latitude: 12.2958,
    longitude: 76.6394,
    zoomLevel: 12,
    zone: 'Southern Transition Zone',
  },
  Hassan: {
    name: 'Hassan',
    nameKannada: 'ಹಾಸನ',
    state: 'Karnataka',
    latitude: 13.0033,
    longitude: 76.1004,
    zoomLevel: 12,
    zone: 'Southern Transition & Hilly Zone',
  },
  Belagavi: {
    name: 'Belagavi',
    nameKannada: 'ಬೆಳಗಾವಿ',
    state: 'Karnataka',
    latitude: 15.8497,
    longitude: 74.4977,
    zoomLevel: 12,
    zone: 'Northern Transition Zone',
  },

  // --- Kerala Districts ---
  Palakkad: {
    name: 'Palakkad',
    nameMalayalam: 'പാലക്കാട്',
    state: 'Kerala',
    latitude: 10.7867,
    longitude: 76.6548,
    zoomLevel: 12,
    zone: 'Palakkad Plains (Rice Bowl of Kerala)',
  },
  Alappuzha: {
    name: 'Alappuzha',
    nameMalayalam: 'ആലപ്പുഴ',
    state: 'Kerala',
    latitude: 9.4981,
    longitude: 76.3388,
    zoomLevel: 12,
    zone: 'Kuttanad Below-Sea-Level Farming Zone',
  },
  Thrissur: {
    name: 'Thrissur',
    nameMalayalam: 'തൃശ്ശൂർ',
    state: 'Kerala',
    latitude: 10.5276,
    longitude: 76.2144,
    zoomLevel: 12,
    zone: 'Central Alluvial Zone',
  },
  Wayanad: {
    name: 'Wayanad',
    nameMalayalam: 'വയനാട്',
    state: 'Kerala',
    latitude: 11.6854,
    longitude: 76.132,
    zoomLevel: 12,
    zone: 'High Altitude Plantation Zone',
  },

  // --- Puducherry ---
  Puducherry: {
    name: 'Puducherry',
    nameTamil: 'புதுச்சேரி',
    state: 'Puducherry',
    latitude: 11.9416,
    longitude: 79.8083,
    zoomLevel: 12,
    zone: 'Coastal Delta Union Territory',
  },
  Karaikal: {
    name: 'Karaikal',
    nameTamil: 'காரைக்கால்',
    state: 'Puducherry',
    latitude: 10.9254,
    longitude: 79.838,
    zoomLevel: 12,
    zone: 'Cauvery Delta Coastal Enclave',
  },
};

/**
 * Helper to look up district or region geodata case-insensitively
 */
export function getSouthIndiaDistrictGeo(query: string): SouthIndiaRegionGeo | undefined {
  if (!query) return undefined;
  const qClean = query.trim().toLowerCase();

  for (const [key, geo] of Object.entries(SOUTH_INDIA_DISTRICTS_GEODATA)) {
    if (
      key.toLowerCase() === qClean ||
      geo.name.toLowerCase() === qClean ||
      geo.nameTamil?.toLowerCase() === qClean ||
      geo.nameTelugu?.toLowerCase() === qClean ||
      geo.nameKannada?.toLowerCase() === qClean ||
      geo.nameMalayalam?.toLowerCase() === qClean
    ) {
      return geo;
    }
  }

  // Partial match fallback
  for (const [key, geo] of Object.entries(SOUTH_INDIA_DISTRICTS_GEODATA)) {
    if (key.toLowerCase().includes(qClean) || geo.name.toLowerCase().includes(qClean)) {
      return geo;
    }
  }

  return undefined;
}
