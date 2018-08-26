'use strict';
/*
 Assumptions:
 - I am not using ES6 since I'm not using a transpiler like Babel
 */

/*
  Final testing:
  - Run html validator
  - Remove console.logs
*/

var calendarEvents = {

  // Project settings.
  appNodeId: 'calendar',
  startTime: 9,
  endTime: 9,
  hourInPixels: 60,

  // Don't edit these.
  minuteInPixels: this.hourInPixels/60,

  // Events arrays.
  calEvents: [],
  sortedCalEvents: [],

  // Error feedback.
  errorMsg: '',

  // HTML templates.
  calEventTemplate: '<div class="cal-event" style="{$test}"></div>',

  // Set up calendar.
  setup: function(calEvents) {
    this.calEvents = calEvents;
  },

  logError: function() {
    if (this.errorMsg.length > 0) {
      console.log(this.errorMsg);
      this.debugLog();
    }
  },

  debugLog: function() {
    console.log(this);
  },

  // Check requirements.
  requirementsMet: function() {
    if (
      !this.calEvents
      || !Array.isArray(this.calEvents)
      || 0 === this.calEvents.length
      ) {
        this.errorMsg = 'Please supply an array of events.';
        return false;
    }
    return true;
  },

  // Compare function for sorting start times.
  compareStartTime: function(a,b) {
    if (a.starts_at < b.starts_at) {
      return -1;
    }
    if (a.starts_at > b.starts_at) {
      return 1;
    }
    return 0;
  },

  sortEvents: function() {
    this.sortedCalEvents = this.calEvents.slice();
    this.sortedCalEvents.sort(this.compareStartTime);
  },

  /**
   * Cycle through all sorted events and add overlap information.
   * We will use 'overlapping_events' to calculate event width.
   */
  setOverlapInfo: function() {
    const sortedCalEvents = this.sortedCalEvents;
    let endTimes = [];
    sortedCalEvents.forEach(function(calEvent) {
      calEvent.overlaps = 0;
      if (!calEvent.starts_at || !calEvent.duration) {
        return; // Move on to next event.
      }
      if (endTimes.length > 0) {
        let endTimesToRemove = [];
        // Cycle through existing endTimes and check if current event starts after.
        endTimes.forEach(function(endTime) {
          if (calEvent.starts_at > endTime) {
            endTimesToRemove.push(endTimes.indexOf(endTime));
          }
        });
        // Remove irrelevant endTimes.
        endTimesToRemove.forEach(function(endTime) {
          endTimes.splice(endTimes.indexOf(endTime));
        });
      }

      // If end times still exist, both current event and event in endTimes overlap.
      if (endTimes.length > 0) {
        const currentItemIndex = sortedCalEvents.indexOf(calEvent);
        sortedCalEvents[currentItemIndex-1].overlaps += 1;
        // Increment current calEvent overlaps by number of endTimes.
        sortedCalEvents[currentItemIndex].overlaps = endTimes.length;
      }
      // Push current end time to check against next event.
      endTimes.push(calEvent.starts_at + calEvent.duration);
    })
  },

  renderEventMarkup: function(calEvent) {
    const eventNode = document.createElement('div');
    const overlaps = calEvent.overlaps;
    const eventWidth = (overlaps > 0) ? 100/(overlaps+1) : 100;
    eventNode.classList.add('calendar-item');
    eventNode.setAttribute('style', `width: ${eventWidth}%;`);
    eventNode.innerHTML = calEvent.starts_at;
    return eventNode;
  },

  renderCalendarMarkup: function() {
    const renderEventMarkup = this.renderEventMarkup;
    const calendar = document.getElementById(this.appNodeId);
    this.sortedCalEvents.forEach(function(calEvent) {
      calendar.appendChild(renderEventMarkup(calEvent));
    })
  },

  // Render calendar and events.
  render: function(calEvents) {
    this.setup(calEvents);
    if (!this.requirementsMet()) {
      this.logError();
      return;
    }
    this.sortEvents();
    this.setOverlapInfo();
    this.renderCalendarMarkup();

    // Logging for dev.
    this.debugLog();
  },
};

var renderEvents = function(calEvents) {
  calendarEvents.render(calEvents);
}

// ***** FOR DEVELOPMENT ONLY *****
var eventsArray = [{starts_at: 120, duration: 45, title: "Meeting with Ben", location: "Coffee Shop"}, {starts_at: 240, duration: 60, title: "Lunch with Karl", location: "TBA"}, {starts_at: 75, duration: 60, title: "Sync with John"}, {starts_at: 360, duration: 25}, {starts_at: 420, duration: 120}];
renderEvents(eventsArray);
// ***** END DEVELOPMENT ONLY CODE *****
