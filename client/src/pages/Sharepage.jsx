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

const { TextArea } = Input;

export default function Sharepage({ initialData = null, mode = "create" }) {
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [recipeLoading, setRecipeLoading] = useState(false);
  const [recipeFileList, setRecipeFileList] = useState(
    initialData?.ImageURL
      ? [{ url: initialData.ImageURL, uid: 'existing', isOld: true }]
      : []
  );

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // ---------------- Helpers ----------------
  const getBase64 = (file, callback) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => callback(reader.result));
    reader.readAsDataURL(file);
  };

  const beforeUpload = (file) => {
    const isValid =
      ["image/jpeg", "image/png", "image/jpg"].includes(file.type) &&
      file.size / 1024 / 1024 < 2;
    if (!isValid) {
      message.error("Only JPG/PNG under 2MB allowed!");
      return Upload.LIST_IGNORE;
    }
    return false; // prevent auto upload
  };

  const normFile = (e) =>
    (Array.isArray(e) ? e : e?.fileList || []).map((f) => ({
      ...f,
      url: f.url || (f.response && f.response.url),
      isOld: f.isOld || (!!f.url && !f.originFileObj),
      new: !f.isOld && !!f.originFileObj,
      tempName: f.originFileObj?.name || f.tempName,
    }));

  const handlePreview = (file) => {
    setPreviewImage(
      file.originFileObj ? URL.createObjectURL(file.originFileObj) : file.url
    );
    setPreviewVisible(true);
  };

  // ---------------- Submit ----------------
  const onFinish = async (values) => {
    try {
      const formData = new FormData();

      // Basic fields
      formData.append("title", values.title);
      formData.append("time", values.time || "");
      formData.append("videoURL", values.video || "");
      formData.append("tags", JSON.stringify(values.tags?.map((t) => t.tag) || []));
      formData.append("ingredients", JSON.stringify(values.ingredientsList || []));

      // Recipe main image
      if (mode === "edit") {
        if (!values.recipeImage?.length) {
          formData.append("removeRecipeImage", true);
        } else if (values.recipeImage[0]?.originFileObj) {
          formData.append("recipeImage", values.recipeImage[0].originFileObj);
        }
      } else if (values.recipeImage?.[0]?.originFileObj) {
        formData.append("recipeImage", values.recipeImage[0].originFileObj);
      }

      // Instructions
      const instructions = values.stepsList.map((step) => ({
        text: step.stepDescription,
        stepImages:
          step.stepImages?.map((f) =>
            f.originFileObj
              ? { new: true, tempName: f.name }
              : f.url
                ? { url: f.url, isOld: f.isOld }
                : null
          ).filter(Boolean) || [],
      }));
      formData.append("instructions", JSON.stringify(instructions));

      // Append new step images
      values.stepsList.forEach((s) =>
        s.stepImages?.forEach((f) => {
          if (f.originFileObj) formData.append("stepImages", f.originFileObj);
        })
      );
      // --- Confirmation of FormData contents ---
      // console.log("=== FormData contents ===");
      const formDataObj = {};

      for (let [key, value] of formData.entries()) {
        if (value instanceof File) {
          // For uploaded files, show name instead of full object
          formDataObj[key] = value.name;
        } else {
          formDataObj[key] = value;
        }
      }

      // console.dir(formDataObj);
      // console.log("========================");
      // Confirm modal
      Modal.confirm({
        title: mode === "edit" ? "ยืนยันการอัปเดตสูตรอาหาร?" : "ยืนยันการแชร์สูตรอาหาร?",
        content: "คุณแน่ใจหรือไม่ว่าต้องการดำเนินการต่อ",
        okText: "ยืนยัน",
        cancelText: "ยกเลิก",
        onOk: async () => {
          try {
            const res = await axios({
              url:
                mode === "edit"
                  ? `/api/recipes/${initialData.RecipeID}/edit`
                  : "/api/recipes/addnew",
              method: mode === "edit" ? "PUT" : "POST",
              data: formData,
              headers: { "Content-Type": "multipart/form-data" },
              withCredentials: true,
            });
            if (res.data?.RecipeID) {
              message.success(mode === "edit" ? "Recipe updated!" : "Recipe submitted!");
              navigate(`/recipes/${res.data.RecipeID}`);
            } else message.error("Submission failed!");
          } catch (err) {
            console.error(err);
            message.error("Submission failed!");
          }
        },
      });
    } catch (err) {
      console.error(err);
      message.error("Submission failed!");
    }
  };

  // ---------------- Layout ----------------
  const formItemLayout = { labelCol: { md: { span: 6 } }, wrapperCol: { md: { span: 16 } } };
  const buttonItemLayout = { wrapperCol: { md: { span: 10 } } };

  // ---------------- Render ----------------
  return (
    <div className="sharepage">
      <h2 className="sharepage-title mb-3">Share Your Recipe</h2>

      <Form
        name="recipe_form"
        className="recipe-form"
        layout="horizontal"
        onFinish={onFinish}
        initialValues={{
          title: initialData?.Title || "",
          time: initialData?.time || "",
          tags: initialData?.categories?.map((tag) => ({ tag: tag.name })) || [],
          ingredientsList:
            initialData?.ingredients || [{ name: "", quantity: "", unit: "กิโลกรัม" }],
          stepsList:
            initialData?.instructions?.map((inst, i) => ({
              stepDescription: inst.text,
              stepImages:
                inst.images?.map((img, j) => ({
                  url: img.url,
                  uid: `existing-${i}-${j}`,
                  isOld: true,
                })) || [],
            })) || [{ stepDescription: "", stepImages: [] }],
          video: initialData?.videoURL || "",
          recipeImage: initialData?.ImageURL
            ? [{ url: initialData.ImageURL, uid: "existing", isOld: true }]
            : [],
        }}
      >
        {/* Title */}
        <Form.Item
          name="title"
          rules={[{ required: true, message: "โปรดใส่ชื่อเมนูอาหาร" }]}
        >
          <Input className="text-center input-text" placeholder="ชื่อเมนูอาหาร" />
        </Form.Item>

        {/* Recipe Image */}
        <Row justify="center">
          <Col>
            <Form.Item
              name="recipeImage"
              valuePropName="fileList"
              getValueFromEvent={normFile}
            >
              <Upload
                accept="image/png, image/jpeg"
                listType="picture-card"
                maxCount={1}
                beforeUpload={beforeUpload}
                onPreview={handlePreview}
                onChange={({ fileList }) => setRecipeFileList(fileList)}
              >
                {recipeFileList && recipeFileList.length >= 1 ? null : (
                  <div className="upload-placeholder">
                    {recipeLoading ? <LoadingOutlined /> : <PlusOutlined />}
                    <div style={{ marginTop: 8 }}>Upload</div>
                  </div>
                )}
              </Upload>
            </Form.Item>
          </Col>
        </Row>

        {/* Tags */}
        <Form.Item label="ชื่อแท็ก" {...formItemLayout}>
          <Form.List name="tags">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...rest }) => (
                  <Space key={key} style={{ display: "flex", marginBottom: 8 }}>
                    <Form.Item {...rest} name={[name, "tag"]} rules={[{ required: true }]}>
                      <Input placeholder="ชื่อแท็ก" />
                    </Form.Item>
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  </Space>
                ))}
                <Form.Item {...buttonItemLayout}>
                  <Button onClick={() => add()} block icon={<PlusOutlined />}>
                    เพิ่มแท็ก
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form.Item>

        {/* Time */}
        <Form.Item name="time" label="เวลาที่ใช้โดยประมาณ (นาที)" {...formItemLayout}>
          <InputNumber addonAfter="นาที" style={{ width: "100%" }} />
        </Form.Item>

        {/* Ingredients */}
        <Form.List name="ingredientsList">
          {(fields, { add, remove }) => (
            <Form.Item label="วัตถุดิบ" {...formItemLayout}>
              {fields.map(({ key, name, ...rest }) => (
                <Space key={key} align="baseline">
                  <Form.Item {...rest} name={[name, "name"]} rules={[{ required: true }]}>
                    <Input placeholder="ชื่อวัตถุดิบ" />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, "quantity"]} rules={[{ required: true }]}>
                    <InputNumber placeholder="จำนวน" />
                  </Form.Item>
                  <Form.Item {...rest} name={[name, "unit"]} rules={[{ required: true }]}>
                    <Select
                      options={[
                        "กิโลกรัม",
                        "กรัม",
                        "ลิตร",
                        "มิลลิลิตร",
                        "ช้อนชา",
                        "ช้อนโต๊ะ",
                        "ถ้วย",
                      ].map((u) => ({ value: u, label: u }))}
                    />
                  </Form.Item>
                  {fields.length > 1 && (
                    <MinusCircleOutlined onClick={() => remove(name)} />
                  )}
                </Space>
              ))}
              <Form.Item {...buttonItemLayout}>
                <Button onClick={() => add({ unit: "กิโลกรัม" })} block icon={<PlusOutlined />}>
                  เพิ่มวัตถุดิบ
                </Button>
              </Form.Item>
            </Form.Item>
          )}
        </Form.List>

        {/* Steps */}
        <Form.List name="stepsList">
          {(fields, { add, remove }) => (
            <Form.Item label="ขั้นตอนการปรุงอาหาร" {...formItemLayout}>
              {fields.map(({ key, name, ...rest }) => (
                <div key={key} className="step-block">
                  <Form.Item
                    {...rest}
                    name={[name, "stepDescription"]}
                    rules={[{ required: true }]}
                  >
                    <TextArea placeholder="รายละเอียดขั้นตอนการปรุงอาหาร" autoSize={{ minRows: 3 }} />
                  </Form.Item>
                  <Form.Item
                    {...rest}
                    name={[name, "stepImages"]}
                    valuePropName="fileList"
                    getValueFromEvent={normFile}
                  >
                    <Upload
                      listType="picture-card"
                      accept="image/png, image/jpeg"
                      multiple
                      beforeUpload={beforeUpload}
                      onPreview={handlePreview}
                    >
                      <div className="upload-placeholder">
                        <PlusOutlined />
                        <div>Add Images</div>
                      </div>
                    </Upload>
                  </Form.Item>
                  {fields.length > 1 && <MinusCircleOutlined onClick={() => remove(name)} />}
                </div>
              ))}
              <Form.Item {...buttonItemLayout}>
                <Button onClick={() => add()} block icon={<PlusOutlined />}>
                  เพิ่มขั้นตอนการปรุงอาหาร
                </Button>
              </Form.Item>
            </Form.Item>
          )}
        </Form.List>

        {/* Video */}
        <Form.Item label="วิดีโอสูตรอาหาร" name="video" rules={[{ type: "url" }]} {...formItemLayout}>
          <Input placeholder="Video URL (YouTube, Vimeo, TikTok...)" />
        </Form.Item>
        <Form.Item shouldUpdate>
          {({ getFieldValue }) =>
            getFieldValue("video") ? <VideoPreview url={getFieldValue("video")} /> : null
          }
        </Form.Item>

        {/* Submit */}
        <Form.Item>
          <Button
            type="default"
            htmlType="submit"
            icon={mode === "edit" ? <EditOutlined /> : <PlusOutlined />}
          >
            {mode === "edit" ? "อัปเดตสูตรของฉัน" : "แชร์สูตรของฉัน"}
          </Button>
        </Form.Item>
      </Form>

      <Modal open={previewVisible} footer={null} onCancel={() => setPreviewVisible(false)}>
        <img alt="Preview" style={{ width: "100%" }} src={previewImage} />
      </Modal>
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
