import React, { useState, useEffect, useContext, useForm } from 'react';
import { useNavigate } from 'react-router-dom';
import "./Sharepage.css";
import '../components/Button.css'
import './Form.css'
import { AuthContext } from "../context/AuthContext";
import { EditOutlined, PlusOutlined, LoadingOutlined, MinusCircleOutlined, DeleteOutlined } from '@ant-design/icons';
import {
  AutoComplete,
  Button,
  Form,
  Input,
  InputNumber,
  message,
  Modal,
  Select,
  Space,
  Popconfirm,
  Upload,
  Row,
  Col
} from 'antd';
import axios from 'axios';
import Videoiframe from '../components/Videoiframe';
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
  const [form] = Form.useForm();

  const [tagSearch, setTagSearch] = useState('');
  const [ingredientSearch, setIngredientSearch] = useState('');

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [ingredientOptions, setIngredientOptions] = useState([]);

  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  useEffect(() => {
    // Fetch categories from backend
    axios.get("/api/recipes/getData/categories")
      .then(res => {
        const options = res.data.map(cat => ({ value: cat.Name }));
        setCategoryOptions(options);
      })
      .catch(err => console.error(err));
  }, []);
  useEffect(() => {
    // Fetch ingredient from backend
    axios.get("/api/recipes/getData/ingredients")
      .then(res => {
        const options = res.data.map(intgre => ({ value: intgre.name_th }));
        setIngredientOptions(options);
      })
      .catch(err => console.error(err));
  }, []);
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
    <div className="sharepage set-max-w full-m-0-auto">
      <h2 className="sharepage-title mb-3">Share Your Recipe</h2>

      <Form
        form={form}
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
        <Row justify="center">
          <Col md={18} lg={16} xl={12} className='full-width'>
            <Form.Item
              name="title"
              className='full-width'
              rules={[{ required: true, message: "โปรดใส่ชื่อเมนูอาหาร" }]}
            >
              <Input className="text-center input-text" placeholder="ชื่อเมนูอาหาร" />
            </Form.Item>
          </Col>
        </Row>

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
                  <Form.Item shouldUpdate style={{ marginBottom: '.5rem' }} key={key}>
                    {() => {
                      const tagValue = form.getFieldValue(['tags', name, 'tag']) || '';
                      const hasContent = tagValue.trim();

                      return (
                        <Space className='flex align-center'>
                          <Form.Item {...rest} className='mb-2' name={[name, "tag"]} rules={[{ required: true }]}>
                            <AutoComplete
                              placeholder="ชื่อแท็ก"
                              style={{ width: "25ch" }}
                              options={
                                categoryOptions
                                  .filter(opt => opt.value.toLowerCase().includes(tagSearch.toLowerCase()))
                                  .slice(0, 5)
                              }
                              onFocus={() => setTagSearch('')}
                              onSearch={setTagSearch}
                              allowClear
                            />
                          </Form.Item>

                          {fields.length > 1 && (
                            hasContent ? (
                              <Popconfirm
                                title={`คุณแน่ใจหรือไม่ว่าต้องการลบ "${tagValue}" ?`}
                                okText="ลบ"
                                cancelText="ยกเลิก"
                                onConfirm={() => remove(name)}
                              >
                                <MinusCircleOutlined style={{ cursor: 'pointer' }} />
                              </Popconfirm>
                            ) : (
                              <MinusCircleOutlined
                                style={{ cursor: 'pointer' }}
                                onClick={() => remove(name)}
                              />
                            )
                          )}
                        </Space>
                      );
                    }}
                  </Form.Item>
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

        <Form.List name="ingredientsList">
          {(fields, { add, remove }) => (
            <Form.Item label="วัตถุดิบ" {...formItemLayout}>
              {fields.map(({ key, name, ...rest }) => (
                <Form.Item style={{ marginBottom: '.5rem' }} shouldUpdate key={key}>
                  {() => {
                    const ingredientName = form.getFieldValue(['ingredientsList', name, 'name']) || '';
                    const hasContent = ingredientName.trim();

                    return (
                      <Space align="baseline" className='full-width'>
                        <Form.Item {...rest} style={{ marginBottom: 0 }} name={[name, "name"]} rules={[{ required: true }]}>
                          <AutoComplete
                            style={{ width: "30ch" }}
                            placeholder="ชื่อวัตถุดิบ"
                            options={
                              ingredientOptions
                                .filter(opt => opt.value.toLowerCase().includes(ingredientSearch.toLowerCase()))
                                .slice(0, 5)
                            }
                            onFocus={() => setIngredientSearch('')}
                            onSearch={setIngredientSearch}
                            allowClear
                          />
                        </Form.Item>

                        <Form.Item {...rest} style={{ marginBottom: 0 }} name={[name, "quantity"]} rules={[{ required: true }]}>
                          <InputNumber placeholder="จำนวน" />
                        </Form.Item>

                        <Form.Item {...rest} style={{ marginBottom: 0 }} name={[name, "unit"]} rules={[{ required: true }]}>
                          <Select
                            style={{ minWidth: "11ch" }}
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
                          hasContent ? (
                            <Popconfirm
                              title={`คุณแน่ใจหรือไม่ว่าต้องการลบ "${ingredientName}" ?`}
                              okText="ลบ"
                              cancelText="ยกเลิก"
                              onConfirm={() => remove(name)}
                            >
                              <MinusCircleOutlined style={{ cursor: 'pointer' }} />
                            </Popconfirm>
                          ) : (
                            <MinusCircleOutlined
                              style={{ cursor: 'pointer' }}
                              onClick={() => remove(name)}
                            />
                          )
                        )}
                      </Space>
                    );
                  }}
                </Form.Item>
              ))}
              <Form.Item {...buttonItemLayout}>
                <Button onClick={() => add({ unit: "กิโลกรัม" })} block icon={<PlusOutlined />}>
                  เพิ่มวัตถุดิบ
                </Button>
              </Form.Item>
            </Form.Item>
          )}
        </Form.List>


        <Form.List name="stepsList">
          {(fields, { add, remove }) => (
            <Form.Item label="ขั้นตอนการปรุงอาหาร" {...formItemLayout}>
              {fields.map(({ key, name, ...rest }) => (
                <Form.Item shouldUpdate style={{ marginBottom: '.5rem' }} key={key}>
                  {() => {
                    const stepDescription = form.getFieldValue(['stepsList', name, 'stepDescription']) || '';
                    const stepImages = form.getFieldValue(['stepsList', name, 'stepImages']) || [];
                    const hasContent = stepDescription.trim() || stepImages.length > 0;

                    return (
                      <div className="step-block flex">
                        <div className="flex flex-column flex-1">
                          <div className="flex flex-1 gap-3">
                            <Form.Item
                              {...rest}
                              name={[name, "stepDescription"]}
                              rules={[{ required: true }]}
                              className="flex-1"
                              style={{ marginBottom: '.5rem' }}
                            >
                              <TextArea
                                placeholder="รายละเอียดขั้นตอนการปรุงอาหาร"
                                autoSize={{ minRows: 3 }}
                              />
                            </Form.Item>

                            {fields.length > 1 && (
                              hasContent ? (
                                <Popconfirm
                                  title="คุณแน่ใจหรือไม่ว่าต้องการลบขั้นตอนนี้ ?"
                                  okText="ลบ"
                                  cancelText="ยกเลิก"
                                  onConfirm={() => remove(name)}
                                >
                                  <DeleteOutlined style={{ fontSize: '1.2rem', cursor: 'pointer' }} />
                                </Popconfirm>
                              ) : (
                                <DeleteOutlined
                                  style={{ fontSize: '1.2rem', cursor: 'pointer' }}
                                  onClick={() => remove(name)}
                                />
                              )
                            )}
                          </div>

                          <Form.Item
                            {...rest}
                            name={[name, "stepImages"]}
                            style={{ marginBottom: '.5rem' }}
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
                        </div>
                      </div>
                    );
                  }}
                </Form.Item>
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
        <Form.Item label="วิดีโอสูตรอาหาร" name="video" rules={[{ type: "url", message: "กรุณากรอก URL ที่ถูกต้อง" }]} {...formItemLayout}>
          <Input placeholder="Video URL (YouTube, Vimeo, Facebook)" />
        </Form.Item>

        <Form.Item shouldUpdate>
          {({ getFieldValue }) => {
            const url = getFieldValue("video");

            if (!url) return null;

            // Check if the URL is supported
            const allowedDomains = ["youtube.com", "youtu.be", "vimeo.com", "facebook.com"];
            const isSupported = allowedDomains.some((domain) => url.includes(domain));

            return (
              <div style={{ display: "flex", justifyContent: "center", flexDirection: "column", alignItems: "center" }}>
                {isSupported ? (
                  <Videoiframe videoURL={url} />
                ) : (
                  <div style={{ color: "red", marginTop: 12 }}>
                    หา URL ไม่เจอ เนื่องจากลิงก์วิดีโอไม่รองรับ หรือไม่เปิดเป็นสาธารณะ
                  </div>
                )}
              </div>
            );
          }}
        </Form.Item>

        {/* Submit */}
        <Form.Item>
          <div className='flex pl-3'>
            <Button
              size='large'
              type="default"
              htmlType="submit"
              icon={mode === "edit" ? <EditOutlined /> : <PlusOutlined />}
            >
              {mode === "edit" ? "อัปเดตสูตรของฉัน" : "แชร์สูตรของฉัน"}
            </Button>
          </div>
        </Form.Item>
      </Form>

      <Modal open={previewVisible} footer={null} onCancel={() => setPreviewVisible(false)}>
        <img alt="Preview" style={{ width: "100%" }} src={previewImage} />
      </Modal>
    </div>
  );
}

