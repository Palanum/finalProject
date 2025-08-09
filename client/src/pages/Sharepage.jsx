import React, { useState, useRef } from 'react'
import "./Sharepage.css";

function Sharepage() {
  const [ingredients, setIngredients] = useState([
    { name: '', amount: '', unit: 'กรัม' }
  ]);
  const [steps, setSteps] = useState([
    { text: '', images: [] }
  ]);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');

  // Ingredient handlers (unchanged)
  const handleIngredientChange = (idx, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[idx][field] = value;
    setIngredients(newIngredients);
  };
  const addIngredient = () => {
    setIngredients([...ingredients, { name: '', amount: '', unit: 'กรัม' }]);
  };
  const removeIngredient = idx => {
    setIngredients(ingredients.filter((_, i) => i !== idx));
  };

  // Step handlers
  const fileInputs = useRef([]);

  const handleStepChange = (idx, value) => {
    const newSteps = [...steps];
    newSteps[idx].text = value;
    setSteps(newSteps);
  };
  const handleStepImagesChange = (idx, files) => {
    const newSteps = [...steps];
    const newImages = Array.from(files).map(file => ({
      file,
      preview: URL.createObjectURL(file)
    }));
    newSteps[idx].images = [...(newSteps[idx].images || []), ...newImages];
    setSteps(newSteps);
  };
  const removeStep = idx => {
    setSteps(steps.filter((_, i) => i !== idx));
  };
  const removeStepImage = (stepIdx, imgIdx) => {
    const newSteps = [...steps];
    newSteps[stepIdx].images = newSteps[stepIdx].images.filter((_, i) => i !== imgIdx);
    setSteps(newSteps);
  };
  const addStep = () => {
    setSteps([...steps, { text: '', images: [] }]);
  };

  // Tag handlers (unchanged)
  const handleAddTag = () => {
    if (tagInput && !tags.includes(tagInput)) {
      setTags([...tags, tagInput]);
      setTagInput('');
    }
  };
  const removeTag = tag => {
    setTags(tags.filter(t => t !== tag));
  };

  const handleSubmit = e => {
    e.preventDefault();
    // Submit logic here (handle images as FormData if uploading)
    alert('Recipe submitted!');
  };

  return (
    <div className='sharepage'>
      <h2>Share Your Recipe</h2>
      <form className='flex flex-column align-center' onSubmit={handleSubmit}>
        <input
          type="text"
          id='recipe-title'
          placeholder="ชื่อเมนู"
          value={title}
          onChange={e => setTitle(e.target.value)}
          required
        />

        {/* Tag section */}
        <section className='flex just-center align-center tag-container'>
          <input
            type="text"
            value={tagInput}
            onChange={e => setTagInput(e.target.value)}
            placeholder="เพิ่ม tag"
          />
          <button type="button" onClick={handleAddTag}>เพิ่ม tag</button>
          <div className="tag-list">
            {tags.map(tag => (
              <span key={tag} className="tag">
                {tag}
                <button type="button" onClick={() => removeTag(tag)}>x</button>
              </span>
            ))}
          </div>
        </section>

        {/* Time */}
        <section>
          <div className='flex'>
            <label htmlFor="recipe-time">ใช้เวลาประมาณ</label>
            <input
              type="text"
              id='recipe-time'
              placeholder="ระบุเวลา(นาที)"
              value={time}
              onChange={e => setTime(e.target.value)}
            />
          </div>
        </section>

        {/* Ingredients */}
        <section>
          <span>วัตถุดิบที่ใช้</span>
          <div id='ingredient-list' className='flex flex-column'>
            {ingredients.map((ing, idx) => (
              <div className='flex ingredient-container' key={idx}>
                <input
                  type="text"
                  placeholder="ระบุวัตถุดิบ"
                  value={ing.name}
                  onChange={e => handleIngredientChange(idx, 'name', e.target.value)}
                  required
                />
                <input
                  type="number"
                  placeholder="จำนวน"
                  value={ing.amount}
                  onChange={e => handleIngredientChange(idx, 'amount', e.target.value)}
                  required
                />
                <select
                  value={ing.unit}
                  onChange={e => handleIngredientChange(idx, 'unit', e.target.value)}
                >
                  <option value="กรัม">กรัม</option>
                  <option value="กิโลกรัม">กิโลกรัม</option>
                  <option value="มิลลิลิตร">มิลลิลิตร</option>
                  <option value="ลิตร">ลิตร</option>
                  <option value="ช้อนชา">ช้อนชา</option>
                  <option value="ช้อนโต๊ะ">ช้อนโต๊ะ</option>
                </select>
                <button type="button" onClick={() => removeIngredient(idx)}>ลบ</button>
              </div>
            ))}
          </div>
          <button type="button" onClick={addIngredient}>เพิ่มวัตถุดิบ</button>
        </section>

        {/* Steps */}
        <section>
          <h4>ขั้นตอนการปรุง</h4>
          <div id='instruction-steps' className='flex flex-column'>
            {steps.map((step, idx) => (
              <div className='flex step-row' key={idx}>
                <div className='step-text'>
                  <label>ขั้นตอนที่ {idx + 1}</label>
                  <textarea
                    placeholder="ระบุขั้นตอนการทำอาหาร"
                    value={step.text}
                    onChange={e => handleStepChange(idx, e.target.value)}
                    required
                  />
                </div>
                <div className="step-img-upload">
                  <div
                    className="step-img-preview-multi"
                  >
                    {step.images && step.images.map((img, imgIdx) => (
                      <div
                        key={imgIdx}
                        className='step-img-preview'
                      >
                        <img
                          src={img.preview}
                          alt={`step${idx + 1}-img${imgIdx + 1}`}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                        <button
                          type="button"
                          className="remove-img-btn"
                          onClick={e => {
                            e.stopPropagation();
                            removeStepImage(idx, imgIdx);
                          }}
                        >×</button>
                      </div>
                    ))}
                    <div
                      className="add-img-btn"
                      onClick={() => fileInputs.current[idx]?.click()}
                    >
                      <span style={{ color: '#aaa', fontSize: 32 }}>+</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        style={{ display: 'none' }}
                        ref={el => (fileInputs.current[idx] = el)}
                        onChange={e => {
                          if (e.target.files.length > 0) handleStepImagesChange(idx, e.target.files);
                        }}
                      />
                    </div>
                  </div>
                </div>
                <div>
                  <button type="button" onClick={() => removeStep(idx)}>ลบขั้นตอน</button>
                </div>
              </div>
            ))}
          </div>
          <button type="button" onClick={addStep}>เพิ่มขั้นตอน</button>
        </section>

        {/* Submit */}
        <button type="submit">Share Recipe</button>
      </form>
    </div>
  )
}

export default Sharepage