import fs from 'fs';
const FILE_PATH = './chatData.json';

// Initial in-memory data
export let data = {
  users: {},
  PendingMessages: {},
  PendingRequests: {},
  pendingApprovals: {}
};

// Load from file on server start
export function loadData() {
  if (fs.existsSync(FILE_PATH)) {
    const raw = fs.readFileSync(FILE_PATH);
    Object.assign(data, JSON.parse(raw));
    console.log('Data loaded from file');
  }
}

// Save to file
export function saveData() {
  fs.writeFileSync(FILE_PATH, JSON.stringify(data, null, 2));
  console.log('Data saved to file');
}

// Optional: auto-save every 30 seconds
setInterval(saveData, 30000);
