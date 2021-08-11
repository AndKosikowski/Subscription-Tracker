/* @author 
 * Andrew Kosikowski and Athena Henderson
 */

var rhit = rhit || {};

rhit.FB_COLLECTION_SUBSCRIPTIONTRACKER = "Subscription-Tracker";
rhit.FB_KEY_NAME = "Name"
rhit.FB_KEY_COST = "Cost"
rhit.FB_KEY_INTERVAL = "Interval"
rhit.FB_KEY_RENEWAL_DATE = "Renewal"
rhit.FB_KEY_LAST_TOUCHED = "LastTouched"
rhit.fbAuthManager = null;
rhit.calendarManager = null;


rhit.Subscription = class{
	constructor(id,name,cost,interval,date){
		this.id = id;
		this.name = name;
		this.cost = cost;
		this.interval = interval;
		this.date = date;
	}
}

rhit.SubscriptionsManager = class {
	constructor(uid) {
		this._uid = uid;
		console.log("Created Subscriptions Manager");
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_SUBSCRIPTIONTRACKER);
		this._unsubscribe = null;
	}

	add(name,cost,interval,date) {
		this._ref.add({
			[rhit.FB_KEY_NAME]: name,
			[rhit.FB_KEY_COST]: cost,
			[rhit.FB_KEY_INTERVAL]: interval,
			[rhit.FB_KEY_RENEWAL_DATE]: date,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now()
		})
		.then(function (docRef) {
			console.log("document written with ID: ", docRef.id);
		})
		.catch(function (docRef) {
			console.error("Error adding document: ", error);
		})
	}

	beginListening(changeListener) {

		let query = this._ref.orderBy(rhit.FB_KEY_LAST_TOUCHED, "desc");

		this._unsubscribe = query.onSnapshot((querySnapshot) => {
			console.log("Subscription Update:");

			this._documentSnapshots = querySnapshot.docs;

			changeListener();
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	update(id, quote, movie) {}

	delete(id) {}

	get length() {
		return this._documentSnapshots.length;
	}
	getMovieQuoteAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const mq = new rhit.MovieQuote(docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_QUOTE),
			docSnapshot.get(rhit.FB_KEY_MOVIE));
		return mq;
	}
}


rhit.MainPageController = class {
	constructor() {
		rhit.calendarManager = new rhit.CalendarCreator();
		console.log("calendar?");
	}

}

rhit.SubscriptionPageController = class {
	constructor() {

	}
}

rhit.AccountPageController = class {
	constructor() {

	}
}

rhit.FbAuthManager = class {
	constructor() {
		this._user = null;
	}

	beginListening(changeListener) {
		firebase.auth().onAuthStateChanged((user) => {
			this._user = user;
			changeListener();
		});
	}

	signIn() {
		console.log("login");

		Rosefire.signIn("6d2940da-c084-494f-920e-89dc67d673a2", (err, rfUser) => {
		if (err) {
	 	 	console.log("Rosefire error!", err);
	  		return;
		}
		console.log("Rosefire success!", rfUser);

		firebase.auth().signInWithCustomToken(rfUser.token).catch((rror) => {
			const errorCode = error.code;
			const errorMessage = error.message;
			if (errorCode === 'auth/invalid-custom-token') {
				alert('The token you provided is not valid.');
			} else{
				console.error("custom auth error", errorCode, errorMessage);
			}
		});
  		});	
	}

	signOut() {
		firebase.auth().signOut().catch((error) => {
			console.log("Sign out error");
		});
	}
	get isSignedIn() {
		return !!this._user;
	}
	get uid() {
		return this._user.uid;
	}
}

rhit.LoginPageController = class {
	constructor() {
		document.querySelector("#roseFireButton").onclick = (event) => {
			rhit.fbAuthManager.signIn();
		};

	}
}

rhit.checkForRedirects = function() {

	if (document.querySelector("#loginPage") && rhit.fbAuthManager.isSignedIn) {
		window.location.href = "main.html"
	}

	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "index.html"
	}
};
// https://fullcalendar.io/docs

rhit.CalendarCreator = class {
	constructor() {
		console.log("hello?");
		var calendarEl = document.getElementById('calendar');
		console.log("hello?");
		var calendar = new FullCalendar.Calendar(calendarEl, {
		  initialView: 'dayGridMonth',
		  navLinks: true,
		  navLinkDayClick: function() {
			window.location.href = "/manage.html"//Replace with close up of day with all subscriptions
		  },
		  eventClick: function(eventInfo) {
		
			window.location.href = "/manage.html"
		  }
		});
		console.log("hello?");
		calendar.addEvent({
				title: 'Netflix',
				start: '2021-08-12',
				end: '2021-08-12'
		});
		calendar.addEvent({
			title: 'Amazon',
			start: '2021-08-14',
			end: '2021-08-14'
	});
		calendar.render();
	}
}

rhit.initializePage = function(){
	if (document.querySelector("#mainPage")) {
		new rhit.MainPageController();
	}
	if (document.querySelector("#subscriptionPage")) {
		new rhit.SubscriptionPageController();
	}
	if (document.querySelector("#accountPage")) {
		new rhit.AccountPageController();
	}
	if (document.querySelector("#loginPage")){
		new rhit.LoginPageController();
	}
	const subscriptions = document.querySelectorAll(".subscription");
	console.log(subscriptions);
	for(i = 0; i < subscriptions.length; i++) {
		subscriptions[i].addEventListener("click", (event) => {
			console.log(subscriptions[i]);
			console.log(event.target.innerHTML);
		});
	}
}

rhit.main = function () {
	rhit.fbAuthManager = new rhit.FbAuthManager();
	rhit.fbAuthManager.beginListening(() => {
		console.log("auth change callback fired");
		console.log("isSignedIn = ",rhit.fbAuthManager.isSignedIn);
		rhit.checkForRedirects();
		rhit.initializePage();
	});
};



rhit.main();
