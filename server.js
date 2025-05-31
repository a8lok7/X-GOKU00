const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

const app = express();
const dbFile = path.join(__dirname, 'keys.json');

let keys = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile)) : [];

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'user')));

app.post('/api/create-key', (req, res) => {
  const { key, usageLimit, userLimit, expiry } = req.body;
  const newKey = {
    key,
    usageLimit: parseInt(usageLimit),
    userLimit: parseInt(userLimit) || 1,
    users: [],
    expiry,
    uses: 0,
    status: 'active'
  };
  keys.push(newKey);
  fs.writeFileSync(dbFile, JSON.stringify(keys, null, 2));
  res.json({ success: true });
});

app.get('/api/keys', (req, res) => {
  res.json(keys);
});

app.post('/api/verify-key', (req, res) => {
  const { key, userId } = req.body;
  const found = keys.find(k => k.key === key && k.status === 'active');

  if (!found) return res.json({ success: false, message: "Invalid or expired key" });
  if (found.usageLimit && found.uses >= found.usageLimit)
    return res.json({ success: false, message: "Usage limit reached" });
  if (found.expiry && new Date() > new Date(found.expiry))
    return res.json({ success: false, message: "Key expired" });
  if (found.users.length >= found.userLimit && !found.users.includes(userId))
    return res.json({ success: false, message: "User limit reached" });

  if (!found.users.includes(userId)) found.users.push(userId);
  found.uses = (found.uses || 0) + 1;

  fs.writeFileSync(dbFile, JSON.stringify(keys, null, 2));
  res.json({ success: true });
});

app.listen(3000, () => {
  console.log("✅ X-GOKU Backend is running at http://localhost:3000");
});
