import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/ui/header";
import Home from "./pages/Home";
const About = lazy(() => import("./pages/About"));
const Login = lazy(() => import("./pages/login"));
const Signup = lazy(() => import("./pages/signup"));
const VillaDetails = lazy(() => import("./pages/villadetails"));
import Footer from "./components/ui/footer";
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Favorites = lazy(() => import("./pages/favorites"));
const ForgotPassword = lazy(() => import("./pages/forgot-password"));
const ResetPassword = lazy(() => import("./pages/reset-password"));
const Admin = lazy(() => import("./pages/admin"));
const Profile = lazy(() => import("./pages/profile"));

function App() {
  return (
    <>
      <Header />
      <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/villa/:id" element={<VillaDetails />} />
        <Route path="/my-bookings" element={<MyBookings />} />
        <Route path="/favorites" element={<Favorites />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      </Suspense>
      <Footer />
    </>
  );
}

export default App;
