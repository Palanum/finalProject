import React, { useState, useRef } from 'react'
import "./Sharepage.css";
import { PlusOutlined, LoadingOutlined, MinusCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Cascader,
  Checkbox,
  ColorPicker,
  DatePicker,
  Form,
  Input,
  InputNumber,
  message,
  Radio,
  Rate,
  Select,
  Slider,
  Space,
  Switch,
  TreeSelect,
  Upload,
} from 'antd';
function Sharepage() {
  const { TextArea } = Input;

  const [recipeImageUrl, setRecipeImageUrl] = useState();
  const [recipeLoading, setRecipeLoading] = useState(false);

  const normFile = e => (Array.isArray(e) ? e : e?.fileList);

  const getBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(file);
  };

  const beforeUpload = file => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) message.error('You can only upload JPG/PNG file!');
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) message.error('Image must smaller than 2MB!');
    return isJpgOrPng && isLt2M;
  };

  const handleRecipeChange = info => {
    const file = info.file.originFileObj;
    if (!file) return;

    setRecipeLoading(true);

    getBase64(file, url => {
      setRecipeLoading(false);
      setRecipeImageUrl(url);
    });

    return false;
  };

  const uploadRecipeButton = (
    <div>
      {recipeLoading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const onFinish = values => {
    console.log('Form Values:', values);
    message.success('Recipe submitted successfully!');
  };

  const formItemLayout = {
    labelCol: {
      xs: { span: 4 },
      sm: { span: 4 }
    },
    wrapperCol: {
      xs: { span: 14 },
      sm: { span: 18 }
    },
  };
  const formItemLayoutWithOutLabel = {
    wrapperCol: {
      xs: { span: 14, offset: 4 },
      sm: { span: 18, offset: 4 }
    },
  };
  return (
    <div className="sharepage">
      <h3>Share Your Recipe</h3>
      <Form
        name="recipe_form"
        className="recipe-form"
        layout="horizontal"
        initialValues={{
          tags: [], // 0 tags by default
          ingredientsList: [{ name: '', quantity: '', unit: 'กิโลกรัม' }], // 1 ingredient
          stepsList: [{ stepDescription: '', stepImages: [] }], // 1 step
        }}
        onFinish={onFinish}
      >
        {/* Recipe Title */}
        <Form.Item
          name="title"
          rules={[{ required: true, message: 'Please input the title of your recipe!' }]}
          {...formItemLayoutWithOutLabel}
        >
          <Input placeholder="ชื่อเมนูอาหาร" />
        </Form.Item>

        {/* Recipe Image */}
        <Form.Item
          name="recipeImage"
          label="Recipe Image"
          valuePropName="fileList"
          getValueFromEvent={normFile}
          {...formItemLayout}
        >
          <Upload
            accept="image/png, image/jpeg, image/jpg"
            name="recipe"
            listType="picture-card"
            showUploadList={false}
            maxCount={1}
            beforeUpload={beforeUpload}
            onChange={handleRecipeChange}
          >
            {recipeImageUrl ? (
              <img src={recipeImageUrl} alt="recipe" style={{ width: '100%' }} />
            ) : (
              uploadRecipeButton
            )}
          </Upload>
        </Form.Item>

        {/* Tags */}
        <Form.Item label="Tags" {...formItemLayout}>
          <Form.List name="tags">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'tag']}
                      rules={[{ required: true, message: 'Missing Tag Name' }]}
                    >
                      <Input placeholder="Tag Name" />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item {...formItemLayoutWithOutLabel}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Tag
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form.Item>

        {/* Description */}
        <Form.Item name="description" label="Description" {...formItemLayout}>
          <TextArea autoSize={{ minRows: 3, maxRows: 3 }} />
        </Form.Item>

        {/* Time */}
        <Form.Item name="time" label="Time" {...formItemLayout}>
          <InputNumber />
        </Form.Item>

        {/* Ingredients */}
        <Form.Item label="Ingredients" {...formItemLayout}>
          <Form.List name="ingredientsList">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                    <Form.Item
                      {...restField}
                      name={[name, 'name']}
                      rules={[{ required: true, message: 'Missing ingredient name' }]}
                      style={{ flex: 2, minWidth: 120 }}
                    >
                      <Input placeholder="Ingredient Name" />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'quantity']}
                      rules={[{ required: true, message: 'Missing quantity' }]}
                      style={{ flex: 1, minWidth: 80 }}
                    >
                      <InputNumber placeholder="Quantity" style={{ width: '100%' }} />
                    </Form.Item>

                    <Form.Item
                      {...restField}
                      name={[name, 'unit']}
                      rules={[{ required: true, message: 'Missing unit' }]}
                      style={{ flex: 1, minWidth: 100 }}
                    >
                      <Select
                        options={[
                          { value: 'กิโลกรัม', label: 'กิโลกรัม' },
                          { value: 'กรัม', label: 'กรัม' },
                          { value: 'ลิตร', label: 'ลิตร' },
                          { value: 'มิลลิลิตร', label: 'มิลลิลิตร' },
                          { value: 'ช้อนชา', label: 'ช้อนชา' },
                          { value: 'ช้อนโต๊ะ', label: 'ช้อนโต๊ะ' },
                          { value: 'ถ้วย', label: 'ถ้วย' },
                        ]}
                        style={{ width: '100%' }}
                      />
                    </Form.Item>

                    {fields.length > 1 && (
                      <MinusCircleOutlined
                        style={{ marginTop: 8 }}
                        onClick={() => remove(name)}
                      />
                    )}
                  </div>
                ))}


                <Form.Item {...formItemLayoutWithOutLabel}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Ingredient
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form.Item>


        {/* Cooking Steps */}
        <Form.Item label="Cooking Steps" {...formItemLayout}>
          <Form.List name="stepsList">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <div
                    key={key}
                    style={{
                      border: '1px solid #ddd',
                      padding: '10px',
                      marginBottom: '12px',
                      borderRadius: '6px',
                    }}
                  >
                    <div className="flex align-start mb-2">
                      <Form.Item
                        {...restField}
                        name={[name, 'stepDescription']}
                        rules={[{ required: true, message: 'Missing step description' }]}
                        style={{ flex: 1, marginBottom: 0 }}
                      >
                        <TextArea
                          placeholder="Step description"
                          autoSize={{ minRows: 3, maxRows: 3 }}
                          style={{ width: '100%' }}
                        />
                      </Form.Item>
                      {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(name)} />}
                    </div>

                    <Form.Item
                      {...restField}
                      name={[name, 'stepImages']}
                      valuePropName="fileList"
                      getValueFromEvent={normFile}
                    >
                      <Upload
                        accept="image/png, image/jpeg, image/jpg"
                        listType="picture-card"
                        multiple
                        action="/upload.do"
                        beforeUpload={beforeUpload}
                      >
                        <div>
                          <PlusOutlined />
                          <div style={{ fontSize: 12 }}>Add Images</div>
                        </div>
                      </Upload>
                    </Form.Item>
                  </div>
                ))}
                <Form.Item {...formItemLayoutWithOutLabel}>
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    Add Step
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form.Item>

        {/* Submit */}
        <Form.Item {...formItemLayoutWithOutLabel}>
          <Button type="primary" htmlType="submit">
            Share Recipe
          </Button>
        </Form.Item>
      </Form>
    </div>
  );
}



// function Sharepage() {
//   const [ingredients, setIngredients] = useState([
//     { name: '', amount: '', unit: 'กรัม' }
//   ]);
//   const [steps, setSteps] = useState([
//     { text: '', images: [] }
//   ]);
//   const [title, setTitle] = useState('');
//   const [time, setTime] = useState('');
//   const [tags, setTags] = useState([]);
//   const [tagInput, setTagInput] = useState('');

//   // Ingredient handlers (unchanged)
//   const handleIngredientChange = (idx, field, value) => {
//     const newIngredients = [...ingredients];
//     newIngredients[idx][field] = value;
//     setIngredients(newIngredients);
//   };
//   const addIngredient = () => {
//     setIngredients([...ingredients, { name: '', amount: '', unit: 'กรัม' }]);
//   };
//   const removeIngredient = idx => {
//     setIngredients(ingredients.filter((_, i) => i !== idx));
//   };

//   // Step handlers
//   const fileInputs = useRef([]);

//   const handleStepChange = (idx, value) => {
//     const newSteps = [...steps];
//     newSteps[idx].text = value;
//     setSteps(newSteps);
//   };
//   const handleStepImagesChange = (idx, files) => {
//     const newSteps = [...steps];
//     const newImages = Array.from(files).map(file => ({
//       file,
//       preview: URL.createObjectURL(file)
//     }));
//     newSteps[idx].images = [...(newSteps[idx].images || []), ...newImages];
//     setSteps(newSteps);
//   };
//   const removeStep = idx => {
//     setSteps(steps.filter((_, i) => i !== idx));
//   };
//   const removeStepImage = (stepIdx, imgIdx) => {
//     const newSteps = [...steps];
//     newSteps[stepIdx].images = newSteps[stepIdx].images.filter((_, i) => i !== imgIdx);
//     setSteps(newSteps);
//   };
//   const addStep = () => {
//     setSteps([...steps, { text: '', images: [] }]);
//   };

//   // Tag handlers (unchanged)
//   const handleAddTag = () => {
//     if (tagInput && !tags.includes(tagInput)) {
//       setTags([...tags, tagInput]);
//       setTagInput('');
//     }
//   };
//   const removeTag = tag => {
//     setTags(tags.filter(t => t !== tag));
//   };

//   const handleSubmit = e => {
//     e.preventDefault();
//     // Submit logic here (handle images as FormData if uploading)
//     alert('Recipe submitted!');
//   };

//   return (
//     <div className='sharepage'>
//       <h2>Share Your Recipe</h2>
//       <form className='flex flex-column align-center' onSubmit={handleSubmit}>
//         <input
//           type="text"
//           id='recipe-title'
//           placeholder="ชื่อเมนู"
//           value={title}
//           onChange={e => setTitle(e.target.value)}
//           required
//         />

//         {/* Tag section */}
//         <section className='flex just-center align-center tag-container'>
//           <input
//             type="text"
//             value={tagInput}
//             onChange={e => setTagInput(e.target.value)}
//             placeholder="เพิ่ม tag"
//           />
//           <button type="button" onClick={handleAddTag}>เพิ่ม tag</button>
//           <div className="tag-list">
//             {tags.map(tag => (
//               <span key={tag} className="tag">
//                 {tag}
//                 <button type="button" onClick={() => removeTag(tag)}>x</button>
//               </span>
//             ))}
//           </div>
//         </section>

//         {/* Time */}
//         <section>
//           <div className='flex'>
//             <label htmlFor="recipe-time">ใช้เวลาประมาณ</label>
//             <input
//               type="text"
//               id='recipe-time'
//               placeholder="ระบุเวลา(นาที)"
//               value={time}
//               onChange={e => setTime(e.target.value)}
//             />
//           </div>
//         </section>

//         {/* Ingredients */}
//         <section>
//           <span>วัตถุดิบที่ใช้</span>
//           <div id='ingredient-list' className='flex flex-column'>
//             {ingredients.map((ing, idx) => (
//               <div className='flex ingredient-container' key={idx}>
//                 <input
//                   type="text"
//                   placeholder="ระบุวัตถุดิบ"
//                   value={ing.name}
//                   onChange={e => handleIngredientChange(idx, 'name', e.target.value)}
//                   required
//                 />
//                 <input
//                   type="number"
//                   placeholder="จำนวน"
//                   value={ing.amount}
//                   onChange={e => handleIngredientChange(idx, 'amount', e.target.value)}
//                   required
//                 />
//                 <select
//                   value={ing.unit}
//                   onChange={e => handleIngredientChange(idx, 'unit', e.target.value)}
//                 >
//                   <option value="กรัม">กรัม</option>
//                   <option value="กิโลกรัม">กิโลกรัม</option>
//                   <option value="มิลลิลิตร">มิลลิลิตร</option>
//                   <option value="ลิตร">ลิตร</option>
//                   <option value="ช้อนชา">ช้อนชา</option>
//                   <option value="ช้อนโต๊ะ">ช้อนโต๊ะ</option>
//                 </select>
//                 <button type="button" onClick={() => removeIngredient(idx)}>ลบ</button>
//               </div>
//             ))}
//           </div>
//           <button type="button" onClick={addIngredient}>เพิ่มวัตถุดิบ</button>
//         </section>

//         {/* Steps */}
//         <section>
//           <h4>ขั้นตอนการปรุง</h4>
//           <div id='instruction-steps' className='flex flex-column'>
//             {steps.map((step, idx) => (
//               <div className='flex step-row' key={idx}>
//                 <div className='step-text'>
//                   <label>ขั้นตอนที่ {idx + 1}</label>
//                   <textarea
//                     placeholder="ระบุขั้นตอนการทำอาหาร"
//                     value={step.text}
//                     onChange={e => handleStepChange(idx, e.target.value)}
//                     required
//                   />
//                 </div>
//                 <div className="step-img-upload">
//                   <div
//                     className="step-img-preview-multi"
//                   >
//                     {step.images && step.images.map((img, imgIdx) => (
//                       <div
//                         key={imgIdx}
//                         className='step-img-preview'
//                       >
//                         <img
//                           src={img.preview}
//                           alt={`step${idx + 1}-img${imgIdx + 1}`}
//                           style={{ width: '100%', height: '100%', objectFit: 'cover' }}
//                         />
//                         <button
//                           type="button"
//                           className="remove-img-btn"
//                           onClick={e => {
//                             e.stopPropagation();
//                             removeStepImage(idx, imgIdx);
//                           }}
//                         >×</button>
//                       </div>
//                     ))}
//                     <div
//                       className="add-img-btn"
//                       onClick={() => fileInputs.current[idx]?.click()}
//                     >
//                       <span style={{ color: '#aaa', fontSize: 32 }}>+</span>
//                       <input
//                         type="file"
//                         accept="image/*"
//                         multiple
//                         style={{ display: 'none' }}
//                         ref={el => (fileInputs.current[idx] = el)}
//                         onChange={e => {
//                           if (e.target.files.length > 0) handleStepImagesChange(idx, e.target.files);
//                         }}
//                       />
//                     </div>
//                   </div>
//                 </div>
//                 <div>
//                   <button type="button" onClick={() => removeStep(idx)}>ลบขั้นตอน</button>
//                 </div>
//               </div>
//             ))}
//           </div>
//           <button type="button" onClick={addStep}>เพิ่มขั้นตอน</button>
//         </section>

//         {/* Submit */}
//         <button type="submit">Share Recipe</button>
//       </form>
//     </div>
//   )
// }

export default Sharepage