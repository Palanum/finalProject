import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input, Card, Tag, Row, Col, Select } from "antd";
const { Meta } = Card;
const { Search: AntSearch } = Input;

const RecipesAndSearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const query = params.get("q") || "";
  const category = params.get("category") || "";

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // fetch data
  useEffect(() => {
    setLoading(true);

    let url = "/api/recipes";
    const qParams = [];
    if (query) qParams.push(`q=${encodeURIComponent(query)}`);
    if (category) qParams.push(`category=${encodeURIComponent(category)}`);

    if (qParams.length > 0) {
      url = `/api/recipes/search?${qParams.join("&")}`;
    }

    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Fetch failed:", err);
        setLoading(false);
      });
  }, [query, category]);

  // handle search submit
  const onSearch = (value) => {
    navigate(`/search?q=${encodeURIComponent(value)}${category ? `&category=${category}` : ""}`);
  };

  // handle category filter
  const onCategoryChange = (value) => {
    navigate(`/search?q=${encodeURIComponent(query)}${value ? `&category=${value}` : ""}`);
  };

  return (
    <div className="recipes-page" style={{ padding: "20px" }}>
      <h1>{query ? "ผลการค้นหา" : "สูตรอาหารทั้งหมด"}</h1>

      {/* Search & Filter controls */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <AntSearch
          placeholder="ค้นหาสูตรอาหาร..."
          allowClear
          enterButton="ค้นหา"
          size="large"
          defaultValue={query}
          onSearch={onSearch}
        />

        <Select
          placeholder="เลือกหมวดหมู่"
          style={{ width: 200 }}
          value={category || undefined}
          onChange={onCategoryChange}
          allowClear
        >
          <Select.Option value="อาหารไทย">อาหารไทย</Select.Option>
          <Select.Option value="อาหารฝรั่ง">อาหารฝรั่ง</Select.Option>
          <Select.Option value="ของหวาน">ของหวาน</Select.Option>
        </Select>
      </div>

      {loading && <p>กำลังโหลด...</p>}

      {!loading && results.length === 0 && <p>ไม่พบสูตรอาหาร</p>}

      {/* Card Grid */}
      <Row gutter={[16, 16]}>
        {results.map((recipe) => (
          <Col key={recipe.RecipeID} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              cover={<img alt={recipe.Title} src={recipe.ImageURL || "/placeholder.png"} />}
              onClick={() => navigate(`/recipes/${recipe.RecipeID}`)}
            >
              <Meta title={recipe.Title} description={`เวลา: ${recipe.time || "N/A"} นาที`} />
              <div style={{ marginTop: "10px" }}>
                {recipe.categories?.map((c, i) => (
                  <Tag key={i} color="green">{c}</Tag>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: "0.85em", color: "#555" }}>
                👨‍🍳 {recipe.username}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default RecipesAndSearchPage;
