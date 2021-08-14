/* @author 
 * Andrew Kosikowski and Athena Henderson
 */

var rhit = rhit || {};

rhit.FB_COLLECTION_USERS = "Users";
rhit.FB_COLLECTION_SUBSCRIPTIONS = "Subscriptions";
rhit.FB_KEY_NAME = "Name";
rhit.FB_KEY_COST = "Cost";
rhit.FB_KEY_INTERVAL = "Interval";
rhit.FB_KEY_RENEWAL_DATE = "Renewal";
rhit.FB_KEY_LAST_TOUCHED = "LastTouched";
rhit.FB_KEY_EMAIL = "Email";
rhit.FB_KEY_PHONE = "Phone";
rhit.FB_KEY_REMIND_EMAIL = "RemindEmail";
rhit.FB_KEY_REMIND_TEXT = "RemindText";
rhit.fbAuthManager = null;
rhit.fbAccountManager = null;
rhit.fbSubscriptionsManager = null;
rhit.calendarManager = null;


//Stolen from stackoverflow
function htmlToElement(html) {
	var template = document.createElement('template');
	html = html.trim();
	template.innerHTML = html;
	return template.content.firstChild;
}

rhit.Subscription = class{
	constructor(id,name,cost,interval,date){
		this.id = id;
		this.name = name;
		this.cost = cost;
		this.interval = interval;
		this.date = date;
	}
}

rhit.AccountManager = class{
	constructor(uid){
		this._uid = uid;
		this._documentSnapshot = {};
		this._unsubscribe = null;
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(this._uid);
	}

	beginListening(changeListener) {
		this._unsubscribe = this._ref.onSnapshot((doc) => {
			this._documentSnapshot = doc;
			changeListener();
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	updateAccount(name,email,phone,remindPhone,remindEmail){

		this._ref.update({
			[rhit.FB_KEY_NAME]: name,
			[rhit.FB_KEY_EMAIL]: email,
			[rhit.FB_KEY_PHONE]: phone,
			[rhit.FB_KEY_REMIND_EMAIL]: remindEmail,
			[rhit.FB_KEY_REMIND_TEXT]: remindPhone,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		})
	}

	get name(){
		return this._documentSnapshot.get(rhit.FB_KEY_NAME);
	}

	get email(){
		return this._documentSnapshot.get(rhit.FB_KEY_EMAIL);
	}

	get phone(){
		return this._documentSnapshot.get(rhit.FB_KEY_PHONE);
	}

	get remindText(){
		return this._documentSnapshot.get(rhit.FB_KEY_REMIND_TEXT);
	}

	get remindEmail(){
		return this._documentSnapshot.get(rhit.FB_KEY_REMIND_EMAIL);
	}

};

rhit.SubscriptionsManager = class {
	constructor(uid) {
		this._uid = uid;
		this._documentSnapshots = [];
		this._ref = firebase.firestore().collection(rhit.FB_COLLECTION_USERS).doc(this._uid).collection(rhit.FB_COLLECTION_SUBSCRIPTIONS);
		this._unsubscribe = null;
	}

	add(name,cost,date,interval) {
		//https://stackoverflow.com/questions/40404663/convert-mm-dd-yyyy-to-date-in-javascript
		let d = date.split("/");
		let f = new Date(d[2], d[0] - 1, d[1]);


		this._ref.add({
			[rhit.FB_KEY_NAME]: name,
			[rhit.FB_KEY_COST]: cost,
			[rhit.FB_KEY_INTERVAL]: interval,
			[rhit.FB_KEY_RENEWAL_DATE]: firebase.firestore.Timestamp.fromDate(f),
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
		this._unsubscribe = this._ref.onSnapshot((querySnapshot) => {
			this._documentSnapshots = querySnapshot.docs;
			changeListener();
		});
	}

	stopListening() {
		this._unsubscribe();
	}

	update(sub){
		//https://stackoverflow.com/questions/40404663/convert-mm-dd-yyyy-to-date-in-javascript
		let d = sub.date.split("/");
		let f = new Date(d[2], d[0] - 1, d[1]);

		this._ref.doc(sub.id).update({
			[rhit.FB_KEY_COST]: sub.cost,
			[rhit.FB_KEY_NAME]: sub.name,
			[rhit.FB_KEY_RENEWAL_DATE]: f,
			[rhit.FB_KEY_INTERVAL]: sub.interval,
			[rhit.FB_KEY_LAST_TOUCHED]: firebase.firestore.Timestamp.now(),
		})
	}

	delete(sub) {}

	get length() {
		return this._documentSnapshots.length;
	}

	getSubscriptionAtIndex(index) {
		const docSnapshot = this._documentSnapshots[index];
		const sub = new rhit.Subscription(docSnapshot.id,
			docSnapshot.get(rhit.FB_KEY_NAME),
			docSnapshot.get(rhit.FB_KEY_COST),
			docSnapshot.get(rhit.FB_KEY_INTERVAL),
			docSnapshot.get(rhit.FB_KEY_RENEWAL_DATE));
		return sub;
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
		document.querySelector("#submitAddSubscription").onclick = (event) => {
			const name = document.querySelector("#inputName").value;
			const cost = document.querySelector("#inputCost").value;
			const date = document.querySelector("#inputDate").value;
			const interval = document.querySelector("#inputInterval").value;
			rhit.fbSubscriptionsManager.add(name,cost,date,interval);
		}
		rhit.fbSubscriptionsManager.beginListening(this.updateView.bind(this));
	}

	_createCard(sub){
		let date = sub.date.toDate();
		//https://stackoverflow.com/questions/11591854/format-date-to-mm-dd-yyyy-in-javascript
		let dateFormatted = ((date.getMonth() > 8) ? (date.getMonth() + 1) : ('0' + (date.getMonth() + 1))) + '/' + ((date.getDate() > 9) ? date.getDate() : ('0' + date.getDate())) + '/' + date.getFullYear();
		return htmlToElement(`<span class="row flex-nowrap subscription" data-doc-id="${sub.id}>
		<div class="col">
		  <img class="logo" src="logos/netflix.jpg" alt="${sub.name} Logo">
		</div>
		<div class="col">
		  <h3>${sub.name}</h3>
		  <div>${sub.cost}</div>
		</div>
		<div class="col">
		  <h3>Renews:</h3>

		  <div>${dateFormatted}</div>
		</div>
		<div class="col">
		  <h3>Interval:</h3>
		  <div>${sub.interval}</div>
		</div>
	  </span>`);
	}

	_createEditCard(sub){
		return htmlToElement(`<span class="row align-items-start flex-nowrap subscription" data-doc-id="${sub.id}>
		<div class="col"> <img class="logo" src="logos/netflix.jpg" alt="${sub.name} Logo"> </div>
		<div class="col">
		  <div class="form-group">
			<label for="subName" class="bmd-label-floating"></label>
			<input type="subName" class="form-control" id="subName" value="${sub.name}">
		  </div>
		  <div class="form-group">
			<label for="cost" class="bmd-label-floating"></label>
			<input type="cost" class="form-control" id="cost" value="${sub.cost}">
		  </div>
		</div>
		<div class="col">
		  <div class="form-group">
			<label for="renewDate" class="bmd-label-floating"></label>
			<input type="date" class="form-control" id="renewDate" value="${sub.date.toDate()}">
		  </div>
		</div>
		<div class="col">
		  <div class="form-group">
			<select type="name" class="form-control" id="interval" value="${sub.interval}">
			  <option value="monthly">Monthly</option>
			  <option value="yearly">Yearly</option>
			</select>
		  </div>
		  <br>
		  <i class="bi bi-trash"></i>
		  <button type="button" class="btn btn-outline-danger" id="deleteSubscription"class="btn" data-toggle="modal" data-target="#exampleModal">
			<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
			  <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"></path>
			  <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"></path>
			</svg>
		  </button>
		</div>
	  </span>`);

	}

	updateView(){
		const newList = htmlToElement('<div id="subscriptionListContainer"></div>');

		for (let i = 0; i < rhit.fbSubscriptionsManager.length; i++) {
			const sub = rhit.fbSubscriptionsManager.getSubscriptionAtIndex(i);
			const newCard = this._createCard(sub);
			newCard.classList.add("inCardMode");
			newCard.onclick = (event) => {
				if(!!document.querySelector(".inEditMode")){
					document.querySelector(".inEditMode").remove();
					let hiddenEls = document.getElementsByClassName("inCardMode");
					for (let j = 0; j < hiddenEls.length; j++){
						hiddenEls[j].hidden = false;
					}
				}
				const newEditCard = this._createEditCard(sub);
				newEditCard.classList.add("inEditMode");
				newList.insertBefore(newEditCard, newCard);
				newCard.hidden = true;
			}
			newList.appendChild(newCard);
		}

		const oldList = document.querySelector("#subscriptionListContainer");
		oldList.parentElement.insertBefore(newList,oldList)
		oldList.remove();

	}
}

rhit.AccountPageController = class {
	constructor() {
		document.querySelector("#updateAccount").onclick = (event) => {
			rhit.fbAccountManager.updateAccount(document.querySelector("#accountName").value,
				document.querySelector("#accountEmail").value,
				document.querySelector("#accountPhone").value,
				document.querySelector("#accountReminderPhone").checked,
				document.querySelector("#accountReminderEmail").checked
			);
		};
		document.querySelector("#signOut").onclick = (event) => {
			rhit.fbAuthManager.signOut();
		}
		document.querySelector("#deleteAccountModal").onclick = (event) => {
			rhit.fbAuthManager.deleteAccount();

		};

		rhit.fbAccountManager.beginListening(this.updateView.bind(this));
	}

	updateView(){
		if(rhit.fbAccountManager.name){
			document.querySelector("#accountName").value = rhit.fbAccountManager.name;
			document.querySelector("#accountName").parentElement.classList.add("is-filled");
		}
		if(rhit.fbAccountManager.email){
			document.querySelector("#accountEmail").value = rhit.fbAccountManager.email;
			document.querySelector("#accountEmail").parentElement.classList.add("is-filled");
		}
		if(rhit.fbAccountManager.phone){
			document.querySelector("#accountPhone").value = rhit.fbAccountManager.phone;
			document.querySelector("#accountPhone").parentElement.classList.add("is-filled");
		}
		document.querySelector("#accountReminderEmail").checked = rhit.fbAccountManager.remindEmail;
		document.querySelector("#accountReminderPhone").checked = rhit.fbAccountManager.remindText;
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

		return Rosefire.signIn("6d2940da-c084-494f-920e-89dc67d673a2", (err, rfUser) => {
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

	deleteAccount() {
		return Rosefire.signIn("6d2940da-c084-494f-920e-89dc67d673a2", (err, rfUser) => {
		if (err) {
	 	 	console.log("Rosefire error!", err);
	  		return;
		}
		console.log("Rosefire success!", rfUser);

		firebase.auth().signInWithCustomToken(rfUser.token).then(() => {
			this._user.delete()
		}).catch((rror) => {
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
		window.location.href = "/main.html"
	}

	if (!document.querySelector("#loginPage") && !rhit.fbAuthManager.isSignedIn) {
		window.location.href = "/index.html"
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
		rhit.fbSubscriptionsManager = new rhit.SubscriptionsManager(rhit.fbAuthManager.uid);
		new rhit.SubscriptionPageController();
	}
	if (document.querySelector("#accountPage")) {
		rhit.fbAccountManager = new rhit.AccountManager(rhit.fbAuthManager.uid);
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
		console.log("isSignedIn = ", rhit.fbAuthManager.isSignedIn);
		rhit.checkForRedirects();
		rhit.initializePage();
	});
};



rhit.main();
