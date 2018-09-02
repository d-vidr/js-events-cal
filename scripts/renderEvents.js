'use strict';
/*
 Assumptions:

 */

/*
  Final testing:
  - Run html validator
  - Remove console.logs
*/

var calendarEvents = {

  /******************** SETTINGS ********************/
  appNodeId: 'calendar',
  startTime: 9, // The start time.
  hoursInCalDay: 12, // The number of hours to be shown in day.
  hourInPixels: 60, // How many vertical pixels represent an hour.

  // Events arrays.
  calEvents: [],
  sortedCalEvents: [],

  // HTML templates.
  calEventTemplate: '<div class="cal-event" style="{$test}"></div>',

  /******************** UTILITY METHODS ********************/

  // Set up calendar.
  setup: function(calEvents) {
    this.calEvents = calEvents;
  },

  logError: function(msg) {
    console.log(msg);
    // Also show current parent object state.
    this.debugLog();
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
        return false;
    }
    return true;
  },

  /******************** DATA METHODS ********************/

  /**
   * Compare function for sorting events by start time.
   *
   * @param {number} a Number to compare.
   * @param {number} b Number to compare.
   */
  compareStartTime: function(a,b) {
    if (a.starts_at < b.starts_at) {
      return -1;
    }
    if (a.starts_at > b.starts_at) {
      return 1;
    }
    return 0;
  },

  /**
   * Sort events.
   */
  sortEvents: function() {
    this.sortedCalEvents = this.calEvents.slice();
    this.sortedCalEvents.sort(this.compareStartTime);
  },

  /**
   * Calculate and set overlap info.
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

  /******************** RENDER METHODS ********************/

  /**
   * Get hour label for time including AM/PM.
   *
   * @param {number} h Hour.
   */
  getHourLabel: function(h) {
    let hour = 0;
    let hourLabel = 'AM';
    if( h > 12 ) {
      hour = h - 12;
      hourLabel = 'PM';
    } else {
      hour = h;
      hourLabel = 'AM';
    }
    return `${hour} ${hourLabel}`;
  },

  /**
   * Append element to main application DOM element.
   *
   * @param {Object} el Node to append.
   */
  appendToCal: function(el) {
    const cal = document.getElementById(this.appNodeId);
    cal.appendChild(el);
  },

  /**
   * Get single hour block for rendering calendar.
   */
  getSingleHourBlock: function() {
    const calHourNode = document.createElement('div');
    calHourNode.classList.add('calendar-hour');
    return calHourNode;
  },

  /**
   * Get single hour block label for rendering calendar.
   *
   * @param {number} h Hour.
   */
  getSingleHourBlockLabel: function(h) {
    const calHourLabel = document.createElement('span');
    calHourLabel.classList.add('cal-label');
    calHourLabel.innerHTML = this.getHourLabel(h);
    return calHourLabel;
  },

  /**
   * Render calendar hour blocks.
   */
  renderCalHourBlocks: function() {
    const endTime = this.startTime + this.hoursInCalDay;
    for (let h=this.startTime; h<endTime+1; h++) {
      const calHourNode = this.getSingleHourBlock();
      const calHourLabel = this.getSingleHourBlockLabel(h);
      calHourNode.appendChild(calHourLabel);
      this.appendToCal(calHourNode);
    }
  },

  /**
   * Render event markup (single)
   *
   * @param {object} Event object.
   */
  getSingleEvent: function(calEvent) {
    const eventNode = document.createElement('div');
    const overlaps = calEvent.overlaps;
    const eventWidth = (overlaps > 0) ? 100/(overlaps+1) : 100;
    eventNode.classList.add('calendar-item');
    eventNode.setAttribute('style', `width: ${eventWidth}%;`);
    eventNode.innerHTML = calEvent.starts_at;
    return eventNode;
  },

  /**
   * Render all markup.
   */
  renderMarkup: function() {
    // First render calendar markup - container, hour divs
    this.renderCalHourBlocks();
    // Then, render events.
    this.sortedCalEvents.forEach(function(calEvent) {
      const singleEvent = this.getSingleEvent(calEvent);
      this.appendToCal(singleEvent);
    }, this);
  },

  // Render calendar and events.
  render: function(calEvents) {
    this.setup(calEvents);
    if (!this.requirementsMet()) {
      this.logError('Please supply an array of events.');
      return;
    }
    this.sortEvents();
    this.setOverlapInfo();
    this.renderMarkup();

    // Logging for dev.
    this.debugLog();
  },
};

/**
 * Global wrapper function to render events.
 *
 * @param {Array.Object[]} calEvents Array of events objects.
 */
var renderEvents = function(calEvents) {
  calendarEvents.render(calEvents);
}

// ***** FOR DEVELOPMENT ONLY *****
var eventsArray = [{starts_at: 120, duration: 45, title: "Meeting with Ben", location: "Coffee Shop"}, {starts_at: 240, duration: 60, title: "Lunch with Karl", location: "TBA"}, {starts_at: 75, duration: 60, title: "Sync with John"}, {starts_at: 360, duration: 25}, {starts_at: 420, duration: 120}];
renderEvents(eventsArray);
// ***** END DEVELOPMENT ONLY CODE *****
