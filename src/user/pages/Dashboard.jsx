import { useEffect, useState } from "react";
import { auth } from "../../firebase";
import { onAuthStateChanged } from "firebase/auth";
import { db } from "../../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
} from "firebase/firestore";
import "./Dashboard.css";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedStartDate, setSelectedStartDate] = useState(null);
  const [selectedEndDate, setSelectedEndDate] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [showSafeDays, setShowSafeDays] = useState(false);
  const [symptoms, setSymptoms] = useState([]);
  const [isSymptomModalOpen, setIsSymptomModalOpen] = useState(false);
  const [selectedSymptoms, setSelectedSymptoms] = useState([]);
  const [selectedMood, setSelectedMood] = useState("");
  const [notes, setNotes] = useState("");
  
  // 🔹 Custom Modal State
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  const showModal = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  // 🔹 Fetch cycle history
  const fetchHistory = async (uid) => {
    try {
      const q = query(collection(db, "periods"), where("uid", "==", uid));
      const snapshot = await getDocs(q);

      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      records.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));
      setHistory(records);
    } catch (error) {
      console.error("Error fetching history:", error);
      showModal("History Error", "Could not load your cycle history. Please check your permissions. 🛡️", "error");
    }
  };

  const fetchSymptoms = async (uid) => {
    try {
      const q = query(collection(db, "symptoms"), where("uid", "==", uid));
      const snapshot = await getDocs(q);
      const records = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setSymptoms(records);
    } catch (error) {
      console.error("Error fetching symptoms:", error);
      // We don't necessarily need to show another modal here if fetchHistory already showed one
    }
  };

  const deletePeriod = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this record?");
    if (!confirmDelete) return;

    try {
      await deleteDoc(doc(db, "periods", id));
      fetchHistory(user.uid);
      showModal("Success", "Record deleted successfully!");
    } catch (error) {
      showModal("Error", "Failed to delete record.", "error");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchHistory(currentUser.uid);
        fetchSymptoms(currentUser.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const savePeriod = async () => {
    if (!user || !selectedStartDate || !selectedEndDate) {
      showModal("Wait!", "Please select the start and end dates on the calendar first.", "warning");
      return;
    }

    try {
      await addDoc(collection(db, "periods"), {
        uid: user.uid,
        startDate: selectedStartDate.toISOString().split('T')[0],
        endDate: selectedEndDate.toISOString().split('T')[0],
        createdAt: new Date(),
      });

      showModal("Great!", "Your period data has been saved successfully. ✨");
      setSelectedStartDate(null);
      setSelectedEndDate(null);
      fetchHistory(user.uid);
    } catch (error) {
      showModal("Oops!", "Something went wrong while saving: " + error.message, "error");
    }
  };

  const saveSymptom = async () => {
    if (!user || !selectedStartDate) {
      showModal("Wait!", "Please select a date on the calendar first.", "warning");
      return;
    }

    try {
      await addDoc(collection(db, "symptoms"), {
        uid: user.uid,
        date: selectedStartDate.toISOString().split('T')[0],
        mood: selectedMood,
        symptoms: selectedSymptoms,
        notes: notes,
        createdAt: new Date(),
      });

      showModal("Saved!", "Your symptoms for today have been logged. 📝");
      setIsSymptomModalOpen(false);
      setSelectedSymptoms([]);
      setSelectedMood("");
      setNotes("");
      fetchSymptoms(user.uid);
    } catch (error) {
      showModal("Oops!", "Something went wrong while saving: " + error.message, "error");
    }
  };

  const predictNextCycle = async () => {
    if (history.length < 2) {
      showModal("Need More Data", "Please add at least 2 periods so I can learn your cycle! 📈", "info");
      return;
    }

    const dates = history
      .map((h) => h.startDate)
      .sort((a, b) => new Date(a) - new Date(b));

    let cycles = [];
    for (let i = 1; i < dates.length; i++) {
      const diff = (new Date(dates[i]) - new Date(dates[i - 1])) / (1000 * 60 * 60 * 24);
      cycles.push(Math.round(diff));
    }

    try {
      const res = await fetch(`${process.env.REACT_APP_API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cycles }),
      });

      if (!res.ok) throw new Error("Server error");
      const data = await res.json();
      setPrediction(data.next_cycle_length);

      // 🔹 Calculate days until next period
      if (!history || history.length === 0) {
        showModal("Prediction Ready", `Your next cycle is predicted to be **${data.next_cycle_length} days**.`, "success");
        return;
      }

      const lastStart = new Date(history[0].startDate);
      const nextDate = new Date(lastStart);
      nextDate.setDate(lastStart.getDate() + data.next_cycle_length);
      
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const diffTime = nextDate - today;
      const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const formattedDate = nextDate.toLocaleDateString('default', { month: 'short', day: 'numeric', year: 'numeric' });
      
      let message = "";
      if (daysLeft > 0) {
        message = `Your next period is predicted to start in **${daysLeft} days** (${formattedDate}). Stay prepared! 🌸`;
      } else if (daysLeft === 0) {
        message = `Your next period is predicted to start **today** (${formattedDate}). Take care! 🍵`;
      } else {
        message = `Your next period was predicted for **${Math.abs(daysLeft)} days ago** (${formattedDate}). Is everything okay? 🩹`;
      }

      showModal("Prediction Ready", message, "success");
    } catch (err) {
      showModal("Backend Offline", "I couldn't reach the prediction server. Please make sure the backend is running! 🔌", "error");
    }
  };

  // 📅 Calendar Logic
  const daysInMonth = (year, month) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (year, month) => new Date(year, month, 1).getDay();

  const handleDateClick = (date) => {
    if (!selectedStartDate || (selectedStartDate && selectedEndDate)) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    } else if (date < selectedStartDate) {
      setSelectedStartDate(date);
    } else {
      setSelectedEndDate(date);
    }
  };

  const isPeriodDay = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return history.some(h => dateStr >= h.startDate && dateStr <= h.endDate);
  };

  const hasSymptom = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return symptoms.some(s => s.date === dateStr);
  };

  const isPredictedDay = (date) => {
    if (!prediction || history.length === 0) return false;
    const lastStart = new Date(history[0].startDate);
    const predictedStart = new Date(lastStart);
    predictedStart.setDate(lastStart.getDate() + prediction);
    
    const dateStr = date.toISOString().split('T')[0];
    const predictedStr = predictedStart.toISOString().split('T')[0];
    return dateStr === predictedStr;
  };

  const isSafeDay = (date) => {
    if (!showSafeDays || history.length === 0) return false;
    // Simple safe day logic: Days 1-7 and 21-28 for a 28 day cycle
    // Adjusted logic: approx 14 days before next period is ovulation. Safe is far from that.
    const lastStart = new Date(history[0].startDate);
    const dayDiff = Math.floor((date - lastStart) / (1000 * 60 * 60 * 24)) % 28;
    return (dayDiff >= 0 && dayDiff <= 7) || (dayDiff >= 20 && dayDiff <= 28);
  };

  const renderCalendar = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = [];
    const totalDays = daysInMonth(year, month);
    const startDay = firstDayOfMonth(year, month);

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    for (let i = 1; i <= totalDays; i++) {
      const date = new Date(year, month, i);
      let classes = "calendar-day";
      if (isPeriodDay(date)) classes += " period-day";
      if (isPredictedDay(date)) classes += " predicted-day";
      if (isSafeDay(date)) classes += " safe-day";
      if (hasSymptom(date)) classes += " symptom-day";
      if (date.toDateString() === new Date().toDateString()) classes += " today";
      if (selectedStartDate && date.toDateString() === selectedStartDate.toDateString()) classes += " selected";
      if (selectedEndDate && date.toDateString() === selectedEndDate.toDateString()) classes += " selected";
      
      // Highlight range between selected start and end
      if (selectedStartDate && selectedEndDate && date > selectedStartDate && date < selectedEndDate) {
        classes += " selected-range";
      }

      days.push(
        <div key={i} className={classes} onClick={() => handleDateClick(date)}>
          {i}
        </div>
      );
    }

    return days;
  };

  const changeMonth = (offset) => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));
  };

  if (!user) return <div className="loading">✨ Smart Cycle Loading...</div>;

  return (
    <div className="dashboard-container">
      <div className="dashboard-card glass-card">
        <h2 className="outfit-font">Your Cycle Dashboard</h2>
        <p className="user-email">{user.email}</p>

        <div className="dashboard-content">
          <div className="calendar-section">
            <div className="calendar-header">
              <button className="nav-btn" onClick={() => changeMonth(-1)}>❮</button>
              <h3 className="outfit-font">
                {currentMonth.toLocaleString('default', { month: 'long' })} {currentMonth.getFullYear()}
              </h3>
              <button className="nav-btn" onClick={() => changeMonth(1)}>❯</button>
            </div>
            
            <div className="calendar-grid-header">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>
            <div className="calendar-grid">
              {renderCalendar()}
            </div>
          </div>

          <div className="button-group">
            <button className="primary-btn" onClick={savePeriod}>
              <span>🩸</span> Log Period
            </button>
            <button className="secondary-btn" onClick={predictNextCycle}>
              <span>✨</span> Predict Next
            </button>
            <button className="safe-btn" onClick={() => setShowSafeDays(!showSafeDays)}>
              <span>🛡️</span> {showSafeDays ? "Hide Safe Days" : "Show Safe Periods"}
            </button>
            <button className="symptom-btn" onClick={() => setIsSymptomModalOpen(true)}>
              <span>📝</span> Log Symptoms
            </button>
          </div>

          <hr className="divider" style={{ margin: '30px 0', opacity: 0.1 }} />

          <div className="history-section">
            <h3 className="outfit-font">Recent Cycles</h3>
            {history.length === 0 ? (
              <p className="empty-text">No records yet. Select dates on the calendar to start!</p>
            ) : (
              <ul className="history-list" style={{ listStyle: 'none', padding: 0 }}>
                {history.slice(0, 5).map((item) => (
                  <li key={item.id} className="history-item">
                    <span>
                      📅 {item.startDate} to {item.endDate}
                    </span>
                    <button className="delete-btn" onClick={() => deletePeriod(item.id)}>🗑️</button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      <SymptomModal 
        isOpen={isSymptomModalOpen}
        onClose={() => setIsSymptomModalOpen(false)}
        onSave={saveSymptom}
        selectedSymptoms={selectedSymptoms}
        setSelectedSymptoms={setSelectedSymptoms}
        selectedMood={selectedMood}
        setSelectedMood={setSelectedMood}
        notes={notes}
        setNotes={setNotes}
      />

      {/* 🌸 Custom Cute Modal */}
      {modal.isOpen && (
        <div className="modal-overlay" onClick={() => setModal({ ...modal, isOpen: false })}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-header ${modal.type}`}>
              <h3>{modal.title}</h3>
              <button className="close-btn" onClick={() => setModal({ ...modal, isOpen: false })}>✕</button>
            </div>
            <div className="modal-body text-main">
              <p dangerouslySetInnerHTML={{ __html: modal.message.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}></p>
            </div>
            <div className="modal-footer">
              <button className="modal-btn" onClick={() => setModal({ ...modal, isOpen: false })}>
                Okay! ✨
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const SymptomModal = ({ isOpen, onClose, onSave, selectedSymptoms, setSelectedSymptoms, selectedMood, setSelectedMood, notes, setNotes }) => {
  if (!isOpen) return null;

  const moods = ["Happy", "Sad", "Anxious", "Irritable", "Calm", "Tired"];
  const allSymptoms = ["Cramps", "Bloating", "Headache", "Acne", "Back Pain", "Breast Tenderness"];

  const toggleSymptom = (s) => {
    if (selectedSymptoms.includes(s)) {
      setSelectedSymptoms(selectedSymptoms.filter((item) => item !== s));
    } else {
      setSelectedSymptoms([...selectedSymptoms, s]);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Log Daily Symptoms</h3>
          <button className="close-btn" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="symptom-section">
            <p>How are you feeling?</p>
            <div className="tag-cloud">
              {moods.map(m => (
                <button 
                  key={m} 
                  className={`tag-btn ${selectedMood === m ? 'active' : ''}`}
                  onClick={() => setSelectedMood(m)}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
          <div className="symptom-section">
            <p>Physical Symptoms</p>
            <div className="tag-cloud">
              {allSymptoms.map(s => (
                <button 
                  key={s} 
                  className={`tag-btn ${selectedSymptoms.includes(s) ? 'active' : ''}`}
                  onClick={() => toggleSymptom(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="symptom-section">
            <p>Notes</p>
            <textarea 
              className="notes-area" 
              placeholder="Any other details?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="primary-btn" onClick={onSave}>Save Log ✨</button>
        </div>
      </div>
    </div>
  );
};
