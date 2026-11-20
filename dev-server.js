// dev-server.js  Runs the API locally on http://localhost:3000  (npm run dev)
// Each service adds its router to the list below as it is built.
require('dotenv').config({ quiet: true });
const { createApp } = require('./shared/appFactory');
const health = require('./shared/health');

const routers = [health];
const app = createApp(routers, { largeBodyPaths: [/^\/api\/events\/[^/]+\/invitations\/bulk$/] });
const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => console.log(`Event Manager API listening on http://localhost:${PORT}`));
