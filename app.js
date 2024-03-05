const express = require('express');
const path = require('path');
const app = express();
const port = 3030;

// Serve static files from the 'public' directory
app.use(express.static('public'));

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
