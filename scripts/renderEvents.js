'use strict';

var calendarEvents = {
  appNodeId: 'calendar',
  startTime: 9, // The start time.
  hoursInCalDay: 12, // The number of hours to be shown in day.
  hourInPixels: 60, // How many vertical pixels represent an hour.
  domClasses: {
    hour: 'cal-hour',
    hourLabel: 'cal-hour-label',
    eventsContainer: 'cal-events',
    event: 'cal-event',
    eventLabel: 'cal-event-label',
    eventTitle: 'cal-event-title',
    eventLocation: 'cal-event-location',
    eventTime: 'cal-event-time',
  },

  // Events arrays.
  calEvents: [],
  sortedCalEvents: [],

  /**
   * Set up application.
   *
   * @param {Object[].<number, string>} calEvents Array of events objects.
   */
  setup: function(calEvents) {
    this.calEvents = calEvents;
  },

  /**
   * Log errors.
   *
   * @param {string} msg Error message to log.
   */
  logError: function(msg) {
    const errorEl = this.createCalElement('p', 'error', msg);
    this.appendToApp(errorEl);
  },

  /**
   * Check to see if requirements are met.
   *
   * @returns {boolean} Whether requirements are met.
   */
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

  /**
   * Get standard time label (AM/PM) from hour provide as military time.
   *
   * @param {number} h Hour represented as military time.
   * @param {string} AM/PM label.
   */
  getStandardTimeLabel: function(h) {
    return ( h >= 12 ) ? 'PM' : 'AM';
  },

  /**
   * Get standard time hour from hour provided as military time.
   *
   * @param {number} h Hour represented as military time.
   * @param {number} Standard time hour.
   */
  getStandardTimeHour: function(h) {
    return ( h <= 12 ) ? h : h - 12;
  },

  /**
   * Get hour label for time including AM/PM.
   *
   * @param {number} h Hour represented as 24 hour clock.
   * @returns {string} 12 hour time with AM/PM label.
   */
  getCalHourLabel: function(h) {
    const hour = this.getStandardTimeHour(h);
    const hourLabel = this.getStandardTimeLabel(h);
    return `${hour} ${hourLabel}`;
  },

  /**
   * Get event time span (from, to).
   *
   * @param {Object.<number, string>} calEvent Events object.
   * @returns {string} Time span represented as hh:mm - hh:mm.  No minutes shown on the hour.
   */
  getEventTime: function(calEvent) {
    const startTime = this.calcTime(calEvent.starts_at);
    const endTime = this.calcTime(calEvent.starts_at + calEvent.duration);
    return `${startTime} - ${endTime}`;
  },

  /**
   * Calculate time from minutes from start and include label.
   *
   * @param {number} minutesFromStart Number of minutes from startTime.
   * @returns {string} Formatted time (hh:mm AM/PM).
   */
  calcTime: function(minutesFromStart) {
    const hours = this.startTime + (minutesFromStart / 60);
    let rhours = Math.floor(hours);
    const minutes = 60 * (hours - rhours);
    let rminutes = Math.round(minutes);
    let label = 'AM';
    if ( 12 < rhours ) {
      rhours = rhours - 12;
      label = 'PM';
    }
    rminutes = ( 0 !== rminutes ) ? `:${rminutes}` : '';
    return `${rhours}${rminutes} ${label}`;
  },

  /**
   * Calculate pixel position representing time.
   *
   * @param {number} minutes Minutes from this.startTime.
   * @returns {number} Pixel position representative of given time.
   */
  calcTimePixelPos: function(minutes) {
    return this.hourInPixels / 60 * minutes;
  },

  /**
   * Compare function for sorting events by start time.
   *
   * @param {number} a Number to compare.
   * @param {number} b Number to compare.
   * @returns {number} Number for sort function representing <, >, =.
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
   * Reset / clear app container.
   */
  resetAppContainer: function() {
    document.getElementById(this.appNodeId).innerHTML = '';
  },

  /**
   * Append element to main application DOM element.
   *
   * @param {Object} el Node to append.
   */
  appendToApp: function(el,parent) {
    const parentId = ( 'undefined' !== typeof parent ) ? parent : this.appNodeId;
    const parentEl = document.getElementById(parentId);
    parentEl.appendChild(el);
  },

  /**
   * Create calendar DOM element.
   *
   * @param {string} type Type of element - div, span, etc.
   * @param {string} domClass DOM element class.
   * @param {string} html HTML text.
   */
  createCalElement: function(type, domClass, html) {
    const el = document.createElement(type);
    if ('undefined' !== typeof domClass) {
      el.className = domClass;
    }
    if ('undefined' !== typeof html) {
      el.innerHTML = html;
    }
    return el;
  },

  /**
   * Render calendar hour blocks.
   */
  renderCalHourBlocks: function() {
    const endTime = this.startTime + this.hoursInCalDay;
    for (let h = this.startTime; h < endTime + 1; h++) {
      const calHour = this.createCalElement('div', this.domClasses['hour']);
      const calHourLabel = this.createCalElement('span', this.domClasses['hourLabel'], this.getCalHourLabel(h));
      calHour.appendChild(calHourLabel);
      if (h === endTime) {
        calHour.classList.add('last');
      } else {
        calHour.style.height = `${this.hourInPixels}px`;
      }
      this.appendToApp(calHour);
    }
  },

  /**
   * Create single event DOM element.
   *
   * @param {Object.<number, string>} calEvent Events object.
   */
  createSingleEvent: function(calEvent) {
    const eventEl = this.createCalElement('div', this.domClasses['event']);
    const labelEl = this.createCalElement('div', this.domClasses['eventLabel']);
    eventEl.setAttribute('data-end-time', calEvent.starts_at + calEvent.duration);
    eventEl.style.height = `${calEvent.duration * this.hourInPixels/60}px`;
    eventEl.style.top = `${this.calcTimePixelPos(calEvent.starts_at)}px`;

    if ( 'undefined' !== typeof calEvent.title && calEvent.title.length > 0) {
      labelEl.appendChild(this.createCalElement('span', this.domClasses['eventTitle'], calEvent.title ));
    }
    if ( 'undefined' !== typeof calEvent.location && calEvent.location.length > 0) {
      labelEl.appendChild(this.createCalElement('span', this.domClasses['eventLocation'], calEvent.location ));
    }
    if (0 < labelEl.children.length) {
      eventEl.appendChild(labelEl);
    }
    eventEl.appendChild(this.createCalElement('span', this.domClasses['eventTime'], this.getEventTime(calEvent)));
    return eventEl;
  },

  /**
   * Update simultaneous event info. Used when rendering each event.
   */
  updateSimultaneousEvents: function(simEvents, currentEvent) {
    if (simEvents.length > 0) {
      let simEventsToRemove = [];
      simEvents.forEach(function(simEvent) {
        if (currentEvent.starts_at > simEvent.dataset.endTime) {
          simEventsToRemove.push(simEvents.indexOf(simEvent));
        }
      });
      simEventsToRemove.forEach(function(endTime) {
        simEvents.splice(simEvents.indexOf(endTime));
      });
    }
    return simEvents;
  },

  /**
   * Render calendar events.
   */
  renderEvents: function() {
    // Add event container.
    const container = this.createCalElement('div',this.domClasses['eventsContainer']);
    this.appendToApp(container);

    let simEvents = [];
    this.sortedCalEvents.forEach(function(calEvent) {
      const singleEvent = this.createSingleEvent(calEvent);
      let eventWidth = 100;
      // Check for simultaneous events and set width / left position accordingly.
      simEvents = this.updateSimultaneousEvents(simEvents, calEvent);
      if (0 < simEvents.length) {
        eventWidth = 100 / (simEvents.length + 1);
        singleEvent.style.left = `${simEvents.length * eventWidth}%`;
        simEvents.forEach(function(simEvent, idx) {
          simEvent.style.width = `${eventWidth}%`;
          simEvent.style.left = `${idx * eventWidth}%`;
        });
      }
      singleEvent.style.width = `${eventWidth}%`;
      simEvents.push(singleEvent);
      container.appendChild(singleEvent);
    }, this);
  },

  /**
   * Render all markup.
   */
  renderMarkup: function() {
    this.resetAppContainer();
    this.renderCalHourBlocks();
    this.renderEvents();
  },

  /**
   * Create app.
   *
   * @param {Object[].<number, string>} calEvents Array of events objects.
   */
  render: function(calEvents) {
    this.setup(calEvents);
    if (!this.requirementsMet()) {
      this.logError('Please supply an array of events.');
      return;
    }
    this.sortEvents();
    this.renderMarkup();
  },
};

/**
 * Global wrapper function to render app.
 *
 * @param {Object[].<number, string>} calEvents Array of events objects.
 */
var renderEvents = function(calEvents) {
  calendarEvents.render(calEvents);
}

// ***** FOR DEVELOPMENT ONLY *****
var eventsArray = [
  {starts_at: 120, duration: 45, title: "Meeting with Ben", location: "Coffee Shop"},
  {starts_at: 240, duration: 60, title: "Lunch with Karl", location: "TBA"},
  {starts_at: 75, duration: 60, title: "Sync with John"},
  {starts_at: 360, duration: 25},
  {starts_at: 420, duration: 120}
];
// ***** END DEVELOPMENT ONLY CODE *****
