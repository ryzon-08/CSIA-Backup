import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/authcontext.jsx";

// ProtectedRoute component to guard routes based on authentication status
const ProtectedRoute = ({ children }) => {
  //Get authentication status from auth context
  const { isAuth } = useAuth();

  //If not authenticated, redirect to login page
  if (!isAuth) {
    return <Navigate to="/" replace />;
  }
//If authenticated, render the child components
  return children;
};

export default ProtectedRoute;