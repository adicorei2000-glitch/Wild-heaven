import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Header from "./components/ui/header";
import Home from "./pages/Home";
const About = lazy(() => import("./pages/About"));
const Login = lazy(() => import("./pages/login"));
const Signup = lazy(() => import("./pages/signup"));
const VillaDetails = lazy(() => import("./pages/villadetails"));
import Footer from "./components/ui/footer";
import ErrorBoundary from "./components/ui/error-boundary";
const MyBookings = lazy(() => import("./pages/MyBookings"));
const Favorites = lazy(() => import("./pages/favorites"));
const ForgotPassword = lazy(() => import("./pages/forgot-password"));
const ResetPassword = lazy(() => import("./pages/reset-password"));
const Admin = lazy(() => import("./pages/admin"));
const Profile = lazy(() => import("./pages/profile"));
const NotFound = lazy(() => import("./pages/NotFound"));

function PageSkeleton() {
  return (
    <div className="container mx-auto min-h-[60vh] animate-pulse space-y-4 px-4 py-10">
      <div className="h-8 w-1/3 rounded bg-muted" />
      <div className="h-64 rounded-xl bg-muted" />
      <div className="h-4 w-2/3 rounded bg-muted" />
      <div className="h-4 w-1/2 rounded bg-muted" />
    </div>
  );
}

function App() {
  return (
    <>
      <Header />
      <ErrorBoundary>
      <Suspense fallback={<PageSkeleton />}>
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
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      </ErrorBoundary>
      <Footer />
    </>
  );
}

export default App;
