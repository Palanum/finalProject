import { useEffect, useState, useRef, useContext } from "react";
import { useParams } from "react-router-dom";
import { Card, Row, Col, List, Typography, Image, Spin, Select, Form, Modal, Upload, Radio, Tag, Input, Button, Space, message, Tabs } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import Videoiframe from "../components/Videoiframe";
import { AuthContext } from "../context/AuthContext";
const { Title, Text, Paragraph } = Typography;
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)
export default function Recipespage() {
    const { id } = useParams();
    const { user } = useContext(AuthContext);
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeKey, setActiveKey] = useState("1");
    const [newComment, setNewComment] = useState("");
    const [replyToCommentId, setReplyToCommentId] = useState(null);
    const autoSetReportedId = useRef(false);

    // Refs for jump targets
    const descRef = useRef(null);
    const videoRef = useRef(null);
    const instructionsRef = useRef(null);
    const commentRef = useRef();

    const toggleFavorite = async () => {
        if (!user) {
            message.warning("Please login to use favorites");
            return;
        }

        const action = recipe.isFavorite ? "remove" : "add";

        // Optimistic UI: update instantly
        setRecipe(prev => ({ ...prev, isFavorite: !prev.isFavorite }));

        try {
            const res = await fetch(`/api/users/${recipe.RecipeID}/favorite`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Favorite API failed:", text);
                message.error("Something went wrong");
                // Revert UI
                setRecipe(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
                return;
            }

            const data = await res.json();
            message.success(data.message);
            // Ensure UI matches server
            setRecipe(prev => ({ ...prev, isFavorite: data.isFavorite }));

        } catch (err) {
            console.error("Fetch error:", err);
            message.error("Something went wrong");
            // Revert UI
            setRecipe(prev => ({ ...prev, isFavorite: !prev.isFavorite }));
        }
    };

    const toggleLike = async () => {
        if (!user) {
            // User is not logged in
            message.warning("โปรดเข้าสู่ระบบ");
            return;
        }
        // Just toggle state locally
        // setIsLike(prev => !prev);
        // message.success(isLike ? "Removed like" : "Added like");
        const action = recipe.isLike ? "remove" : "add";
        setRecipe(prev => ({ ...prev, isLike: !prev.isLike }));

        try {
            const res = await fetch(`/api/users/${recipe.RecipeID}/like`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Like API failed:", text);
                message.error("Something went wrong");
                // Revert UI
                setRecipe(prev => ({ ...prev, isLike: !prev.isLike }));
                return;
            }

            const data = await res.json();
            message.success(data.message);
            // Ensure UI matches server
            setRecipe(prev => ({ ...prev, isLike: data.isLike }));

        } catch (err) {
            console.error("Fetch error:", err);
            message.error("Something went wrong");
            // Revert UI
            setRecipe(prev => ({ ...prev, isLike: !prev.isLike }));
        }
    };

    useEffect(() => {
        fetch(`/api/recipes/${id}`)
            .then(res => res.json())
            .then(data => {
                setRecipe(data);
                setLoading(false);
            })
            .catch(err => {
                console.error("Error fetching recipe:", err);
                setLoading(false);
            });
    }, [id]);

    useEffect(() => {
        const sections = [
            { key: "1", ref: descRef },
            { key: "2", ref: instructionsRef },
            { key: "3", ref: videoRef },
            { key: "4", ref: commentRef },
        ];

        const handleScroll = () => {
            const scrollPosition = window.scrollY + 100; // offset for navbar/padding
            for (let i = sections.length - 1; i >= 0; i--) {
                const sectionTop = sections[i].ref.current?.offsetTop;
                if (scrollPosition >= sectionTop) {
                    if (activeKey !== sections[i].key) {
                        setActiveKey(sections[i].key);
                    }
                    break;
                }
            }
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, [activeKey]);

    const handleTabChange = (key) => {
        let target;
        if (key === "1") target = descRef.current;
        if (key === "2") target = instructionsRef.current;
        if (key === "3") target = videoRef.current;
        if (key === "4") target = commentRef.current;

        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    const items = [
        { key: "1", label: "ข้อมูล" },
        { key: "2", label: "วิธีทำ" },
        { key: "3", label: "Video", disabled: !recipe?.videoURL },
        { key: "4", label: "ความคิดเห็น" },
    ];

    const handlePostComment = async (parentId = null) => {
        if (!user) {
            message.warning("โปรดเข้าสู่ระบบ");
            return;
        }
        if (user.status === "banned") {
            const dateUnban = user.stat_update ? new Date(user.stat_update).toLocaleString() : null;
            message.error(
                `⚠️ คุณถูกระงับการใช้งานไม่สามารถเขียนความคิดเห็นได้ ${dateUnban ? "\nจนถึง: " + dateUnban : ""}`
            );
            return;
        }
        if (!newComment.trim()) return;

        try {
            const res = await fetch(`/api/recipes/${recipe.RecipeID}/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ content: newComment, parentId })
            });

            if (!res.ok) {
                const text = await res.text();
                console.error("Comment API failed:", text);
                message.error("Failed to post comment");
                return;
            }

            const data = await res.json();

            // Add new comment or reply
            setRecipe(prev => {
                const updatedComments = [...prev.comments];
                if (parentId) {
                    // Find parent comment
                    const addReply = (comments) => {
                        for (let c of comments) {
                            if (c.id === parentId) {
                                c.replies = [...c.replies, data.comment];
                                return true;
                            }
                            if (c.replies.length && addReply(c.replies)) return true;
                        }
                    };
                    addReply(updatedComments);
                } else {
                    updatedComments.push(data.comment);
                }
                return { ...prev, comments: updatedComments };
            });

            setNewComment("");
            setReplyToCommentId(null);
            message.success(parentId ? "Reply สำเร็จ!" : "แสดงความคิดเห็นสำเร็จ!");
        } catch (err) {
            console.error(err);
            message.error("Something went wrong");
        }
    };

    // Helper to find a comment by ID in the tree
    const findCommentById = (comments, id) => {
        for (let comment of comments) {
            if (comment.id === id) return comment;
            if (comment.replies.length) {
                const found = findCommentById(comment.replies, id);
                if (found) return found;
            }
        }
        return null;
    };

    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [reportForm] = Form.useForm();

    const handleOpenReport = () => {
        if (!user) {
            message.warning("โปรดเข้าสู่ระบบ");
            return;
        }
        if (user.status === "banned") {
            const dateUnban = user.stat_update ? new Date(user.stat_update).toLocaleString() : null;
            message.error(
                `⚠️ คุณถูกระงับการใช้งานไม่สามารถรายงานได้ ${dateUnban ? "\nจนถึง: " + dateUnban : ""}`
            );
            return;
        }
        setReportModalVisible(true);
    }
    const handleCloseReport = () => {
        setReportModalVisible(false);
        reportForm.resetFields();
    };
    const getReportedId = (type) => {
        switch (type) {
            case "recipe":
            case "recipe_image":
            case "video": return recipe.RecipeID;
            case "user": return recipe.user.id;
            default: return null;
        }
    };
    const singleElementTypes = ["recipe", "recipe_image", "video", "user"];
    const handleSubmitReport = async (values) => {
        try {
            const formData = new FormData();
            formData.append("reason", values.description);
            if (values.images) {
                values.images.forEach(file => {
                    formData.append("images", file.originFileObj);
                });
            }
            let reportedID = singleElementTypes.includes(values.type) ? getReportedId(values.type) : values.reported_id;
            formData.append("reported_id", reportedID);
            const reportType = values.type === "other" ? values.customType : values.type;
            formData.append("type", reportType);

            // Debug
            console.log("FormData contents:");
            for (let pair of formData.entries()) {
                console.log(pair[0], pair[1]);
            }

            // --- Confirmation ---
            Modal.confirm({
                title: `ต้องการส่งรายงานของ เมนู ${recipe.Title} ที่สร้างโดย ${recipe.user.username} ? `,
                content: 'คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ',
                okText: 'ยืนยัน',
                cancelText: 'ยกเลิก',
                onOk: async () => {
                    try {
                        const res = await fetch(`/api/users/${recipe.RecipeID}/report`, {
                            method: "POST",
                            body: formData,
                        });

                        if (!res.ok) {
                            const text = await res.text();
                            console.error("Report API failed:", text);
                            message.error("Failed to submit report");
                            return;
                        }

                        message.success("Report submitted!");
                        handleCloseReport();
                    } catch (err) {
                        console.error(err);
                        message.error('Submission failed! See console.');
                    }
                }
            });



        } catch (err) {
            console.error(err);
            message.error("Something went wrong");
        }
    };

    if (loading) return (
        <Spin style={{ display: "block", margin: "50px auto" }} />
    );

    if (recipe.error) return (
        <div className="set-max-w full-m-0-auto p-3">
            <Text type="danger">Recipe not found</Text>
        </div>
    );
    console.dir(recipe);
    return (
        <div className="set-max-w full-m-0-auto">
            <Card>
                <Title level={2} style={{ textAlign: "center" }}>
                    {recipe.Title}
                </Title>
                <Space style={{ marginBottom: 16 }}>
                    <Button danger onClick={handleOpenReport}>รายงาน</Button>
                </Space>

                <Modal
                    title="Report Recipe"
                    open={reportModalVisible}
                    onCancel={handleCloseReport}
                    onOk={() => reportForm.submit()}
                >
                    <Form
                        form={reportForm}
                        layout="vertical"
                        onFinish={handleSubmitReport}
                    >
                        {/* Type of Report */}
                        <Form.Item
                            label="Type of Report"
                            name="type"
                            rules={[{ required: true, message: "Please select report type" }]}
                        >
                            <Select placeholder="Select type">
                                <Select.Option value="user">Name of User</Select.Option>
                                <Select.Option value="recipe">Recipe Title</Select.Option>
                                <Select.Option value="ingredient">Ingredient</Select.Option>
                                <Select.Option value="instruction">Instruction</Select.Option>
                                <Select.Option value="recipe_image">Image of Recipe</Select.Option>

                                {recipe.categories.length > 0
                                    ? <Select.Option value="category">Tag</Select.Option>
                                    : null}
                                <Select.Option value="instruction_image">Image of Instruction</Select.Option>
                                {recipe.videoURL
                                    ? <Select.Option value="video">Video</Select.Option>
                                    : null}

                                {recipe.comments.length > 0
                                    ? <Select.Option value="comment">Comment/Reply</Select.Option>
                                    : null}

                                <Select.Option value="other">Other</Select.Option>
                            </Select>
                        </Form.Item>

                        {/* Custom Type for "Other" */}
                        <Form.Item shouldUpdate>
                            {() => reportForm.getFieldValue("type") === "other" && (
                                <Form.Item
                                    label="Custom Type"
                                    name="customType"
                                    rules={[
                                        { required: true, message: "Please enter a custom type" },
                                        { max: 30, message: "Maximum 30 characters" },
                                    ]}
                                >
                                    <Input placeholder="Enter custom type (max 30 chars)" />
                                </Form.Item>
                            )}
                        </Form.Item>

                        {/* Reported Element */}
                        <Form.Item shouldUpdate>
                            {({ getFieldValue }) => {
                                const type = getFieldValue("type");
                                if (!type) return null;

                                // Multi-option types
                                let options = [];
                                let useRadioWithImages = false;
                                if (type === "ingredient" && recipe.ingredients.length > 0) options = recipe.ingredients.map(i => ({ value: i.id, label: i.name }));
                                if (type === "instruction" && recipe.instructions.length > 0) options = recipe.instructions.map(i => ({ value: i.id, label: i.text.slice(0, 30) + "..." }));
                                if (type === "instruction_image" && recipe.instructions.some(i => i.images.length > 0)) {
                                    useRadioWithImages = true;
                                    options = recipe.instructions.flatMap(i =>
                                        i.images.map(img => ({
                                            value: img.id,
                                            label: `Step ${i.id} Image`,
                                            imgUrl: img.url
                                        }))
                                    );
                                }
                                if (type === "comment" && recipe.comments.length > 0) options = recipe.comments.map(c => ({
                                    value: c.id,
                                    label: `${c.user.username}: ${c.content.slice(0, 30)}...`
                                }));

                                if (!options.length) return null;

                                return (
                                    <Form.Item
                                        label="เลือกสิ่งที่จะรายงาน"
                                        name="reported_id"
                                        rules={[{ required: true, message: "โปรดเลือกสิ่งที่รายงาน" }]}
                                    >
                                        {useRadioWithImages ? (
                                            <Radio.Group>
                                                <Space direction="vertical">
                                                    {options.map(opt => (
                                                        <Radio key={opt.value} value={opt.value}>
                                                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                                                <Image src={opt.imgUrl} alt={opt.label} width={80} />
                                                                <span>{opt.label}</span>
                                                            </div>
                                                        </Radio>
                                                    ))}
                                                </Space>
                                            </Radio.Group>
                                        ) : (
                                            <Select placeholder="ตัวเลือก">
                                                {options.map(opt => (
                                                    <Select.Option key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </Select.Option>
                                                ))}
                                            </Select>
                                        )}
                                    </Form.Item>
                                );
                            }}
                        </Form.Item>

                        {/* Description */}
                        <Form.Item
                            label="รายละเอียด"
                            name="description"
                            rules={[{ required: true, message: "โปรดกรอกรายละเอียด" }]}
                        >
                            <Input.TextArea rows={4} placeholder="กรอกรายละเอียด" />
                        </Form.Item>

                        {/* Upload Images */}
                        <Form.Item
                            label="Upload Images"
                            name="images"
                            valuePropName="fileList"
                            getValueFromEvent={e => e && e.fileList}
                        >
                            <Upload
                                listType="picture-card"
                                accept="image/png, image/jpeg, image/jpg"
                                beforeUpload={() => false}
                                multiple>
                                <div>
                                    <PlusOutlined />
                                    <div style={{ marginTop: 8 }}>Upload</div>
                                </div>
                            </Upload>
                        </Form.Item>
                    </Form>
                </Modal>



                <div style={{ textAlign: "center", marginBottom: 16 }}>
                    <Image
                        src={recipe.ImageURL}
                        alt={recipe.Title}
                        width={300}
                        style={{ borderRadius: 8 }}
                    />
                </div>

                {/* Jump navigation Tabs */}
                <Tabs
                    activeKey={activeKey}
                    onChange={handleTabChange}
                    style={{ marginBottom: 16 }}
                    tabBarExtraContent={
                        <Space>
                            <span style={{ cursor: "pointer" }} onClick={toggleFavorite}>
                                <FontAwesomeIcon icon={recipe.isFavorite ? ["fas", "star"] : ["far", "star"]} /> เพิ่มรายการโปรด
                            </span>
                            <span style={{ cursor: "pointer" }} onClick={toggleLike}>
                                <FontAwesomeIcon icon={recipe.isLike ? ["fas", "thumbs-up"] : ["far", "thumbs-up"]} /> Like
                            </span>
                        </Space>
                    }
                    items={items}
                />


                {/* Description section */}
                <div ref={descRef}>
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            {recipe.categories.map((cat, i) => (
                                <Tag color="green" key={i}>{cat.name}</Tag>
                            ))}
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]} className="mt-2 mb-2">
                        <Col span={12}>
                            <Text strong>โดย: </Text><Text>{recipe.user.username}</Text>
                        </Col>
                        <Col span={12}>
                            <Text strong>เวลาที่ใช้: </Text><Text>{recipe.time} minutes</Text>
                        </Col>
                    </Row>

                    <Row gutter={[16, 16]}>
                        <Col span={12}>
                            <Title level={4}>วัตถุดิบ</Title>
                            <List
                                dataSource={recipe.ingredients}
                                renderItem={ing => (
                                    <List.Item>
                                        {ing.quantity} {ing.unit} - {ing.name}
                                    </List.Item>
                                )}
                                bordered
                                size="small"
                            />
                        </Col>
                        <Col span={12}>
                            <Title level={4}>ข้อมูลโภชนาการ</Title>
                            <List>
                                <List.Item><Text strong>Calories:</Text> {recipe.nutrients.calories.toFixed(2)} kcal</List.Item>
                                <List.Item><Text strong>Protein:</Text> {recipe.nutrients.protein.toFixed(2)} g</List.Item>
                                <List.Item><Text strong>Fat:</Text> {recipe.nutrients.fat.toFixed(2)} g</List.Item>
                                <List.Item><Text strong>Carbs:</Text> {recipe.nutrients.carbs.toFixed(2)} g</List.Item>
                            </List>
                        </Col>
                    </Row>
                </div>
                <div ref={instructionsRef} className="mt-2">
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Title level={4}>ขั้นตอนการปรุงอาหาร</Title>
                            <List
                                dataSource={recipe.instructions}
                                renderItem={(inst, index) => (
                                    <List.Item>
                                        <Paragraph>
                                            {index + 1}. {inst.text}
                                            <div className="flex align-center gap-2 mt-2">
                                                {inst.images.map((img, j) => (
                                                    <Image
                                                        key={j}
                                                        src={img.url}
                                                        alt={`step ${j + 1}`}
                                                        width={100}
                                                        style={{ marginRight: 8 }}
                                                    />
                                                ))}
                                            </div>
                                        </Paragraph>
                                    </List.Item>
                                )}
                                bordered
                                size="small"
                            />
                        </Col>
                    </Row>
                </div>


                {/* Video section */}
                {recipe.videoURL && (
                    <div ref={videoRef} className="mt-2">
                        <Row gutter={[16, 16]}>
                            <Col span={24}>
                                <Card title="Video" variant={false}>
                                    <div className="flex just-center full-width">
                                        <Videoiframe videoURL={recipe.videoURL} />
                                    </div>

                                </Card>
                            </Col>
                        </Row>
                    </div>
                )}
                <div ref={commentRef} className="mt-2">
                    <Title level={4}>ความคิดเห็น</Title>
                    <CommentThread comments={recipe.comments} onReply={setReplyToCommentId} />
                    <div className="flex align-center gap-1 mt-1">
                        {replyToCommentId && (() => {
                            const parentComment = findCommentById(recipe.comments, replyToCommentId);
                            if (parentComment) {
                                return <Text type="secondary">ตอบความเห็นของ {parentComment.user.username || "ถูกลบ"}</Text>;
                            }
                            return null;
                        })()}
                        <Input
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            onPressEnter={() => handlePostComment(replyToCommentId)}
                        />
                        <Button type="primary" onClick={() => handlePostComment(replyToCommentId)}>
                            {replyToCommentId ? "Reply" : "Post"}
                        </Button>
                    </div>
                </div>
            </Card>
        </div>
    );
}

function CommentThread({ comments, onReply, level = 0 }) {
    return (
        <div>
            {comments.map((comment) => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    onReply={onReply}
                    level={level}
                />
            ))}
        </div>
    );
}

function CommentItem({ comment, onReply, level }) {
    const [collapsed, setCollapsed] = useState(false);

    return (
        <div
            style={{
                marginLeft: level * 20,
                borderLeft: level > 0 ? "2px solid #ddd" : "none",
                paddingLeft: 8,
                marginTop: 8,
            }}
        >
            <div
                className="flex align-center gap-1"
            >
                <Text strong={!comment.user.username.includes("deleted")}>
                    {comment.user.username || "Deleted User"}:
                </Text>
                <div style={{ fontSize: level > 0 ? "0.9em" : "1em" }}>
                    {comment.content}
                </div>
                <Button
                    type="link"
                    size="small"
                    onClick={() => onReply(comment.id)}
                    style={{ padding: 0 }}
                >
                    Reply
                </Button>
            </div>
            {comment.replies?.length > 0 && (
                <div style={{ marginTop: 4 }}>
                    <Button
                        type="link"
                        size="small"
                        onClick={() => setCollapsed((prev) => !prev)}
                        style={{ padding: 0 }}
                    >
                        {collapsed
                            ? `Show ${comment.replies.length} repl${comment.replies.length > 1 ? "ies" : "y"
                            }`
                            : "Hide replies"}
                    </Button>
                </div>
            )}

            {!collapsed && comment.replies?.length > 0 && (
                <CommentThread
                    comments={comment.replies}
                    onReply={onReply}
                    level={level + 1}
                />
            )}
        </div>
    );
}


