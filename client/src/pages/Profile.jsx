import { useContext, useEffect, useState } from "react";
import { useLocation, useNavigate } from 'react-router-dom';
import './Profile.css'
import { AuthContext } from '../context/AuthContext';
import { Changepass } from "./Form";
import { List, Avatar, Button, Card, Space, Spin, Popconfirm, message, Tag } from "antd";
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
const pageSize = 5;
function FavoriteSection() {
    const { user } = useContext(AuthContext);
    const [favorites, setFavorites] = useState([]);

    useEffect(() => {
        if (user) {
            fetch("/api/users/favorites")
                .then((res) => res.json())
                .then((data) => {
                    // console.dir(data);
                    setFavorites(data);
                })
                .catch((err) => console.error("Error fetching favorites:", err));
        }
    }, [user]);

    if (!user) return <p>กรุณาเข้าสู่ระบบ</p>;

    return (
        <section id="favorite" className="favorite-section">
            <h3>สูตรโปรดของฉัน</h3>
            {favorites.length === 0 ? (
                <p>คุณยังไม่มีสูตรโปรด</p>
            ) : (
                <List
                    grid={{ gutter: 16, column: 1 }} // 1 column per row
                    dataSource={favorites}
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
                    pagination={
                        favorites.length > pageSize
                            ? { pageSize: pageSize, showSizeChanger: false, showQuickJumper: true }
                            : false
                    }
                />

            )}
        </section>
    );
}

function MyRecipeSection() {
    const { user } = useContext(AuthContext);
    const [myRecipes, setMyRecipes] = useState([]);
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
        try {
            const res = await fetch(`/api/recipes/${recipeId}`, {
                method: "DELETE",
            });
            if (res.ok) {
                message.success("ลบสูตรเรียบร้อยแล้ว");
                setMyRecipes(myRecipes.filter((r) => r.RecipeID !== recipeId));
            } else {
                message.error("ลบสูตรไม่สำเร็จ");
            }
        } catch (err) {
            console.error(err);
            message.error("เกิดข้อผิดพลาด");
        }
    };

    return (
        <section id="myRecipe" className="myRecipe-section">
            <h3>สูตรของฉัน</h3>

            {myRecipes.length === 0 ? (
                <p>คุณยังไม่มีสูตรของตัวเอง</p>
            ) : (
                <List
                    itemLayout="horizontal"
                    dataSource={myRecipes}
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
                                        <Button type="danger" icon={<DeleteOutlined />} />
                                    </Popconfirm>
                                </Space>,
                            ]}
                        >
                            <List.Item.Meta
                                avatar={<Avatar shape="square" size={100} src={recipe.ImageURL || "/default.png"} />}
                                title={<div style={{ fontWeight: "bold", fontSize: "16px" }}>{recipe.Title}</div>}
                                description={<span>เวลา {recipe.time} นาที</span>}
                            />
                        </List.Item>
                    )}
                    pagination={
                        myRecipes.length > pageSize
                            ? { pageSize: pageSize, showSizeChanger: false, showQuickJumper: true }
                            : false
                    }
                />

            )}
        </section>
    );
}

function AlarmSection() {
    const { user } = useContext(AuthContext);
    const [alarms, setAlarms] = useState([]);
    const [loading, setLoading] = useState(false);
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
            color = "red";
            text = "แสดงความคิดเห็นในสูตรของคุณ";
        }

        return (
            <List.Item
                key={`${alarm.type}-${alarm.RecipeID}-${alarm.CreatedAt}`}
                actions={[
                    <Button
                        type="link"
                        onClick={() => navigate(`/recipes/${alarm.RecipeID}`)}
                    >
                        ดู
                    </Button>
                ]}
            >
                <List.Item.Meta
                    avatar={<Avatar src={alarm.recipeImage || "/default.png"} />}
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
                            <div>สูตร: <strong>{alarm.recipeTitle}</strong></div>
                            <div>{new Date(alarm.CreatedAt).toLocaleString("th-TH")}</div>
                        </>
                    }
                />
            </List.Item>
        );
    };

    return (
        <section
            id="alarm"
            className="alarm-section"
            style={{ maxHeight: "100vh", overflowY: "auto" }}
        >
            <h3>การแจ้งเตือน</h3>
            {loading ? (
                <Spin />
            ) : alarms.length === 0 ? (
                <p>คุณยังไม่มีการแจ้งเตือน</p>
            ) : (
                <List
                    itemLayout="horizontal"
                    dataSource={alarms}
                    renderItem={renderAlarmItem}
                    pagination={
                        alarms.length > 5
                            ? { pageSize: 5, showSizeChanger: false, showQuickJumper: true }
                            : false
                    }
                />
            )}
        </section>
    );
}




export default Profile