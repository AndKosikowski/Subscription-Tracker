/* @author 
 * Andrew Kosikowski and Athena Henderson
 */

var rhit = rhit || {};

rhit.functionName = function () {

};

rhit.MainPageController = class {
	constructor() {

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

rhit.CalendarCreator = function() {
	document.addEventListener('DOMContentLoaded', function() {
		var calendarEl = document.getElementById('calendar');
		var calendar = new FullCalendar.Calendar(calendarEl, {
		  initialView: 'dayGridMonth',
		  navLinks: true,
		  navLinkDayClick: function() {
			window.location.href = "/manage.html"
		  }
		});
		calendar.render();
	  });
}

rhit.main = function () {
	console.log("Ready");
	rhit.CalendarCreator();
	calendar.addEvent(calendarEl, {
		events: [
			{title: 'Netflix',
			allDay: true,
			start: '2021-08-03',
			end: '2021-08-03'}
		]
	});
};



rhit.main();
