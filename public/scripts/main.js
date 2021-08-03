/* @author 
 * Andrew Kosikowski and Athena Henderson
 */

var rhit = rhit || {};

rhit.calendarManager = null;


rhit.MainPageController = class {
	constructor() {
		rhit.calendarManager = new rhit.CalendarCreator();
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

rhit.AuthController = class {
	constructor() {

	}
}
// https://fullcalendar.io/docs

rhit.CalendarCreator = class {
	constructor() {
	document.addEventListener('DOMContentLoaded', function() {
		var calendarEl = document.getElementById('calendar');
		var calendar = new FullCalendar.Calendar(calendarEl, {
		  initialView: 'dayGridMonth',
		  navLinks: true,
		  navLinkDayClick: function() {
			window.location.href = "/manage.html"
		  }
		});
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
	  });
	}
}

rhit.main = function () {
	if (document.querySelector("#mainPage")) {
		new rhit.MainPageController();
	}
	if (document.querySelector("#subscriptionPage")) {
		new rhit.SubscriptionPageController();
	}
	if (document.querySelector("#accountPage")) {
		new rhit.AccountPageController();
	}

};



rhit.main();
