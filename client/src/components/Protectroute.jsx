import { useContext, useRef, useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { message } from "antd";

function ProtectedRoute({ children, messageText, requiredRole }) {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const notifiedRef = useRef(false);

    const hasAccess =
        !requiredRole || // no role restriction
        (user && requiredRole.includes(user.role));

    useEffect(() => {
        if (!notifiedRef.current) {
            if (!user) {
                message.error(messageText || "You must be logged in to access this page");
            } else if (!hasAccess) {
                message.error("You don’t have permission to access this page");
            }
            notifiedRef.current = true;
        }
    }, [user, messageText, hasAccess]);


    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!hasAccess) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
