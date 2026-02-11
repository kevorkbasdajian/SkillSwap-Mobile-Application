/*
The purpose of this file is to create a Supabase Client by using the url and the 
key, in order to be able to communicate with the Database.
*/

const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error("Missing Supabase environment variable");
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;
