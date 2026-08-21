const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createDummy() {
  const { data, error } = await supabase.auth.signUp({
    email: 'testuser@careerroadmap.com',
    password: 'TestPass123!',
    options: {
      data: {
        full_name: 'Dummy Tester',
      }
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
        console.log("Dummy account already exists! You can log in.");
    } else {
        console.error("Error creating dummy account:", error.message);
    }
  } else {
    console.log("Dummy account successfully created!");
    console.log("Email: testuser@careerroadmap.com");
    console.log("Password: TestPass123!");
  }
}

createDummy();
