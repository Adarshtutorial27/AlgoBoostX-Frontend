import React from 'react';
import { Navigate } from 'react-router-dom';
import LoginPage from './LoginPage';

export const SignupPage = () => {
  return <Navigate to="/login?tab=signup" replace />;
};

export default SignupPage;
