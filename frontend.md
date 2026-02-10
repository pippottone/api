# Quick local test

1. Run the seed script to refresh the dictionary.
2. Start a local server from the project root.
3. Open the browser to the provided URL.

Commands (PowerShell):

```powershell
$env:API_FOOTBALL_KEY="YOUR_API_KEY"
npm run seed-teams
python -m http.server 5173
```

Then open http://localhost:5173 in your browser.
