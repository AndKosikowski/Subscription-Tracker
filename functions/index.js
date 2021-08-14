const functions = require("firebase-functions");
const admin = require('firebase-admin');
admin.initializeApp();

exports.userDeleted = functions.auth.user().onDelete(user => {
    const doc = admin.firestore().collection('Users').doc(user.uid);
    return doc.delete();
});
