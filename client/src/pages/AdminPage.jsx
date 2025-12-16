import { useEffect, useState, useContext } from "react";
import { useLocation } from 'react-router-dom';
import './AdminPage.css'
import './Profile.css'
import { AuthContext } from '../context/AuthContext';
import { Button, Card, Checkbox, Col, Form, Input, Image, message, Modal, Pagination, Popconfirm, Row, Select, Space, Spin, Table, Tag } from "antd";

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { library } from '@fortawesome/fontawesome-svg-core'

import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)

const { Search } = Input;

export default function AdminPage() {
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
        <div className='admin-page flex'>
            <div className='profile-sidebar'>
                <div className='sidebar-container po-stick'>
                    <ul className='flex flex-column gap-2'>
                        <li><a href="#dashboard">Dashboard <FontAwesomeIcon icon="fa-solid fa-arrow-trend-up" /></a></li>
                        <li><a href="#user-management">จัดการสมาชิก <FontAwesomeIcon icon="fa-solid fa-users-gear" /> </a></li>
                        <li><a href="#recipe-management">จัดการสูตรอาหาร</a></li>
                        <li><a href="#comment-management">จัดการคอมเม้น <FontAwesomeIcon icon="fa-regular fa-message" /></a></li>
                        <li><a href="#report-section">การรายงาน <FontAwesomeIcon icon="fa-regular fa-flag" /></a></li>
                    </ul>
                </div>
            </div>
            <div className='profile-container flex-1 admin-section-container set-max-w full-m-0-auto'>
                <Dashboard />
                <UserManagement />
                <RecipeManagement />
                <CommentManagement />
                <ReportSection />
            </div>
        </div>

    )
}

function Dashboard() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    async function fetchAdminData() {
        try {
            const res = await fetch(`/api/users/admin/data`, {
                method: "GET",
                headers: { "Content-Type": "application/json" }
            });
            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const jsonData = await res.json();
            setData(jsonData);
        } catch (err) {
            console.error("Error loading admin data:", err);
        } finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        fetchAdminData();
    }, []);

    if (loading)
        return (
            <div style={{ textAlign: "center", padding: "50px" }}>
                <Spin size="large" />
            </div>
        );
    if (!data) return <p>Failed to load data</p>;

    const { counts } = data;

    const colCards = {
        xs: 24,
        sm: 12,
        md: 8,
    };

    return (
        <section id="dashboard" className="Dashboard-section">
            <h2 className="text-center mb-2">Dashboard</h2>
            <Row gutter={[16, 16]} align="middle">
                <Col {...colCards}>
                    <Card title={<span className="main-text">สมาชิกทั้งหมด</span>} variant={false}>
                        <span className="sub-text">{counts.totalUsers || 0} คน</span>
                    </Card>
                </Col>
                <Col {...colCards}>
                    <Card title={<span className="main-text">ผู้ใช้ใหม่ (30 วันล่าสุด)</span>} variant={false}>
                        <span className="sub-text">{counts.usersLast30Days || 0} คน</span>
                    </Card>
                </Col>
                <Col {...colCards}>
                    <Card title={<span className="main-text">รายงานที่รอดำเนินการ</span>} variant={false}>
                        <span className="sub-text">{counts.pendingReports || 0} รายงาน</span>
                    </Card>
                </Col>
                <Col {...colCards}>
                    <Card title={<span className="main-text">จำนวนสูตรทั้งหมด</span>} variant={false}>
                        <span className="sub-text">{counts.totalRecipes || 0} สูตร</span>
                    </Card>
                </Col>
                <Col {...colCards}>
                    <Card title={<span className="main-text">สูตรใหม่ (30 วันล่าสุด)</span>} variant={false}>
                        <span className="sub-text">{counts.recipesLast30Days || 0} สูตร</span>
                    </Card>
                </Col>

            </Row>
        </section>
    );
}
// const pageSize = 5;
async function sendAlarmRequest(userId, text, recipeId = null) {
    try {
        const res = await fetch(`/api/users/admin/user/${userId}/alarm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: text, recipeId }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error sending alarm");
        message.success(data.message);
    } catch (err) {
        message.error(err.message);
    }
}

function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [alarmModalVisible, setAlarmModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [form] = Form.useForm();
    const { user } = useContext(AuthContext);
    const [roleConfirm, setRoleConfirm] = useState({
        visible: false,
        newRole: null,
        user: null
    });

    // Fetch users
    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/users/admin/user");
            if (!res.ok) throw new Error("Failed to fetch users");
            const data = await res.json();
            setUsers(data);
        } catch (err) {
            console.error("Error loading users:", err);
            message.error("โหลดข้อมูลผู้ใช้ล้มเหลว");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);
    const toggleBan = async (id, action) => {
        try {
            const res = await fetch(`/api/users/admin/user/${id}/ban`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error updating status");
            message.success(data.message);
            fetchUsers();
            setActionModal({ visible: false, user: null });
        } catch (err) {
            message.error(err.message);
        }
    };
    const handleBan = async () => {
        if (!banDays || isNaN(banDays)) {
            message.error("โปรดใส่จำนวนวัน");
            return;
        }
        try {
            const res = await fetch(`/api/users/admin/user/${actionModal.user.id}/ban`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "ban", days: banDays }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error banning user");
            message.success(`${actionModal.user.username} ถูกแบนเป็นเวลา ${banDays} วันแล้ว`);
            setActionModal({ visible: false, user: null });
            fetchUsers();
        } catch (err) {
            message.error(err.message);
        }
    };

    const handleDelete = async () => {
        try {
            const res = await fetch(`/api/users/admin/user/${actionModal.user.id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error deleting user");
            message.success("ลบผู้ใช้งานสำเร็จ");
            fetchUsers();
            setActionModal({ visible: false, user: null });
        } catch (err) {
            message.error(err.message);
        }
    };
    // Function to change role
    const handleRoleChange = async (newRole, user) => {
        if (!user) return;

        try {
            const res = await fetch(`/api/users/admin/user/${user.id}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error updating role");

            message.success(data.message);
            fetchUsers();
            setActionModal({ visible: false, user: null });
        } catch (err) {
            message.error(err.message);
        }
    };


    // Handle alarm
    const openAlarmModal = (user) => {
        setSelectedUser(user);
        setAlarmModalVisible(true);
        form.resetFields();
    };

    const sendAlarm = async () => {
        try {
            const values = await form.validateFields();
            await sendAlarmRequest(selectedUser.id, values.message); // use helper
            setAlarmModalVisible(false);
        } catch (err) {
            message.error(err.message);
        }
    };

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    // Filter users
    const filteredUsers = users.filter((u) =>
        u.username.toLowerCase().includes(search.toLowerCase())
    );

    // Paginate
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    const handlePageChange = (page) => setCurrentPage(page);


    const [banDays, setBanDays] = useState(null);
    const [actionModal, setActionModal] = useState({
        visible: false,
        user: null,
    });


    const openActionModal = (user) => {
        setActionModal({ visible: true, user });
        setBanDays(null);
    };


    const columns = [
        { title: "ชื่อผู้ใช้", dataIndex: "username", key: "username" },
        { title: "E-mail", dataIndex: "email", key: "email" },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (role) => <Tag color={role === "admin" ? "gold" : "blue"}>{role}</Tag>,
        },
        {
            title: "สถานะ",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === "banned" ? "red" : "green"}>{status}</Tag>
            ),
        },
        {
            title: "การจัดการ",
            key: "actions",
            render: (_, record) => {
                const isSelf = record.id === user?.id;
                return isSelf ? (
                    <Tag color="purple">It's You</Tag>
                ) : (
                    <>
                        <Button type="link" onClick={() => openAlarmModal(record)}>
                            ส่งคำเตือน
                        </Button>
                        <Button type="link" onClick={() => openActionModal(record)}>
                            ตั้งค่า
                        </Button>
                    </>
                );
            },
        }


        ,
    ];

    return (
        <section id="user-management" className="User-management-section">
            <div className="flex just-between align-center mb-2">
                <h2>จัดการสมาชิก</h2>
                {filteredUsers.length > pageSize && (
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredUsers.length}
                        onChange={handlePageChange}
                        style={{ marginTop: 16, textAlign: "right" }}
                    />
                )}

            </div>

            <Search
                placeholder="ค้นหาชื่อผู้ใช้"
                allowClear
                enterButton="Search"
                onSearch={(value) => { setSearch(value); setCurrentPage(1); }}
                style={{ maxWidth: 300, marginBottom: 16 }}
            />


            <Table
                rowKey="id"
                columns={columns}
                dataSource={currentUsers} // ✅ correct
                loading={loading}
                className="full-width"
                pagination={false}
            />


            {/* Alarm Modal */}
            <Modal
                title={`ส่งคำเตือนถึง ${selectedUser?.username}`}
                open={alarmModalVisible}
                onOk={sendAlarm}
                onCancel={() => setAlarmModalVisible(false)}
                okText="Send"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="message"
                        label="Message"
                        rules={[{ required: true, message: "โปรดใส่ข้อความเตือนก่อนส่ง" }]}
                    >
                        <Input.TextArea className="p-3" rows={4} style={{ resize: 'none' }} placeholder="ใส่ข้อความเตือน" />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title={`การตั้งค่าของ ${actionModal.user?.username}`}
                open={actionModal.visible}
                onCancel={() => setActionModal({ visible: false, user: null })}
                footer={null}
            >
                <Form layout="vertical">
                    {/* Change role */}
                    <Form.Item label="เปลี่ยน Role">
                        <Select
                            value={actionModal.user?.role}
                            onChange={(newRole) => {
                                setRoleConfirm({ visible: true, newRole, user: actionModal.user });
                            }}
                            options={[
                                { label: "User", value: "user" },
                                { label: "Admin", value: "admin" },
                            ]}
                        />

                    </Form.Item>


                    {/* Ban user */}
                    {actionModal.user?.status !== "banned" && (
                        <Form.Item
                            label="Number of days to ban"
                        >
                            <Input
                                type="number"
                                min={1}
                                placeholder="e.g., 7"
                                value={banDays}
                                onChange={(e) => setBanDays(e.target.value)}
                                suffix="วัน"
                            />
                        </Form.Item>
                    )}
                    {actionModal.user?.status !== "banned" && (
                        <Form.Item>
                            <Popconfirm
                                title={`ต้องการระงับการใช้งานของ ${actionModal.user?.username} จำนวน ${banDays} วัน?`}
                                onConfirm={handleBan}
                                okText="Yes"
                                cancelText="No"
                            >
                                <Button
                                    type="primary"
                                    block
                                    disabled={!banDays || Number(banDays) <= 0}
                                >
                                    Ban
                                </Button>
                            </Popconfirm>
                        </Form.Item>
                    )}
                    {actionModal.user?.status === "banned" && (
                        <Form.Item label="Unban user">
                            <Button
                                type="primary"
                                onClick={() => toggleBan(actionModal.user.id, "unban")}
                                block
                            >
                                Unban
                            </Button>
                        </Form.Item>

                    )}

                    {/* Delete user */}
                    <Form.Item label="Remove This User">
                        <Popconfirm
                            title={`ต้องการลบ ${actionModal.user?.username} ออกจากระบบใช่หรือไม่?`}
                            onConfirm={handleDelete}
                            okText="Yes"
                            cancelText="No"
                        >
                            <Button type="primary" danger block>
                                Delete
                            </Button>
                        </Popconfirm>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title={`ต้องการเปลี่ยน role ของ ${roleConfirm.user?.username} เป็น ${roleConfirm.newRole} ใช่หรือไม่ ?`}
                open={roleConfirm.visible}
                onOk={() => {
                    handleRoleChange(roleConfirm.newRole, roleConfirm.user);
                    setRoleConfirm({ visible: false, newRole: null, user: null });
                }}
                onCancel={() => setRoleConfirm({ visible: false, newRole: null, user: null })}
                okText="Yes"
                cancelText="No"
            >
                <p>New role: {roleConfirm.newRole}</p>
            </Modal>
        </section>
    );
}
function RecipeManagement() {
    const [recipes, setRecipes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [reportModalVisible, setReportModalVisible] = useState(false);
    const [selectedRecipe, setSelectedRecipe] = useState(null);
    const [form] = Form.useForm();

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    // Filter recipes first
    const filteredRecipes = recipes.filter((r) =>
        r.Title.toLowerCase().includes(search.toLowerCase())
    );

    // Paginate
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentRecipes = filteredRecipes.slice(startIndex, endIndex);

    const handlePageChange = (page) => setCurrentPage(page);

    // Fetch recipes
    const fetchRecipes = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/users/admin/recipe");
            if (!res.ok) throw new Error("Failed to fetch recipes");
            const data = await res.json();
            // console.dir(data);
            setRecipes(data);
        } catch (err) {
            console.error("Error loading recipes:", err);
            message.error("โหลดข้อมูลสูตรอาหารล้มเหลว");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRecipes();
    }, []);

    // Delete recipe
    const handleDelete = async (id) => {
        try {
            const res = await fetch(`/api/users/admin/recipe/${id}`, {
                method: "DELETE",
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error deleting recipe");
            message.success("ลบสูตรอาหารสำเร็จ");
            fetchRecipes();
        } catch (err) {
            message.error(err.message);
        }
    };

    // Report to recipe owner
    const openReportModal = (recipe) => {
        setSelectedRecipe(recipe);
        setReportModalVisible(true);
        form.resetFields();
    };

    const sendReport = async () => {
        try {
            const values = await form.validateFields();           // validate form input
            await sendAlarmRequest(selectedRecipe.UserID, values.message, selectedRecipe.RecipeID); // call helper
            setReportModalVisible(false);                           // close modal
        } catch (err) {
            // Optional: errors already shown in helper, but you can catch validation errors here
            message.error(err.message);
        }
    };


    const columns = [
        { title: "ชื่อเมนู", dataIndex: "Title", key: "Title" },
        {
            title: "ชื่อผู้ใช้",
            dataIndex: "UserID",
            key: "UserID",
            render: (_, record) => record.User?.username || "Unknown"
        },
        {
            title: "วันที่สร้าง",
            dataIndex: "CreatedAt",
            key: "CreatedAt",
            render: (date) => (date ? new Date(date).toLocaleString() : "-"),
        },
        {
            title: "วันที่แก้ไข",
            dataIndex: "UpdatedAt",
            key: "UpdatedAt",
            render: (date) => (date ? new Date(date).toLocaleString() : "-"),
        },
        {
            title: "การจัดการ",
            key: "actions",
            render: (_, record) => (
                <>
                    <Button type="link" onClick={() => openReportModal(record)}>
                        ส่งคำเตือน
                    </Button>
                    <Popconfirm
                        title={`คุณแน่ใจหรือไม่ที่จะลบสูตรอาหาร "${record.Title}" ?`}
                        onConfirm={() => handleDelete(record.RecipeID)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger>
                            Delete
                        </Button>
                    </Popconfirm>
                </>
            ),
        },
    ];

    return (
        <section id="recipe-management" className="Recipe-management-section">
            <div className="flex just-between align-center mb-2">
                <h2>จัดการสูตรอาหาร</h2>
                {filteredRecipes.length > pageSize && (
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredRecipes.length}
                        onChange={handlePageChange}
                    />
                )}
            </div>

            <Input.Search
                placeholder="ค้นหาชื่อเมนู"
                allowClear
                enterButton="Search"
                onSearch={(value) => { setSearch(value); setCurrentPage(1); }}
                style={{ maxWidth: 300, marginBottom: 16 }}
            />

            <Table
                rowKey="RecipeID"
                columns={columns}
                dataSource={currentRecipes} // use paginated slice
                loading={loading}
                pagination={false} // disable built-in
            />


            {/* Report Modal */}
            <Modal
                title={`ส่งคำเตือนให้เจ้าของเมนู "${selectedRecipe?.Title}"`}
                open={reportModalVisible}
                onOk={sendReport}
                onCancel={() => setReportModalVisible(false)}
                okText="Send"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="message"
                        label="Message"
                        rules={[{ required: true, message: "โปรดกรอกรายละเอือดคำเตือนก่อนส่ง" }]}
                    >
                        <Input.TextArea
                            className="p-3"
                            rows={4}
                            style={{ resize: "none" }}
                            placeholder="กรอกรายละเอียดคำเตือน"
                        />
                    </Form.Item>
                </Form>
            </Modal>
        </section>
    );
}
function CommentManagement() {
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedComment, setSelectedComment] = useState(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [form] = Form.useForm();
    const [skipAlarms, setSkipAlarms] = useState({});
    const [search, setSearch] = useState("");

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;

    const fetchComments = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/users/admin/comment", { credentials: "include" });
            if (!res.ok) throw new Error("Failed to fetch comments");
            const data = await res.json();
            setComments(data);
        } catch (err) {
            console.error("Error loading comments:", err);
            message.error("โหลดข้อมูลคอมเมนต์ล้มเหลว");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchComments();
    }, []);

    // Filter comments
    const filteredComments = comments.filter((c) =>
        c.content.toLowerCase().includes(search.toLowerCase()) ||
        c.user?.username.toLowerCase().includes(search.toLowerCase())
    );

    // Paginate
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentComments = filteredComments.slice(startIndex, endIndex);

    const handlePageChange = (page) => setCurrentPage(page);

    const toggleSkipAlarm = (id, checked) => {
        setSkipAlarms((prev) => ({ ...prev, [id]: checked }));
    };

    const handleDelete = async (id) => {
        const skipAlarm = skipAlarms[id] || false;
        try {
            const res = await fetch(`/api/users/admin/comment/${id}`, {
                method: "DELETE",
                credentials: "include",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isAddedRequest: skipAlarm }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error deleting comment");
            message.success("ลบคอมเมนต์สำเร็จ");
            fetchComments();
        } catch (err) {
            message.error(err.message);
        }
    };

    const openEditModal = (comment) => {
        setSelectedComment(comment);
        setEditModalVisible(true);
        form.setFieldsValue({ content: comment.content });
    };

    const handleEdit = async () => {
        try {
            const values = await form.validateFields();
            const res = await fetch(`/api/users/admin/comment/${selectedComment.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ content: values.content }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error editing comment");
            message.success("แก้ไขคอมเมนต์สำเร็จ");
            setEditModalVisible(false);
            fetchComments();
        } catch (err) {
            message.error(err.message);
        }
    };

    const columns = [
        { title: "ชื่อผู้ใช้", dataIndex: "user", key: "user", render: (user) => user?.username || "Unknown" },
        {
            title: "เนื้อหา",
            key: "content",
            render: (_, record) => (
                <>
                    {record.parrentContent && <div>reply to: "{record.parrentContent}"</div>}
                    <div>{record.content}</div>
                </>
            ),
        },
        { title: "ชนิด", dataIndex: "type", key: "type", width: 80, render: (type) => <Tag color={type === "alarm" ? "red" : "green"}>{type}</Tag> },
        { title: "วันที่สร้าง", dataIndex: "createdAt", key: "createdAt", render: (date) => (date ? new Date(date).toLocaleString() : "-") },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => (
                <Space direction="vertical">
                    <Checkbox checked={!!skipAlarms[record.id]} onChange={(e) => toggleSkipAlarm(record.id, e.target.checked)}>
                        <span style={{ fontSize: "0.85rem" }}>ไม่ส่งข้อความให้เจ้าของ</span>
                    </Checkbox>
                    <Popconfirm
                        title="คุณแน่ใจหรือไม่ที่จะลบคอมเมนต์นี้?"
                        onConfirm={() => handleDelete(record.id)}
                        okText="Yes"
                        cancelText="No"
                    >
                        <Button type="link" danger>Delete</Button>
                    </Popconfirm>
                    {record.type === "alarm" && <Button type="link" onClick={() => openEditModal(record)}>Edit</Button>}
                </Space>
            ),
        },
    ];

    return (
        <section id="comment-management" className="Comment-management-section">
            <div className="flex just-between align-center mb-2">
                <h2>จัดการคอมเม้น</h2>
                {filteredComments.length > pageSize && (
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredComments.length}
                        onChange={handlePageChange}
                    />
                )}
            </div>

            <Input.Search
                placeholder="ค้นหาเนื้อหาคอมเม้นหรือชื่อผู้ใช้งาน"
                allowClear
                enterButton="Search"
                onSearch={(value) => { setSearch(value); setCurrentPage(1); }}
                style={{ maxWidth: 300, marginBottom: 16 }}
            />

            <Table
                rowKey="id"
                columns={columns}
                dataSource={currentComments}
                loading={loading}
                pagination={false}
            />

            <Modal
                title={`แก้ไขคอมเม้น ${selectedComment?.content}`}
                open={editModalVisible}
                onOk={handleEdit}
                onCancel={() => setEditModalVisible(false)}
                okText="Save"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="content"
                        label="เนื้อหาใหม่"
                        rules={[{ required: true, message: "โปรดกรอกเนื้อหาของการแก้ไข" }]}
                    >
                        <Input.TextArea rows={4} style={{ resize: "none" }} />
                    </Form.Item>
                </Form>
            </Modal>
        </section>
    );
}

function ReportSection() {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedReport, setSelectedReport] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);
    const [previewImage, setPreviewImage] = useState(null);
    const [previewVisible, setPreviewVisible] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 5;
    // Fetch reports from backend 

    const fetchReports = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/users/admin/report");
            if (!res.ok) throw new Error("Failed to fetch reports");
            const data = await res.json(); setReports(data);
        } catch (err) {
            console.error("Error fetching reports:", err);
            message.error("Failed to load reports");
        } finally { setLoading(false); }
    };

    useEffect(() => { fetchReports(); }, []);

    // Filtered reports 
    const filteredReports = reports.filter((r) =>
        r.Reporter_name.toLowerCase().includes(search.toLowerCase()) ||
        r.reported_type?.toLowerCase().includes(search.toLowerCase()));

    // Pagination slice 
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const currentReports = filteredReports.slice(startIndex, endIndex);
    const handlePageChange = (page) => { setCurrentPage(page); };

    // Handle actions from backend 
    const handleAction = async (id, action) => {
        try {
            const res = await fetch(`/api/users/report/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Action failed");
            message.success(data.message); setModalVisible(false); fetchReports();
        }
        catch (err) {
            console.error(err); message.error("โหลดข้อมูลล้มเหลว");
        }
    };
    const columns = [
        { title: "ผู้รายงาน", dataIndex: "Reporter_name", key: "Reporter_name" },
        {
            title: "ชนิด - รายงาน",
            key: "reported_info",
            render: (_, record) => {
                const baseType = record.reported_type?.split(',')[0] || "unknown";
                const colorMap = {
                    alarm: "red",
                    // like: "green",
                    // comment: "purple",
                    // favorite: "gold",
                };

                return (
                    <div className="flex flex-column align-center gap-1">
                        <Tag color={colorMap[baseType] || "blue"} style={{ margin: 0 }}>
                            {baseType}
                        </Tag>
                        <span>{record.reported_name !== 'Alarm' ? record.reported_name : ''}</span>
                    </div>
                );
            },
        }
        ,
        { title: "ข้อความที่แจ้ง", dataIndex: "reason", key: "reason" },
        {
            title: "Status", dataIndex: "status", key: "status",
            render: (status) => status ? (
                <div className="flex just-center">
                    <Tag color={status === "pending" ?
                        "orange" :
                        status === "resolved" ?
                            "green" :
                            "red"
                    } style={{ margin: 0 }} // remove default margin 
                    > {status} </Tag> </div>
            ) : null,
        },
        {
            title: "วันที่รายงาน", dataIndex: "created_on", key: "created_on",
            render: (date) => date ? new Date(date).toLocaleString() : "-",
        },
        {
            title: "การจัดการ", key: "actions",
            render: (_, record) => (
                <Button
                    type="link"
                    onClick={() => {
                        setSelectedReport(record);
                        setModalVisible(true);
                        console.dir(record)
                    }} >
                    ดูรายละอียด
                </Button>),
        }
    ];
    return (
        <section id="report-section" className="Report-section">
            <div className="flex just-between align-center mb-2">
                <h2>การรายงาน</h2>
                {filteredReports.length > pageSize && (
                    <Pagination
                        current={currentPage}
                        pageSize={pageSize}
                        total={filteredReports.length}
                        onChange={handlePageChange}
                        size="small"
                    />
                )}
            </div>
            <Search
                placeholder="ใส่ชื่อผู้รายงานหรือชนิดรายงาน"
                allowClear
                enterButton="Search"
                onSearch={(value) => setSearch(value)}
                style={{ maxWidth: 300, marginBottom: 16 }}
            />
            <Table
                rowKey="ReportID"
                columns={columns}
                dataSource={currentReports}
                loading={loading}
                className="full-width"
                pagination={false} // disable default table pagination 
            />

            <Modal
                title={`รายงาน #${selectedReport?.ReportID}`}

                open={modalVisible}
                onCancel={() => setModalVisible(false)} footer={null} width={700} >
                {selectedReport && (
                    <div>
                        <p>
                            <b>ผู้รายงาน:</b>
                            {selectedReport.Reporter_name}
                        </p>
                        <p>
                            <b>ชนิด:</b>
                            {selectedReport.reported_type}
                        </p>
                        <p>
                            <b>รายงาน:</b>
                            ID: {selectedReport.reported_id} - {selectedReport.reported_name}
                        </p>
                        <p>
                            <b>ข้อความที่แจ้ง:</b>
                            {selectedReport.reason}
                        </p>
                        <p>
                            <b>Status:</b>
                            {" "} {selectedReport.status ? (
                                <Tag color={selectedReport.status === "pending" ?
                                    "orange" :
                                    selectedReport.status === "resolved" ?
                                        "green" :
                                        "red"}
                                >
                                    {selectedReport.status} </Tag>) : "—"}
                        </p>
                        <p>
                            <b>วันที่รายงาน:</b>
                            {" "} {selectedReport.created_on ? new Date(selectedReport.created_on).toLocaleString() : "-"}
                        </p>
                        {/* 🔎 Evidence Section */}
                        <div style={{ marginTop: 16 }}>
                            <b>หลักฐาน:</b>
                            {selectedReport.evidences?.length > 0 ? (
                                <ul className="flex gap-2" style={{ listStyle: "none", padding: 0 }}>
                                    {selectedReport.evidences.map((e) => {
                                        const isImage = e.file_type?.startsWith("image");
                                        return (
                                            <li key={e.EvidenceID} style={{ marginBottom: 8 }}>
                                                {isImage ? (
                                                    <Image
                                                        src={e.file_url}
                                                        alt={e.file_type || "Evidence"}
                                                        style={{
                                                            maxWidth: 200,
                                                            maxHeight: 200,
                                                            borderRadius: 8,
                                                            border: "1px solid #ddd",
                                                            objectFit: "cover",
                                                        }}
                                                    />

                                                ) : (
                                                    <a
                                                        href={e.file_url}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                    >
                                                        {e.file_type || "File"}
                                                    </a>
                                                )}
                                            </li>);
                                    })}
                                </ul>
                            ) : (
                                <p style={{ color: "gray" }}>
                                    ไมามีการแนบหลักฐาน
                                </p>
                            )}
                        </div>
                        {/* 🔎 Command Section */}
                        <div className="mt-1 text-right">
                            <Button danger onClick={() => handleAction(selectedReport.ReportID, "delete")} >
                                Delete
                            </Button>
                            {selectedReport.status && (
                                <Button
                                    type="primary"
                                    style={{ marginLeft: 8 }}
                                    disabled={selectedReport.status === "resolved"}
                                    onClick={() => handleAction(selectedReport.ReportID, "resolved")}
                                >
                                    ดำเนินการสำเร็จ
                                </Button>)}
                        </div>
                    </div>)}
            </Modal>
        </section >);
}