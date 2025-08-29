import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { Card, Row, Col, List, Typography, Image, Spin, Tag, Space, Button, Checkbox, Divider, Tabs } from "antd";
import Videoiframe from "../components/Videoiframe";
const { Title, Text, Paragraph } = Typography;
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { library } from '@fortawesome/fontawesome-svg-core'
import { fas } from '@fortawesome/free-solid-svg-icons'
import { far } from '@fortawesome/free-regular-svg-icons'
import { fab } from '@fortawesome/free-brands-svg-icons'

library.add(fas, far, fab)
export default function Recipespage() {
    const { id } = useParams();
    const { user } = JSON.parse(localStorage.getItem("user")) || {};
    const [recipe, setRecipe] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeKey, setActiveKey] = useState("1");
    const [isFavorite, setIsFavorite] = useState(false);
    const [isLike, setIsLike] = useState(false);
    // Refs for jump targets
    const descRef = useRef(null);
    const videoRef = useRef(null);
    const instructionsRef = useRef(null);
    const toggleFavorite = () => {
        if (!user) {
            // User is not logged in
            message.warning("Please log in to favorite recipes");
            return;
        }
        fetch(`/api/user/${user.id}/${id}/favorite`, {
            method: isFavorite ? "DELETE" : "POST",
        })
            .then((res) => res.json())
            .then(() => {
                setIsFavorite(!isFavorite);
                message.success(
                    isFavorite ? "Removed from favorites" : "Added to favorites"
                );
            })
            .catch((err) => {
                console.error(err);
                message.error("Something went wrong");
            });
    };
    const toggleLike = () => {
        if (!user) {
            // User is not logged in
            message.warning("Please log in to like recipes");
            return;
        }
        fetch(`/api/user/${user.id}/${id}/like`, {
            method: isLike ? "DELETE" : "POST",
        })
            .then((res) => res.json())
            .then(() => {
                setIsLike(!isLike);
                message.success(
                    isLike ? "Removed like" : "Added like"
                );
            })
            .catch((err) => {
                console.error(err);
                message.error("Something went wrong");
            });
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
        ];

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter(e => e.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
                if (visible.length > 0) {
                    const section = sections.find(s => s.ref.current === visible[0].target);
                    if (section && section.key !== activeKey) {
                        setActiveKey(section.key);
                    }
                }
            },
            {
                root: null,
                threshold: 0.5, // 30% of section visible
            }
        );

        sections.forEach(s => {
            if (s.ref.current) observer.observe(s.ref.current);
        });

        return () => observer.disconnect();
    }, [activeKey]);

    const handleTabChange = (key) => {
        let target;
        if (key === "1") target = descRef.current;
        if (key === "2") target = instructionsRef.current;
        if (key === "3") target = videoRef.current;

        if (target) {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
        }
    };

    if (loading) return <Spin style={{ display: "block", margin: "50px auto" }} />;

    if (!recipe) return <Text type="danger">Recipe not found</Text>;

    return (
        <Card>
            <Title level={2} style={{ textAlign: "center" }}>
                {recipe.Title}
            </Title>

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
                            {isFavorite ? (
                                <>
                                    <FontAwesomeIcon icon={["fas", "star"]} /> Favorite
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={["far", "star"]} /> Favorite
                                </>
                            )}
                        </span>

                        <span
                            style={{
                                cursor: "pointer"

                            }}
                            onClick={toggleLike}
                        >
                            {isLike ? (
                                <>
                                    <FontAwesomeIcon icon={["fas", "thumbs-up"]} /> Liked
                                </>
                            ) : (
                                <>
                                    <FontAwesomeIcon icon={["far", "thumbs-up"]} /> Like
                                </>
                            )}
                        </span>
                    </Space>
                }
            >
                <Tabs.TabPane tab="Description" key="1" />
                <Tabs.TabPane tab="Instructions" key="2" />
                <Tabs.TabPane tab="Video" key="3" />

            </Tabs>

            {/* Description section */}
            <div ref={descRef}>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        {recipe.categories.map((cat, i) => (
                            <Tag color="green" key={i}>{cat}</Tag>
                        ))}
                    </Col>
                </Row>

                <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                    <Col span={12}>
                        <Text strong>By: </Text><Text>{recipe.user.username}</Text>
                    </Col>
                    <Col span={12}>
                        <Text strong>Time: </Text><Text>{recipe.time} minutes</Text>
                    </Col>
                </Row>

                <Row gutter={[16, 16]}>
                    <Col span={12}>
                        <Title level={4}>Ingredients</Title>
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
                        <Title level={4}>Nutrients</Title>
                        <List>
                            <List.Item><Text strong>Calories:</Text> {recipe.nutrients.calories.toFixed(2)} kcal</List.Item>
                            <List.Item><Text strong>Protein:</Text> {recipe.nutrients.protein.toFixed(2)} g</List.Item>
                            <List.Item><Text strong>Fat:</Text> {recipe.nutrients.fat.toFixed(2)} g</List.Item>
                            <List.Item><Text strong>Carbs:</Text> {recipe.nutrients.carbs.toFixed(2)} g</List.Item>
                        </List>
                    </Col>
                </Row>
            </div>
            <div ref={instructionsRef}>
                <Row gutter={[16, 16]}>
                    <Col span={24}>
                        <Title level={4}>Instructions</Title>
                        <List
                            dataSource={recipe.instructions}
                            renderItem={inst => (
                                <List.Item>
                                    <Paragraph>
                                        {inst.text}
                                        <div style={{ marginTop: 8 }}>
                                            {inst.images.map((img, j) => (
                                                <Image
                                                    key={j}
                                                    src={img}
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
                <div ref={videoRef} style={{ marginTop: 32 }}>
                    <Row gutter={[16, 16]}>
                        <Col span={24}>
                            <Card title="Video" bordered={false}>
                                <Videoiframe videoURL={recipe.videoURL} />
                            </Card>
                        </Col>
                    </Row>
                </div>
            )}
        </Card>
    );
}
