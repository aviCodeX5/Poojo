INSERT INTO committees (
  id, name, puja_type, city, state, pincode, pandal_address, pandal_lat, pandal_lng,
  founded_year, admin_email, admin_phone, current_edition_id, current_year, is_active, created_at
) VALUES (
  'DUR-2026-KOL-0001',
  'Lakeview Sarbojanin Durga Puja Committee',
  'Durga',
  'Kolkata',
  'West Bengal',
  '700029',
  'Lake Gardens, Kolkata, West Bengal',
  22.5059,
  88.3498,
  1986,
  'demo.admin@samitibook.app',
  '+919876500001',
  'durga-2026',
  2026,
  1,
  '2026-05-26T00:00:00.000Z'
)
ON CONFLICT(id) DO UPDATE SET
  name = excluded.name,
  puja_type = excluded.puja_type,
  city = excluded.city,
  state = excluded.state,
  pincode = excluded.pincode,
  pandal_address = excluded.pandal_address,
  pandal_lat = excluded.pandal_lat,
  pandal_lng = excluded.pandal_lng,
  founded_year = excluded.founded_year,
  admin_email = excluded.admin_email,
  admin_phone = excluded.admin_phone,
  current_edition_id = excluded.current_edition_id,
  current_year = excluded.current_year,
  is_active = excluded.is_active;

INSERT INTO members (
  committee_id, member_id, name, phone, role, address, login_code, added_at, added_by, is_active
) VALUES
  ('DUR-2026-KOL-0001', '+919876500001', 'Anirban Chatterjee', '+919876500001', 'ADMIN', 'Chairperson', 'ADM2026', '2026-05-26T00:00:00.000Z', '+919876500001', 1),
  ('DUR-2026-KOL-0001', '+919876500002', 'Madhumita Sen', '+919876500002', 'SECRETARY', 'Secretary', 'SEC2026', '2026-05-26T00:00:00.000Z', '+919876500001', 1),
  ('DUR-2026-KOL-0001', '+919876500003', 'Rohit Basu', '+919876500003', 'CASHIER', 'Cashier', 'CSH2026', '2026-05-26T00:00:00.000Z', '+919876500001', 1),
  ('DUR-2026-KOL-0001', '+919876500004', 'Priyanka Dutta', '+919876500004', 'DONATION_INCHARGE', 'Sponsorship Lead', 'DON2026', '2026-05-26T00:00:00.000Z', '+919876500001', 1),
  ('DUR-2026-KOL-0001', '+919876500005', 'Arindam Ghosh', '+919876500005', 'CHANDA_INCHARGE', 'Collection Lead', 'CHD2026', '2026-05-26T00:00:00.000Z', '+919876500001', 1),
  ('DUR-2026-KOL-0001', '+919876500006', 'Sohini Roy', '+919876500006', 'CULTURAL_INCHARGE', 'Cultural Lead', 'CUL2026', '2026-05-26T00:00:00.000Z', '+919876500001', 1),
  ('DUR-2026-KOL-0001', '+919876500007', 'Debjit Nandi', '+919876500007', 'LIGHT_INCHARGE', 'Lighting Lead', 'LGT2026', '2026-05-26T00:00:00.000Z', '+919876500001', 1),
  ('DUR-2026-KOL-0001', '+919876500008', 'Sagnik Mukherjee', '+919876500008', 'MANDAP_INCHARGE', 'Ritual Lead', 'MND2026', '2026-05-26T00:00:00.000Z', '+919876500001', 1)
ON CONFLICT(committee_id, member_id) DO UPDATE SET
  name = excluded.name,
  phone = excluded.phone,
  role = excluded.role,
  address = excluded.address,
  login_code = excluded.login_code,
  is_active = excluded.is_active;

INSERT INTO collection_records (committee_id, collection_name, record_id, data_json, created_at, updated_at) VALUES
  ('DUR-2026-KOL-0001', 'editions', 'durga-2026', '{"id":"durga-2026","year":2026,"pujaType":"Durga","editionName":"40th Year Community Celebration","startDate":"2026-10-17","endDate":"2026-10-24","isActive":true,"createdAt":"2026-05-26T00:00:00.000Z","createdBy":"+919876500001","committeeDesignation":"Lakeview Sarbojanin Durga Puja Committee","budget":850000,"theme":"River, Roots and Renewal"}', '2026-05-26T00:00:00.000Z', '2026-05-26T00:00:00.000Z'),
  ('DUR-2026-KOL-0001', 'donations', 'DON-001', '{"donorName":"Eastern Hardware Stores","donorPhone":"+913340001111","amount":75000,"donationType":"Sponsor","date":"2026-08-10T10:30:00.000Z","year":2026,"editionId":"durga-2026","enteredBy":"+919876500001","receiptNumber":"DUR-2026-KOL-0001/DON/2026/0001","receiptSent":false}', '2026-05-26T00:00:00.000Z', '2026-05-26T00:00:00.000Z'),
  ('DUR-2026-KOL-0001', 'donations', 'DON-002', '{"donorName":"Sen Family Foundation","donorPhone":"+919830001122","amount":50000,"donationType":"UPI","date":"2026-08-11T10:30:00.000Z","year":2026,"editionId":"durga-2026","enteredBy":"+919876500001","receiptNumber":"DUR-2026-KOL-0001/DON/2026/0002","receiptSent":false}', '2026-05-26T00:00:00.000Z', '2026-05-26T00:00:00.000Z'),
  ('DUR-2026-KOL-0001', 'chandaEntries', 'CHANDA-001', '{"donorName":"Amitava Lahiri","donorPhone":"+919831111111","donorAddress":"Block A, Lake Gardens","amount":5000,"collectedBy":"+919876500005","date":"2026-08-15T16:00:00.000Z","year":2026,"editionId":"durga-2026","status":"Approved","receiptNumber":"DUR-2026-KOL-0001/CHANDA/2026/0001","notes":"Community subscription","approvedBy":"+919876500001","approvedAt":"2026-05-26T00:00:00.000Z"}', '2026-05-26T00:00:00.000Z', '2026-05-26T00:00:00.000Z'),
  ('DUR-2026-KOL-0001', 'chandaEntries', 'CHANDA-003', '{"donorName":"Subhojit Pal","donorPhone":"+919833333333","donorAddress":"Prince Anwar Shah Road","amount":2000,"collectedBy":"+919876500005","date":"2026-08-17T16:00:00.000Z","year":2026,"editionId":"durga-2026","status":"Pending","receiptNumber":"DUR-2026-KOL-0001/CHANDA/2026/0003","notes":"Awaiting treasurer approval"}', '2026-05-26T00:00:00.000Z', '2026-05-26T00:00:00.000Z'),
  ('DUR-2026-KOL-0001', 'expenses', 'EXP-001', '{"category":"Lighting","amount":64000,"reason":"LED facade advance","vendorName":"Prakash Electricals","date":"2026-09-05T09:00:00.000Z","year":2026,"editionId":"durga-2026","enteredBy":"+919876500001","enteredByRole":"LIGHT_INCHARGE"}', '2026-05-26T00:00:00.000Z', '2026-05-26T00:00:00.000Z'),
  ('DUR-2026-KOL-0001', 'expenses', 'EXP-002', '{"category":"Pandal","amount":120000,"reason":"Main pandal bamboo structure","vendorName":"Bengal Decorators","date":"2026-09-06T09:00:00.000Z","year":2026,"editionId":"durga-2026","enteredBy":"+919876500001","enteredByRole":"ADMIN"}', '2026-05-26T00:00:00.000Z', '2026-05-26T00:00:00.000Z'),
  ('DUR-2026-KOL-0001', 'yearlyBudget', '2026-lighting', '{"year":2026,"category":"Lighting","allocatedAmount":120000,"spentAmount":64000,"remainingAmount":56000,"editionId":"durga-2026","createdAt":"2026-05-26T00:00:00.000Z","createdBy":"+919876500001","notes":"Lighting budget for pandal facade and approach lane"}', '2026-05-26T00:00:00.000Z', '2026-05-26T00:00:00.000Z')
ON CONFLICT(committee_id, collection_name, record_id) DO UPDATE SET
  data_json = excluded.data_json,
  updated_at = excluded.updated_at;
