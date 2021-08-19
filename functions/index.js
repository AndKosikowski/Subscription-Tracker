const functions = require("firebase-functions");
const admin = require('firebase-admin');
const express = require('express');
var nodemailer = require('nodemailer');
const Vonage = require('@vonage/server-sdk');
const later = require('later');
var moment = require('moment');
const cors = require('cors');
moment().format();
admin.initializeApp();
// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//

const app = express();
app.use(cors({origin: true}));

const db = admin.firestore();

const from = "18337907816";

exports.scheduledFunction = functions.pubsub.schedule('every 24 hours').onRun( async (context) => {
  
  let usersRef = db.collection("Users");
  let documentSnapshots = null;


  let snapshot = await usersRef.get();

  snapshot.forEach(async (doc) => {
    let emailNotifications = doc.data().RemindEmail;
    let phoneNotifications = doc.data().RemindText;
    let email = null;
    let phone = null;
    let userName = null;
    if(emailNotifications || phoneNotifications){
        email = doc.data().Email;
        phone = doc.data().Phone;
        userName = doc.data().Name;
        if(userName == null || userName.length == 0){
          userName = "user";
        }
    }
    functions.logger.log(email);
        let subsRef = await doc.ref.collection("Subscriptions").get();
        subsRef.forEach( async (subDoc) => {
            let renewalDate = subDoc.data().Renewal.toDate();
            let momentRenewalDate = moment.utc(renewalDate);
            let currentDate = new moment.utc();
            functions.logger.log(`moment: ${momentRenewalDate}`);
            functions.logger.log(`moment: ${momentRenewalDate}`);
            if(momentRenewalDate.isSame(currentDate.add(1, 'd'), 'd')){
              text = `Hello ${userName}, your ${subDoc.data().Name} subscription is about to renew!`;
              if(phone){
                vonage.message.sendSms(from, phone, text, (err, responseData) => {
                  if (err) {
                      functions.logger.log(err);
                  } else {
                      if(responseData.messages[0]['status'] === "0") {
                          functions.logger.log("Message sent successfully.");
                      } else {
                          functions.logger.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
                      }
                  }
                });
              }
              if(email){
                var transporter = nodemailer.createTransport({
                  service: 'hotmail',
                  auth: {
                    user: 'subscriptiontracker@hotmail.com',
                    pass: 'SuperSecret420'
                  }
                });
      
                var mailOptions = {
                  from: 'subscriptiontracker@hotmail.com',
                  to: email,
                  subject: 'Subscription Tracker Email Verification',
                  text: text
                };
      
                transporter.sendMail(mailOptions, function(error, info){
                  if (error) {
                  functions.logger.log(error);
                  } else {
                    functions.logger.log('Email sent: ' + info.response);
                  }
                });
              }
            }
            else if(momentRenewalDate.diff(currentDate) < 0){
              functions.logger.log(`Attempt to update renewal of: ${subDoc.data().Name}`)
              let renewalInterval = subDoc.data().Interval;
              let nextDate = null;
              if(renewalInterval.toUpperCase().localeCompare("MONTH")){
                nextDate = momentRenewalDate.add(1, 'M');
              }else{
                nextDate = momentRenewalDate.add(1, 'y');
              }

              functions.logger.log(`Next date will be: ${nextDate.toDate()}`)
              subDoc.ref.update({Renewal: admin.firestore.Timestamp.fromDate(nextDate.toDate())});
            }

        })
    
  });
  return null;
});


const vonage = new Vonage({
    apiKey: "c7706b7f",
    apiSecret: "W4ek0CZHtvlESqFm"
  });

// app.get("/updateSubscriptions", async (request, response) =>{

// });


app.get("/phoneChanged/:number/:name/", (request, response) =>{
    const to = request.params.number;

    const name = request.params.name;
    const text = `Hey ${name}, we're just verifying your phone number`;
    vonage.message.sendSms(from, to, text, (err, responseData) => {
        if (err) {
            functions.logger.log(err);
        } else {
            if(responseData.messages[0]['status'] === "0") {
                functions.logger.log("Message sent successfully.");
            } else {
                functions.logger.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
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
          functions.logger.log(error);
        } else {
          functions.logger.log('Email sent: ' + info.response);
        }
      });

    response.json({sent: "yes"});
})


// exports.emailChanged = functions.https.onRequest((req, res) => {

// });

// exports.phoneChanged = functions.https.onCall((data, context) => {
//     const number = data.number;
//     functions.logger.log(number);

// });


exports.userDeleted = functions.auth.user().onDelete(user => {
    const doc = admin.firestore().collection('Users').doc(user.uid);
    return doc.delete();
});

exports.api = functions.https.onRequest(app);