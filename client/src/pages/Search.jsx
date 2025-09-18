import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Input, Card, Tag, Row, Col, Slider, Switch, Button, InputNumber } from "antd";
import '../components/Button.css';
import './Search.css';
const { Meta } = Card;
const { Search } = Input;

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
    <div className="recipes-page p-3">
      <h1>{query ? "ผลการค้นหา" : "สูตรอาหารทั้งหมด"}</h1>

      {/* Basic search */}
      <div className="search-container flex gap-2 align-center mb-2">
        <Search
          placeholder="ค้นหาสูตรอาหาร..."
          allowClear
          enterButton={
            <Button
              type="primary"
              style={{
                backgroundColor: "var(--btn-g)",
                color: "var(--white)",
                padding: "0.5rem 1rem",
                boxShadow: "0px 1px 2px rgba(166, 175, 195, 0.25)",
              }}
            >
              ค้นหา
            </Button>
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={onSearch}
        />
        <Button className="link-btn link-green" type="link" onClick={() => setShowAdvanced(!showAdvanced)}>
          {showAdvanced ? "ซ่อนตัวกรองขั้นสูง" : "ตัวกรองขั้นสูง"}
        </Button>
      </div>

      {/* Advanced search filters */}
      {showAdvanced && (
        <div className="advanced-filters flex flex-column gap-2" >
          <div className="time-filters flex flex-column gap-2">
            <Row gutter={[16, 16]}>
              <Col md={12}>
                <Row
                  align="middle"
                  className="gap-2"
                >
                  <Col>
                    <Switch checked={includeMinTime} onChange={setIncludeMinTime} />
                  </Col>
                  <Col>
                    <label htmlFor="min-time">เวลาขั้นต่ำ</label>
                  </Col>
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
              <Col md={12}>
                <Row
                  align="middle"
                  className="gap-2"
                >
                  <Col>
                    <Switch checked={includeMaxTime} onChange={setIncludeMaxTime} />
                  </Col>
                  <Col><label htmlFor="max-time">เวลาสูงสุด</label></Col>
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
            <label htmlFor="indentIngredient">ค้นหาในวัตถุดิบด้วย</label>
            <Switch id="indentIngredient" checked={includeIngredient} onChange={setIncludeIngredient} />
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
