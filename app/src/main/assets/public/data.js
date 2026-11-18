/* Seed data untuk prototipe dashboard OrangeSky (disimpan di localStorage) */
(function (global) {
  'use strict';

  const pad = (n) => String(n).padStart(2, '0');
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const dayOffset = (n) => { const d = new Date(); d.setDate(d.getDate() + n); return iso(d); };
  const pick = (arr, i) => arr[i % arr.length];

  const PROPERTY_NAMES = [
    'Lifstay by Orange Sky Indonesia',
    'OS Hotel Airport Batam',
    'OS Hotel Batu Aji Batam',
    'OS Hotel Tanjung Uncang Batam',
    'OS Style Hotel Batam Centre',
    'OS Style Hotel Batu Aji',
    'REOTEL at CITRAPLAZA - NAGOYA',
    'REOTEL at THE NOVE - NUVASA BAY',
    'Sky View Hotel by Orange Sky',
    'OrangeSky Residence Nagoya'
  ];
  const CITIES = ['Batam', 'Batam', 'Batam', 'Batam', 'Batam', 'Batam', 'Batam', 'Batam', 'Batam', 'Batam'];
  const FACILITY_GROUPS = {
    'General': ['Swimming Pool', 'Restaurant', 'Meeting Room', 'Gym'],
    'Public Facilities': ['Lobby', 'Parking Area', 'Elevator', 'Cafe'],
    'In-room Facilities': ['Air Conditioner', 'TV', 'Mini Bar', 'Safety Box'],
    'Connectivity': ['Free Wifi', 'LAN Cable', 'USB Port'],
    'Amenities & Toiletries': ['Shampoo Gel', 'Shower Gel', 'Tissue', 'Towel', 'Water Heater']
  };
  const ROOM_TYPES = [
    { name: 'Standard Room', space: 22, price: 480000, upgrade: 'Deluxe Room' },
    { name: 'Deluxe Room', space: 28, price: 650000, upgrade: 'Family Room' },
    { name: 'Family Room', space: 38, price: 1100000, upgrade: 'Suite Room' },
    { name: 'Suite Room', space: 52, price: 1650000, upgrade: '-' }
  ];
  const ROOM_NAMES = ['Room 101', 'Room 102', 'Room 201', 'Room 202', 'Room 301', 'Room 302'];
  const MERCHANT_NAMES = [
    'Ekles clinic', 'SIR GENTS SALON TEMBESI', 'VIO VIO BEACH', 'HANIKA MOM & BABY',
    'GARAGE RENT BATAM', 'WARUNG ANAK LANANG', 'First Spa', 'LAPISA',
    'YUSI FADILA SALON', 'i Smile', 'PADANG GOLF SUKAJADI', 'SHOESCARE',
    'Nous Coffee & Bites', 'LOCAL CAFE', 'Segara Seafood'
  ];
  const MERCHANT_TYPES = ['Accessories','Attraction','Beautycare','Expedition','Favourite','Food & Beverage','Goodies','Playground','Recreation','Retail','Salon','Transportation','Treatments','Wellnes Spa'];
  const MEMBER_NAMES = [
    'AAN KURNIAWAN','RAGAN DETA IBRAHIM','GERALD PAKPAHAN','RANTI OLIVIA','BENI',
    'JOHANNES HOTLAN HARSONO','SITI AMINAH','BUDI SANTOSO','DEWI ANGELIA','FARHAN MAULANA',
    'MAYA SARI','ANDI PRASETYO','LINA MARLINA','REZA RAMADHAN','NUR ULFA',
    'DONI SETIAWAN','SARI DEWI','RIZKY ANANDA','YUSUF MANSYUR','ANISA FITRI',
    'TAUFIK HIDAYAT','MEGA WATI','HENDRA GUNAWAN','PUTRI AMELIA'
  ];
  const GUEST_EMAILS = ['gmail.com','yahoo.com','outlook.com','hotmail.com'];
  const NATIONS = ['INDONESIA','MALAYSIA','SINGAPORE','UNITED STATES'];

  function seed() {
    const users = [
      { id: 'u1', name: 'REDACTED', uname: 'REDACTED', email: 'hm1.osab@gmail.com', pass: 'REDACTED', type: 'Admin', photo: '', status: 'Active' },
      { id: 'u2', name: 'Operator Batam Centre', uname: 'operator', email: 'operator@orangesky.id', pass: 'REDACTED', type: 'User', photo: '', status: 'Active' },
      { id: 'u3', name: 'Staff Reservation', uname: 'reservation', email: 'reservation@orangesky.id', pass: 'REDACTED', type: 'User', photo: '', status: 'Active' },
      { id: 'u4', name: 'Finance Admin', uname: 'finance', email: 'finance@orangesky.id', pass: 'REDACTED', type: 'Admin', photo: '', status: 'Active' },
      { id: 'u5', name: 'Marketing', uname: 'marketing', email: 'marketing@orangesky.id', pass: 'REDACTED', type: 'User', photo: '', status: 'Active' }
    ];

    const properties = PROPERTY_NAMES.map((name, i) => ({
      id: `pr${i + 1}`, name,
      telp: `0778-${String(3000000 + i * 137).slice(0, 7)}`,
      email: `info${i + 1}@orangesky.id`,
      city: CITIES[i], address: `Jl. ${pick(['Sudirman','Thamrin','Gatot Subroto','Ahmad Yani'], i)} No. ${12 + i}, ${CITIES[i]}`,
      photo: ''
    }));

    const facilities = [];
    let fCount = 0;
    Object.keys(FACILITY_GROUPS).forEach(category => {
      FACILITY_GROUPS[category].forEach(name => {
        facilities.push({ id: `f${++fCount}`, category, name });
      });
    });

    const roomTypes = [];
    const rooms = [];
    let rtCount = 0, rCount = 0;
    properties.forEach((p, pi) => {
      ROOM_TYPES.forEach((rt, ri) => {
        const rtId = `rt${++rtCount}`;
        roomTypes.push({ id: rtId, prID: p.id, name: rt.name, space: rt.space, price: rt.price + pi * 10000, upgrade: rt.upgrade, status: 'Publish' });
        const roomCount = ri === 3 ? 2 : 4;
        for (let k = 0; k < roomCount; k++) {
          rooms.push({
            id: `r${++rCount}`, tkID: rtId, name: `${rt.name.replace(' Room','')} ${101 + k + ri * 10}`,
            status: k === 3 ? 'Draft' : 'Publish',
            is_breakfast: ri > 0 ? 'Yes' : 'No', is_smoking: ri === 0 ? 'Yes' : 'No',
            is_wifi: 'Yes', is_fitness: ri >= 2 ? 'Yes' : 'No', is_parking: 'Yes',
            adult: ri >= 2 ? 3 : 2, child: ri >= 2 ? 2 : 1, bed: pick(['Single','Double','Twin','King'], ri),
            total: 1, description: `${rt.name} dengan fasilitas standar hotel`, photo: ''
          });
        }
      });
    });

    const ratePlans = [];
    const today = new Date();
    for (let i = 0; i < 42; i++) {
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() + i);
      roomTypes.slice(0, 6).forEach((rt, j) => {
        ratePlans.push({
          id: `rp${ratePlans.length + 1}`, tkID: rt.id, rID: '', date: iso(d),
          rate: rt.price + (i % 7 === 5 || i % 7 === 6 ? 75000 : 0),
          availability: 3 + ((i + j) % 5)
        });
      });
    }

    const members = MEMBER_NAMES.map((name, i) => ({
      id: `m${i + 1}`, fullname: name,
      email: `${name.toLowerCase().replace(/[^a-z]+/g, '.')}${i}@${pick(GUEST_EMAILS, i)}`,
      mobile: `0812${String(34560000 + i * 9871).slice(0, 8)}`,
      nationality: i % 9 === 0 ? NATIONS[i % NATIONS.length] : 'INDONESIA',
      memberType: i % 12 === 0 ? 'Platinum' : (i % 5 === 0 ? 'Gold' : 'Silver'),
      point: i * 35 + (i % 4) * 120,
      status: i === 17 ? 'Not Active' : 'Active',
      reference: i % 3 === 0 ? `REF-${2400 + i}` : '',
      joined: dayOffset(-(i * 9 + 12)), avatar: '',
      city: pick(['Batam','Jakarta','Surabaya','Atlanta','Batam'], i)
    }));

    const merchants = MERCHANT_NAMES.map((name, i) => ({
      id: `mc${i + 1}`, name,
      email: `merchant${i + 1}@example.com`,
      phone: `0813${String(22340000 + i * 7717).slice(0, 8)}`,
      type: pick(MERCHANT_TYPES, i),
      address: `Jl. Merchant No. ${i + 3}, Batam`,
      pass: '123456', photo: ''
    }));

    const vouchers = Array.from({ length: 12 }, (_, i) => {
      const start = dayOffset(i < 8 ? -20 + i : 5 + i);
      const end = dayOffset(i < 8 ? 10 + i : 35 + i);
      return {
        id: `v${i + 1}`, mID: merchants[i % merchants.length].id,
        title: `Promo ${pick(['Diskon Hotel','Makan Hemat','Wellness Deal','Weekend Special','New Member'], i)} ${i + 1}`,
        minimum: 250000 + i * 50000,
        discount: 5 + (i % 4) * 5,
        discountOrange: 2 + (i % 3) * 2,
        start, end,
        status: i < 8 ? 'Publish' : 'Draft',
        description: `Promo berlaku untuk transaksi minimal Rp${(250000 + i * 50000).toLocaleString('id-ID')}.`,
        photo: ''
      };
    });

    const bookings = Array.from({ length: 48 }, (_, i) => {
      const p = properties[i % properties.length];
      const rts = roomTypes.filter(x => x.prID === p.id);
      const rt = rts[i % rts.length];
      const m = members[i % members.length];
      const nights = 1 + (i % 4);
      const start = dayOffset(-60 + i * 2);
      const end = dayOffset(-60 + i * 2 + nights);
      const rate = rt.price + (i % 3) * 25000;
      const status = i < 6 ? 'Waiting' : (i > 40 ? 'Expired' : 'Completed');
      return {
        id: `BK${String(100000 + i * 137).slice(-10)}`,
        created: `${start} 1${i % 9}:${pad((i * 7) % 60)}:12`,
        mID: m.id, guest: m.fullname, email: m.email,
        prID: p.id, property: p.name, tkID: rt.id, roomType: rt.name, rID: '',
        start, end, nights, status,
        roomRate: rate, commission: Math.round(rate * 0.15), netHotel: Math.round(rate * 0.85),
        pointUsed: i % 5 === 0 ? 100 : 0,
        totalPayment: rate, feePayment: i % 4 === 0 ? 2500 : 0,
        netReceived: rate - (i % 4 === 0 ? 2500 : 0), margin: Math.round(rate * 0.15)
      };
    });

    const payments = bookings.filter((_, i) => i % 3 !== 0).map((b, i) => ({
      id: `pay${i + 1}`, bookingID: b.id, amount: b.totalPayment,
      channel: pick(['Virtual Account','Credit Card','E-Wallet'], i),
      status: i % 5 === 0 ? 'Pending' : 'Verified',
      paidAt: i % 5 === 0 ? '' : `${b.start} 09:${pad(i)}:00`
    }));

    const memberLogs = Array.from({ length: 18 }, (_, i) => {
      const b = bookings[i + 4];
      return {
        id: `ml${i + 1}`, mID: members[i % members.length].id,
        bookingID: b.id, property: b.property, roomType: b.roomType,
        point: 50 + i * 10, type: i % 4 === 0 ? 'Upgrade' : 'Booking',
        status: i % 3 === 0 ? 'Pending' : 'Processed', created: b.created
      };
    });

    const gallery = roomTypes.slice(0, 5).flatMap((rt, i) => [
      { id: `g${i * 2 + 1}`, tkID: rt.id, url: '', caption: `${rt.name} — tampak depan` },
      { id: `g${i * 2 + 2}`, tkID: rt.id, url: '', caption: `${rt.name} — interior` }
    ]);

    return {
      users, properties, facilities, roomTypes, rooms, ratePlans,
      members, memberLogs, merchants, vouchers, bookings, payments, gallery,
      userProperties: users.map((u, i) => ({ id: `up${i + 1}`, uID: u.id, propertyID: properties[i % properties.length].id })),
      pageViews: [
        { page: '/js/lib/waypoints/login/merchant/lib/wow/uploads/v', total: 2 },
        { page: '/js/lib/waypoints/lib/wow/uploads/property/lib/cou', total: 2 },
        { page: '/js/lib/waypoints/login/merchant/lib/tempusdominus', total: 1 },
        { page: '/js/lib/waypoints/login/merchant/lib/wow/uploads/v', total: 1 },
        { page: '/uploads/voucher', total: 1 }
      ],
      cities: [
        { city: 'Atlanta', country: 'United States', total: 310 },
        { city: '', country: '', total: 147 },
        { city: 'Batam', country: 'Indonesia', total: 84 },
        { city: 'Jakarta', country: 'Indonesia', total: 52 },
        { city: 'Singapore', country: 'Singapore', total: 21 }
      ],
      visitor: { total: 461, unique: 2, todayTotal: 0, todayUnique: 0 },
      otpHint: '482913'
    };
  }

  global.ORANGE_SEED = seed;
})(window);
