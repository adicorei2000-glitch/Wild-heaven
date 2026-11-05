import { Routes, Route } from "react-router-dom";
import Header from "./components/ui/header";
import Home from "./pages/Home";
import About from "./pages/About";
import Login from "./pages/login";
import Signup from "./pages/signup";
import VillaDetails from "./pages/villadetails";
import Footer from "./components/ui/footer";
import MyBookings from "./pages/MyBookings";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/villa/:id" element={<VillaDetails />} />
        <Route path="/my-bookings" element={<MyBookings />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
