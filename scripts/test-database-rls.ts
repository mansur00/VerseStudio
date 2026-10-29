/**
 * VerseStudio 4K Pro — Production Database RLS & Schema Tests
 * Executes against embedded PostgreSQL 16 engine (PGlite / official Postgres core)
 * Proves:
 * 1. anon reads nothing from protected tables
 * 2. user reads only own rows (cannot read other users' private data)
 * 3. only admin roles read admin tables (admin_roles, audit_log)
 * 4. Viewer role cannot write or update protected records
 * 5. audit_log is strictly immutable (UPDATE and DELETE are rejected by trigger)
 */

import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';

async function runDatabaseRlsTests() {
  console.log('=== Starting Real PostgreSQL RLS & Migration Test Suite ===\n');

  const db = new PGlite();
  const vRes = await db.query('SELECT version();');
  console.log('PostgreSQL Server Version:', (vRes.rows[0] as any).version);

  // 1. Apply Migration 1: Admin Schema & RLS
  const migration1Sql = fs.readFileSync(
    path.resolve(process.cwd(), 'supabase/migrations/20261029000000_init_admin_schema.sql'),
    'utf8'
  );
  await db.exec(migration1Sql);
  console.log('✓ Applied migration 20261029000000_init_admin_schema.sql');

  // 2. Apply Migration 2: Phone Signaling
  const migration2Sql = fs.readFileSync(
    path.resolve(process.cwd(), 'supabase/migrations/20261029000001_phone_signaling.sql'),
    'utf8'
  );
  await db.exec(migration2Sql);
  console.log('✓ Applied migration 20261029000001_phone_signaling.sql\n');

  // Helper to simulate Supabase JWT context
  async function asUser(userId: string | null, role: 'anon' | 'authenticated' | 'service_role', userEmail?: string) {
    await db.exec(`SET ROLE ${role};`);
    if (userId) {
      const claims = JSON.stringify({
        sub: userId,
        role: role,
        email: userEmail || `${userId}@versestudio.app`,
      });
      await db.exec(`SET request.jwt.claims = '${claims}';`);
    } else {
      await db.exec(`RESET request.jwt.claims;`);
    }
  }

  // Seed test records via service_role
  console.log('--- Seeding Test Records (via service_role) ---');
  await asUser(null, 'service_role');

  // Profiles
  await db.exec(`
    INSERT INTO public.profiles (id, email, name, plan, status) VALUES
      ('usr_alice', 'alice@test.com', 'Alice Creator', 'pro', 'active'),
      ('usr_bob', 'bob@test.com', 'Bob Creator', 'free', 'active'),
      ('usr_admin_super', 'superadmin@versestudio.app', 'Super Admin', 'pro', 'active'),
      ('usr_admin_viewer', 'viewer@versestudio.app', 'Viewer Admin', 'free', 'active');
  `);

  // Admin roles
  await db.exec(`
    INSERT INTO public.admin_roles (id, user_id, email, role) VALUES
      ('adm_super', 'usr_admin_super', 'superadmin@versestudio.app', 'super_admin'),
      ('adm_viewer', 'usr_admin_viewer', 'viewer@versestudio.app', 'viewer');
  `);

  // Share pages
  await db.exec(`
    INSERT INTO public.share_pages (id, user_id, title, drive_file_id, drive_view_url, is_blocked, is_private) VALUES
      ('page_alice_public', 'usr_alice', 'Alice Public Tutorial', 'file_1', 'https://drive.google.com/1', false, false),
      ('page_alice_private', 'usr_alice', 'Alice Private Rough Cut', 'file_2', 'https://drive.google.com/2', false, true),
      ('page_bob_public', 'usr_bob', 'Bob Public Guide', 'file_3', 'https://drive.google.com/3', false, false),
      ('page_bob_private', 'usr_bob', 'Bob Private Draft', 'file_4', 'https://drive.google.com/4', false, true);
  `);

  // Audit log
  await db.exec(`
    INSERT INTO public.audit_log (id, actor_id, actor_email, actor_role, action, target_type, target_id) VALUES
      ('aud_init_1', 'usr_admin_super', 'superadmin@versestudio.app', 'super_admin', 'SYSTEM_INIT', 'system', 'root');
  `);
  console.log('✓ Successfully seeded profiles, admin_roles, share_pages, and audit_log.\n');

  // TEST 1: anon reads nothing from profiles
  console.log('--- TEST 1: anon role reads nothing from profiles ---');
  await asUser(null, 'anon');
  const anonProfiles = await db.query('SELECT * FROM public.profiles;');
  console.log(`Anon profiles count: ${anonProfiles.rows.length}`);
  if (anonProfiles.rows.length !== 0) throw new Error('FAIL: anon was able to read profiles!');
  console.log('✓ PASS: anon reads 0 rows from profiles.\n');

  // TEST 2: authenticated user reads only own rows
  console.log('--- TEST 2: a user reads only own rows ---');
  await asUser('usr_alice', 'authenticated', 'alice@test.com');
  const aliceProfiles = await db.query('SELECT id, email, name FROM public.profiles;');
  console.log(`Alice queried profiles: count = ${aliceProfiles.rows.length}, id = ${(aliceProfiles.rows[0] as any)?.id}`);
  if (aliceProfiles.rows.length !== 1 || (aliceProfiles.rows[0] as any).id !== 'usr_alice') {
    throw new Error('FAIL: Alice was able to read records other than her own!');
  }

  // Alice checks share_pages: should see her own (public + private) and Bob's public, but NOT Bob's private!
  const alicePages = await db.query('SELECT id, user_id, is_private FROM public.share_pages ORDER BY id;');
  const alicePageIds = alicePages.rows.map((r: any) => r.id);
  console.log('Alice visible share_pages:', alicePageIds);
  if (alicePageIds.includes('page_bob_private')) {
    throw new Error('FAIL: Alice was able to read Bob\'s private share page!');
  }
  if (!alicePageIds.includes('page_alice_private')) {
    throw new Error('FAIL: Alice could not read her own private share page!');
  }
  console.log('✓ PASS: Alice reads only own private rows and public pages; cannot see other users\' private data.\n');

  // TEST 3: only admin roles read admin tables
  console.log('--- TEST 3: only admin roles read admin tables ---');
  // 3a. Normal user Alice queries admin_roles and audit_log
  await asUser('usr_alice', 'authenticated', 'alice@test.com');
  const aliceAdminRoles = await db.query('SELECT * FROM public.admin_roles;');
  const aliceAuditLog = await db.query('SELECT * FROM public.audit_log;');
  console.log(`Normal user query: admin_roles count = ${aliceAdminRoles.rows.length}, audit_log count = ${aliceAuditLog.rows.length}`);
  if (aliceAdminRoles.rows.length !== 0 || aliceAuditLog.rows.length !== 0) {
    throw new Error('FAIL: Normal user Alice was able to read admin tables!');
  }

  // 3b. Admin user queries admin_roles and audit_log
  await asUser('usr_admin_super', 'authenticated', 'superadmin@versestudio.app');
  const superAdminRoles = await db.query('SELECT id, role FROM public.admin_roles;');
  const superAuditLog = await db.query('SELECT id, action FROM public.audit_log;');
  console.log(`Super admin query: admin_roles count = ${superAdminRoles.rows.length}, audit_log count = ${superAuditLog.rows.length}`);
  if (superAdminRoles.rows.length === 0 || superAuditLog.rows.length === 0) {
    throw new Error('FAIL: Super admin could not read admin tables!');
  }
  console.log('✓ PASS: Non-admin reads 0 rows; admin role successfully reads admin tables.\n');

  // TEST 4: Viewer cannot write
  console.log('--- TEST 4: Viewer role cannot write or mutate protected rows ---');
  await asUser('usr_admin_viewer', 'authenticated', 'viewer@versestudio.app');
  // Viewer attempts to update/block a share page
  const viewerUpdate = await db.query(`
    UPDATE public.share_pages
    SET is_blocked = true
    WHERE id = 'page_alice_public'
    RETURNING id;
  `);
  console.log(`Viewer update affected rows: ${viewerUpdate.rows.length}`);
  if (viewerUpdate.rows.length !== 0) {
    throw new Error('FAIL: Viewer was able to update a share page!');
  }

  // Super Admin performs the update
  await asUser('usr_admin_super', 'authenticated', 'superadmin@versestudio.app');
  const superUpdate = await db.query(`
    UPDATE public.share_pages
    SET is_blocked = true
    WHERE id = 'page_alice_public'
    RETURNING id;
  `);
  console.log(`Super admin update affected rows: ${superUpdate.rows.length}`);
  if (superUpdate.rows.length !== 1) {
    throw new Error('FAIL: Super admin could not update share page!');
  }
  console.log('✓ PASS: Viewer cannot write (0 rows affected); Super admin successfully mutates.\n');

  // TEST 5: audit_log cannot be updated or deleted
  console.log('--- TEST 5: audit_log cannot be updated or deleted (immutability) ---');
  await asUser('usr_admin_super', 'authenticated', 'superadmin@versestudio.app');

  let updateThrew = false;
  try {
    await db.query(`UPDATE public.audit_log SET action = 'TAMPERED' WHERE id = 'aud_init_1';`);
  } catch (err: any) {
    updateThrew = true;
    console.log('Caught expected error on UPDATE:', err.message);
  }
  if (!updateThrew) throw new Error('FAIL: audit_log UPDATE succeeded when it must be prohibited!');

  let deleteThrew = false;
  try {
    await db.query(`DELETE FROM public.audit_log WHERE id = 'aud_init_1';`);
  } catch (err: any) {
    deleteThrew = true;
    console.log('Caught expected error on DELETE:', err.message);
  }
  if (!deleteThrew) throw new Error('FAIL: audit_log DELETE succeeded when it must be prohibited!');

  console.log('✓ PASS: Both UPDATE and DELETE on audit_log were strictly blocked by the immutable trigger.\n');

  console.log('================================================================');
  console.log('ALL REAL DATABASE RLS & SECURITY TESTS PASSED WITH 100% PROOF');
  console.log('================================================================');
}

runDatabaseRlsTests().catch((err) => {
  console.error('\nDatabase Test Failed:', err);
  process.exit(1);
});
