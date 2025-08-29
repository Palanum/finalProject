import React from "react";
import { Typography } from "antd";

const { Text } = Typography;

export default function Videoiframe({ videoURL }) {
    if (!videoURL) {
        return <Text type="danger">No video available</Text>;
    }

    if (videoURL.includes("youtube.com") || videoURL.includes("youtu.be")) {
        return (
            <iframe
                width="100%"
                height="400"
                src={videoURL
                    .replace("watch?v=", "embed/")
                    .replace("youtu.be/", "youtube.com/embed/")}
                title="YouTube video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: 8 }}
            />
        );
    }

    if (videoURL.includes("vimeo.com")) {
        return (
            <iframe
                src={videoURL.replace("vimeo.com", "player.vimeo.com/video")}
                width="100%"
                height="400"
                frameBorder="0"
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: 8 }}
                title="Vimeo video"
            />
        );
    }

    if (videoURL.includes("tiktok.com")) {
        return (
            <iframe
                src={`https://www.tiktok.com/embed/${videoURL.split("/").pop()}`}
                width="100%"
                height="600"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                style={{ borderRadius: 8 }}
                title="TikTok video"
            />
        );
    }

    if (videoURL.includes("facebook.com")) {
        return (
            <iframe
                src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
                    videoURL
                )}&show_text=0&width=560`}
                width="100%"
                height="450"
                style={{ borderRadius: 8 }}
                scrolling="no"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture"
                allowFullScreen
                title="Facebook video"
            />
        );
    }

    // ✅ fallback MP4 player
    return (
        <video
            controls
            style={{ width: "100%", maxHeight: 500, borderRadius: 8 }}
        >
            <source src={videoURL} type="video/mp4" />
            Your browser does not support the video tag.
        </video>
    );
}
