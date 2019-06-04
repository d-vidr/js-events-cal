class Events {
  appNodeId = 'calendar';
  startTime = 9; // The start time.
  hoursInCalDay = 12; // The number of hours to be shown in day.
  hourInPixels = 60; // How many vertical pixels represent an hour.
  sortedEvents = [];
  simultaneousEventPositions = [];
  eventColTotals = [];

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
    this.sortedEvents = events.slice().sort(this.compareStartTime);
    this.setPositions();
    this.resetAppContainer();
    this.renderCalHourBlocks();
    this.renderEvents();
    console.log(this.sortedEvents);
    console.log(this.simultaneousEventPositions);
    console.log(this.eventColTotals);
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
  createSingleEvent(calEvent, index) {
    const elHeight = calEvent.duration * this.hourInPixels/60;
    const elTop = this.calcTimePixelPos(calEvent.starts_at);
    const width = 100 / this.eventColTotals[index];
    const leftPos = (this.simultaneousEventPositions[index] - 1) * width;

    const titleEl =
      calEvent.title
      ? `<span class="cal-event-title">${calEvent.title}</span>`
      : '';
    const locationEl =
      calEvent.title
      ? `<span class="cal-event-location">${calEvent.location}</span>`
      : '';
    const labelEl =
      titleEl || locationEl
      ? `<div class="cal-event-label">${titleEl}${locationEl}</div>`
      : '';

    return `
      <div class="cal-event"
          style="
            height: ${elHeight}px;
            top: ${elTop}px;
            width: ${width}%;
            left: ${leftPos}%;
            ">
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
        ${this.sortedEvents.map((event, index) => this.createSingleEvent(event, index)).join('')}
      </div>
    `;
    document.getElementById(this.appNodeId).innerHTML += events;
  };

  setPositions() {
    let eventMap = [];
    let col = 0;
    let eventColTotalsOffset = 0;
    this.sortedEvents.forEach((event, index) => {
      const startTime = event.starts_at;
      const endTime = event.starts_at + event.duration;

      // For first column
      if (!eventMap.length) {
        eventMap[1] = endTime;
        col++;
        console.log(`eventMap[1]: ${endTime}`);
        this.simultaneousEventPositions[index] = col;
        return;
      }

      const latestEndTime = eventMap.reduce((acc, item) => item > acc ? item : acc);
      const earliestEndTime = eventMap.reduce((acc, item) => item < acc ? item : acc);
      let cols = 0;
      // If start time > = all end times up to this point, start a new "row"
      if (startTime >= latestEndTime) {
        // At this point we also know total cols for events up to this point.
        // We want to set all indexes up to current index
        // @todo use the zero based array better
        cols = eventMap.length-1;
        for (let idx = eventColTotalsOffset; idx <= index; idx++) {
          this.eventColTotals[idx] = cols;
        }
        eventColTotalsOffset = index;
        console.log(eventMap);
        col = 0;
        eventMap = [];
        eventMap[col+1] = endTime;
        console.log(`RESET eventMap[${col+1}]: ${endTime}, offset: ${eventColTotalsOffset}`);
        this.simultaneousEventPositions[index] = col+1;
        return;
      }

      // If start time < at least one end times, add col
      if (startTime < earliestEndTime) {
        col++;
        eventMap[col] = endTime;
        console.log(`eventMap[${col}]: ${endTime}`);
        this.simultaneousEventPositions[index] = col;
        // @todo: DRY this
        // If last item, set eventColTotals again
        if (index === this.sortedEvents.length - 1) {
          cols = eventMap.length-1;
          console.log(`offset: ${eventColTotalsOffset}, index: ${index}`);
          for (let idx = eventColTotalsOffset; idx <= index; idx++) {
            this.eventColTotals[idx] = cols;
          }
        }
        return;
      }

      // If we make it here, we need to loop through eventMap to find earliest value ending before start time
      // and get index to assign
      const position = eventMap.reduce((acc, endTime, colIndex) => endTime <= startTime ? colIndex : acc, 1);
      eventMap[position] = endTime;
      console.log(eventMap);
      console.log(`UPDATE eventMap[${position}]: ${endTime}`);
      this.simultaneousEventPositions[index] = position;

      // If last item, set eventColTotals again
      if (index === this.sortedEvents.length - 1) {
        cols = eventMap.length-1;
        console.log(`offset: ${eventColTotalsOffset}, index: ${index}`);
        for (let idx = eventColTotalsOffset; idx <= index; idx++) {
          this.eventColTotals[idx] = cols;
        }
      }
    })
  }

  /**
   * Compare function for sorting events by start time.
   *
   * @param {number} a Number to compare.
   * @param {number} b Number to compare.
   * @returns {number} Number for sort function representing <, >, =.
   */
  compareStartTime(a,b) {
    if (a.starts_at < b.starts_at) {
      return -1;
    }
    if (a.starts_at > b.starts_at) {
      return 1;
    }
    return 0;
  };
}

/**
 * Global wrapper function to render app.
 *
 * @param {Object[].<number, string>} sortedEvents Array of events objects.
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
  {starts_at: 120, duration: 45, title: "1 Meeting with Ben", location: "Coffee Shop"},
  {starts_at: 135, duration: 215, title: "2 Meeting with Ben", location: "Coffee Shop by the tracks"},
  {starts_at: 240, duration: 60, title: "1 Lunch with Karl", location: "TBA"},
  {starts_at: 75, duration: 60, title: "1 Sync with John"},
  {starts_at: 360, duration: 25},
  {starts_at: 460, duration: 120},
  {starts_at: 120, duration: 45, title: "3 Meeting with Ben", location: "Coffee Shop"},
  {starts_at: 135, duration: 215, title: "4 Another Meeting with Ben", location: "Coffee Shop by the tracks"},
  {starts_at: 240, duration: 60, title: "2 Lunch with Karl", location: "TBA"},
  {starts_at: 75, duration: 60, title: "2 Sync with John"},
  {starts_at: 360, duration: 25},
  {starts_at: 470, duration: 120},
  {starts_at: 220, duration: 45, title: "4 Meeting with Ben", location: "Coffee Shop"},
  {starts_at: 35, duration: 115, title: "5 Another Meeting with Ben", location: "Coffee Shop by the tracks"},
  {starts_at: 40, duration: 390, title: "3 Lunch with Karl", location: "TBA"},
  {starts_at: 175, duration: 15, title: "3 Sync with John"},
  {starts_at: 460, duration: 150},
  {starts_at: 450, duration: 60},
  {starts_at: 470, duration: 115, title: "6 Another Meeting with Ben", location: "Coffee Shop by the tracks"},
  {starts_at: 470, duration: 390, title: "4 Lunch with Karl", location: "TBA"},
];

// 120-165, 135-350, 240-300, 75-135, 360-385, 420-540

