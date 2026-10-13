export interface SeasonalCropWindow {
  seasonKey: string;
  seasonName: string;
  seasonNameTamil: string;
  cropId: 'rice' | 'tomato' | 'chilli' | 'cotton' | 'maize' | 'groundnut' | 'pulses';
  cropName: string;
  cropNameTamil: string;
  sowingPeriod: string;
  sowingPeriodTamil: string;
  harvestPeriod: string;
  harvestPeriodTamil: string;
  durationDays: string;
  applicableDistricts: string[];
  recommendedCultivars: string[];
  waterStrategy: string;
  waterStrategyTamil: string;
  pathologyRisks: string[];
  pathologyRisksTamil: string[];
  verifiedSource: string;
  sourceUrl: string;
  isRegionSpecific: boolean;
}

export const TN_SEASONAL_CALENDAR: SeasonalCropWindow[] = [
  // 1. Rice: Kuruvai
  {
    seasonKey: 'rice-kuruvai',
    seasonName: 'Kuruvai (Short Duration)',
    seasonNameTamil: 'குறுவை பருவம் (குறுகிய காலம்)',
    cropId: 'rice',
    cropName: 'Rice (Paddy)',
    cropNameTamil: 'நெல் (பயிர்)',
    sowingPeriod: 'June 1 – July 15',
    sowingPeriodTamil: 'ஜூன் 1 – ஜூலை 15',
    harvestPeriod: 'September – October',
    harvestPeriodTamil: 'செப்டம்பர் – அக்டோபர்',
    durationDays: '105 – 120 Days',
    applicableDistricts: ['Thanjavur', 'Tiruvarur', 'Mayiladuthurai', 'Nagapattinam', 'Tiruchirappalli', 'Cuddalore'],
    recommendedCultivars: ['ADT 43', 'ADT 45', 'CO 51', 'ASD 16', 'TPS 5'],
    waterStrategy: 'Mettur dam canal opening dependent; requires borewell support for nursery if canal discharge is delayed.',
    waterStrategyTamil: 'மேட்டூர் அணை கால்வாய் நீர் பாசனம்; கால்வாய் தாமதமானால் ஆழ்துளை கிணறு மூலம் நாற்றங்கால் தயார் செய்ய வேண்டும்.',
    pathologyRisks: ['Leaf Folder', 'Brown Spot (potash deficiency)', 'Stem Borer during vegetative growth'],
    pathologyRisksTamil: ['இலைச்சுருட்டுப்புழு', 'இலைப்புள்ளி நோய்', 'தண்டுத்துளைப்பான்'],
    verifiedSource: 'TNAU Agritech Portal – Rice Crop Knowledge Base & CPBG Guidelines',
    sourceUrl: 'https://agritech.tnau.ac.in/agriculture/agri_crop_production_cereals_rice.html',
    isRegionSpecific: true,
  },

  // 2. Rice: Samba
  {
    seasonKey: 'rice-samba',
    seasonName: 'Samba (Main Monsoon Season)',
    seasonNameTamil: 'சம்பா பருவம் (முதன்மை பருவமழை காலம்)',
    cropId: 'rice',
    cropName: 'Rice (Paddy)',
    cropNameTamil: 'நெல் (பயிர்)',
    sowingPeriod: 'August 1 – September 30',
    sowingPeriodTamil: 'ஆகஸ்ட் 1 – செப்டம்பர் 30',
    harvestPeriod: 'December – January',
    harvestPeriodTamil: 'டிசம்பர் – ஜனவரி',
    durationDays: '130 – 150 Days',
    applicableDistricts: [
      'Thanjavur',
      'Tiruvarur',
      'Mayiladuthurai',
      'Nagapattinam',
      'Cuddalore',
      'Pudukkottai',
      'Tiruchirappalli',
      'Madurai',
      'Villupuram',
      'Tiruvannamalai',
      'Ramanathapuram',
    ],
    recommendedCultivars: ['CR 1009 Sub 1', 'BPT 5204 (Samba Mahsuri)', 'TKM 13', 'CO 52', 'ADT 53', 'Karuppu Kavuni'],
    waterStrategy: 'Coincides with North East Monsoon rains (NEM); drainage management is critical to prevent submergence injury in low-lying delta parcels.',
    waterStrategyTamil: 'வடகிழக்கு பருவமழையுடன் ஒத்துப்போகிறது; வடிநீர் வசதி மிகவும் அவசியம், நீர் தேங்கினால் வடிகால் வாய்க்கால்களை தூர்வாரவும்.',
    pathologyRisks: ['Leaf & Neck Blast (Magnaporthe oryzae)', 'Bacterial Leaf Blight (Xanthomonas oryzae)', 'Sheath Rot'],
    pathologyRisksTamil: ['குலை நோய் மற்றும் கழுத்துக் குலை', 'பாக்டீரியா இலைக்கருகல்', 'உறை அழுகல் நோய்'],
    verifiedSource: 'TNAU Agritech Portal & District Joint Director of Agriculture Advisory',
    sourceUrl: 'https://agritech.tnau.ac.in/agriculture/agri_crop_production_cereals_rice.html',
    isRegionSpecific: true,
  },

  // 3. Rice: Thaladi
  {
    seasonKey: 'rice-thaladi',
    seasonName: 'Thaladi (Late Samba / Double Crop)',
    seasonNameTamil: 'தாளடி பருவம் (இரண்டாம் பயிர்)',
    cropId: 'rice',
    cropName: 'Rice (Paddy)',
    cropNameTamil: 'நெல் (பயிர்)',
    sowingPeriod: 'September 15 – October 31',
    sowingPeriodTamil: 'செப்டம்பர் 15 – அக்டோபர் 31',
    harvestPeriod: 'January – February',
    harvestPeriodTamil: 'ஜனவரி – பிப்ரவரி',
    durationDays: '130 – 135 Days',
    applicableDistricts: ['Thanjavur', 'Tiruvarur', 'Mayiladuthurai', 'Nagapattinam'],
    recommendedCultivars: ['ADT 38', 'ADT 46', 'CO 52', 'CR 1009 Sub 1'],
    waterStrategy: 'Utilizes receding Northeast Monsoon showers; protect terminal stage from moisture deficit with groundwater irrigation.',
    waterStrategyTamil: 'பருவமழையின் இறுதிக்கட்ட நீரைப் பயன்படுத்துகிறது; பால் பிடிக்கும் தருணத்தில் நீர் பற்றாக்குறை வராமல் காக்க வேண்டும்.',
    pathologyRisks: ['False Smut (Ustilaginoidea virens)', 'Sheath Blight', 'Bacterial Grain Rot'],
    pathologyRisksTamil: ['கரிப்பூட்டை நோய் (மஞ்சள் கதிர் பூஞ்சை)', 'உறை கருகல் நோய்', 'தானிய அழுகல்'],
    verifiedSource: 'TNAU Tamil Nadu Agricultural Weather Network & ICAR-NRRI',
    sourceUrl: 'https://agritech.tnau.ac.in',
    isRegionSpecific: true,
  },

  // 4. Rice: Navarai
  {
    seasonKey: 'rice-navarai',
    seasonName: 'Navarai (Dry Season Irrigated)',
    seasonNameTamil: 'நவரை பருவம் (கோடைக்கால நீர்ப்பாசனம்)',
    cropId: 'rice',
    cropName: 'Rice (Paddy)',
    cropNameTamil: 'நெல் (பயிர்)',
    sowingPeriod: 'December 1 – January 15',
    sowingPeriodTamil: 'டிசம்பர் 1 – ஜனவரி 15',
    harvestPeriod: 'March – April',
    harvestPeriodTamil: 'மார்ச் – ஏப்ரல்',
    durationDays: '115 – 125 Days',
    applicableDistricts: ['Tiruvallur', 'Kanchipuram', 'Chengalpattu', 'Vellore', 'Tiruvannamalai', 'Villupuram', 'Cuddalore'],
    recommendedCultivars: ['ADT 37', 'ASD 16', 'CO 51', 'TKM 9'],
    waterStrategy: 'Borewell and tank irrigated; apply Alternate Wetting and Drying (AWD) to economize water during rising summer temperatures.',
    waterStrategyTamil: 'ஆழ்துளை கிணறு மற்றும் ஏரி பாசனம்; கோடைக் காலத்தில் நீரைச் சேமிக்க காய்ச்சலும் பாய்ச்சலுமாக நீர் பாய்ச்சவும்.',
    pathologyRisks: ['Mite Infestation', 'Stem Borer', 'Brown Planthopper (BPH)'],
    pathologyRisksTamil: ['செம்பேன் தாக்குதல்', 'தண்டுத்துளைப்பான்', 'பழுப்பு நிற தத்துப்பூச்சி'],
    verifiedSource: 'TNAU Directorate of Extension Education, Coimbatore',
    sourceUrl: 'https://agritech.tnau.ac.in',
    isRegionSpecific: true,
  },

  // 5. Tomato: Rabi / Winter
  {
    seasonKey: 'tomato-rabi',
    seasonName: 'Tomato: Rabi / Winter Season',
    seasonNameTamil: 'தக்காளி: குளிர்காலப் பருவம்',
    cropId: 'tomato',
    cropName: 'Tomato',
    cropNameTamil: 'தக்காளி',
    sowingPeriod: 'September 1 – October 31',
    sowingPeriodTamil: 'செப்டம்பர் 1 – அக்டோபர் 31',
    harvestPeriod: 'December – March',
    harvestPeriodTamil: 'டிசம்பர் – மார்ச்',
    durationDays: '110 – 135 Days',
    applicableDistricts: ['Dindigul', 'Madurai', 'Salem', 'Dharmapuri', 'Krishnagiri', 'Theni', 'Coimbatore'],
    recommendedCultivars: ['Shivam', 'Abhinav', 'CO 3', 'PKM 1', 'Arka Rakshak'],
    waterStrategy: 'Drip irrigation with fertigation; avoid furrow flooding to prevent root collar collar rot.',
    waterStrategyTamil: 'சொட்டு நீர் பாசனம் சிறந்தது; தண்டு அழுகல் வராமல் இருக்க செடியின் அடிப்பகுதியில் நீர் தேங்காமல் பார்த்துக் கொள்ளவும்.',
    pathologyRisks: ['Early Blight (Alternaria solani)', 'Late Blight (Phytophthora)', 'Tomato Leaf Curl Virus (Whitefly vector)'],
    pathologyRisksTamil: ['முன் கருகல் நோய்', 'பின் கருகல் நோய்', 'இலைச்சுருள் நச்சுயிரி (வெள்ளைப் ஈ மூலம்)'],
    verifiedSource: 'TNAU Horticultural College & Research Institute, Periyakulam',
    sourceUrl: 'https://agritech.tnau.ac.in/horticulture/horti_vegetables_tomato.html',
    isRegionSpecific: true,
  },

  // 6. Chilli: Winter Irrigated
  {
    seasonKey: 'chilli-winter',
    seasonName: 'Chilli: Winter Irrigated',
    seasonNameTamil: 'மிளகாய்: குளிர்காலப் பாசனம்',
    cropId: 'chilli',
    cropName: 'Chilli',
    cropNameTamil: 'மிளகாய்',
    sowingPeriod: 'September 1 – October 15',
    sowingPeriodTamil: 'செப்டம்பர் 1 – அக்டோபர் 15',
    harvestPeriod: 'December – April',
    harvestPeriodTamil: 'டிசம்பர் – ஏப்ரல்',
    durationDays: '150 – 180 Days',
    applicableDistricts: ['Ramanathapuram', 'Thoothukudi', 'Virudhunagar', 'Sivaganga', 'Dindigul', 'Tirunelveli'],
    recommendedCultivars: ['K1', 'K2', 'CO 4', 'PKM 1', 'Guntur Sannam'],
    waterStrategy: 'Moderate moisture requirement; sensitive to standing water. Raised bed planting recommended.',
    waterStrategyTamil: 'மிதமான நீர் தேவை; நீர் தேங்குவதை முற்றிலும் தாங்காது. மேட்டுப்பாத்தி அமைத்து நடவு செய்வது நன்று.',
    pathologyRisks: ['Anthracnose / Fruit Rot (Colletotrichum capsici)', 'Dieback', 'Chilli Murda (Thrips + Mite complex)'],
    pathologyRisksTamil: ['காய் அழுகல் / நுனிக்கருகல்', 'இலைப்பேன் மற்றும் அசுவினி தாக்குதல்', 'முரணை நோய்'],
    verifiedSource: 'TNAU Department of Spices & Plantation Crops',
    sourceUrl: 'https://agritech.tnau.ac.in/horticulture/horti_spices_chilli.html',
    isRegionSpecific: true,
  },

  // 7. Cotton: Winter Irrigated
  {
    seasonKey: 'cotton-winter',
    seasonName: 'Cotton: Winter Irrigated',
    seasonNameTamil: 'பருத்தி: குளிர்காலப் பாசனம்',
    cropId: 'cotton',
    cropName: 'Cotton',
    cropNameTamil: 'பருத்தி',
    sowingPeriod: 'August 1 – September 15',
    sowingPeriodTamil: 'ஆகஸ்ட் 1 – செப்டம்பர் 15',
    harvestPeriod: 'January – March',
    harvestPeriodTamil: 'ஜனவரி – மார்ச்',
    durationDays: '150 – 165 Days',
    applicableDistricts: ['Coimbatore', 'Erode', 'Salem', 'Virudhunagar', 'Perambalur', 'Dharmapuri'],
    recommendedCultivars: ['MCU 5', 'MCU 7', 'SVPR 2', 'Surabhi', 'Bt Hybrids'],
    waterStrategy: 'Skip furrow irrigation or drip; water stress at squaring and boll formation reduces yield.',
    waterStrategyTamil: 'மாற்றுச்சால் பாசனம் அல்லது சொட்டு நீர்; பூக்கும் மற்றும் காய் பிடிக்கும் பருவத்தில் வறட்சி கூடாது.',
    pathologyRisks: ['Angular Leaf Spot (Xanthomonas malvacearum)', 'Boll Rot', 'Grey Mildew'],
    pathologyRisksTamil: ['கோண இலைப்புள்ளி நோய்', 'காய் அழுகல் நோய்', 'சாம்பல் நோய்'],
    verifiedSource: 'TNAU Cotton Research Station, Srivilliputhur',
    sourceUrl: 'https://agritech.tnau.ac.in/agriculture/agri_crop_production_commercialcrops_cotton.html',
    isRegionSpecific: true,
  },

  // 8. Maize: Rabi Irrigated
  {
    seasonKey: 'maize-rabi',
    seasonName: 'Maize: Rabi Irrigated & Rainfed',
    seasonNameTamil: 'மக்காச்சோளம்: குளிர்காலப் பயிர்',
    cropId: 'maize',
    cropName: 'Maize',
    cropNameTamil: 'மக்காச்சோளம்',
    sowingPeriod: 'October 1 – November 15',
    sowingPeriodTamil: 'அக்டோபர் 1 – நவம்பர் 15',
    harvestPeriod: 'January – February',
    harvestPeriodTamil: 'ஜனவரி – பிப்ரவரி',
    durationDays: '100 – 115 Days',
    applicableDistricts: ['Perambalur', 'Ariyalur', 'Dindigul', 'Tiruchirappalli', 'Virudhunagar', 'Thoothukudi', 'Salem'],
    recommendedCultivars: ['CO 6', 'CO 8', 'Pioneer 30V92', 'NK 6240', 'CP 818'],
    waterStrategy: 'Critical water stages: Knee-high, Tasseling, Silking, and Grain filling. Standing water causes severe chlorosis.',
    waterStrategyTamil: 'முக்கிய பாசன தருணங்கள்: முழங்கால் உயரம், பூ மற்றும் கதிர் வரும் பருவம்; நீர் தேங்கினால் மஞ்சள் நிறமாக மாறும்.',
    pathologyRisks: ['Turcicum Leaf Blight (Exserohilum turcicum)', 'Fall Armyworm (Spodoptera frugiperda)', 'Maydis Blight'],
    pathologyRisksTamil: ['டர்சிகம் இலைக்கருகல் நோய்', 'படைப்புழு தாக்குதல்', 'மக்காச்சோள கருகல்'],
    verifiedSource: 'TNAU Department of Millets, Centre for Plant Breeding and Genetics',
    sourceUrl: 'https://agritech.tnau.ac.in/agriculture/agri_crop_production_cereals_maize.html',
    isRegionSpecific: true,
  },
];

/**
 * Find active seasonal windows for a given district and crop
 */
export function getActiveSeasonalWindows(district: string, cropNameOrId?: string): SeasonalCropWindow[] {
  const normDistrict = district.trim().toLowerCase();
  const normCrop = (cropNameOrId || '').toLowerCase();

  return TN_SEASONAL_CALENDAR.filter((entry) => {
    // Check district match
    const districtMatches =
      entry.applicableDistricts.some((d) => d.toLowerCase() === normDistrict) ||
      !entry.isRegionSpecific;

    // Check crop match if supplied
    let cropMatches = true;
    if (normCrop) {
      cropMatches =
        entry.cropId.toLowerCase() === normCrop ||
        entry.cropName.toLowerCase().includes(normCrop) ||
        normCrop.includes(entry.cropId.toLowerCase()) ||
        (normCrop.includes('paddy') && entry.cropId === 'rice');
    }

    return districtMatches && cropMatches;
  });
}
