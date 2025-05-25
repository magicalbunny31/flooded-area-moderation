# 📦 [google cloud firestore](https://cloud.google.com/firestore) setup instructions

this is pretty complex! let me hold your paw as we set it up together~

1. [create a google cloud project](https://developers.google.com/workspace/guides/create-project) if you haven't already
   - linking a billing account is optional (see below)
2. [create a firestore database](https://console.cloud.google.com/firestore/create-database)
   - create the database in native mode
   - by naming the "Database ID" "`(default)`", it counts under [firestore's free quota](https://cloud.google.com/firestore/pricing#free-quota)!
      - ..meaning, you don't pay for this (as long as you stay under the generous free quota limit, else the app will stop working until the quota resets..)
   - which location you wanna create your database in is up to you - it doesn't really matter but just remember that you can't change it after creating the database
   - you must name the `databaseId` in [`/src/index.js`](../src/index.js#L85) (line 85) the same as the "Database ID" for this newly created database
      - if you've named the "Database ID" "`(default)`" (aka: leaving that field blank), you can omit the `databaseId` property in [`/src/index.js`](../src/index.js#L85) (line 85)
3. [create a service account for your google cloud project](https://cloud.google.com/iam/docs/service-accounts-create) if you haven't already
   - when granting the service account permissions, give it "Cloud Datastore User" so that it is able to access the database
4. click on your newly created service account and go on the "KEYS" tab
   - under "ADD KEY", select "Create new key"
   - a json file will be downloaded to your device!
   - open the json file: you'll need it for step 5 below
5. input values into your `.env` file
   - `GCP_PROJECT_ID`: the `project_id`'s value in the downloaded json file from step 4
   - `GCP_CLIENT_EMAIL`: the `client_email`'s value in the downloaded json file from step 4
   - `GCP_PRIVATE_KEY`: the `private_key`'s value in the downloaded json file from step 4
6. [return back to `setup.md` and continue from step 6 there](./setup.md)