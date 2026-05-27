UPDATE committees
SET
  name = 'Lakeview Sarbojanin Durga Pooja Samiti',
  admin_email = 'demo.admin@poojasamiti.online'
WHERE id = 'DUR-2026-KOL-0001';

UPDATE admin_users
SET
  id = 'admin-demo-admin-poojasamiti-online',
  email = 'demo.admin@poojasamiti.online'
WHERE committee_id = 'DUR-2026-KOL-0001'
  AND email IN ('demo.admin@samitibook.app', 'demo.admin@pooja-samiti.app', 'demo.admin@poojasamiti.online');

UPDATE collection_records
SET data_json = replace(data_json, 'Lakeview Sarbojanin Durga Puja Committee', 'Lakeview Sarbojanin Durga Pooja Samiti')
WHERE committee_id = 'DUR-2026-KOL-0001';
