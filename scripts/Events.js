class Events {

  constructor(calEvents) {
    this.appNodeId = 'calendar';
    this.startTime = 9; // The start time.
    this.hoursInCalDay = 12; // The number of hours to be shown in day.
    this.hourInPixels = 60; // How many vertical pixels represent an hour.
    this.sortedEvents = []; // Copy of events array that is passed in, then sorted by time.
    this.simultaneousEventPositions = []; // Array of column positions, ie
    this.eventColTotals = []; // Array of column totals for each event index. IE, 4 means 4 columns, one event would be 25%
    this.eventColTotalsOffset = 0;

    if (! calEvents || ! Array.isArray(calEvents) || ! calEvents.length) {
      alert('Please supply an array of events.');
      return;
    }

    this.sortEvents(calEvents);
    this.setPositions();
    this.renderCalHourBlocks();
    this.renderEvents();
  }

  /**
   * Sort events.
   *
   * @param calEvents
   */
  sortEvents(calEvents) {
    this.sortedEvents = calEvents.slice().sort(this.compareStartTime);
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

  setPositions() {
    let eventMap = [];
    let col = 0;

    this.sortedEvents.forEach((event, index) => {
      const startTime = event.starts_at;
      const endTime = event.starts_at + event.duration;

      // First column
      if (!eventMap.length) {
        eventMap[col] = endTime;
        this.simultaneousEventPositions[index] = col;
        this.setColTotals(index, eventMap);
        col++;
        return;
      }

      const latestEndTime = eventMap.reduce((acc, item) => item > acc ? item : acc);
      const earliestEndTime = eventMap.reduce((acc, item) => item < acc ? item : acc);

      // If start time > = all end times up to this point, start a new row.
      if (startTime >= latestEndTime) {
        // Set col totals first b/c we are about to start a new row
        this.setColTotals(index, eventMap, true);
        col = 0;
        eventMap = [];
        eventMap[col] = endTime;
        this.simultaneousEventPositions[index] = col;
        col++;
        return;
      }

      // If start time < earliest end time, add a column.
      if (startTime < earliestEndTime) {
        eventMap[col] = endTime;
        this.simultaneousEventPositions[index] = col;
        this.setColTotals(index, eventMap);
        col++;
        return;
      }

      // Loop through eventMap to find lowest value < start time and assign to that column.
      const position = eventMap.reduce((acc, endTime, colIndex) => endTime <= startTime ? colIndex : acc, 1);
      eventMap[position] = endTime;
      this.simultaneousEventPositions[index] = position;
      this.setColTotals(index, eventMap);
      col++;
    })
  }

  setColTotals(index, eventMap, manualOverride = false) {
    if (index === this.sortedEvents.length - 1 || manualOverride) {
      const cols = eventMap.length;
      for (let idx = this.eventColTotalsOffset; idx <= index; idx++) {
        this.eventColTotals[idx] = cols;
      }
      this.eventColTotalsOffset = index;
    }
  }

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
  };

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

  /**
   * Create single event DOM element.
   *
   * @param {Object.<number, string>} calEvent Events object.
   */
  createSingleEvent(calEvent, index) {
    const elHeight = calEvent.duration * this.hourInPixels/60;
    const elTop = this.calcTimePixelPos(calEvent.starts_at);
    const width = 100 / this.eventColTotals[index];
    const leftPos = (this.simultaneousEventPositions[index]) * width;

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
  {starts_at: 35, duration: 115, title: "5 Another Meeting with Ben", location: "Coffee Shop by the tracks"},
  {starts_at: 40, duration: 390, title: "3 Lunch with Karl", location: "TBA"},
  // {starts_at: 175, duration: 15, title: "3 Sync with John"},
  {starts_at: 460, duration: 150},
  // {starts_at: 450, duration: 60},
  {starts_at: 470, duration: 390, title: "4 Lunch with Karl", location: "TBA"},
// ];
// const eventsArray = [
  {starts_at: 75, duration: 60, title: "1 Sync with John"},
  {starts_at: 440, duration: 20},
  {starts_at: 460, duration: 120},
  {starts_at: 120, duration: 45, title: "3 Meeting with Ben", location: "Coffee Shop"},
];


