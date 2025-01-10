import { io } from "socket.io-client";
import React, { useState, useEffect, useRef } from "react";
import { Modal, Spin, notification, Select, Table, Tag } from "antd";
import { Button } from "@/components/ui/button";
import { QRCodeSVG } from "qrcode.react";
import {
  QrCode,
  Download,
  History,
  Clock,
  ShieldOff,
  Activity,
  Trash2,
} from "lucide-react";
import axios from "axios";
import html2canvas from "html2canvas"; // Make sure to install this package
import jsPDF from "jspdf"; // Make sure to install this package

const QrGeneration = () => {
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isActiveModalOpen, setIsActiveModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [isQRDisplayModalOpen, setIsQRDisplayModalOpen] = useState(false);
  const [selectedQR, setSelectedQR] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [expiryDuration, setExpiryDuration] = useState("24");
  const [previousQRCodes, setPreviousQRCodes] = useState([]);
  const [activeQRCodes, setActiveQRCodes] = useState([]);

  const qrCodeRef = useRef(null);
  const socketRef = useRef(null);

  const refreshData = async () => {
    await Promise.all([fetchActiveQRCodes(), fetchQRHistory()]);
  };

  // Update socket event handler
  useEffect(() => {
    socketRef.current = io("http://localhost:5000", {
      withCredentials: true,
    });

    socketRef.current.on("qrCodeUpdated", () => {
      console.log("QR code update received via socket");
      refreshData();
    });

    // Initial data fetch
    refreshData();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  // Initialize Socket.IO connection
  useEffect(() => {
    socketRef.current = io("http://localhost:5000", {
      withCredentials: true,
    });

    // Listen for QR code updates
    socketRef.current.on("qrCodeUpdated", () => {
      console.log("QR code update received");
      fetchActiveQRCodes();
      fetchQRHistory();
    });

    // Cleanup on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  const fetchActiveQRCodes = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/qr-codes/active",
        {
          params: { schoolId: "123" },
        }
      );

      if (response.data.success) {
        const formattedQRCodes = response.data.activeQRCodes.map((qr) => ({
          ...qr,
          generatedAt: qr.createdAt, // Ensure generatedAt is set for QRCodeDisplay
        }));
        setActiveQRCodes(formattedQRCodes);
      }
    } catch (error) {
      console.error("Error fetching active QR codes:", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch active QR codes",
      });
    }
  };

  const fetchQRHistory = async () => {
    try {
      const response = await axios.get(
        "http://localhost:5000/api/qr-codes/history",
        {
          params: { schoolId: "123" },
        }
      );

      if (response.data.success) {
        const formattedQRCodes = response.data.qrCodes.map((qr) => ({
          ...qr,
          generatedAt: qr.createdAt, // Ensure generatedAt is set for QRCodeDisplay
        }));
        setPreviousQRCodes(formattedQRCodes);
      }
    } catch (error) {
      console.error("Error fetching QR history:", error);
      notification.error({
        message: "Error",
        description: "Failed to fetch QR history",
      });
    }
  };

  const calculateExpiryDate = (hours) => {
    const date = new Date();
    date.setHours(date.getHours() + parseInt(hours));
    return date;
  };

  const generateQRCode = async () => {
    try {
      setIsLoading(true);
      const expiryDate = calculateExpiryDate(expiryDuration);
      const currentDate = new Date().toISOString();

      const response = await axios.post(
        "http://localhost:5000/api/qr-codes/generate",
        {
          schoolId: "123",
          timestamp: currentDate,
          expiresAt: expiryDate.toISOString(),
        }
      );

      if (response.data.success) {
        setIsGenerateModalOpen(false);
        notification.success({
          message: "QR Code Generated",
          description: "New QR code has been generated successfully.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to generate QR code",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Updated formatTimeLeft function with better date handling
  const formatTimeLeft = (expiryDate) => {
    if (!expiryDate) return "Invalid date";

    try {
      const now = new Date();
      const expiry = new Date(expiryDate);

      if (isNaN(expiry.getTime())) return "Invalid date";

      const diff = expiry - now;

      if (diff <= 0) return "Expired";

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (days > 0) return `${days}d ${hours}h left`;
      if (hours > 0) return `${hours}h ${minutes}m left`;
      return `${minutes}m left`;
    } catch (error) {
      console.error("Error formatting time left:", error);
      return "Invalid date";
    }
  };

  // Updated date formatter function
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return "Invalid date";

      return date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    } catch (error) {
      console.error("Error formatting date:", error);
      return "Invalid date";
    }
  };

  const deactivateQR = async (qrCode) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/qr-codes/${qrCode.code}/deactivate`
      );

      if (response.data.success) {
        notification.success({
          message: "QR Code Deactivated",
          description: "The QR code has been deactivated successfully.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to deactivate QR code",
      });
    }
  };

  const downloadPNG = async (qrData) => {
    try {
      const qrCodeElement = document.getElementById(
        `qr-container-${qrData.code}`
      );

      if (!qrCodeElement) {
        throw new Error("QR code element not found");
      }

      const canvas = await html2canvas(qrCodeElement, {
        backgroundColor: "#ffffff",
      });

      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `pickup-qr-${qrData.code}.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (error) {
      console.error("Error downloading PNG:", error);
      notification.error({
        message: "Download Failed",
        description: "Failed to download PNG file.",
      });
    }
  };

  // Updated PDF download function
  const downloadAsPDF = async (qrData) => {
    try {
      const qrCodeElement = document.getElementById(
        `qr-container-${qrData.code}`
      );

      if (!qrCodeElement) {
        throw new Error("QR code element not found");
      }

      const canvas = await html2canvas(qrCodeElement, {
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      // Calculate positions to center the QR code
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = 100; // Width in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      const x = (pdfWidth - imgWidth) / 2;
      const y = 20; // Top margin in mm

      // Add QR code image
      pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);

      // Add text below the QR code
      pdf.setFontSize(12);
      pdf.setTextColor(0, 0, 0);

      const textLines = [
        `Generated: ${new Date(qrData.generatedAt).toLocaleString()}`,
        `Expires: ${new Date(qrData.expiresAt).toLocaleString()}`,
        `Status: ${qrData.isActive ? "Active" : "Inactive"}`,
      ];

      let textY = y + imgHeight + 10; // Start text below the image
      textLines.forEach((line) => {
        pdf.text(line, pdfWidth / 2, textY, { align: "center" });
        textY += 8; // Move to next line
      });

      pdf.save(`pickup-qr-${qrData.code}.pdf`);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      notification.error({
        message: "Download Failed",
        description: "Failed to download PDF file.",
      });
    }
  };

  // Updated QRCodeDisplay component
  const QRCodeDisplay = ({ qrData }) => (
    <div className="flex flex-col items-center p-4">
      <div
        id={`qr-container-${qrData.code}`}
        className="bg-white p-4 rounded-lg"
        ref={qrCodeRef}
      >
        <QRCodeSVG
          value={qrData.code}
          size={256}
          level="H"
          includeMargin={true}
        />
        <div className="mt-2 text-center text-black">
          <p className="text-sm">Generated: {formatDate(qrData.createdAt)}</p>
          <p className="text-sm">Expires: {formatDate(qrData.expiresAt)}</p>
        </div>
      </div>
      <div className="mt-4 text-center space-y-2">
        <p className="text-sm text-gray-500">
          Time Left: {formatTimeLeft(qrData.expiresAt)}
        </p>
      </div>
      <div className="mt-4 flex space-x-2">
        <Button
          onClick={() => downloadPNG(qrData)}
          className="flex items-center bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PNG
        </Button>
        <Button
          onClick={() => downloadAsPDF(qrData)}
          className="flex items-center bg-green-500 hover:bg-green-600 text-white"
        >
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>
    </div>
  );

  const deleteQR = async (qrCode) => {
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/qr-codes/${qrCode.code}`
      );

      if (response.data.success) {
        notification.success({
          message: "QR Code Deleted",
          description: "The QR code has been deleted successfully.",
        });
      }
    } catch (error) {
      notification.error({
        message: "Error",
        description: "Failed to delete QR code",
      });
    }
  };

  // Updated history columns with better date handling
  const historyColumns = [
    {
      title: "Generated At",
      dataIndex: "createdAt", // Updated to use createdAt
      key: "createdAt",
      render: (text) => formatDate(text),
      sorter: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    },
    {
      title: "Expires At",
      dataIndex: "expiresAt",
      key: "expiresAt",
      render: (text) => formatDate(text),
    },
    {
      title: "Status",
      key: "status",
      render: (_, record) => {
        const now = new Date();
        const expiry = new Date(record.expiresAt);
        let status =
          record.status === "deactivated"
            ? "deactivated"
            : now > expiry
            ? "expired"
            : "active";

        const colors = {
          active: "green",
          expired: "red",
          deactivated: "gray",
        };

        return <Tag color={colors[status]}>{status.toUpperCase()}</Tag>;
      },
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <div className="space-x-2">
          <Button
            size="sm"
            onClick={() => {
              setSelectedQR(record);
              setIsQRDisplayModalOpen(true);
            }}
          >
            View QR
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              Modal.confirm({
                title: "Delete QR Code",
                content:
                  "Are you sure you want to delete this QR code? This action cannot be undone.",
                okText: "Delete",
                okButtonProps: { className: "bg-red-500 hover:bg-red-600" },
                onOk: () => deleteQR(record),
              });
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  // In QrGeneration.jsx - Add delete button to active QR codes modal
  {
    activeQRCodes.map((qr, index) => (
      <div key={index} className="border-b border-gray-700 pb-6 last:border-0">
        <QRCodeDisplay qrData={qr} />
        <div className="mt-4 flex justify-center space-x-2">
          <Button
            onClick={() => deactivateQR(qr)}
            className="flex items-center bg-red-500 hover:bg-red-600 text-white"
          >
            <ShieldOff className="h-4 w-4 mr-2" />
            Deactivate QR Code
          </Button>
          <Button
            onClick={() => {
              Modal.confirm({
                title: "Delete QR Code",
                content:
                  "Are you sure you want to delete this QR code? This action cannot be undone.",
                okText: "Delete",
                okButtonProps: { className: "bg-red-500 hover:bg-red-600" },
                onOk: () => deleteQR(qr),
              });
            }}
            className="flex items-center bg-red-500 hover:bg-red-600 text-white"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete QR Code
          </Button>
        </div>
      </div>
    ));
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
      {/* Generate QR Button */}
      <Button
        className="flex items-center justify-center p-8 h-32 w-full bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-blue-500/20 transition-all"
        onClick={() => setIsGenerateModalOpen(true)}
        disabled={isLoading}
      >
        <div className="flex flex-col items-center">
          {isLoading ? (
            <Spin size="small" />
          ) : (
            <>
              <QrCode className="h-8 w-8 mb-3" />
              <span className="text-lg font-semibold">Generate New QR</span>
            </>
          )}
        </div>
      </Button>

      {/* View Active QRs Button */}
      <Button
        className="flex items-center justify-center p-8 h-32 w-full bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg hover:shadow-emerald-500/20 transition-all"
        onClick={() => setIsActiveModalOpen(true)}
      >
        <div className="flex flex-col items-center">
          <Activity className="h-8 w-8 mb-3" />
          <span className="text-lg font-semibold">Active QR Codes</span>
        </div>
      </Button>

      {/* View History Button */}
      <Button
        className="flex items-center justify-center p-8 h-32 w-full bg-gradient-to-br from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white shadow-lg hover:shadow-violet-500/20 transition-all"
        onClick={() => setIsHistoryModalOpen(true)}
      >
        <div className="flex flex-col items-center">
          <History className="h-8 w-8 mb-3" />
          <span className="text-lg font-semibold">QR Code History</span>
        </div>
      </Button>

      {/* Generate QR Modal */}
      <Modal
        title="Generate New QR Code"
        open={isGenerateModalOpen}
        onCancel={() => setIsGenerateModalOpen(false)}
        onOk={generateQRCode}
        okText="Generate QR Code"
        cancelText="Cancel"
        centered
      >
        <div className="py-4">
          <p className="mb-4">
            Please select the expiry duration for the QR code:
          </p>

          <Select
            className="w-full"
            value={expiryDuration}
            onChange={setExpiryDuration}
            options={[
              { value: "24", label: "1 day" },
              { value: "48", label: "2 days" },
              { value: "72", label: "3 days" },
              { value: "96", label: "4 days" },
              { value: "120", label: "5 days" },
              { value: "144", label: "6 days" },
              { value: "168", label: "7 days" },
            ]}
          />
        </div>
      </Modal>

      {/* Active QR Codes Modal */}
      <Modal
        title="Active QR Codes"
        open={isActiveModalOpen}
        onCancel={() => setIsActiveModalOpen(false)}
        footer={null}
        width={800}
        centered
      >
        <div className="space-y-6">
          {activeQRCodes.map((qr, index) => (
            <div
              key={index}
              className="border-b border-gray-700 pb-6 last:border-0"
            >
              <QRCodeDisplay qrData={qr} />
              <div className="mt-4 flex justify-center">
                <Button
                  onClick={() => deactivateQR(qr)}
                  className="flex items-center bg-red-500 hover:bg-red-600 text-white"
                >
                  <ShieldOff className="h-4 w-4 mr-2" />
                  Deactivate QR Code
                </Button>
              </div>
            </div>
          ))}
          {activeQRCodes.length === 0 && (
            <p className="text-center text-gray-500">No active QR codes</p>
          )}
        </div>
      </Modal>

      {/* History Modal */}
      <Modal
        title="QR Code History"
        open={isHistoryModalOpen}
        onCancel={() => setIsHistoryModalOpen(false)}
        footer={null}
        width={800}
        centered
      >
        <Table
          dataSource={previousQRCodes}
          columns={historyColumns}
          rowKey={(record) => record.id || record.code}
        />
      </Modal>

      {/* QR Display Modal */}
      <Modal
        title="QR Code Details"
        open={isQRDisplayModalOpen}
        onCancel={() => setIsQRDisplayModalOpen(false)}
        footer={null}
        centered
      >
        {selectedQR && <QRCodeDisplay qrData={selectedQR} />}
      </Modal>
    </div>
  );
};

export default QrGeneration;
