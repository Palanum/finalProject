import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input, Card, Tag, Row, Col, Slider, Switch, Button, InputNumber } from "antd";
const { Meta } = Card;
const { Search: AntSearch } = Input;

const RecipesAndSearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);

  // Basic query
  const [query, setQuery] = useState(params.get("q") || "");

  // Advanced search state
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [minTime, setMinTime] = useState(Number(params.get("minTime")) || 0);
  const [maxTime, setMaxTime] = useState(Number(params.get("maxTime")) || 120);
  const [includeIngredient, setIncludeIngredient] = useState(params.get("includeIngredient") === "true" || false);
  const [includeMaxTime, setIncludeMaxTime] = useState(params.get("includeMaxTime") === "true" || false);
  const [includeMinTime, setIncludeMinTime] = useState(params.get("includeMinTime") === "true" || false);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch recipes
  const fetchRecipes = (options = {}) => {
    setLoading(true);
    const qParams = [];

    if (options.query !== undefined) qParams.push(`q=${encodeURIComponent(options.query)}`);
    if (options.minTime !== undefined) qParams.push(`minTime=${options.minTime}`);
    if (options.maxTime !== undefined) qParams.push(`maxTime=${options.maxTime}`);
    if (options.includeIngredient !== undefined) qParams.push(`includeIngredient=${options.includeIngredient}`);

    const url = qParams.length ? `/api/recipes/search?${qParams.join("&")}` : "/api/recipes/";

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
  };

  // Initial load (optional: load all recipes)
  useEffect(() => {
    fetchRecipes({
      query,
      minTime,
      maxTime,
      includeIngredient
    });
  }, []);

  // Handle simple search submit
  const onSearch = () => {
    const qParams = [];
    if (query) qParams.push(`q=${encodeURIComponent(query)}`);
    if (includeMinTime) qParams.push(`minTime=${minTime}`);
    if (includeMaxTime) qParams.push(`maxTime=${maxTime}`);
    if (includeIngredient) qParams.push(`includeIngredient=true`);

    const url = qParams.length ? `/api/recipes/search?${qParams.join("&")}` : "/api/recipes";
    navigate(qParams.length ? `/search?${qParams.join("&")}` : "/recipes");

    setLoading(true);
    fetch(url)
      .then(res => res.json())
      .then(data => { setResults(data); setLoading(false); setQuery("") })
      .catch(err => { console.error(err); setLoading(false); });
  };

  return (
    <div className="recipes-page" style={{ padding: "20px" }}>
      <h1>{query ? "ผลการค้นหา" : "สูตรอาหารทั้งหมด"}</h1>

      {/* Basic search */}
      <div className="search-container flex gap-2 align-center" style={{ marginBottom: "10px" }}>
        <AntSearch
          placeholder="ค้นหาสูตรอาหาร..."
          allowClear
          enterButton="ค้นหา"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={onSearch}
        />
        <Button type="link" onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? "ซ่อนตัวกรองขั้นสูง" : "ตัวกรองขั้นสูง"}
        </Button>
      </div>

      {/* Advanced search filters */}
      {showAdvanced && (
        <div className="advanced-filters flex flex-column gap-2" style={{ marginBottom: "20px" }}>
          <div className="time-filters flex flex-column gap-2">
            <Row gutter={[16, 16]}>
              <Col md={12} sm={24} xs={24}>
                <Row justify={"space-between"} align="middle">
                  <Col span={4}>
                    <Switch checked={includeMinTime} onChange={setIncludeMinTime} />
                  </Col>
                  <Col span={6}><label htmlFor="min-time">เวลาขั้นต่ำ</label></Col>
                  <Col span={14}>
                    <Input
                      id="min-time"
                      type="number"
                      placeholder="เวลาขั้นต่ำ"
                      className="main-text"
                      suffix="นาที"
                      value={minTime}
                      disabled={!includeMinTime}
                      onChange={(e) => setMinTime(Number(e.target.value))}
                    />
                  </Col>

                </Row>
              </Col>
              <Col md={12} sm={24} xs={24}>
                <Row align="middle" justify="space-between">
                  <Col span={4}>
                    <Switch checked={includeMaxTime} onChange={setIncludeMaxTime} />
                  </Col>
                  <Col span={6}><label htmlFor="max-time">เวลาสูงสุด</label></Col>
                  <Col span={14}>
                    <Input
                      id="max-time"
                      type="number"
                      placeholder="เวลาสูงสุด"
                      className="main-text"
                      suffix="นาที"
                      value={maxTime}
                      disabled={!includeMaxTime}
                      onChange={(e) => setMaxTime(Number(e.target.value))}
                    />
                  </Col>

                </Row>
              </Col>
            </Row>

          </div>
          <div className="ingredient-filter flex gap-2 align-center">
            <span>ค้นหาในวัตถุดิบด้วย</span>
            <Switch checked={includeIngredient} onChange={setIncludeIngredient} />
          </div>
        </div>
      )}

      {loading && <p>กำลังโหลด...</p>}
      {!loading && results.length === 0 && <p>ไม่พบสูตรอาหาร</p>}

      {/* Card Grid */}
      <section className='card-section flex flex-column gap-1 align-center pt-3 pb-3'>
        <Row gutter={[16, 16]} className='full-width p-3' justify="center">
          {results.map((recipe) => (
            <Col
              key={recipe.RecipeID}
              xs={12}
              sm={12}
              md={8}
              lg={6}
            >
              <div className="full-height flex">
                <Card
                  hoverable
                  className="flex flex-column flex-1"
                  cover={<img alt={recipe.Title} className='card-cover' src={recipe.ImageURL || "/placeholder.png"} />}
                  onClick={() => navigate(`/recipes/${recipe.RecipeID}`)}
                >
                  <Meta title={<span className="main-text">{recipe.Title}</span>} description={`เวลา: ${recipe.time || "N/A"} นาที`} />
                  <div className='card-tags-container flex flex-wrap gap-1 mt-2'>
                    {recipe.categories?.map((c, i) => (
                      <Tag key={i} className='card-tag green-tag'>{c}</Tag>
                    ))}
                  </div>
                  <div className='sub-text mt-2'>
                    <strong className='bold-text'>ชื่อผู้โพส :</strong> {recipe.username}
                  </div>
                </Card>
              </div>
            </Col>
          ))}
        </Row>
      </section>
    </div>
  );
};

export default RecipesAndSearchPage;
