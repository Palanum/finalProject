import { useEffect, useState, useContext } from "react";
import { useLocation } from 'react-router-dom';
import './AdminPage.css'
import './Profile.css'
import { AuthContext } from '../context/AuthContext';
import { Button, Card, Col, Form, Input, message, Modal, Popconfirm, Row, Select, Spin, Table, Tag } from "antd";
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
                        <li><a href="#dashboard">Dashboard</a></li>
                        <li><a href="#user-management">User Management</a></li>
                        <li><a href="#recipe-management">Recipe Management</a></li>
                        <li><a href="#comment-management">Comment Management</a></li>
                        <li><a href="#report-section">Reports</a></li>
                    </ul>
                </div>
            </div>
            <div className='profile-container flex-1 admin-section-container'>
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
const pageSize = 5;
function UserManagement() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [alarmModalVisible, setAlarmModalVisible] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [form] = Form.useForm();
    const { user } = useContext(AuthContext);
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
        } catch (err) {
            message.error(err.message);
        }
    };
    const handleBan = async () => {
        if (!banDays || isNaN(banDays)) {
            message.error("Please enter valid days");
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
            message.success(`User banned for ${banDays} day(s)`);
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
            message.success("User deleted successfully");
            fetchUsers();
            setActionModal({ visible: false, user: null });
        } catch (err) {
            message.error(err.message);
        }
    };
    // Function to change role
    const handleRoleChange = async (newRole) => {
        if (!actionModal.user) return;

        try {
            const res = await fetch(`/api/users/admin/user/${actionModal.user.id}/role`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ role: newRole }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error updating role");

            message.success(data.message);
            fetchUsers(); // refresh table
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
            const res = await fetch(`/api/users/admin/user/${selectedUser.id}/alarm`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message: values.message }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Error sending alarm");
            message.success(data.message);
            setAlarmModalVisible(false);
        } catch (err) {
            message.error(err.message);
        }
    };

    // Filter users
    const filteredUsers = users.filter((u) =>
        u.username.toLowerCase().includes(search.toLowerCase())
    );

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
        { title: "ID", dataIndex: "id", key: "id", width: 60 },
        { title: "Username", dataIndex: "username", key: "username" },
        { title: "Email", dataIndex: "email", key: "email" },
        {
            title: "Role",
            dataIndex: "role",
            key: "role",
            render: (role) => <Tag color={role === "admin" ? "gold" : "blue"}>{role}</Tag>,
        },
        {
            title: "Status",
            dataIndex: "status",
            key: "status",
            render: (status) => (
                <Tag color={status === "banned" ? "red" : "green"}>{status}</Tag>
            ),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_, record) => {
                const isSelf = record.id === user?.id;
                return isSelf ? (
                    <Tag color="purple">It's You</Tag>
                ) : (
                    <>
                        <Button type="link" onClick={() => openAlarmModal(record)}>
                            Send Alarm
                        </Button>
                        <Button type="link" onClick={() => openActionModal(record)}>
                            Settings
                        </Button>
                    </>
                );
            },
        }


        ,
    ];

    return (
        <section id="user-management" className="User-management-section">
            <h2>User Management</h2>
            <Search
                placeholder="Search by username"
                allowClear
                enterButton="Search"
                onSearch={(value) => setSearch(value)}
                style={{ maxWidth: 300, marginBottom: 16 }}
            />
            <Table
                rowKey="id"
                columns={columns}
                dataSource={filteredUsers}
                loading={loading}
                pagination={
                    filteredUsers.length > pageSize
                        ? { pageSize: pageSize, showSizeChanger: false, showQuickJumper: true }
                        : false
                }
            />

            {/* Alarm Modal */}
            <Modal
                title={`Send Alarm to ${selectedUser?.username}`}
                open={alarmModalVisible}
                onOk={sendAlarm}
                onCancel={() => setAlarmModalVisible(false)}
                okText="Send"
            >
                <Form form={form} layout="vertical">
                    <Form.Item
                        name="message"
                        label="Message"
                        rules={[{ required: true, message: "Please enter a message" }]}
                    >
                        <Input.TextArea rows={4} placeholder="Enter alarm message..." />
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title={`Manage ${actionModal.user?.username}`}
                open={actionModal.visible}
                onCancel={() => setActionModal({ visible: false, user: null })}
                footer={null}
            >
                <Form layout="vertical">
                    {/* Ban user */}
                    {actionModal.user?.status !== "banned" && (
                        <Form.Item label="Number of days to ban">
                            <Input
                                type="number"
                                min={1}
                                placeholder="e.g., 7"
                                value={banDays}
                                onChange={(e) => setBanDays(e.target.value)}
                            />
                        </Form.Item>
                    )}
                    {actionModal.user?.status !== "banned" && (
                        <Form.Item>
                            <Button type="primary" onClick={handleBan} block>
                                Ban
                            </Button>
                        </Form.Item>
                    )}
                    {actionModal.user?.status === "banned" && (
                        <Form.Item>
                            <Button
                                type="primary"
                                onClick={() => toggleBan(actionModal.user.id, "unban")}
                                block
                            >
                                Unban
                            </Button>
                        </Form.Item>
                    )}

                    {/* Change role */}
                    <Form.Item label="Change Role">
                        <Select
                            value={actionModal.user?.role}
                            onChange={handleRoleChange}
                            options={[
                                { label: "User", value: "user" },
                                { label: "Admin", value: "admin" },
                            ]}
                        />
                    </Form.Item>

                    {/* Delete user */}
                    <Form.Item>
                        <Popconfirm
                            title={`Are you sure you want to delete ${actionModal.user?.username}?`}
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




        </section>
    );
}
function RecipeManagement() {
    return (
        <section id="recipe-management" className='Recipe-management-section'>
            <h2>Recipe Management</h2>
        </section>
    )
}
function CommentManagement() {
    return (
        <section id="comment-management" className='Comment-management-section'>
            <h2>Comment Management</h2>
        </section>
    )
}
function ReportSection() {
    return (
        <section id="report-section" className='Report-section'>
            <h2>Reports</h2>
        </section>
    )
}