import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Adjust the path to your Firebase config

const CalendarComponent = ({ userId }) => {
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({
    title: '',
    date: '',
    startTime: '09:00',
    endTime: '10:00',
    allDay: false,
  });
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [showAddEventModal, setShowAddEventModal] = useState(false);
  const [showEditEventModal, setShowEditEventModal] = useState(false);

  // Fetch Events from Firebase
  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'events'));
        const eventsData = querySnapshot.docs
          .map(doc => {
            const eventData = { id: doc.id, ...doc.data() };
            console.log('Fetched Event:', eventData); // Debug: Check fetched data
            return eventData;
          })
          .filter(event => event?.userIds?.includes(userId)); // Filter events for the current user

        const formattedEvents = eventsData.map(event => {
          const startDateTime = new Date(event?.start);
          const endDateTime = new Date(event?.end);

          if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
            console.error('Invalid date or time format:', event?.start, event?.end);
            return null;
          }

          return {
            id: event?.id,
            title: event?.title || 'Untitled Event',
            start: startDateTime.toISOString(),
            end: endDateTime.toISOString(),
            allDay: event?.allDay || false,
          };
        }).filter(event => event !== null);

        setEvents(formattedEvents);
        console.log('Formatted Events:', formattedEvents);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [userId]);

  // Handle date click in the calendar
  const handleDateClick = (arg) => {
    console.log('Date clicked:', arg.dateStr); // Debug: Check clicked date
    setNewEvent({
      ...newEvent,
      date: arg.dateStr,
    });
    setShowAddEventModal(true);
  };

  // Handle event click in the calendar
  const handleEventClick = (clickInfo) => {
    console.log('Event clicked:', clickInfo.event); // Debug: Check clicked event
    const eventId = clickInfo.event._def.publicId;
    setSelectedEvent({
      id: eventId,
      title: clickInfo.event.title,
      start: clickInfo.event.start.toISOString().split('T')[0], // Extract date
      startTime: clickInfo.event.start.toTimeString().substring(0, 5), // Extract time
      endTime: clickInfo.event.end?.toTimeString().substring(0, 5), // Extract time
      allDay: clickInfo.event.allDay,
    });
    setShowEditEventModal(true);
  };

  // Add a new event
  const handleAddEvent = async () => {
    if (newEvent.title && newEvent.date && newEvent.startTime && newEvent.endTime) {
      try {
        const { date, startTime, endTime, allDay } = newEvent;
        const formattedDate = date.split('T')[0];
        console.log(formattedDate);
        const startDateTimeStr = `${formattedDate}T${startTime}:00`; // Correct start time formatting
        const endDateTimeStr = `${formattedDate}T${endTime}:00`; // Correct end time formatting

        // Convert to valid Date objects
        const startDateTime = new Date(startDateTimeStr);
        const endDateTime = new Date(endDateTimeStr);

        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          throw new Error(`Invalid date or time format: ${startDateTimeStr}, ${endDateTimeStr}`);
        }

        const eventToAdd = {
          title: newEvent.title,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          allDay: allDay || false,
          userIds: [userId],
        };

        const docRef = await addDoc(collection(db, 'events'), eventToAdd);
        eventToAdd.id = docRef.id;
        setEvents([...events, eventToAdd]);
        setShowAddEventModal(false);
      } catch (error) {
        console.error('Error adding event:', error.message);
      }
    } else {
      alert('Please fill in all required fields (title, date, start time, and end time)');
    }
  };

  // Update an existing event
  const handleUpdateEvent = async () => {
    if (selectedEvent && selectedEvent.id) {
      try {
        const eventRef = doc(db, 'events', selectedEvent.id);

        const dateOnly = selectedEvent.start.split('T')[0];
        const startDateTimeStr = `${dateOnly}T${selectedEvent.startTime}:00`;
        const endDateTimeStr = `${dateOnly}T${selectedEvent.endTime}:00`;

        const startDateTime = new Date(startDateTimeStr);
        const endDateTime = new Date(endDateTimeStr);

        if (isNaN(startDateTime.getTime()) || isNaN(endDateTime.getTime())) {
          throw new Error(`Invalid date or time format: ${startDateTimeStr}, ${endDateTimeStr}`);
        }

        const updatedEventData = {
          title: selectedEvent.title,
          start: startDateTime.toISOString(),
          end: endDateTime.toISOString(),
          allDay: selectedEvent.allDay,
          userIds: [userId],
        };

        await updateDoc(eventRef, updatedEventData);

        setEvents(events.map(event =>
          event.id === selectedEvent.id ? { ...updatedEventData, id: selectedEvent.id } : event
        ));

        setShowEditEventModal(false);
      } catch (error) {
        console.error('Error updating event:', error.message);
      }
    } else {
      console.error('Error: selectedEvent.id is undefined or invalid');
    }
  };

  // Delete an event
  const handleDeleteEvent = async () => {
    if (selectedEvent && selectedEvent.id) {
      try {
        const eventRef = doc(db, 'events', selectedEvent.id);
        await deleteDoc(eventRef);

        setEvents(events.filter(event => event.id !== selectedEvent.id));
        setShowEditEventModal(false);
      } catch (error) {
        console.error('Error deleting event:', error.message);
      }
    } else {
      console.error('Error: selectedEvent.id is undefined or invalid');
    }
  };

  return (
    <section className="mb-8">
            <style>
        {`
          .fc-timegrid-slot-label {
            color: #ffffff;
          }

          .fc-timegrid-slot {
            color: #ffffff;
          }
          
          .fc-timegrid-axis{
            color: #ffffff;
          }

          .fc-toolbar-title{
            color: #ffffff;
          }

          .fc-list-empty-cushion{
            color: #ffffff;
          }
        `}
      </style>
      <h2 className="text-2xl font-semibold text-white mb-4">Class Calendar</h2>
      <div className="responsive-calendar-container">
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
          initialView={window.innerWidth > 768 ? 'listWeek' : 'listWeek'}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: window.innerWidth > 500 ? 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' : 'timeGridWeek,listWeek',
          }}
          events={events}
          dateClick={handleDateClick}
          eventClick={handleEventClick}
          themeSystem="lumen"
          eventColor="#3498db"
          eventTextColor="#ffffff"
          height="auto"
          contentHeight="auto"
          buttonText={{
            today: 'Today',
            month: 'Month',
            week: 'Week',
            day: 'Day',
            list: 'List',
          }}
        />
      </div>

      {/* Add Event Modal */}
      {showAddEventModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-4 text-black">Add Event</h2>
            <input
              type="text"
              className="block w-full p-2 mb-4 border"
              placeholder="Event Title"
              value={newEvent.title}
              onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
            />
            <input
              type="time"
              className="block w-full p-2 mb-4 border"
              value={newEvent.startTime}
              onChange={(e) => setNewEvent({ ...newEvent, startTime: e.target.value })}
            />
            <input
              type="time"
              className="block w-full p-2 mb-4 border"
              value={newEvent.endTime}
              onChange={(e) => setNewEvent({ ...newEvent, endTime: e.target.value })}
            />
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                className="mr-2"
                checked={newEvent.allDay}
                onChange={(e) => setNewEvent({ ...newEvent, allDay: e.target.checked })}
              />
              <label className="text-black">All Day Event</label>
            </div>
            <button onClick={handleAddEvent} className="bg-blue-500 text-white px-4 py-2 rounded">
              Add Event
            </button>
            <button onClick={() => setShowAddEventModal(false)} className="bg-red-500 text-white px-4 py-2 rounded ml-4">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Event Modal */}
      {showEditEventModal && selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-2xl font-semibold mb-4 text-black">Edit Event</h2>
            <input
              type="text"
              className="block w-full p-2 mb-4 border"
              placeholder="Event Title"
              value={selectedEvent.title || ''}
              onChange={(e) => setSelectedEvent({ ...selectedEvent, title: e.target.value })}
            />
            <input
              type="time"
              className="block w-full p-2 mb-4 border"
              value={selectedEvent.startTime || ''}
              onChange={(e) => setSelectedEvent({ ...selectedEvent, startTime: e.target.value })}
            />
            <input
              type="time"
              className="block w-full p-2 mb-4 border"
              value={selectedEvent.endTime || ''}
              onChange={(e) => setSelectedEvent({ ...selectedEvent, endTime: e.target.value })}
            />
            <button onClick={handleUpdateEvent} className="bg-blue-500 text-white px-4 py-2 rounded">
              Update Event
            </button>
            <button onClick={handleDeleteEvent} className="bg-red-500 text-white px-4 py-2 rounded ml-4">
              Delete Event
            </button>
            <button onClick={() => setShowEditEventModal(false)} className="bg-gray-500 text-white px-4 py-2 rounded ml-4">
              Cancel
            </button>
          </div>
        </div>
      )}
    </section>
  );
};

export default CalendarComponent;
