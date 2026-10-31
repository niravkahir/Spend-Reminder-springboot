
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';

import ProtectedRoute, {
    AdminRoute
} from './components/ProtectedRoute';

import AppLayout from './layouts/AppLayout';

import DashboardPage from './pages/DashboardPage';
import ExpensesPage from './pages/ExpensesPage';
import BudgetPage from './pages/BudgetPage';
import InsightsPage from './pages/InsightsPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';

import {
    LoginPage,
    RegisterPage
} from './pages/AuthPages';

import './styles.css';


function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>

                    {/* Public Routes */}
                    <Route
                        path="/login"
                        element={<LoginPage />}
                    />

                    <Route
                        path="/register"
                        element={<RegisterPage />}
                    />


                    {/* Protected User Routes */}
                    <Route element={<ProtectedRoute />}>
                        <Route element={<AppLayout />}>

                            <Route
                                index
                                element={<DashboardPage />}
                            />

                            <Route
                                path="expenses"
                                element={<ExpensesPage />}
                            />

                            <Route
                                path="budget"
                                element={<BudgetPage />}
                            />

                            <Route
                                path="insights"
                                element={<InsightsPage />}
                            />

                            <Route
                                path="profile"
                                element={<ProfilePage />}
                            />

                        </Route>


                        {/* Protected Admin Routes */}
                        <Route element={<AdminRoute />}>
                            <Route element={<AppLayout />}>

                                <Route
                                    path="admin"
                                    element={<AdminPage />}
                                />

                            </Route>
                        </Route>

                    </Route>


                    {/* Fallback Route */}
                    <Route
                path="*"
                element={<LoginPage />}
            />

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}


ReactDOM.createRoot(
    document.getElementById('root')
).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
