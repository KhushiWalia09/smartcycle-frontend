import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup 
} from "firebase/auth";

import { auth, db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import "./Auth.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const provider = new GoogleAuthProvider();

  const [modal, setModal] = useState({ isOpen: false, title: "", message: "", type: "info" });

  const showModal = (title, message, type = "info") => {
    setModal({ isOpen: true, title, message, type });
  };

  // 🔥 Redirect if already logged in
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists() && userDoc.data().role === "admin") {
            navigate("/admin");
          } else {
            navigate("/dashboard");
          }
        } catch (error) {
          console.error("Error during auth state change redirect:", error);
          // Fallback to dashboard if Firestore check fails but user is authenticated
          navigate("/dashboard");
        }
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  // 🔵 Google Login
  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } catch (firestoreError) {
        console.error("Firestore error after Google login:", firestoreError);
        navigate("/dashboard");
      }
    } catch (error) {
      showModal("Oops!", error.message, "error");
    }
  };

  // 🔵 Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      const user = result.user;
      
      try {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists() && userDoc.data().role === "admin") {
          navigate("/admin");
        } else {
          navigate("/dashboard");
        }
      } catch (firestoreError) {
        console.error("Firestore error after email login:", firestoreError);
        navigate("/dashboard");
      }
    } catch (error) {
      showModal("Login Failed", error.message, "error");
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card glass-card">
        <h2 className="outfit-font">Welcome Back</h2>

        <form className="auth-form" onSubmit={handleLogin}>
          <div className="auth-input-group">
            <label>Email Address</label>
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="auth-input-group">
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="auth-btn">
            Login
          </button>
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
          Don't have an account?{" "}
          <span onClick={() => navigate("/signup")}>Sign Up</span>
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
