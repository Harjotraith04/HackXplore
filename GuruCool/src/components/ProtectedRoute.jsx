import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ element, isLoggedIn, userType, requiredUserType }) => {
  // Debugging information
  console.log('ProtectedRoute:', { isLoggedIn, userType, requiredUserType });

  return isLoggedIn && userType === requiredUserType ? (
    element
  ) : (
    <Navigate to="/login" />
  );
};

export default ProtectedRoute;
