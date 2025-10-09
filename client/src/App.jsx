import {BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Login from './components/loginstuff/Login';
import Dashboard from "./pages/dashboard";
import ProtectedRoute from "./components/protectedroute";
import { AuthProv } from "./context/authcontext.jsx";
import InputStock from "./pages/inputstock";
import SalesDashboard from "./pages/salesexpiry.jsx";
import ViewStock from "./pages/viewstock.jsx";
import InputSales from "./pages/inputsales.jsx";
import ViewSales from "./pages/viewsales.jsx";
import InputSalesBill from "./pages/inputsalesbill.jsx";
import ViewExpiry from "./pages/viewexpiry.jsx";
import SalesDetails from "./pages/salesdetails.jsx";





function App() {
  return (
    <AuthProv>
      <Router>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard/>
          </ProtectedRoute>

            } />

          <Route path="/inputstock" element={
            <ProtectedRoute>
              <InputStock/>
            </ProtectedRoute>
          } />

          <Route path="/salesexpiry" element={
            <ProtectedRoute>
              <SalesDashboard/>
            </ProtectedRoute>
           } />

           <Route path="/viewstock" element={
            <ProtectedRoute>
              <ViewStock/>
            </ProtectedRoute>
           } />

           <Route path="/inputsales" element={
            <ProtectedRoute>
              <InputSales/>
            </ProtectedRoute>
           } />

           <Route path="/inputsalesbill" element={
            <ProtectedRoute>
              <InputSalesBill/>
            </ProtectedRoute>
           } />

           <Route path="/viewsales" element={
            <ProtectedRoute>
              <ViewSales/>
            </ProtectedRoute>
           } />

           <Route path="/viewexpiry" element={
            <ProtectedRoute>
              <ViewExpiry/>
            </ProtectedRoute>
           } />

           <Route path="/salesdetails" element={
            <ProtectedRoute>
              <SalesDetails/>
            </ProtectedRoute>
           } />

        
        </Routes>
      </Router>
    </AuthProv>
  );
}

export default App;