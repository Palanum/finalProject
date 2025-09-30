import { useContext, useRef, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { App } from "antd";

function ProtectedRoute({ children, messageText, requiredRole }) {
    const { user } = useContext(AuthContext);
    const location = useLocation();
    const notifiedRef = useRef(false);
    const { message } = App.useApp();

    const hasAccess =
        !requiredRole || (user && requiredRole.includes(user.role));

    useEffect(() => {
        if (!notifiedRef.current) {
            if (!user) {
                message.error(messageText || "โปรดเข้าสู่ระบบ");
            } else if (!hasAccess) {
                message.error("โปรดติดต่อผู้ดูแลระบบ");
            }
            notifiedRef.current = true;
        }
    }, [user, messageText, hasAccess, message]);

    if (!user) {
        return <Navigate to="/login" replace state={{ from: location }} />;
    }

    if (!hasAccess) {
        return <Navigate to="/" replace />;
    }

    return children;
}

export default ProtectedRoute;
