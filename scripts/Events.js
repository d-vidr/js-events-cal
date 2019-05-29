class Events {
  // Settings.
  appNodeId = 'calendar';
  startTime = 9; // The start time.
  hoursInCalDay = 12; // The number of hours to be shown in day.
  hourInPixels = 60; // How many vertical pixels represent an hour.
  // Events array.
  calEvents = [];

  /**
   * Set up application.
   *
   * @param {Object[].<number, string>} events Array of events objects.
   */
  constructor(events) {
    if (! events || ! Array.isArray(events) || ! events.length) {
      alert('Please supply an array of events.');
      return;
    }
    this.calEvents = events;
    this.setConcurrency();
    this.compareConcurrency();
    this.resetAppContainer();
    this.renderCalHourBlocks();
    this.renderEvents();
  }

  /**
   * Get hour label for time including AM/PM.
   *
   * @param {number} h Hour represented as 24 hour clock.
   * @returns {string} 12 hour time with AM/PM label.
   */
  getCalHourLabel(h) {
    const hour = h <= 12 ? h : h - 12;
    const hourLabel = h >= 12 ? 'PM' : 'AM';
    return `${hour} ${hourLabel}`;
  };

  /**
   * Get event time span (from, to).
   *
   * @param {Object.<number, string>} calEvent Events object.
   * @returns {string} Time span represented as hh:mm - hh:mm.  No minutes shown on the hour.
   */
  getEventTime(calEvent) {
    const startTime = this.calcTime(calEvent.starts_at);
    const endTime = this.calcTime(calEvent.starts_at + calEvent.duration);
    return `${startTime} - ${endTime}`;
  };

  /**
   * Calculate time from minutes from start and include label.
   *
   * @param {number} minutesFromStart Number of minutes from startTime.
   * @returns {string} Formatted time (hh:mm AM/PM).
   */
  calcTime(minutesFromStart) {
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
  };

  /**
   * Calculate pixel position representing time.
   *
   * @param {number} minutes Minutes from this.startTime.
   * @returns {number} Pixel position representative of given time.
   */
  calcTimePixelPos(minutes) {
    return this.hourInPixels / 60 * minutes;
  };

  /**
   * Reset / clear app container.
   */
  resetAppContainer() {
    document.getElementById(this.appNodeId).innerHTML = '';
  };

  /**
   * Render calendar hour blocks.
   */
  renderCalHourBlocks() {
    const endTime = this.startTime + this.hoursInCalDay;
    const hours = [];
    for (let h = this.startTime; h < endTime + 1; h++) {
      hours.push(h);
    }
    const hourEls = hours.map((h) => {
      return `
        <div class="cal-hour" style="height: ${this.hourInPixels}px;">
          <span class="cal-hour-label">${this.getCalHourLabel(h)}</span>
        </div>
      `;
    });
    document.getElementById(this.appNodeId).innerHTML = hourEls.join('');
    // @todo: add last class calHour.classList.add('last');
  };

  /**
   * Create single event DOM element.
   *
   * @param {Object.<number, string>} calEvent Events object.
   */
  createSingleEvent(calEvent) {
    const elHeight = calEvent.duration * this.hourInPixels/60;
    const elTop = this.calcTimePixelPos(calEvent.starts_at);
    const width = 100 / (calEvent.concurrentCount + 1);

    const titleEl =
      calEvent.title
      ? `<span class="cal-event-title">${calEvent.title}</span>`
      : '';
    const locationEl =
      calEvent.title
      ? `<span class="cal-event-location">calEvent.location</span>`
      : '';
    const labelEl =
      titleEl || locationEl
      ? `<div class="cal-event-label">${titleEl}${locationEl}</div>`
      : '';

    return `
      <div class="cal-event"
          style="height: ${elHeight}px; top: ${elTop}px; width: ${width}%">
          ${labelEl}
          <span class="cal-event-time">${this.getEventTime(calEvent)}</span>
      </div>   
    `;
  };

  /**
   * Render calendar events.
   */
  renderEvents() {
    const events = `
      <div class="cal-events">
        ${this.calEvents.map((event) => this.createSingleEvent(event)).join('')}
      </div>
    `;
    document.getElementById(this.appNodeId).innerHTML += events;
  };

  setConcurrency() {
    this.calEvents.forEach((event, index, thisEvents) => {
      // Filter events / reduce to get concurrents
      const concurrents = thisEvents.filter((comparedEvent, comparedIndex) => {
        return (
          // Has to start before orig ends, and end after orig starts
          index !== comparedIndex
          && comparedEvent.starts_at < event.starts_at + event.duration
          && comparedEvent.starts_at + comparedEvent.duration > event.starts_at
        )
      });
      event.concurrents = concurrents;
    })
  };

  compareConcurrency() {
    this.calEvents.forEach((event) => {
      event.concurrentCount =
        event.concurrents.length
          ? event.concurrents.reduce((accum, curr) => Math.max(accum, curr.concurrents.length), event.concurrents.length)
          : 0;
    })
  };
}

/**
 * Global wrapper function to render app.
 *
 * @param {Object[].<number, string>} calEvents Array of events objects.
 */
const renderEvents = function(events) {
  new Events(events);
};

/**
 * Sample events array.
 */

/**
 * This now contains edge case which breaks layout.
 * Look at implementing logic that checks and sets max number potential simultaneous events.
 * So, 'Lunch with Karl' would have a value of 2, but the previous event only takes up 1/3.
 * also an issue w/ Sync with john. hmmm...
 * How can we
 */
const eventsArray = [
  {starts_at: 120, duration: 45, title: "Meeting with Ben", location: "Coffee Shop"},
  {starts_at: 135, duration: 215, title: "Another Meeting with Ben", location: "Coffee Shop by the tracks"},
  {starts_at: 240, duration: 60, title: "Lunch with Karl", location: "TBA"},
  {starts_at: 75, duration: 60, title: "Sync with John"},
  {starts_at: 360, duration: 25},
  {starts_at: 420, duration: 120}
];