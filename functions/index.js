const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require('express');
var nodemailer = require('nodemailer');
const Vonage = require('@vonage/server-sdk');
const cors = require('cors');
admin.initializeApp();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const app = express();
app.use(cors({origin: true}));

const from = "18337907816";


const vonage = new Vonage({
    apiKey: "c7706b7f",
    apiSecret: "W4ek0CZHtvlESqFm"
  });

app.get("/phoneChanged/:number/:name/", (request, response) =>{
    const to = request.params.number;
    const name = request.params.name;
    const text = `Hey ${name}, we're just verifying your phone number`;
    vonage.message.sendSms(from, to, text, (err, responseData) => {
        if (err) {
            console.log(err);
        } else {
            if(responseData.messages[0]['status'] === "0") {
                console.log("Message sent successfully.");
            } else {
                console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
            }
        }
    });
    response.json({sent: "yes"});
})


app.get("/emailChanged/:email/:name/", (request, response) => {
    let sendTo = request.params.email;
    let name = request.params.name;
    var transporter = nodemailer.createTransport({
        service: 'hotmail',
        auth: {
          user: 'subscriptiontracker@hotmail.com',
          pass: 'SuperSecret420'
        }
      });
      
      var mailOptions = {
        from: 'subscriptiontracker@hotmail.com',
        to: sendTo,
        subject: 'Subscription Tracker Email Verification',
        text: `Hey ${name}, we're just verifying your email`
      };
      
      transporter.sendMail(mailOptions, function(error, info){
        if (error) {
          console.log(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
      });

    response.json({sent: "yes"});
})


// exports.emailChanged = functions.https.onRequest((req, res) => {

// });

// exports.phoneChanged = functions.https.onCall((data, context) => {
//     const number = data.number;
//     console.log(number);

// });


exports.userDeleted = functions.auth.user().onDelete(user => {
    const doc = admin.firestore().collection('Users').doc(user.uid);
    return doc.delete();
});

exports.api = functions.https.onRequest(app);