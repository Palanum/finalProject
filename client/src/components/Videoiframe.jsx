import { useEffect, useState, useRef } from "react";
import { Button } from 'antd';
export default function Videoiframe({ videoURL }) {
    const [type, setType] = useState(null);
    const [embedUrl, setEmbedUrl] = useState(null);

    useEffect(() => {
        if (!videoURL) {
            setType(null);
            setEmbedUrl(null);
            return;
        }

        let service = null;
        let embed = null;

        if (videoURL.includes("youtube.com") || videoURL.includes("youtu.be")) {
            service = "youtube";
            const id = getYouTubeId(videoURL);
            embed = id ? `https://www.youtube.com/embed/${id}` : null;
        } else if (videoURL.includes("vimeo.com")) {
            service = "vimeo";
            const id = videoURL.split("vimeo.com/")[1]?.split(/[?&]/)[0];
            embed = `https://player.vimeo.com/video/${id}`;
            // } else if (videoURL.includes("tiktok.com")) {
            //     service = "tiktok";
        } else if (videoURL.includes("facebook.com")) {
            service = "facebook";
        } else if (videoURL.endsWith(".mp4")) {
            service = "mp4";
            embed = videoURL;
        }

        setType(service);
        setEmbedUrl(embed);
    }, [videoURL]);

    const getYouTubeId = (url) => {
        if (url.includes("watch?v=")) return new URL(url).searchParams.get("v");
        if (url.includes("youtu.be/")) return url.split("youtu.be/")[1].split(/[?&]/)[0];
        return null;
    };

    if (!type) return null;

    // if (type === "tiktok") return <TikTokEmbed url={videoURL} />;
    if (type === "mp4") return <MP4Embed url={embedUrl} />;
    if (type === "facebook") return <FacebookEmbed url={videoURL} />;

    return <IframeEmbed url={embedUrl} />;
}

// ----------------------
// TikTok
function TikTokEmbed({ url }) {
    const ref = useRef(null);

    useEffect(() => {
        if (!url) return;

        ref.current.innerHTML = "";
        const blockquote = document.createElement("blockquote");
        blockquote.className = "tiktok-embed";
        blockquote.cite = url;
        blockquote.dataset.videoId = url.split("/video/")[1]?.split("?")[0];
        blockquote.style.width = "100%";
        ref.current.appendChild(blockquote);

        const existingScript = document.querySelector('script[src="https://www.tiktok.com/embed.js"]');
        if (!existingScript) {
            const script = document.createElement("script");
            script.src = "https://www.tiktok.com/embed.js";
            script.async = true;
            document.body.appendChild(script);
        }
    }, [url]);

    return (
        <div
            ref={ref}
            style={{
                marginTop: 12,
                width: "100%",
                maxWidth: 600,
                display: "flex",
                justifyContent: "center",
            }}
        />
    );
}

// ----------------------
// MP4
function MP4Embed({ url }) {
    return (
        <div
            style={{
                marginTop: 12,
                width: "100%",
                maxWidth: 600,
                display: "flex",
                justifyContent: "center",
            }}
        >
            <video
                src={url}
                controls
                style={{
                    width: "100%",
                    height: "100%",
                    maxHeight: "80vh",
                    objectFit: "contain",
                    borderRadius: 12,
                    backgroundColor: "#000",
                }}
            />
        </div>
    );
}

// ----------------------
// Facebook
function FacebookEmbed({ url }) {
    const [dimension, setDimension] = useState("hori"); // "hori" or "verti"

    const objVheight = {
        hori: {
            minHeight: "337px",
            minWidth: "600px",
        },
        verti: {
            minHeight: "533px",
            minWidth: "250px",
        },
    };

    const toggleDimension = () => {
        setDimension((prev) => (prev === "hori" ? "verti" : "hori"));
    };

    return (
        <div className="mt-1 text-center flex flex-column gap-2">
            <Button
                type="dashed"
                onClick={toggleDimension}
            >
                มุมมอง:{dimension === "hori" ? "แนวนอน" : "แนวตั้ง"}
            </Button>
            <div
                style={{
                    width: "100%",
                    maxWidth: 600,
                    display: "flex",
                    justifyContent: "center",
                }}
            >
                <iframe
                    src={`https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(
                        url
                    )}&show_text=0`}
                    style={{
                        width: "100%",
                        height: "100%",
                        maxHeight: "80vh",
                        minHeight: objVheight[dimension].minHeight,
                        minWidth: objVheight[dimension].minWidth,
                        border: "none",
                        borderRadius: 12,
                        objectFit: "contain",
                    }}
                    allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                    allowFullScreen
                />
            </div>
        </div>
    );
}

// ----------------------
// Generic iframe (YouTube, Vimeo)
function IframeEmbed({ url }) {
    return (
        <div
            style={{
                marginTop: 12,
                width: "100%",
                maxWidth: 600,
                display: "flex",
                justifyContent: "center",
            }}
        >
            <iframe
                src={url}
                style={{
                    width: "100%",
                    height: "100%",
                    minHeight: '337px',
                    maxHeight: "80vh",
                    border: "none",
                    borderRadius: 12,
                    objectFit: "contain",
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        </div>
    );
}
