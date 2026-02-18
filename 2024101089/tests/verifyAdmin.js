const assert = require('assert');

const API_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@felicity.iiit.ac.in';
const ADMIN_PASSWORD = 'thisisadmin'; // From .env

async function runTest() {
    console.log('--- ADMIN ARCHIVE VERIFICATION ---');

    // 1. Login as Admin
    console.log('1. Logging in as Admin...');
    const adminLoginRes = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD })
    });
    const adminLoginData = await adminLoginRes.json();
    if (!adminLoginRes.ok) throw new Error('Admin Login Failed: ' + adminLoginData.message);
    const adminToken = adminLoginData.token;
    console.log('   Admin Logged In.');

    // 2. Create Test Club
    console.log('2. Creating Test Club...');
    const testClubEmail = `testarchive${Date.now()}@clubs.iiit.ac.in`;
    const newClubRes = await fetch(`${API_URL}/admin/clubs`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
            name: `Test Club Archive ${Date.now()}`,
            category: 'Other',
            email: testClubEmail,
            description: 'Test Description'
        })
    });
    const newClubData = await newClubRes.json();
    if (!newClubRes.ok) throw new Error('Create Club Failed: ' + newClubData.message);
    const clubId = newClubData._id;
    const clubPassword = newClubData.password;
    console.log(`   Test Club Created (ID: ${clubId}).`);

    // 3. Login as Test Club (Initial Success)
    console.log('3. Verifying Club Login (Before Archive)...');
    const clubLoginRes1 = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testClubEmail, password: clubPassword })
    });
    if (!clubLoginRes1.ok) throw new Error('Initial Club Login Failed');
    console.log('   Club Login Successful.');

    // 4. Archive Club
    console.log('4. Archiving Club...');
    const archiveRes = await fetch(`${API_URL}/admin/clubs/${clubId}/archive`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    });
    const archiveData = await archiveRes.json();
    if (!archiveRes.ok) throw new Error('Archive Failed: ' + archiveData.message);
    if (!archiveData.isArchived) throw new Error('Club isArchived is false after archiving');
    console.log('   Club Archived.');

    // 5. Login as Test Club (Expected Failure)
    console.log('5. Verifying Club Login (After Archive - Should Fail)...');
    const clubLoginRes2 = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testClubEmail, password: clubPassword })
    });
    if (clubLoginRes2.ok) throw new Error('Club Login Succeeded but should have failed due to archiving');
    console.log('   Club Login Failed as expected (401).');

    // 6. Unarchive Club
    console.log('6. Unarchiving Club...');
    const unarchiveRes = await fetch(`${API_URL}/admin/clubs/${clubId}/archive`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    });
    const unarchiveData = await unarchiveRes.json();
    if (!unarchiveRes.ok) throw new Error('Unarchive Failed: ' + unarchiveData.message);
    if (unarchiveData.isArchived) throw new Error('Club isArchived is true after unarchiving');
    console.log('   Club Unarchived.');

    // 7. Login as Test Club (Success Again)
    console.log('7. Verifying Club Login (After Unarchive)...');
    const clubLoginRes3 = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testClubEmail, password: clubPassword })
    });
    if (!clubLoginRes3.ok) throw new Error('Club Login Failed after unarchive');
    console.log('   Club Login Successful again.');

    // 8. Clean up (Delete Club)
    console.log('8. Deleting Test Club...');
    await fetch(`${API_URL}/admin/clubs/${clubId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${adminToken}`
        }
    });
    console.log('   Test Club Deleted.');

    console.log('✅ ALL TESTS PASSED!');
}

runTest().catch(console.error);
