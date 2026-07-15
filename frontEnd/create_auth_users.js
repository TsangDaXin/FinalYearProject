import { createClient } from '@supabase/supabase-js';

// Hardcoded for test script
const supabaseUrl = 'https://zmaxnatmgxhrfrpgiuzs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InptYXhuYXRtZ3hocmZycGdpdXpzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDMwNTQxMSwiZXhwIjoyMDk1ODgxNDExfQ.dILUYrmLXNwtrq3ISTjqj67BGEV74kDYgHyiKeXdH6A';
const supabase = createClient(supabaseUrl, supabaseKey);

const usersToCreate = [
    {
        email: "day1@test.com",
        password: "password123",
        name: "Day 1 User (New Patient)",
        streak: 1,
        kl: 2
    },
    {
        email: "day7@test.com",
        password: "password123",
        name: "Day 7 User (1-Week Streak)",
        streak: 7,
        kl: 3
    },
    {
        email: "week12@test.com",
        password: "password123",
        name: "Week 12 User (Fully Unlocked)",
        streak: 84,
        kl: 4
    }
];

async function main() {
    for (const u of usersToCreate) {
        let uid;
        console.log(`Processing ${u.email}...`);
        
        // Try creating the user
        const { data: createData, error: createError } = await supabase.auth.admin.createUser({
            email: u.email,
            password: u.password,
            email_confirm: true,
            user_metadata: { full_name: u.name }
        });
        
        if (createError) {
            console.log(`Failed to create ${u.email} (might exist): ${createError.message}`);
            // Let's sign in to get the UUID if they exist
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: u.email,
                password: u.password,
            });
            
            if (signInError) {
                console.error(`Failed to sign in existing user ${u.email}:`, signInError.message);
                continue;
            }
            uid = signInData.user.id;
            console.log(`Fetched existing User ID: ${uid}`);
        } else {
            uid = createData.user.id;
            console.log(`Created Auth User with ID: ${uid}`);
        }
        
        // Now update or insert the profile
        const { error: upsertError } = await supabase.from('profiles').upsert({
            id: uid,
            full_name: u.name,
            kl_grade: u.kl,
            streak_current: u.streak
        });
        
        if (upsertError) {
            console.error(`Error upserting profile for ${u.email}:`, upsertError.message);
        } else {
            console.log(`Successfully linked and updated profile for ${u.email}`);
        }
    }
    console.log("Done!");
}

main();
