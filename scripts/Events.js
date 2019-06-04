'use strict';

/**
 * Events calendar
 */
class EventsCalendar {
  /**
   * Create events calendar.
   * @param {Object[]} calEvents Array of event objects.
   */
  constructor(calEvents) {
    /**
     * Id of html node for rendering element.
     * @type {string}
     */
    this.appNodeId = 'calendar';

    /**
     * The start time.
     * @type {number}
     */
    this.startTime = 9;

    /**
     * Number of hours to be shown in day.
     * @type {number}
     */
    this.hoursInCalDay = 12;

    /**
     * Number of vertical pixels that represent an hour.
     * @type {number}
     */
    this.hourInPixels = 60;

    /**
     * Copy of events array sorted by time.
     * @type {Array}
     */
    this.sortedEvents = [];

    /**
     * Array of column positions, zero based. Ie col 1 = 0. Used to calculate left position of event.
     * @type {Array}
     */
    this.simultaneousEventPositions = [];

    /**
     * Total columns for each event. Used to calculate width of event.
     * @type {Array}
     */
    this.eventColTotals = [];

    /**
     * Column totals offset. Used for storing offset while calculating eventColTotals.
     * @type {number}
     */
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
   * @param {Object[]} calEvents Array of event objects.
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

  /**
   * Set event positions (simultaneousEventPositions, eventColTotals)
   */
  setPositions() {
    /**
     * Array of end times associated to a column (represented by zero based index). This is used to store previous event
     * positions within columns.
     *
     * For example, `eventMap[0] = 120` equates to the first column containing an event with an end time of 120.
     *
     * This information is used to determine if our next event can be placed in the same column or requires a new one.
     * If the current event's start time is later than all the end times in the array, we are essentially starting a
     * new row.
     *
     * @type {Array}
     */
    let eventMap = [];

    /**
     * Current column number (zero based).
     * @type {number}
     */
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

  /**
   * Set column totals.
   * @param index
   * @param eventMap
   * @param manualOverride
   */
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
   * @param {Object} calEvent Events object.
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
