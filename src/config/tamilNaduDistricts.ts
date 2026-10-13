export interface DistrictGeo {
  name: string;
  nameTamil: string;
  latitude: number;
  longitude: number;
  zone: 'Cauvery Delta' | 'North Eastern' | 'Western' | 'Southern' | 'North Western' | 'High Rainfall' | 'Hilly';
  zoneTamil: string;
}

export const TN_DISTRICT_GEODATA: Record<string, DistrictGeo> = {
  Thanjavur: {
    name: 'Thanjavur',
    nameTamil: 'தஞ்சாவூர்',
    latitude: 10.7870,
    longitude: 79.1378,
    zone: 'Cauvery Delta',
    zoneTamil: 'காவிரி டெல்டா மண்டலம்',
  },
  Tiruvarur: {
    name: 'Tiruvarur',
    nameTamil: 'திருவாரூர்',
    latitude: 10.7725,
    longitude: 79.6365,
    zone: 'Cauvery Delta',
    zoneTamil: 'காவிரி டெல்டா மண்டலம்',
  },
  Mayiladuthurai: {
    name: 'Mayiladuthurai',
    nameTamil: 'மயிலாடுதுறை',
    latitude: 11.1018,
    longitude: 79.6522,
    zone: 'Cauvery Delta',
    zoneTamil: 'காவிரி டெல்டா மண்டலம்',
  },
  Nagapattinam: {
    name: 'Nagapattinam',
    nameTamil: 'நாகப்பட்டினம்',
    latitude: 10.7656,
    longitude: 79.8428,
    zone: 'Cauvery Delta',
    zoneTamil: 'காவிரி டெல்டா மண்டலம்',
  },
  Cuddalore: {
    name: 'Cuddalore',
    nameTamil: 'கடலூர்',
    latitude: 11.7480,
    longitude: 79.7714,
    zone: 'North Eastern',
    zoneTamil: 'வடகிழக்கு மண்டலம்',
  },
  Madurai: {
    name: 'Madurai',
    nameTamil: 'மதுரை',
    latitude: 9.9252,
    longitude: 78.1198,
    zone: 'Southern',
    zoneTamil: 'தென் மண்டலம்',
  },
  Tiruchirappalli: {
    name: 'Tiruchirappalli',
    nameTamil: 'திருச்சிராப்பள்ளி',
    latitude: 10.7905,
    longitude: 78.7047,
    zone: 'Cauvery Delta',
    zoneTamil: 'காவிரி டெல்டா மண்டலம்',
  },
  Pudukkottai: {
    name: 'Pudukkottai',
    nameTamil: 'புதுக்கோட்டை',
    latitude: 10.3833,
    longitude: 78.8001,
    zone: 'Cauvery Delta',
    zoneTamil: 'காவிரி டெல்டா மண்டலம்',
  },
  Tiruvannamalai: {
    name: 'Tiruvannamalai',
    nameTamil: 'திருவண்ணாமலை',
    latitude: 12.2253,
    longitude: 79.0747,
    zone: 'North Eastern',
    zoneTamil: 'வடகிழக்கு மண்டலம்',
  },
  Villupuram: {
    name: 'Villupuram',
    nameTamil: 'விழுப்புரம்',
    latitude: 11.9401,
    longitude: 79.4861,
    zone: 'North Eastern',
    zoneTamil: 'வடகிழக்கு மண்டலம்',
  },
  Salem: {
    name: 'Salem',
    nameTamil: 'சேலம்',
    latitude: 11.6643,
    longitude: 78.1460,
    zone: 'North Western',
    zoneTamil: 'வடமேற்கு மண்டலம்',
  },
  Coimbatore: {
    name: 'Coimbatore',
    nameTamil: 'கோயம்புத்தூர்',
    latitude: 11.0168,
    longitude: 76.9558,
    zone: 'Western',
    zoneTamil: 'மேற்கு மண்டலம்',
  },
  Erode: {
    name: 'Erode',
    nameTamil: 'ஈரோடு',
    latitude: 11.3410,
    longitude: 77.7172,
    zone: 'Western',
    zoneTamil: 'மேற்கு மண்டலம்',
  },
  Tirunelveli: {
    name: 'Tirunelveli',
    nameTamil: 'திருநெல்வேலி',
    latitude: 8.7139,
    longitude: 77.7567,
    zone: 'Southern',
    zoneTamil: 'தென் மண்டலம்',
  },
  Dindigul: {
    name: 'Dindigul',
    nameTamil: 'திண்டுக்கல்',
    latitude: 10.3673,
    longitude: 77.9803,
    zone: 'Southern',
    zoneTamil: 'தென் மண்டலம்',
  },
  Vellore: {
    name: 'Vellore',
    nameTamil: 'வேலூர்',
    latitude: 12.9165,
    longitude: 79.1325,
    zone: 'North Eastern',
    zoneTamil: 'வடகிழக்கு மண்டலம்',
  },
  Theni: {
    name: 'Theni',
    nameTamil: 'தேனி',
    latitude: 10.0104,
    longitude: 77.4768,
    zone: 'Southern',
    zoneTamil: 'தென் மண்டலம்',
  },
  Karur: {
    name: 'Karur',
    nameTamil: 'கரூர்',
    latitude: 10.9601,
    longitude: 78.0766,
    zone: 'Western',
    zoneTamil: 'மேற்கு மண்டலம்',
  },
  Dharmapuri: {
    name: 'Dharmapuri',
    nameTamil: 'தர்மபுரி',
    latitude: 12.1211,
    longitude: 78.1582,
    zone: 'North Western',
    zoneTamil: 'வடமேற்கு மண்டலம்',
  },
  Ariyalur: {
    name: 'Ariyalur',
    nameTamil: 'அரியலூர்',
    latitude: 11.1401,
    longitude: 79.0786,
    zone: 'Cauvery Delta',
    zoneTamil: 'காவிரி டெல்டா மண்டலம்',
  },
  Perambalur: {
    name: 'Perambalur',
    nameTamil: 'பெரம்பலூர்',
    latitude: 11.2342,
    longitude: 78.8820,
    zone: 'Cauvery Delta',
    zoneTamil: 'காவிரி டெல்டா மண்டலம்',
  },
  Ramanathapuram: {
    name: 'Ramanathapuram',
    nameTamil: 'இராமநாதபுரம்',
    latitude: 9.3639,
    longitude: 78.8395,
    zone: 'Southern',
    zoneTamil: 'தென் மண்டலம்',
  },
  Virudhunagar: {
    name: 'Virudhunagar',
    nameTamil: 'விருதுநகர்',
    latitude: 9.5680,
    longitude: 77.9624,
    zone: 'Southern',
    zoneTamil: 'தென் மண்டலம்',
  },
  Sivaganga: {
    name: 'Sivaganga',
    nameTamil: 'சிவகங்கை',
    latitude: 9.8433,
    longitude: 78.4809,
    zone: 'Southern',
    zoneTamil: 'தென் மண்டலம்',
  },
  Thoothukudi: {
    name: 'Thoothukudi',
    nameTamil: 'தூத்துக்குடி',
    latitude: 8.7642,
    longitude: 78.1348,
    zone: 'Southern',
    zoneTamil: 'தென் மண்டலம்',
  },
  Kanyakumari: {
    name: 'Kanyakumari',
    nameTamil: 'கன்னியாகுமரி',
    latitude: 8.0883,
    longitude: 77.5385,
    zone: 'High Rainfall',
    zoneTamil: 'அதிக மழைப்பொழிவு மண்டலம்',
  },
  Krishnagiri: {
    name: 'Krishnagiri',
    nameTamil: 'கிருஷ்ணகிரி',
    latitude: 12.5186,
    longitude: 78.2137,
    zone: 'North Western',
    zoneTamil: 'வடமேற்கு மண்டலம்',
  },
  Namakkal: {
    name: 'Namakkal',
    nameTamil: 'நாமக்கல்',
    latitude: 11.2189,
    longitude: 78.1674,
    zone: 'North Western',
    zoneTamil: 'வடமேற்கு மண்டலம்',
  },
  Nilgiris: {
    name: 'Nilgiris',
    nameTamil: 'நீலகிரி',
    latitude: 11.4102,
    longitude: 76.6950,
    zone: 'Hilly',
    zoneTamil: 'மலைப் பிரதேசம்',
  },
  Tirupathur: {
    name: 'Tirupathur',
    nameTamil: 'திருப்பத்தூர்',
    latitude: 12.4950,
    longitude: 78.5678,
    zone: 'North Eastern',
    zoneTamil: 'வடகிழக்கு மண்டலம்',
  },
  Ranipet: {
    name: 'Ranipet',
    nameTamil: 'இராணிப்பேட்டை',
    latitude: 12.9279,
    longitude: 79.3330,
    zone: 'North Eastern',
    zoneTamil: 'வடகிழக்கு மண்டலம்',
  },
  Chengalpattu: {
    name: 'Chengalpattu',
    nameTamil: 'செங்கல்பட்டு',
    latitude: 12.6841,
    longitude: 79.9836,
    zone: 'North Eastern',
    zoneTamil: 'வடகிழக்கு மண்டலம்',
  },
  Kanchipuram: {
    name: 'Kanchipuram',
    nameTamil: 'காஞ்சிபுரம்',
    latitude: 12.8342,
    longitude: 79.7036,
    zone: 'North Eastern',
    zoneTamil: 'வடகிழக்கு மண்டலம்',
  },
  Tiruvallur: {
    name: 'Tiruvallur',
    nameTamil: 'திருவள்ளூர்',
    latitude: 13.1432,
    longitude: 79.9083,
    zone: 'North Eastern',
    zoneTamil: 'வடகிழக்கு மண்டலம்',
  },
  Tenkasi: {
    name: 'Tenkasi',
    nameTamil: 'தென்காசி',
    latitude: 8.9594,
    longitude: 77.3151,
    zone: 'Southern',
    zoneTamil: 'தென் மண்டலம்',
  },
  Kallakurichi: {
    name: 'Kallakurichi',
    nameTamil: 'கள்ளக்குறிச்சி',
    latitude: 11.7384,
    longitude: 78.9639,
    zone: 'North Eastern',
    zoneTamil: 'வடகிழக்கு மண்டலம்',
  },
};

export function getDistrictGeo(districtName: string): DistrictGeo {
  // Normalize lookup
  const clean = districtName.trim().toLowerCase();
  for (const [key, geo] of Object.entries(TN_DISTRICT_GEODATA)) {
    if (key.toLowerCase() === clean || geo.nameTamil.toLowerCase() === clean) {
      return geo;
    }
  }
  // Default to Thanjavur (Cauvery Delta hub)
  return TN_DISTRICT_GEODATA.Thanjavur;
}

export const ALL_TAMIL_NADU_DISTRICTS: DistrictGeo[] = Object.values(TN_DISTRICT_GEODATA);

