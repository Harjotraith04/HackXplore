import React from 'react';
import { Route, Redirect } from 'react-router-dom';

const ProtectedRoute = ({ element: Element, isLoggedIn, userType, requiredUserType, ...rest }) => {
  return (
    <Route
      {...rest}
      render={(props) =>
        isLoggedIn && userType === requiredUserType ? (
          <Element {...props} />
        ) : (
          <Redirect to="/login" />
        )
      }
    />
  );
};

export default ProtectedRoute;
