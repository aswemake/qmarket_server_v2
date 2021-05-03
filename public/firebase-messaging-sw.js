importScripts('https://www.gstatic.com/firebasejs/7.16.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/7.16.1/firebase-messaging.js');

// Initialize Firebase
var config = {
    apiKey: "AIzaSyCTUAzHxysIJIm8rBYfiyjxl1J3YS19G9k",
    authDomain: "qmarket-47a89.firebaseapp.com",
    databaseURL: "https://qmarket-47a89.firebaseio.com",
    projectId: "qmarket-47a89",
    storageBucket: "qmarket-47a89.appspot.com",
    messagingSenderId: "840234128314",
    appId: "1:840234128314:web:b30dbd15389c3e1fbb8383",
    measurementId: "G-3E3K2SENV2"
};
firebase.initializeApp(config);

const messaging = firebase.messaging();

//messaging.usePublicVapidKey("BIKJHOp98FDzWyA4nJTaB7ICY3qn98fYfJoE__LRlwNWqB4lb3veI7Rjp95s4Us4iDgj8COTNRH9MHafnHmqJl4");
// messaging.setBackgroundMessageHandler(function (payload) {
//     console.log('[firebase-messaging-sw.js] Received background message ', payload);
//     // Customize notification here
//     const notificationTitle = 'Background Message Title';
//     const notificationOptions = {
//         body: 'Background Message body.',
//         icon: '/firebase-logo.png'
//     };

//     return self.registration.showNotification(notificationTitle,
//         notificationOptions);
// });