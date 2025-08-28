import { useContext, useRef, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { message } from "antd";

function ProtectedRoute({ children, messageText }) {
    const { user } = useContext(AuthContext);
    const location = useLocation(); // helps to know which page user tried to access
    const notifiedRef = useRef(false);

    useEffect(() => {
        if (!user && !notifiedRef.current) {
            message.error(messageText || "You must be logged in to access this page");
            notifiedRef.current = true;
        }
    }, [user, messageText]);
    // console.log('Location:', location);
    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    return children;
}

export default ProtectedRoute;
