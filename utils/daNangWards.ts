// Shared Utility for Da Nang Districts and Wards (Tọa độ & Ranh giới các Xã/Phường Đà Nẵng)

export interface WardInfo {
  ward: string;
  district: string;
  lat: number;
  lng: number;
  radiusKm: number;
}

export const DA_NANG_WARDS: Record<string, { lat: number; lng: number; district: string; radiusKm?: number }> = {
  // Quận Hải Châu
  'Hòa Cường Bắc': { lat: 16.0384, lng: 108.2158, district: 'Hải Châu', radiusKm: 1.5 },
  'Hòa Cường Nam': { lat: 16.0264, lng: 108.2201, district: 'Hải Châu', radiusKm: 1.8 },
  'Hải Châu I': { lat: 16.0652, lng: 108.2223, district: 'Hải Châu', radiusKm: 1.2 },
  'Hải Châu II': { lat: 16.0611, lng: 108.2162, district: 'Hải Châu', radiusKm: 1.2 },
  'Thạch Thang': { lat: 16.0722, lng: 108.2194, district: 'Hải Châu', radiusKm: 1.0 },
  'Thuận Phước': { lat: 16.0825, lng: 108.2185, district: 'Hải Châu', radiusKm: 1.5 },
  'Hòa Thuận Tây': { lat: 16.0392, lng: 108.2011, district: 'Hải Châu', radiusKm: 1.6 },
  'Hòa Thuận Đông': { lat: 16.0465, lng: 108.2181, district: 'Hải Châu', radiusKm: 1.2 },
  'Nam Dương': { lat: 16.0581, lng: 108.2161, district: 'Hải Châu', radiusKm: 0.9 },
  'Phước Ninh': { lat: 16.0588, lng: 108.2210, district: 'Hải Châu', radiusKm: 0.8 },
  'Bình Thuận': { lat: 16.0505, lng: 108.2162, district: 'Hải Châu', radiusKm: 1.0 },
  'Bình Hiên': { lat: 16.0514, lng: 108.2205, district: 'Hải Châu', radiusKm: 0.9 },

  // Quận Thanh Khê
  'Vĩnh Trung': { lat: 16.0618, lng: 108.2112, district: 'Thanh Khê', radiusKm: 1.0 },
  'Tân Chính': { lat: 16.0674, lng: 108.2081, district: 'Thanh Khê', radiusKm: 1.0 },
  'Thạc Gián': { lat: 16.0582, lng: 108.2045, district: 'Thanh Khê', radiusKm: 1.1 },
  'Chính Gián': { lat: 16.0601, lng: 108.1974, district: 'Thanh Khê', radiusKm: 1.1 },
  'Xuân Hà': { lat: 16.0691, lng: 108.1965, district: 'Thanh Khê', radiusKm: 1.3 },
  'An Khê': { lat: 16.0524, lng: 108.1751, district: 'Thanh Khê', radiusKm: 1.8 },
  'Hòa Khê': { lat: 16.0561, lng: 108.1824, district: 'Thanh Khê', radiusKm: 1.4 },
  'Thanh Khê Tây': { lat: 16.0681, lng: 108.1651, district: 'Thanh Khê', radiusKm: 1.5 },
  'Thanh Khê Đông': { lat: 16.0711, lng: 108.1794, district: 'Thanh Khê', radiusKm: 1.4 },

  // Quận Sơn Trà
  'An Hải Bắc': { lat: 16.0754, lng: 108.2384, district: 'Sơn Trà', radiusKm: 1.6 },
  'An Hải Tây': { lat: 16.0611, lng: 108.2312, district: 'Sơn Trà', radiusKm: 1.2 },
  'An Hải Đông': { lat: 16.0524, lng: 108.2374, district: 'Sơn Trà', radiusKm: 1.3 },
  'Phước Mỹ': { lat: 16.0605, lng: 108.2458, district: 'Sơn Trà', radiusKm: 1.7 },
  'Thọ Quang': { lat: 16.1084, lng: 108.2612, district: 'Sơn Trà', radiusKm: 3.5 },
  'Nại Hiên Đông': { lat: 16.0911, lng: 108.2345, district: 'Sơn Trà', radiusKm: 2.0 },
  'Mân Thái': { lat: 16.0821, lng: 108.2492, district: 'Sơn Trà', radiusKm: 1.5 },

  // Quận Ngũ Hành Sơn
  'Mỹ An': { lat: 16.0381, lng: 108.2442, district: 'Ngũ Hành Sơn', radiusKm: 2.0 },
  'Khuê Mỹ': { lat: 16.0184, lng: 108.2481, district: 'Ngũ Hành Sơn', radiusKm: 2.2 },
  'Hòa Hải': { lat: 15.9861, lng: 108.2684, district: 'Ngũ Hành Sơn', radiusKm: 3.0 },
  'Hòa Quý': { lat: 15.9754, lng: 108.2361, district: 'Ngũ Hành Sơn', radiusKm: 3.2 },

  // Quận Liên Chiểu
  'Hòa Minh': { lat: 16.0592, lng: 108.1654, district: 'Liên Chiểu', radiusKm: 2.8 },
  'Hòa Khánh Nam': { lat: 16.0461, lng: 108.1394, district: 'Liên Chiểu', radiusKm: 2.5 },
  'Hòa Khánh Bắc': { lat: 16.0694, lng: 108.1412, district: 'Liên Chiểu', radiusKm: 2.7 },
  'Hòa Hiệp Nam': { lat: 16.0912, lng: 108.1251, district: 'Liên Chiểu', radiusKm: 3.0 },
  'Hòa Hiệp Bắc': { lat: 16.1245, lng: 108.1094, district: 'Liên Chiểu', radiusKm: 4.0 },

  // Quận Cẩm Lệ
  'Khuê Trung': { lat: 16.0234, lng: 108.2034, district: 'Cẩm Lệ', radiusKm: 1.8 },
  'Hòa Thọ Đông': { lat: 16.0124, lng: 108.1812, district: 'Cẩm Lệ', radiusKm: 2.0 },
  'Hòa Thọ Tây': { lat: 16.0112, lng: 108.1512, district: 'Cẩm Lệ', radiusKm: 2.5 },
  'Hòa An': { lat: 16.0394, lng: 108.1754, district: 'Cẩm Lệ', radiusKm: 2.1 },
  'Hòa Phát': { lat: 16.0305, lng: 108.1884, district: 'Cẩm Lệ', radiusKm: 1.9 },
  'Hòa Xuân': { lat: 15.9881, lng: 108.2124, district: 'Cẩm Lệ', radiusKm: 3.5 },

  // Huyện Hòa Vang
  'Hòa Tiến': { lat: 15.9491, lng: 108.1962, district: 'Hòa Vang', radiusKm: 4.0 },
  'Hòa Châu': { lat: 15.9812, lng: 108.2012, district: 'Hòa Vang', radiusKm: 3.2 },
  'Hòa Phước': { lat: 15.9584, lng: 108.2194, district: 'Hòa Vang', radiusKm: 3.5 },
  'Hòa Khương': { lat: 15.9381, lng: 108.1091, district: 'Hòa Vang', radiusKm: 4.5 },
  'Hòa Nhơn': { lat: 15.9892, lng: 108.1345, district: 'Hòa Vang', radiusKm: 4.2 },
  'Hòa Phong': { lat: 15.9814, lng: 108.1012, district: 'Hòa Vang', radiusKm: 4.0 },
  'Hòa Phú': { lat: 15.9612, lng: 108.0124, district: 'Hòa Vang', radiusKm: 6.0 },
  'Hòa Sơn': { lat: 16.0461, lng: 108.1184, district: 'Hòa Vang', radiusKm: 4.0 },
  'Hòa Liên': { lat: 16.0824, lng: 108.1091, district: 'Hòa Vang', radiusKm: 5.5 },
  'Hòa Ninh': { lat: 16.0684, lng: 108.0412, district: 'Hòa Vang', radiusKm: 6.0 },
  'Hòa Bắc': { lat: 16.1412, lng: 107.9612, district: 'Hòa Vang', radiusKm: 8.0 }
};

export const WARDS_BY_DISTRICT: Record<string, string[]> = {
  'Hải Châu': [
    'Hòa Cường Bắc', 'Hòa Cường Nam', 'Hải Châu I', 'Hải Châu II',
    'Thạch Thang', 'Thuận Phước', 'Hòa Thuận Tây', 'Hòa Thuận Đông',
    'Nam Dương', 'Phước Ninh', 'Bình Thuận', 'Bình Hiên'
  ],
  'Thanh Khê': [
    'Vĩnh Trung', 'Tân Chính', 'Thạc Gián', 'Chính Gián',
    'Xuân Hà', 'An Khê', 'Hòa Khê', 'Thanh Khê Tây', 'Thanh Khê Đông'
  ],
  'Sơn Trà': [
    'An Hải Bắc', 'An Hải Tây', 'An Hải Đông', 'Phước Mỹ',
    'Thọ Quang', 'Nại Hiên Đông', 'Mân Thái'
  ],
  'Ngũ Hành Sơn': [
    'Mỹ An', 'Khuê Mỹ', 'Hòa Hải', 'Hòa Quý'
  ],
  'Liên Chiểu': [
    'Hòa Minh', 'Hòa Khánh Nam', 'Hòa Khánh Bắc', 'Hòa Hiệp Nam', 'Hòa Hiệp Bắc'
  ],
  'Cẩm Lệ': [
    'Khuê Trung', 'Hòa Thọ Đông', 'Hòa Thọ Tây', 'Hòa An', 'Hòa Phát', 'Hòa Xuân'
  ],
  'Hòa Vang': [
    'Hòa Tiến', 'Hòa Châu', 'Hòa Phước', 'Hòa Khương', 'Hòa Nhơn',
    'Hòa Phong', 'Hòa Phú', 'Hòa Sơn', 'Hòa Liên', 'Hòa Ninh', 'Hòa Bắc'
  ]
};

export const DISTRICT_COORDS: Record<string, { lat: number; lng: number }> = {
  'Hải Châu': { lat: 16.0474, lng: 108.2197 },
  'Thanh Khê': { lat: 16.0614, lng: 108.1801 },
  'Sơn Trà': { lat: 16.0911, lng: 108.2616 },
  'Ngũ Hành Sơn': { lat: 16.0025, lng: 108.2492 },
  'Liên Chiểu': { lat: 16.0592, lng: 108.1384 },
  'Cẩm Lệ': { lat: 15.9988, lng: 108.1916 },
  'Hòa Vang': { lat: 15.9867, lng: 108.0671 },
  'Hoàng Sa': { lat: 16.5000, lng: 111.5000 }
};

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Radius of the Earth in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

/**
 * Resolves the Ward (Phường/Xã) and District (Quận/Huyện) from exact GPS coordinates.
 * Finds the closest ward center and checks whether it falls within boundary threshold.
 */
export const resolveWardAndAreaFromGPS = (
  lat: number,
  lng: number
): { ward: string; area: string; distanceKm: number; center: { lat: number; lng: number }; radiusKm: number } => {
  let minDistance = Infinity;
  let matchedWard = 'Hòa Cường Bắc';
  let matchedDistrict = 'Hải Châu';
  let matchedCenter = { lat: 16.0384, lng: 108.2158 };
  let matchedRadius = 1.5;

  Object.entries(DA_NANG_WARDS).forEach(([wardName, data]) => {
    const dist = calculateDistance(lat, lng, data.lat, data.lng);
    if (dist < minDistance) {
      minDistance = dist;
      matchedWard = wardName;
      matchedDistrict = data.district;
      matchedCenter = { lat: data.lat, lng: data.lng };
      matchedRadius = data.radiusKm || 2.0;
    }
  });

  return {
    ward: matchedWard,
    area: matchedDistrict,
    distanceKm: Math.round(minDistance * 100) / 100,
    center: matchedCenter,
    radiusKm: matchedRadius
  };
};
