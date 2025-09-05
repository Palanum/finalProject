import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import "./Sharepage.css";
import '../components/Button.css'
import './Form.css'
import { AuthContext } from "../context/AuthContext";
import { EditOutlined, PlusOutlined, LoadingOutlined, MinusCircleOutlined } from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Upload,
  Row,
  Col
} from 'antd';
import axios from 'axios';

function Sharepage({ initialData = null, mode = "create" }) {
  const { TextArea } = Input;
  const [recipeImageUrl, setRecipeImageUrl] = useState(initialData?.ImageURL || '');
  const [recipeFileList, setRecipeFileList] = useState(
    initialData?.ImageURL
      ? [{ url: initialData.ImageURL, uid: 'existing', isOld: true }]
      : []
  );

  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const { user } = useContext(AuthContext);
  const [recipeLoading, setRecipeLoading] = useState(false);
  const navigate = useNavigate();

  const handlePreview = (file) => {
    setPreviewImage(file.originFileObj ? URL.createObjectURL(file.originFileObj) : file.url);
    setPreviewVisible(true);
  };
  const normFile = e => (Array.isArray(e) ? e : e?.fileList);

  const getBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => callback(reader.result));
    reader.readAsDataURL(file);
  };

  const beforeUpload = (file) => {
    const isJpgOrPng = file.type === 'image/jpeg' || file.type === 'image/png';
    if (!isJpgOrPng) message.error('You can only upload JPG/PNG file!');
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) message.error('Image must smaller than 2MB!');
    return false; // <-- prevent auto upload
  };

  const handleRecipeChange = ({ fileList }) => {
    const updated = fileList.map(file => ({
      ...file,
      isOld: file.isOld || false, // preserve old flag
      uid: file.uid || `recipe-${Date.now()}`
    }));
    setRecipeFileList(updated);

    const file = updated[0]?.originFileObj;
    if (file) getBase64(file, url => setRecipeImageUrl(url));
  };


  const uploadRecipeButton = (
    <div className='upload-placeholder'>
      {recipeLoading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const onFinish = async (values) => {
    try {
      const formData = new FormData();

      // --- Basic recipe info ---
      formData.append('title', values.title);
      formData.append('time', values.time || '');
      formData.append('videoURL', values.video || '');

      // --- Recipe Image Handling ---
      if (mode === 'edit') {
        if (!recipeFileList.length) {
          formData.append('removeRecipeImage', true);
          console.log("Recipe Image: removed");
        } else if (recipeFileList[0]?.originFileObj) {
          formData.append('recipeImage', recipeFileList[0].originFileObj);
          // console.log("Recipe Image: new upload", recipeFileList[0].originFileObj);
        } else {
          // console.log("Recipe Image: kept old", recipeFileList[0].url);
        }
      } else if (recipeFileList[0]?.originFileObj) {
        formData.append('recipeImage', recipeFileList[0].originFileObj);
        // console.log("Recipe Image: new upload", recipeFileList[0].originFileObj);
      }

      // --- Ingredients ---
      formData.append('ingredients', JSON.stringify(values.ingredientsList || []));

      // --- Instructions / Step Images ---
      const instructions = values.stepsList.map((step, stepIndex) => {
        const initialStep = initialData?.instructions?.[stepIndex];
        const stepImages = step.stepImages?.map(f => {
          if (f.originFileObj) return { new: true, tempName: f.name };
          if (f.url) return { url: f.url, isOld: initialStep?.images?.includes(f.url) };
          return null;
        }).filter(Boolean) || [];

        return {
          text: step.stepDescription,
          stepImages
        };
      });

      formData.append('instructions', JSON.stringify(instructions));

      // --- Append new step image files ---
      values.stepsList.forEach(step => {
        step.stepImages?.forEach(file => {
          if (file.originFileObj) formData.append('stepImages', file.originFileObj);
        });
      });

      // --- Tags / Categories ---
      formData.append('tags', JSON.stringify(values.tags?.map(t => t.tag) || []));

      // console.log("=== FormData prepared for backend ===");
      for (let [key, value] of formData.entries()) console.log(key, value);
      // console.log("===================================");

      // --- Confirmation ---
      Modal.confirm({
        title: mode === 'edit' ? 'ยืนยันการอัปเดตสูตรอาหาร?' : 'ยืนยันการแชร์สูตรอาหาร?',
        content: 'คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ',
        okText: 'ยืนยัน',
        cancelText: 'ยกเลิก',
        onOk: async () => {
          const url = mode === 'edit'
            ? `/api/recipes/${initialData.RecipeID}/edit`
            : '/api/recipes/addnew';
          const method = mode === 'edit' ? 'PUT' : 'POST';

          try {
            const res = await axios({
              url,
              method,
              data: formData,
              headers: { 'Content-Type': 'multipart/form-data' },
              withCredentials: true
            });

            if (res.data?.RecipeID) {
              message.success(mode === 'edit' ? 'Recipe updated!' : 'Recipe submitted!');
              navigate(`/recipes/${res.data.RecipeID}`);
            } else {
              message.error('Submission failed!');
            }
          } catch (err) {
            console.error(err);
            message.error('Submission failed! See console.');
          }
        }
      });

    } catch (err) {
      console.error(err);
      message.error('Submission failed! See console.');
    }
  };








  const formItemLayout = {
    labelCol: {
      md: { span: 6 },
      lg: { span: 6 }
    },
    wrapperCol: {
      md: { span: 12 },
      lg: { span: 16 }
    },
  };
  const formItemLayoutWithOutLabel = {
    wrapperCol: {
      md: { span: 12, offset: 6 },
      lg: { span: 16, offset: 6 }
    },
  };
  const buttonItemLayout = {
    wrapperCol: {
      md: { span: 6, offset: 0 },
      lg: { span: 10, offset: 0 }
    },
  };
  return (
    <div className="sharepage">
      <h2 className='sharepage-title mb-3'>Share Your Recipe</h2>
      <Form
        name="recipe_form"
        className="recipe-form"
        layout="horizontal"
        initialValues={{
          title: initialData?.Title || '',
          time: initialData?.time || '',
          tags: initialData?.categories?.map(tag => ({ tag })) || [],
          ingredientsList: initialData?.ingredients || [{ name: '', quantity: '', unit: 'กิโลกรัม' }],
          stepsList: initialData?.instructions?.map(inst => ({
            stepDescription: inst.text,
            stepImages: inst.images?.map((url, index) => ({
              url,
              uid: `existing-${index}`,
              isOld: true
            })) || []
          })) || [{ stepDescription: '', stepImages: [] }],
          video: initialData?.videoURL || '',
        }}
        onFinish={onFinish}
      >
        {/* Recipe Title */}
        <Form.Item
          name="title"
          rules={[{ required: true, message: 'โปรดใส่ชื่อเมนูอาหาร' }]}
          {...formItemLayoutWithOutLabel}
        >
          <Input className='text-center input-text' placeholder="ชื่อเมนูอาหาร" />
        </Form.Item>

        {/* Recipe Image */}
        <Row className='full-width just-center '>
          <Col style={{ textAlign: 'center' }}>
            <Form.Item>
              <Upload
                accept="image/png, image/jpeg"
                listType="picture-card"
                maxCount={1}
                action={null} // prevent auto-upload
                beforeUpload={beforeUpload}
                onPreview={handlePreview}
                fileList={recipeFileList.map(file => ({
                  ...file,
                  isOld: file.isOld || !!file.url, // mark old images
                }))}
                onChange={({ fileList }) => {
                  const updatedList = fileList.map(f => ({
                    uid: f.uid,
                    name: f.name,
                    status: f.status,
                    url: f.url,
                    originFileObj: f.originFileObj || null,
                    isOld: f.isOld || !!f.url,
                  }));
                  setRecipeFileList(updatedList);

                  // Update preview URL if new upload
                  const file = updatedList[0]?.originFileObj;
                  if (file) getBase64(file, url => setRecipeImageUrl(url));
                }}
              >
                {recipeFileList.length >= 1 ? null : uploadRecipeButton}
              </Upload>
            </Form.Item>


            <Modal open={previewVisible} footer={null} onCancel={() => setPreviewVisible(false)}>
              <img alt="Preview" style={{ width: '100%' }} src={previewImage} />
            </Modal>


          </Col>
        </Row>


        {/* Tags */}
        <Form.Item label="ชื่อแท็ก" {...formItemLayout}>
          <Form.List name="tags">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                    <Form.Item
                      {...restField}
                      name={[name, 'tag']}
                      rules={[{ required: true, message: 'โปรดใส่ชื่อแท็ก' }]}
                    >
                      <Input className='input-text' placeholder="ชื่อแท็ก" />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item {...buttonItemLayout}>
                  <Button className='btn white-btn' type="default" onClick={() => add()} block icon={<PlusOutlined />}>
                    เพิ่มแท็ก
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form.Item>

        {/* Time */}
        <Form.Item name="time" label="เวลาที่ใช้โดยประมาณ (นาที)" {...formItemLayout}>
          <InputNumber className='input-text' addonAfter="นาที" style={{ width: '100%' }} />
        </Form.Item>


        {/* Ingredients */}
        <Form.List name="ingredientsList">
          {(fields, { add, remove }) => (
            <Form.Item label="วัตถุดิบ" {...formItemLayout}>
              {fields.map(({ key, name, ...restField }) => (
                <div key={key} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                  <Form.Item
                    {...restField}
                    name={[name, 'name']}
                    rules={[{ required: true, message: 'โปรดใส่ชื่อวัตถุดิบ' }]}
                    style={{ flex: 2, minWidth: 120 }}
                  >
                    <Input className='input-text' placeholder="ชื่อวัตถุดิบ" />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'quantity']}
                    rules={[{ required: true, message: 'โปรดใส่จำนวน' }]}
                    style={{ flex: 1, minWidth: 80 }}
                  >
                    <InputNumber className='input-text' placeholder="จำนวน" style={{ width: '100%' }} />
                  </Form.Item>

                  <Form.Item
                    {...restField}
                    name={[name, 'unit']}
                    rules={[{ required: true, message: 'โปรดเลือกหน่วยที่ใช้' }]}
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


              <Form.Item {...buttonItemLayout}>
                <Button className='btn white-btn' type="default" onClick={() => add({ unit: 'กิโลกรัม' })} block icon={<PlusOutlined />}>
                  เพิ่มวัตถุดิบ
                </Button>
              </Form.Item>
            </Form.Item>
          )}
        </Form.List>


        {/* Cooking Steps */}
        <Form.List name="stepsList">
          {(fields, { add, remove }) => (
            <Form.Item label="ขั้นตอนการปรุงอาหาร" {...formItemLayout}>
              {fields.map(({ key, name, ...restField }, stepIndex) => (
                <div
                  key={key}
                  style={{
                    border: '1px solid #ddd',
                    padding: '10px',
                    marginBottom: '12px',
                    borderRadius: '6px',
                  }}
                >
                  {/* Step description */}
                  <div className="flex align-start mb-2">
                    <Form.Item
                      {...restField}
                      name={[name, 'stepDescription']}
                      rules={[{ required: true, message: 'โปรดใส่รายละเอียดขั้นตอนการปรุงอาหาร' }]}
                      style={{ flex: 1, marginBottom: 0 }}
                    >
                      <TextArea
                        className='input-text full-width'
                        placeholder="รายละเอียดขั้นตอนการปรุงอาหาร"
                        autoSize={{ minRows: 3, maxRows: 3 }}
                      />
                    </Form.Item>
                    {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(name)} />}
                  </div>

                  {/* Step images */}
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
                      beforeUpload={() => false} // prevent auto-upload
                      onPreview={handlePreview}
                      itemRender={(originNode, file) => {
                        // mark old files
                        if (file.url) file.isOld = true;
                        return originNode;
                      }}
                      fileList={recipeFileList}
                      onChange={handleRecipeChange}
                    >
                      <div className='upload-placeholder'>
                        <PlusOutlined />
                        <div style={{ fontSize: 12 }}>Add Images</div>
                      </div>
                    </Upload>
                  </Form.Item>
                </div>
              ))}
              <Form.Item {...buttonItemLayout}>
                <Button className='btn white-btn' type="default" onClick={() => add()} block icon={<PlusOutlined />}>
                  เพิ่มขั้นตอนการปรุงอาหาร
                </Button>
              </Form.Item>
            </Form.Item>
          )}
        </Form.List>


        <Modal
          open={previewVisible}
          footer={null}
          onCancel={() => setPreviewVisible(false)}
        >
          <img
            alt="Preview"
            style={{ width: '100%' }}
            src={previewImage}
          />
        </Modal>
        {/* Single Recipe Video */}
        <Form.Item label="วิดีโอสูตรอาหาร" name="video" rules={[{ type: 'url' }]} {...formItemLayout}>
          <Input className='input-text' placeholder="Video URL (YouTube, Vimeo, TikTok...)" />
        </Form.Item>

        {/* Live Video Preview */}
        <Form.Item shouldUpdate>
          {({ getFieldValue }) => {
            const url = getFieldValue('video');
            return url ? (
              <div style={{ textAlign: 'center' }}>
                <VideoPreview url={url} />
              </div>
            ) : null;
          }}
        </Form.Item>

        {/* Submit */}
        <Form.Item {...formItemLayoutWithOutLabel}>
          <Button
            className='btn white-btn'
            type="default"
            htmlType="submit"
            iconPosition="end"
            icon={mode === 'edit' ? <EditOutlined /> : <PlusOutlined />}
          >
            {mode === 'edit' ? 'อัปเดตสูตรของฉัน' : 'แชร์สูตรของฉัน'}
          </Button>
        </Form.Item>

      </Form>
    </div>
  );
}

function getEmbedUrl(url) {
  if (!url) return null;

  try {
    // YouTube
    if (url.includes("youtube.com/watch")) {
      const videoId = new URL(url).searchParams.get("v");
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (url.includes("youtu.be/")) {
      const videoId = url.split("youtu.be/")[1].split(/[?&]/)[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    // Vimeo
    if (url.includes("vimeo.com/")) {
      const videoId = url.split("vimeo.com/")[1].split(/[?&]/)[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }

    // TikTok (embed)
    if (url.includes("tiktok.com/")) {
      return url.replace("/video/", "/embed/video/");
    }

    // Facebook
    if (url.includes("facebook.com/")) {
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}`;
    }

    return null; // unsupported link
  } catch (err) {
    console.error("Invalid video URL", err);
    return null;
  }
}


const VideoPreview = ({ url }) => {
  const [embedUrl, setEmbedUrl] = useState(null);

  useEffect(() => {
    setEmbedUrl(getEmbedUrl(url));
  }, [url]);

  if (!embedUrl) return null;

  return (
    <div style={{ marginTop: 8 }}>
      <iframe
        width="360"
        height="215"
        src={embedUrl}
        title="Video Preview"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    </div>
  );
};

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