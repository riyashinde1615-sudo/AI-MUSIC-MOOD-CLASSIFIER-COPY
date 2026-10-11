import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();

    if (
      !name.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      alert("Please fill all fields");
      return;
    }

    if (password.length < 6) {
      alert("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email.trim())) {
      alert("Please enter a valid email address");
      return;
    }

    // Demo registration only — details are not saved to a backend.
    alert("Registration Successful");
    navigate("/");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="music-logo">🎵</div>

        <h1>Create Account</h1>

        <h2>AI Music Mood Classifier</h2>

        <p className="subtitle">
          Register to analyze your music mood
        </p>

        <form onSubmit={handleRegister}>
          <label>Full Name</label>

          <input
            type="text"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />

          <label>Email</label>

          <input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />

          <label>Password</label>

          <input
            type="password"
            placeholder="Create password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />

          <label>Confirm Password</label>

          <input
            type="password"
            placeholder="Confirm password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={6}
            required
          />

          <button type="submit">
            Create Account
          </button>
        </form>

        <p className="register-link">
          Already have an account?{" "}
          <Link to="/">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Register;