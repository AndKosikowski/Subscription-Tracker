const functions = require("firebase-functions");
const admin = require('firebase-admin');
// const Vonage = require('@vonage/server-sdk');
admin.initializeApp();

// const vonage = new Vonage({
//   apiKey: "c7706b7f",
//   apiSecret: "W4ek0CZHtvlESqFm"
// });

// const from = "18337907816";
// const to = "18477868711";
// const text = 'A text message sent using the Vonage SMS API';

exports.emailChanged = functions.https.onCall((data, context) => {
	Email.send({
        Host: "smtp.gmail.com",
        Username : "subscriptiontrackerbot@gmail.com",
        Password : "SuperSecret",
        To : 'kosikoaj@rose-hulman.edu',
        From : "subscriptiontrackerbot@gmail.com",
        Subject : "Test Email",
        Body : "This is a test",
        }).then(
            message => alert("mail sent successfully")
        );
});

// exports.phoneChanged = functions.https.onCall((data, context) => {
//     const number = data.number;
//     console.log(number);
//     // vonage.message.sendSms(from, to, text, (err, responseData) => {
//     //     if (err) {
//     //         console.log(err);
//     //     } else {
//     //         if(responseData.messages[0]['status'] === "0") {
//     //             console.log("Message sent successfully.");
//     //         } else {
//     //             console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
//     //         }
//     //     }
//     // })
// });


exports.userDeleted = functions.auth.user().onDelete(user => {
    const doc = admin.firestore().collection('Users').doc(user.uid);
    return doc.delete();
});
