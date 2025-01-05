// AnnouncementModal.js
"use client";
import { Modal, Input, Select, Form, Button } from "antd";
import {
  CalendarCheckIcon,
  CircleAlertIcon,
  MegaphoneIcon,
} from "../../public/icons/icons";

const { TextArea } = Input;

export default function AnnouncementModal({ open, onClose, onSubmit }) {
  const [form] = Form.useForm();

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      onSubmit(values);
      form.resetFields();
      onClose();
    });
  };

  const iconOptions = [
    {
      value: "calendar",
      label: (
        <div className="flex items-center gap-2">
          <CalendarCheckIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <span className="dark:text-white">Calendar</span>
        </div>
      ),
    },
    {
      value: "alert",
      label: (
        <div className="flex items-center gap-2">
          <CircleAlertIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <span className="dark:text-white">Alert</span>
        </div>
      ),
    },
    {
      value: "megaphone",
      label: (
        <div className="flex items-center gap-2">
          <MegaphoneIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          <span className="dark:text-white">Megaphone</span>
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <h3 className="text-lg font-semibold text-gray-900">
          Create New Announcement
        </h3>
      }
      open={open}
      onCancel={onClose}
      footer={null}
      styles={{
        mask: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        wrapper: {
          backgroundColor: "rgba(0, 0, 0, 0.5)",
        },
        header: {
          backgroundColor: "white",
          borderBottom: "1px solid rgb(229 231 235)", // light gray border
        },
        content: {
          backgroundColor: "white",
        },
        body: {
          backgroundColor: "white",
        },
      }}
    >
      <div className="bg-white">
        {" "}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="space-y-4"
        >
          <Form.Item
            name="title"
            label={
              <span className="text-gray-700 dark:text-gray-300">Title</span>
            }
            rules={[
              {
                required: true,
                message: "Please enter a title",
              },
            ]}
          >
            <Input
              placeholder="Enter announcement title"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-black dark:placeholder-gray-400"
            />
          </Form.Item>

          <Form.Item
            name="description"
            label={
              <span className="text-gray-700 dark:text-gray-300">
                Description
              </span>
            }
            rules={[
              {
                required: true,
                message: "Please enter a description",
              },
            ]}
          >
            <TextArea
              rows={4}
              placeholder="Enter announcement description"
              className="dark:bg-gray-700 dark:border-gray-600 dark:text-black dark:placeholder-gray-400"
            />
          </Form.Item>

          <Form.Item
            name="icon"
            label={
              <span className="text-gray-700 dark:text-gray-300">Icon</span>
            }
            rules={[
              {
                required: true,
                message: "Please select an icon",
              },
            ]}
          >
            <Select
              placeholder="Select an icon"
              options={iconOptions}
              className="dark:bg-gray-700 dark:border-gray-600"
              popupClassName="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </Form.Item>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <Button
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              onClick={handleSubmit}
              className="px-4 py-2 bg-black text-white hover:bg-gray-900 transition-colors"
            >
              Create
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
}
