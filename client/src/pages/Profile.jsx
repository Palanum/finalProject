import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import './Profile.css'
import { AuthContext } from '../context/AuthContext';
import { Changepass } from "./Form";
import { List, Avatar, Button, Card, Space, Spin, Popconfirm, message, Modal, Tag, Pagination } from "antd";
import { EditOutlined, DeleteOutlined } from "@ant-design/icons";
const Profile = () => {
    const { user } = useContext(AuthContext);
    const [showChangePass, setShowChangePass] = useState(false);
    const location = useLocation();

    useEffect(() => {
        if (location.hash) {
            const el = document.getElementById(location.hash.replace('#', ''));
            if (el) {
                el.scrollIntoView({ behavior: 'smooth' });
            }
        }
    }, [location]);

    return (
        <div className="flex">
            <div className='profile-sidebar'>
                <div className='sidebar-container po-stick'>
                    <ul className='flex flex-column gap-2'>
                        <li><a href="#profile">โปรไฟล์</a></li>
                        <li><a href="#favorite">รายการโปรด</a></li>
                        <li><a href="#myRecipe">สูตรของฉัน</a></li>
                        <li><a href="#alarm">การแจ้งเตือน</a></li>
                    </ul>
                </div>
            </div>
            <div className='profile-container flex-1'>
                <section id='profile' className='profile-section'>
                    <h3>โปรไฟล์ของฉัน</h3>
                    {user ? (
                        <div className="profile-dashboard">
                            <div className="profile-info">
                                <p><strong>ชื่อผู้ใช้:</strong> {user.username}</p>
                                <p><strong>อีเมล:</strong> {user.email}</p>
                            </div>
                            <button
                                className="btn"
                                onClick={() => setShowChangePass(!showChangePass)}
                            >
                                เปลี่ยนรหัสผ่าน
                            </button>
                            {showChangePass && (
                                <div className="changepass-form-wrapper">
                                    <Changepass />
                                </div>
                            )}
                        </div>
                    ) : (
                        <p>กรุณาเข้าสู่ระบบเพื่อดูโปรไฟล์ของคุณ</p>
                    )}
                </section>
                <FavoriteSection />
                <MyRecipeSection />
                <AlarmSection />
            </div>
        </div>
    )
}

function FavoriteSection() {
    const { user } = useContext(AuthContext);
    const [favorites, setFavorites] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            fetch("/api/users/favorites")
                .then((res) => res.json())
                .then((data) => setFavorites(data))
                .catch((err) => console.error("Error fetching favorites:", err));
        }
    }, [user]);

    if (!user) return <p>กรุณาเข้าสู่ระบบ</p>;

    const handlePageChange = (page) => setCurrentPage(page);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentFavorites = favorites.slice(startIndex, endIndex);

    return (
        <section id="favorite" className="favorite-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3>สูตรโปรดของฉัน</h3>
                {favorites.length > pageSize && (
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={favorites.length}
                        onChange={handlePageChange}
                        size="small"
                    />
                )}
            </div>

            {currentFavorites.length === 0 ? (
                <p>คุณยังไม่มีสูตรโปรด</p>
            ) : (
                <List
                    grid={{ gutter: 16, column: 1 }}
                    dataSource={currentFavorites}
                    renderItem={(recipe) => (
                        <List.Item
                            key={recipe.RecipeID}
                            style={{
                                cursor: "pointer",
                                padding: "16px",
                                borderBottom: "1px solid #f0f0f0",
                                transition: "background 0.2s",
                            }}
                            onClick={() => navigate(`/recipes/${recipe.RecipeID}`)}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                        >
                            <List.Item.Meta
                                avatar={<Avatar shape="square" size={100} src={recipe.ImageURL} />}
                                title={<div style={{ fontWeight: "bold", fontSize: "16px" }}>{recipe.Title}</div>}
                                description={<span>เวลา {recipe.time} นาที</span>}
                            />
                        </List.Item>
                    )}
                />
            )}
        </section>
    );
}

function MyRecipeSection() {
    const { user } = useContext(AuthContext);
    const [myRecipes, setMyRecipes] = useState([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [deletingId, setDeletingId] = useState(null);
    const pageSize = 5;
    const navigate = useNavigate();

    useEffect(() => {
        if (user) {
            fetch("/api/users/my_recipes")
                .then((res) => res.json())
                .then((data) => setMyRecipes(data))
                .catch((err) => console.error("Error fetching my recipes:", err));
        }
    }, [user]);

    if (!user) return <p>กรุณาเข้าสู่ระบบ</p>;

    const handleDelete = async (recipeId) => {
        setDeletingId(recipeId);
        try {
            const res = await fetch(`/api/users/recipe/${recipeId}`, { method: "DELETE" });
            const data = await res.json();

            if (res.ok) {
                message.success(data.message || "ลบสูตรเรียบร้อยแล้ว");
                setMyRecipes(myRecipes.filter((r) => r.RecipeID !== recipeId));
            } else {
                message.error(data.error || "ลบสูตรไม่สำเร็จ");
            }
        } catch (err) {
            console.error(err);
            message.error("เกิดข้อผิดพลาด");
        } finally {
            setDeletingId(null);
        }
    };

    const handlePageChange = (page) => setCurrentPage(page);

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentRecipes = myRecipes.slice(startIndex, endIndex);

    return (
        <section id="myRecipe" className="myRecipe-section">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3>สูตรของฉัน</h3>
                {myRecipes.length > pageSize && (
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={myRecipes.length}
                        onChange={handlePageChange}
                        size="small"
                    />
                )}
            </div>

            {currentRecipes.length === 0 ? (
                <p>คุณยังไม่มีสูตรของตัวเอง</p>
            ) : (
                <List
                    itemLayout="horizontal"
                    dataSource={currentRecipes}
                    renderItem={(recipe) => (
                        <List.Item
                            key={recipe.RecipeID}
                            style={{
                                padding: "16px",
                                borderBottom: "1px solid #f0f0f0",
                                transition: "background 0.2s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#fafafa")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "white")}
                            actions={[
                                <Space key="actions">
                                    <Button
                                        type="default"
                                        icon={<EditOutlined />}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            navigate(`/recipes/${recipe.RecipeID}/edit`);
                                        }}
                                    >
                                        แก้ไข
                                    </Button>

                                    <Popconfirm
                                        title="คุณแน่ใจว่าต้องการลบสูตรนี้?"
                                        onConfirm={(e) => {
                                            e.stopPropagation();
                                            handleDelete(recipe.RecipeID);
                                        }}
                                        onCancel={(e) => e.stopPropagation()}
                                        okText="ใช่"
                                        cancelText="ยกเลิก"
                                    >
                                        <Button
                                            type="danger"
                                            icon={<DeleteOutlined />}
                                            loading={deletingId === recipe.RecipeID}
                                        />

                                    </Popconfirm>
                                </Space>,
                            ]}
                        >
                            <List.Item.Meta
                                avatar={
                                    <Avatar
                                        shape="square"
                                        size={100}
                                        src={recipe.ImageURL || "/default.png"}
                                        style={{ cursor: "pointer" }}
                                        onClick={() => navigate(`/recipes/${recipe.RecipeID}`)}
                                    />
                                }
                                title={
                                    <div
                                        style={{ fontWeight: "bold", fontSize: "16px", cursor: "pointer" }}
                                        onClick={() => navigate(`/recipes/${recipe.RecipeID}`)}
                                    >
                                        {recipe.Title}
                                    </div>
                                }
                                description={
                                    <span
                                        style={{ cursor: "pointer" }}
                                        onClick={() => navigate(`/recipes/${recipe.RecipeID}`)}
                                    >
                                        เวลา {recipe.time} นาที
                                    </span>}
                            />

                        </List.Item>

                    )}
                />
            )}
        </section>
    );
}


function AlarmSection() {
    const { user } = useContext(AuthContext);
    const [alarms, setAlarms] = useState([]);
    const [loading, setLoading] = useState(false);
    const [modalVisible, setModalVisible] = useState(false);
    const [modalContent, setModalContent] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const navigate = useNavigate();

    useEffect(() => {
        if (!user) return;

        setLoading(true);
        fetch("/api/users/alarm")
            .then(res => res.json())
            .then(data => {
                setAlarms(data);
                return fetch("/api/users/alarm/mark-read", { method: "POST" });
            })
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [user]);

    if (!user) return <p>กรุณาเข้าสู่ระบบ</p>;

    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    const renderAlarmItem = alarm => {
        let color = "blue";
        let text = "";

        if (alarm.type === "like") {
            color = "green";
            text = "ชอบสูตรของคุณ";
        } else if (alarm.type === "favorite") {
            color = "gold";
            text = "บันทึกสูตรของคุณเป็นรายการโปรด";
        } else if (alarm.type === "comment") {
            color = "purple";
            text = "แสดงความคิดเห็นในสูตรของคุณ";
        } else if (alarm.type === "alarm") {
            color = "red";
            text = "การแจ้งเตือน จากผู้ดูแลระบบ";
        }

        const handleAlarmClick = alarm => {
            if (alarm.type === "alarm") {
                setModalContent(alarm.Content || "ไม่มีข้อความ");
                setModalVisible(true);
            } else {
                navigate(`/recipes/${alarm.RecipeID}`);
            }
        };

        return (
            <div
                style={{
                    backgroundColor: alarm.type === "alarm" ? "#ffe6e6" : '',
                    borderRadius: '8px',
                }}
                className="full-width p-2 mb-1"
            >
                <List.Item
                    key={`${alarm.type}-${alarm.RecipeID}-${alarm.CreatedAt}`}
                    actions={[
                        <Button
                            type="link"
                            onClick={() => handleAlarmClick(alarm)}
                        >
                            ดู
                        </Button>
                    ]}
                >
                    <List.Item.Meta
                        avatar={<Avatar src={alarm.recipeImage || ""} />}
                        title={
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <strong>{alarm.actorUsername}</strong>
                                <Tag color={color}>{alarm.type}</Tag>
                                {!alarm.isRead && <Tag color="magenta">New</Tag>}
                            </div>
                        }
                        description={
                            <>
                                <div>{text}</div>
                                {alarm.recipeTitle && (
                                    <div>สูตร: <strong>{alarm.recipeTitle}</strong></div>
                                )}
                                <div>{new Date(alarm.CreatedAt).toLocaleString("th-TH")}</div>
                            </>
                        }
                    />
                </List.Item>
            </div>
        );
    };

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentAlarms = alarms.slice(startIndex, endIndex);

    return (
        <section
            id="alarm"
            className="alarm-section"
            style={{ overflowY: "auto" }}
        >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <h3>การแจ้งเตือน</h3>
                {alarms.length > pageSize && (
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={alarms.length}
                        onChange={handlePageChange}
                        size="small"
                    />
                )}
            </div>
            {loading ? (
                <Spin />
            ) : currentAlarms.length === 0 ? (
                <p>คุณยังไม่มีการแจ้งเตือน</p>
            ) : (
                <List
                    itemLayout="horizontal"
                    dataSource={currentAlarms}
                    renderItem={renderAlarmItem}
                />
            )}
            <Modal
                title="ข้อความจากผู้ดูแลระบบ"
                open={modalVisible}
                onCancel={() => setModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setModalVisible(false)}>
                        ปิด
                    </Button>
                ]}
            >
                <p>{modalContent}</p>
            </Modal>
        </section>
    );
}





export default Profile