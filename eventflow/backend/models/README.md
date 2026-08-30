# Models (reference schemas)

The running demo uses `backend/data/store.js`, a JSON-file datastore, so the
project boots with zero external services. These files are the equivalent
Mongoose schemas — copy them in and point `store.js`'s callers at
`Model.find()/.create()/.findById()` etc. to move onto real MongoDB. Field
names match the JSON shapes exactly, so the migration is mechanical.
