// Navigation/Navigation.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from '../Pages/Home';
import Agent from '../Pages/Agent';
import Application from '../Pages/Application'; 

function Navigation() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/agent" element={<Agent />} />
                <Route path="/application/:key" element={<Application />} />
            </Routes>
        </Router>
    );
}

export default Navigation;