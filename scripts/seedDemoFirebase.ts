import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DEMO_COMMITTEE_ID = 'DUR-2026-KOL-0001';
const DEMO_ADMIN_EMAIL = process.env.DEMO_ADMIN_EMAIL || 'demo.admin@poojo.app';
const DEMO_ADMIN_PASSWORD = process.env.DEMO_ADMIN_PASSWORD || 'Demo@123456';
const DEMO_ADMIN_PHONE = '+919876500001';

const projectId = process.env.VITE_FIREBASE_PROJECT_ID;
const apiKey = process.env.VITE_FIREBASE_API_KEY;
const databaseId = process.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;

type JsonMap = Record<string, any>;

function requireConfig() {
  const missing = [
    ['VITE_FIREBASE_PROJECT_ID', projectId],
    ['VITE_FIREBASE_API_KEY', apiKey],
    ['VITE_FIREBASE_FIRESTORE_DATABASE_ID', databaseId],
  ].filter(([, value]) => !value).map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Firebase environment variables: ${missing.join(', ')}`);
  }
}

async function firebaseAuth(path: string, body: JsonMap) {
  const res = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    const message = json?.error?.message || `${res.status} ${res.statusText}`;
    throw new Error(message);
  }
  return json;
}

async function ensureDemoAdmin() {
  try {
    console.log('Creating demo admin user if needed...');
    return await firebaseAuth('accounts:signUp', {
      email: DEMO_ADMIN_EMAIL,
      password: DEMO_ADMIN_PASSWORD,
      returnSecureToken: true,
    });
  } catch (error: any) {
    if (!String(error.message).includes('EMAIL_EXISTS')) throw error;
    console.log('Demo admin exists; signing in...');
    return firebaseAuth('accounts:signInWithPassword', {
      email: DEMO_ADMIN_EMAIL,
      password: DEMO_ADMIN_PASSWORD,
      returnSecureToken: true,
    });
  }
}

function documentUrl(path = '') {
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/${databaseId}/documents`;
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  return path ? `${base}/${encodedPath}` : base;
}

function toValue(value: any): JsonMap {
  if (value === null || value === undefined) return { nullValue: null };
  if (typeof value === 'string') return { stringValue: value };
  if (typeof value === 'boolean') return { booleanValue: value };
  if (typeof value === 'number') {
    return Number.isInteger(value) ? { integerValue: String(value) } : { doubleValue: value };
  }
  if (Array.isArray(value)) {
    return { arrayValue: { values: value.map(toValue) } };
  }
  return {
    mapValue: {
      fields: Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, toValue(nested)])),
    },
  };
}

function toDocument(fields: JsonMap) {
  return {
    fields: Object.fromEntries(
      Object.entries(fields)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, toValue(value)])
    ),
  };
}

async function firestoreFetch(idToken: string, path: string, init: RequestInit = {}) {
  const res = await fetch(documentUrl(path), {
    ...init,
    headers: {
      authorization: `Bearer ${idToken}`,
      'content-type': 'application/json',
      ...(init.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${init.method || 'GET'} ${path}: ${json?.error?.message || res.statusText}`);
  }
  return json;
}

async function setDocRest(idToken: string, path: string, fields: JsonMap) {
  await firestoreFetch(idToken, path, {
    method: 'PATCH',
    body: JSON.stringify(toDocument(fields)),
  });
}

async function deleteDocRest(idToken: string, path: string) {
  const res = await fetch(documentUrl(path), {
    method: 'DELETE',
    headers: { authorization: `Bearer ${idToken}` },
  });
  if (!res.ok && res.status !== 404) {
    const json = await res.json().catch(() => ({}));
    throw new Error(`DELETE ${path}: ${json?.error?.message || res.statusText}`);
  }
}

async function runSubcollectionQuery(idToken: string, name: string) {
  const res = await fetch(`${documentUrl(`committees/${DEMO_COMMITTEE_ID}`)}:runQuery`, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${idToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId: name }],
      },
    }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`QUERY ${name}: ${json?.error?.message || res.statusText}`);
  }
  return json as Array<{ document?: { name: string; fields?: JsonMap } }>;
}

async function cleanupMalformedPhoneDocs(idToken: string) {
  const entries = await runSubcollectionQuery(idToken, 'members');
  const malformed = entries
    .map(entry => entry.document?.name)
    .filter((name): name is string => Boolean(name))
    .map(name => name.split('/documents/')[1])
    .filter(path => path.split('/').at(-1)?.startsWith(' '));

  for (const path of malformed) {
    await deleteDocRest(idToken, path);
  }

  if (malformed.length > 0) {
    console.log(`Removed malformed demo member docs: ${malformed.length}`);
  }
}

async function seed() {
  requireConfig();
  console.log(`Using free-tier Firestore database: ${databaseId}`);

  const auth = await ensureDemoAdmin();
  const idToken = auth.idToken as string;
  const adminUid = auth.localId as string;
  const now = new Date().toISOString();
  const year = 2026;
  const editionId = 'durga-2026';
  const committeePath = `committees/${DEMO_COMMITTEE_ID}`;

  console.log('Writing committee profile...');
  await setDocRest(idToken, committeePath, {
    committeeId: DEMO_COMMITTEE_ID,
    name: 'Lakeview Sarbojanin Durga Puja Committee',
    pujaType: 'Durga',
    city: 'Kolkata',
    state: 'West Bengal',
    pincode: '700029',
    pandalAddress: 'Lake Gardens, Kolkata, West Bengal',
    pandalLatLng: { lat: 22.5059, lng: 88.3498 },
    foundedYear: 1986,
    adminUID: adminUid,
    adminEmail: DEMO_ADMIN_EMAIL,
    adminPhone: DEMO_ADMIN_PHONE,
    createdAt: now,
    isActive: true,
    customPujaTypes: [],
    currentEditionId: editionId,
    currentYear: year,
  });

  await cleanupMalformedPhoneDocs(idToken);

  console.log('Writing members...');
  const members = [
    [DEMO_ADMIN_PHONE, 'Anirban Chatterjee', 'ADMIN', 'Chairperson'],
    ['+919876500002', 'Madhumita Sen', 'SECRETARY', 'Secretary'],
    ['+919876500003', 'Rohit Basu', 'CASHIER', 'Cashier'],
    ['+919876500004', 'Priyanka Dutta', 'DONATION_INCHARGE', 'Sponsorship Lead'],
    ['+919876500005', 'Arindam Ghosh', 'CHANDA_INCHARGE', 'Collection Lead'],
    ['+919876500006', 'Sohini Roy', 'CULTURAL_INCHARGE', 'Cultural Lead'],
    ['+919876500007', 'Debjit Nandi', 'LIGHT_INCHARGE', 'Lighting Lead'],
    ['+919876500008', 'Sagnik Mukherjee', 'MANDAP_INCHARGE', 'Ritual Lead'],
  ];

  for (const [phone, name, role, address] of members) {
    await setDocRest(idToken, `${committeePath}/members/${phone}`, {
      memberId: phone,
      name,
      phone,
      role,
      address,
      addedAt: now,
      addedBy: adminUid,
      isActive: true,
      ...(phone === DEMO_ADMIN_PHONE ? { firebaseUID: adminUid } : {}),
    });
  }

  await setDocRest(idToken, `${committeePath}/editions/${editionId}`, {
    id: editionId,
    year,
    pujaType: 'Durga',
    editionName: '40th Year Community Celebration',
    startDate: '2026-10-17',
    endDate: '2026-10-24',
    isActive: true,
    createdAt: now,
    createdBy: DEMO_ADMIN_PHONE,
    committeeDesignation: 'Lakeview Sarbojanin Durga Puja Committee',
    budget: 850000,
    theme: 'River, Roots and Renewal',
  });

  console.log('Writing ledgers and schedules...');
  const writes: Array<[string, JsonMap]> = [
    [`${committeePath}/donations/DON-001`, donation('Eastern Hardware Stores', '+913340001111', 75000, 'Sponsor', 1)],
    [`${committeePath}/donations/DON-002`, donation('Sen Family Foundation', '+919830001122', 50000, 'UPI', 2)],
    [`${committeePath}/donations/DON-003`, donation('Lakeview Medical Hall', '+913340009999', 25000, 'Cheque', 3)],
    [`${committeePath}/chandaEntries/CHANDA-001`, chanda('Amitava Lahiri', '+919831111111', 'Block A, Lake Gardens', 5000, 'Approved', 1)],
    [`${committeePath}/chandaEntries/CHANDA-002`, chanda('Nandini Bose', '+919832222222', 'Block B, Lake Gardens', 3500, 'Approved', 2)],
    [`${committeePath}/chandaEntries/CHANDA-003`, chanda('Subhojit Pal', '+919833333333', 'Prince Anwar Shah Road', 2000, 'Pending', 3)],
    [`${committeePath}/expenses/EXP-001`, expense('Lighting', 64000, 'LED facade advance', 'Prakash Electricals', 'LIGHT_INCHARGE', 5)],
    [`${committeePath}/expenses/EXP-002`, expense('Pandal', 120000, 'Main pandal bamboo structure', 'Bengal Decorators', 'ADMIN', 6)],
    [`${committeePath}/expenses/EXP-003`, expense('Cultural', 30000, 'Opening night sound setup', 'Sur Taal Audio', 'CULTURAL_INCHARGE', 7)],
    [`${committeePath}/inventory/INV-001`, inventory('Lighting', 'Warm LED String Lights', 'sets', 'Prakash Electricals', 80, 25, 450)],
    [`${committeePath}/inventory/INV-002`, inventory('Pandal', 'Fire Retardant Cloth Panels', 'pcs', 'Bengal Decorators', 120, 90, 220)],
    [`${committeePath}/inventory/INV-003`, inventory('Mandap', 'Brass Puja Thali', 'pcs', 'Kumartuli Ritual Supply', 25, 8, 380)],
    [`${committeePath}/culturalEvents/CULT-001`, {
      eventName: 'Agomoni Cultural Evening',
      date: '2026-10-17',
      startTime: '18:30',
      endTime: '21:30',
      participants: ['Lakeview Children Choir', 'Sohini Roy', 'Anindya Sen'],
      performerDetails: 'Rabindra Sangeet, recitation and community dance',
      broadcastSent: false,
      year,
      editionId,
      enteredBy: '+919876500006',
    }],
    [`${committeePath}/mandapSchedule/MANDAP-001`, {
      day: 6,
      date: '2026-10-19',
      tithi: 'Maha Sasthi',
      pujaName: 'Bodhon and Amantran',
      startTime: '07:30',
      endTime: '10:00',
      mandapDetails: 'Bel leaves, dhaak, flowers and traditional lamp arrangement',
      expenses: 12000,
      year,
      editionId,
      enteredBy: '+919876500008',
    }],
    [`${committeePath}/broadcasts/BCAST-001`, {
      message: 'Welcome to the 40th year celebration. Maha Sasthi Bodhon starts at 7:30 AM.',
      sentBy: DEMO_ADMIN_PHONE,
      sentByRole: 'ADMIN',
      targetRoles: 'all',
      sentAt: now,
      type: 'General',
    }],
    [`${committeePath}/yearlyBudget/2026-lighting`, {
      year,
      category: 'Lighting',
      allocatedAmount: 120000,
      spentAmount: 64000,
      remainingAmount: 56000,
      editionId,
      createdAt: now,
      createdBy: DEMO_ADMIN_PHONE,
      notes: 'Lighting budget for pandal facade and approach lane',
    }],
  ];

  for (const [path, fields] of writes) {
    await setDocRest(idToken, path, fields);
  }

  console.log(`Seeded demo committee ${DEMO_COMMITTEE_ID}`);
  console.log(`Admin login: ${DEMO_ADMIN_EMAIL}`);
  console.log(`Admin password: ${DEMO_ADMIN_PASSWORD}`);

  function donation(donorName: string, donorPhone: string, amount: number, donationType: string, index: number) {
    return {
      donorName,
      donorPhone,
      amount,
      donationType,
      date: `2026-08-${9 + index}T10:30:00.000Z`,
      year,
      editionId,
      enteredBy: DEMO_ADMIN_PHONE,
      receiptNumber: `${DEMO_COMMITTEE_ID}/DON/2026/${String(index).padStart(4, '0')}`,
      receiptSent: false,
    };
  }

  function chanda(donorName: string, donorPhone: string, donorAddress: string, amount: number, status: string, index: number) {
    return {
      donorName,
      donorPhone,
      donorAddress,
      amount,
      collectedBy: '+919876500005',
      date: `2026-08-${14 + index}T16:00:00.000Z`,
      year,
      editionId,
      status,
      receiptNumber: `${DEMO_COMMITTEE_ID}/CHANDA/2026/${String(index).padStart(4, '0')}`,
      notes: status === 'Pending' ? 'Awaiting treasurer approval' : 'Community subscription',
      ...(status === 'Approved' ? { approvedBy: DEMO_ADMIN_PHONE, approvedAt: now } : {}),
    };
  }

  function expense(category: string, amount: number, reason: string, vendorName: string, enteredByRole: string, day: number) {
    return {
      category,
      amount,
      reason,
      vendorName,
      date: `2026-09-${String(day).padStart(2, '0')}T09:00:00.000Z`,
      year,
      editionId,
      enteredBy: DEMO_ADMIN_PHONE,
      enteredByRole,
    };
  }

  function inventory(module: string, itemName: string, unit: string, vendorName: string, quantityPurchased: number, quantityUsed: number, pricePerUnit: number) {
    return {
      module,
      itemName,
      unit,
      vendorName,
      quantityPurchased,
      quantityUsed,
      pricePerUnit,
      year,
      editionId,
      enteredBy: DEMO_ADMIN_PHONE,
    };
  }
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
