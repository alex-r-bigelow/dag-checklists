const nano = require('nano')(`http://${process.env.COUCHDB_USER}:${process.env.COUCHDB_PASSWORD}@localhost:5984`);

(async () => {
  const tasks = nano.use('tasks');
  tasks.insert({
    _id: '_design/read_only',
    language: 'javascript',
    validate_doc_update: function (newDoc, oldDoc, userCtx, secObj) {
      if (secObj.admins.names.indexOf(userCtx.name)) {
        throw({ 'forbidden': 'The tasks database is read-only' }); // eslint-disable-line no-throw-literal, keyword-spacing
      }
    }
  });
})();
