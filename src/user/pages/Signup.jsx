import { 
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup 
} from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, setDoc } from "firebase/firestore";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Auth.css";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const showModal = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  const signup = async () => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      // 🔥 Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        role: "user", // Default role
        createdAt: new Date().toISOString()
      });

      navigate("/dashboard");
    } catch (err) {
      showModal("Signup Failed", err.message, "error");
    }
  };

  // 🔵 Google Login (Signup)
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // 🔥 Ensure user document exists (for Google Login)
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        role: "user",
        createdAt: new Date().toISOString()
      }, { merge: true }); // Use merge to avoid overwriting existing role if they already have one

      navigate("/dashboard");
    } catch (error) {
      showModal("Oops!", error.message, "error");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <h2 className="outfit-font">Create Account</h2>
        <form className="auth-form" onSubmit={(e) => { e.preventDefault(); signup(); }}>
          <div className="auth-input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="auth-input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Create a password"
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="auth-btn">Sign Up</button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        {/* 🔵 Google Button */}
        <button onClick={handleGoogleLogin} className="google-btn">
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" />
          Continue with Google
        </button>

        <p className="toggle-link">
          Already have an account? <span onClick={() => navigate("/login")}>Login</span>
        </p>
      </div>

      {/* 🌸 Custom Cute Modal */}
      {modal.isOpen && (
        <div className="modal-overlay" onClick={() => setModal({ ...modal, isOpen: false })}>
          <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
            <div className={`modal-header ${modal.type}`}>
              <h3>{modal.title}</h3>
              <button className="close-btn" onClick={() => setModal({ ...modal, isOpen: false })}>✕</button>
            </div>
            <div className="modal-body text-main">
              <p>{modal.message}</p>
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
