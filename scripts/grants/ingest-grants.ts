import { ingestGrantSources } from '../../server/services/grants/ingestionService.js';
import { matchAllUsers } from '../../server/services/grants/matchingService.js';

const run = async () => {
  console.log('🚀 Starting grant ingestion job');
  const ingested = await ingestGrantSources();
  console.log('✅ Ingestion complete', ingested);

  console.log('🔎 Matching grants to users');
  const matches = await matchAllUsers();
  console.log('✅ Matching complete', matches);
};

run()
  .then(() => {
    console.log('🎉 Grants ingestion job completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Grants ingestion job failed:', error);
    process.exit(1);
  });
