import { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { message } from "antd";

function ProtectedRoute({ children }) {
    const { user } = useContext(AuthContext);

    if (!user) {
        message.error("You must be logged in to access this page");
        return <Navigate to="/login" replace />;
    }

    return children;
}

export default ProtectedRoute;
