const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

async function exportDB() {
  console.log('⚡ Starting database connection...');

  const { MongoMemoryServer } = require('mongodb-memory-server');
  const dbPath = path.join(process.cwd(), 'db_data');
  
  console.log(`📦 Database path: ${dbPath}`);
  
  const mongoServer = await MongoMemoryServer.create({
    binary: {
      version: '4.4.29'
    },
    instance: {
      dbPath: dbPath,
      storageEngine: 'wiredTiger',
      persistNDB: true,
      dbName: 'achira_local'
    }
  });

  const uri = mongoServer.getUri();
  console.log(`🔌 Connecting to: ${uri}`);
  await mongoose.connect(uri, { dbName: 'achira_local' });
  console.log('✅ Connected!');

  const db = mongoose.connection.db;

  const data = {};

  const collections = ['products', 'categories', 'brands', 'websiteconfigs', 'homepages', 'contactdetails', 'testimonials'];
  
  for (const name of collections) {
    console.log(`📖 Exporting collection: ${name}...`);
    try {
      const items = await db.collection(name).find({}).toArray();
      data[name] = items;
      console.log(`   Fetched ${items.length} documents.`);
    } catch (e) {
      console.warn(`   No documents found or error: ${e.message}`);
      data[name] = [];
    }
  }

  const destPath = path.join(process.cwd(), '..', 'frontend', 'src', 'utils', 'db_fallback.json');
  fs.writeFileSync(destPath, JSON.stringify(data, null, 2));
  console.log(`💾 Successfully exported database dump to: ${destPath}`);

  await mongoose.disconnect();
  await mongoServer.stop();
  console.log('👋 Finished database export!');
}

exportDB().catch(err => {
  console.error('❌ Database export failed:', err);
  process.exit(1);
});
