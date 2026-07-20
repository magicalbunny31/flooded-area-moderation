# 📦 [node.js native sqlite](https://nodejs.org/api/sqlite.html) setup instructions

1. set the `isFirestore` value [`/flooded-area-moderation-discord/src/data/config.js`](../flooded-area-moderation-discord/src/data/config.js#L11) (line 11) to `false`
2. the database will automatically be created when you first run the app
   - on subsequent re-runs of the app, the database at the location it created the database in ([`/flooded-area-moderation-discord/src/database/sqlite.db`](../flooded-area-moderation-discord/src/database/sqlite.db)) will be re-used
   - should the database not exist at this location (for example: if it was renamed or deleted) then the app will create a fresh new database to use
   - if this repository's code is updated in a way which creates breaking changes to the structure of the database then you, the reader, will be responsible for ensuring you migrate data correctly (we ***may*** even help you out here!)
3. [return back to `setup.md` and continue from step 6 there](./setup.md)