
import { Routes, Route } from 'react-router-dom';
import React, { useContext } from 'react'

import { AuthContext } from './context/AuthContext';

import NavBar from './components/Navbar';
import Footer from './components/Footer';

import './App.css';

import Home from './pages/Home';
import { Login, Register } from './pages/Form'
import Profile from "./pages/Profile";
import RecipesAndSearchPage from './pages/Search';
import Sharepage from './pages/Sharepage';
import Recipespage from './pages/Recipespage';
import EditRecipePage from './pages/EditRecipePage';
import AdminPage from './pages/AdminPage';

import ProtectedRoute from './components/Protectroute';
function App() {
  const { user } = useContext(AuthContext);
  const isLoggedIn = !!user;
  return (
    <div className="App">
      <NavBar isLoggedIn={isLoggedIn} />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route path="/admin" element={
          <ProtectedRoute
            messageText="You must be an admin to access this page"
            requiredRole={['admin']}>
            <AdminPage />
          </ProtectedRoute>
        } />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/share"
          element={
            <ProtectedRoute messageText="You must be logged in to share recipes">
              <Sharepage />
            </ProtectedRoute>
          }
        />

        <Route path="/recipes" element={<RecipesAndSearchPage />} />
        <Route path="/search" element={<RecipesAndSearchPage />} />
        <Route path="/recipes/:id" element={<Recipespage />} />
        <Route
          path="/recipes/:id/edit"
          element={
            <ProtectedRoute messageText="You must be logged in to edit recipes">
              <EditRecipePage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<p>404 Not Found</p>} />
      </Routes>
      <Footer />
    </div>
  );
}

export default App;
