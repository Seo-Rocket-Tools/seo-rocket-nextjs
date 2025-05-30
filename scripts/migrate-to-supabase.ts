import { supabase } from '../lib/supabase'

async function migrateData() {
  console.log('Migration script no longer needed!')
  console.log('The application now uses Supabase exclusively.')
  console.log('')
  console.log('To add data to your Supabase database:')
  console.log('1. Set up your environment variables in .env.local')
  console.log('2. Create the database tables using the SQL in README.md')
  console.log('3. Add data directly through Supabase dashboard or your admin interface')
  console.log('')
  console.log('If you need to restore JSON data, please restore the data/software.json file first.')
}

// Run migration if this file is executed directly
if (require.main === module) {
  migrateData()
}

export { migrateData } 