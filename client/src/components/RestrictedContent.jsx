import { useContext, useEffect, useRef } from "react";
import { AuthContext } from "../context/AuthContext";
import { useLocation, Navigate } from "react-router-dom";
import { App } from "antd";

function RestrictedContent({ children, requiredRole, bannedMessage }) {
    const { user } = useContext(AuthContext);
    const { message } = App.useApp();
    const location = useLocation()
    const notifiedRef = useRef(false);
    const from = location.state?.from; // this will be the page user came from
    // console.log(from)
    const dateUnban = user?.stat_update
        ? new Date(user.stat_update).toLocaleString()
        : null;

    const isBanned = user?.status === "banned";
    const noRole = requiredRole && !requiredRole.includes(user?.role);

    useEffect(() => {
        if (!notifiedRef.current) {
            if (isBanned) {
                message.error(
                    <div>
                        {bannedMessage || "⚠️ Your account is banned. You cannot use this feature."}
                        {dateUnban && (
                            <>
                                <br />
                                Until: {dateUnban}
                            </>
                        )}
                    </div>
                );

            } else if (noRole) {
                message.error("🚫 You don’t have permission to access this content.");
            }
            notifiedRef.current = true;
        }
    }, [isBanned, noRole, bannedMessage, dateUnban, message]);

    if (isBanned || noRole) {
        if (from) {
            return <Navigate to={from} />;
        }
        return
    }

    return <>{children}</>;
}

export default RestrictedContent;
