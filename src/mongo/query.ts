import { MongoClient } from "mongodb";

import { logHandler } from "../utils/logHandler";

(async () => {
  const mongo = new MongoClient(process.env.MONGO_URL as string);
  await mongo.connect();
  const db = mongo.db(process.env.MONGO_DB);
  const collection = db.collection(process.env.MONGO_COLLECTION as string);
  // Query goes here. BUT be careful that you don't commit it!
  const query = {};
  const result = await collection.findOne(query);
  // Add additional filtering here, but DO NOT COMMIT IT :3
  const filtered = JSON.stringify(result, null, 2);
  // This should be unchanged
  logHandler.info(filtered);
  await mongo.close();
})();
