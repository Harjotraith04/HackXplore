import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../firebaseConfig";
import { collection, query, where, getDocs } from "firebase/firestore";

function LoginPage({ setIsLoggedIn, setUserType }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  
  const handleLogin = async (event) => {
    event.preventDefault();
    console.log("Login button clicked");

    try {
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("email", "==", email), where("password", "==", password));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        const fetchedUserType = userData.userType;
        const userId = userDoc.id; // This is the user ID

        setUserType(fetchedUserType);

        if (fetchedUserType === "student") {
          navigate(`/student/${userId}`);
        } else if (fetchedUserType === "teacher") {
          navigate(`/teacher/${userId}`);
        } else if (fetchedUserType === "admin") {
          navigate(`/admin/${userId}`);
        } else {
          console.log("Unknown user type");
        }

        setIsLoggedIn(true);
        setError("");
      } else {
        setError("Invalid email or password");
      }
    } catch (error) {
      console.error("Error logging in: ", error);
      alert("Failed to log in. Please check your email and password.");
      setEmail("");
      setPassword("");
      setError("Failed to log in. Please check your email and password.");
    }
  };

  const sampleCredentials = [
    { role: "Student", email: "hitz123@gmail.com", password: "Hitz123@#" },
    { role: "Teacher", email: "sakshi123@gmail.com", password: "Sakshi123@#" },
    { role: "Admin", email: "bhavya123@gmail.com", password: "Bhavya123@#" },
  ];

  return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="flex flex-col md:flex-row items-center">
        <div className="mb-8 md:mb-0 md:mr-8">
          <img
            src="https://tecdn.b-cdn.net/img/Photos/new-templates/bootstrap-login-form/draw2.webp"
            alt="Image"
            className="w-128"
          />
        </div>
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <button
            onClick={() => navigate("/")}
            className="bg-white flex items-center text-blue-500 hover:text-blue-700 mb-4 transition"
          >
            <span className="mr-2">←</span> Go Back
          </button>
          <h1 className="text-3xl font-bold mb-6 text-center text-black">Login</h1>
          {error && <p className="text-red-500 mb-4">{error}</p>}
          <form onSubmit={handleLogin}>
            <label htmlFor="email" className="block text-gray-700 mb-2">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full p-2 mb-4 border border-gray-300 rounded"
            />
            <label htmlFor="password" className="block text-gray-700 mb-2">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full p-2 mb-4 border border-gray-300 rounded"
            />
            <button
              type="submit"
              className="w-full p-2 bg-blue-500 text-white font-semibold rounded hover:bg-blue-700 transition"
            >
              Login
            </button>
          </form>

          {/* Sample Credentials Carousel */}
          <div className="mt-6">
            <h2 className="text-lg font-bold text-black text-center mb-4">Sample Credentials</h2>
            <div className="flex overflow-x-auto space-x-4 pb-4">
              {sampleCredentials.map((cred, index) => (
                <div
                  key={index}
                  className="text-black flex-none p-4 border rounded-lg bg-gray-100 hover:bg-gray-200 transition cursor-pointer min-w-[350px] mx-2"
                  onClick={() => {
                    setEmail(cred.email);
                    setPassword(cred.password);
                  }}
                >
                  <p className="text-center font-semibold">{cred.role}</p>
                  <p className="text-center text-sm text-gray-600">
                    <strong>Email:</strong> {cred.email}
                  </p>
                  <p className="text-center text-sm text-gray-600">
                    <strong>Password:</strong> {cred.password}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
