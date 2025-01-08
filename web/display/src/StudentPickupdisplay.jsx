/* eslint-disable no-unused-vars */
/* eslint-disable react/prop-types */
import "./App.css";
import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { Card, Typography, Badge, Row, Col } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

const { Title, Text } = Typography;

const AutoSizingText = ({ text, containerWidth }) => {
  const [fontSize, setFontSize] = useState(24);
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current) {
      let currentSize = 24;
      const maxWidth = containerWidth - 32; // Account for padding

      textRef.current.style.fontSize = `${currentSize}px`;
      while (textRef.current.scrollWidth > maxWidth && currentSize > 12) {
        currentSize -= 1;
        textRef.current.style.fontSize = `${currentSize}px`;
      }
      setFontSize(currentSize);
    }
  }, [text, containerWidth]);

  return (
    <div
      ref={textRef}
      className="text-center font-semibold whitespace-nowrap overflow-hidden"
      style={{ fontSize: `${fontSize}px` }}
    >
      {text}
    </div>
  );
};

function StudentPickupDisplay() {
  const [pendingPickups, setPendingPickups] = useState([]);
  const [socket, setSocket] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const audioRef = useRef(null);

  useEffect(() => {
    const newSocket = io("https://self-register-safe-pickup-production.up.railway.app");
    setSocket(newSocket);
    return () => newSocket.disconnect();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPendingPickups = async () => {
    try {
      const response = await axios.get("https://self-register-safe-pickup-production.up.railway.app/api/pickup/logs");
      if (response.data.success) {
        const pending = response.data.data
          .filter((pickup) => pickup.status === "pending")
          .map((pickup) => ({
            id: pickup._id,
            studentName: pickup.studentNames,
            studentCode: pickup.studentCodes,
            requestTime: new Date(pickup.pickupTime),
            waitTime: Math.floor(
              (new Date() - new Date(pickup.pickupTime)) / 60000
            ),
          }));
        setPendingPickups(pending);
      }
    } catch (error) {
      console.error("Error fetching pending pickups:", error);
    }
  };

  useEffect(() => {
    fetchPendingPickups();
    const setupSocketListeners = () => {
      if (!socket) return;

      socket.on("new-pickup", handleNewPickup);
      socket.on("pickup-status-updated", handleStatusUpdate);
      socket.on("pickup-deleted", handlePickupDelete);

      return () => {
        socket.off("new-pickup");
        socket.off("pickup-status-updated");
        socket.off("pickup-deleted");
      };
    };

    const cleanup = setupSocketListeners();
    return () => cleanup && cleanup();
  }, [socket]);

  useEffect(() => {
    audioRef.current = new Audio("/notification-sound.mp3");
  }, []);

  const playNotificationSound = () => {
    if (audioRef.current) {
      audioRef.current.play();
    }
  };

  const handleNewPickup = (pickup) => {
    if (pickup.status === "pending") {
      const newPickup = {
        id: pickup._id,
        studentName: pickup.studentNames,
        studentCode: pickup.studentCodes,
        requestTime: new Date(pickup.pickupTime),
        waitTime: 0,
      };
      setPendingPickups((prev) => [...prev, newPickup]);
      playNotificationSound();
    }
  };

  const handleStatusUpdate = ({ pickupId, status }) => {
    if (status !== "pending") {
      setPendingPickups((prev) => prev.filter((p) => p.id !== pickupId));
    }
  };

  const handlePickupDelete = (pickupId) => {
    setPendingPickups((prev) => prev.filter((p) => p.id !== pickupId));
  };

  const getTimeDisplay = (date) => {
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  const calculateWaitTime = (requestTime) => {
    const diff = Math.floor((currentTime - new Date(requestTime)) / 60000);
    return diff >= 0 ? diff : 0;
  };

  return (
    <div className="min-h-screen w-full absolute top-0 left-0">
      <div className="flex justify-between items-center p-4 bg-white border-b sticky top-0 z-10">
        <Title level={2} className="m-0">
          Student Pickup Board
        </Title>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <ClockCircleOutlined className="text-gray-400" />
            <Text type="secondary" className="text-lg">
              {getTimeDisplay(currentTime)}
            </Text>
          </div>
          <Badge count={pendingPickups.length} overflowCount={99}>
            <Text>Waiting</Text>
          </Badge>
        </div>
      </div>

      <div className="p-4 w-screen">
        <Row gutter={[16, 16]} className="w-full" style={{ margin: 0 }}>
          {pendingPickups.map((pickup) => (
            <Col key={pickup.id} span={3}>
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className="text-center h-32 w-full"
                  bodyStyle={{
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    padding: "12px",
                  }}
                >
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <div className="text-lg font-semibold truncate w-full">
                      {pickup.studentName}
                    </div>
                    <Badge
                      count={`${calculateWaitTime(pickup.requestTime)}m`}
                      style={{
                        backgroundColor:
                          calculateWaitTime(pickup.requestTime) > 15
                            ? "#ff4d4f"
                            : calculateWaitTime(pickup.requestTime) > 10
                            ? "#faad14"
                            : "#52c41a",
                        fontSize: "16px",
                        padding: "0 12px",
                        height: "24px",
                        borderRadius: "12px",
                      }}
                    />
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </div>

      {pendingPickups.length === 0 && (
        <div className="text-center py-12 text-lg">
          <Text type="secondary">
            No students currently waiting for pickup.
          </Text>
        </div>
      )}
    </div>
  );
}

export default StudentPickupDisplay;
