import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import axios from "axios";
import { Card, Avatar, Typography, Badge, Row, Col } from "antd";
import { ClockCircleOutlined } from "@ant-design/icons";
import { motion, AnimatePresence } from "framer-motion";

const { Title, Text } = Typography;

const StudentPickupDisplay = () => {
  const [pendingPickups, setPendingPickups] = useState([]);
  const [socket, setSocket] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const audioRef = useRef(null);
  // Socket and data fetching logic remains the same
  useEffect(() => {
    const newSocket = io("http://localhost:5000");
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
      const response = await axios.get("http://localhost:5000/api/pickup/logs");
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
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center mb-4">
        <Title level={2} className="mb-0">
          Student Pickup Board
        </Title>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <ClockCircleOutlined className="text-gray-400" />{" "}
            <Text type="secondary" className="text-lg">
              {getTimeDisplay(currentTime)}
            </Text>
          </div>
          <Badge count={pendingPickups.length} overflowCount={99}>
            <Text>Waiting</Text>
          </Badge>
        </div>
      </div>

      <AnimatePresence>
        <Row
          gutter={[24, 24]}
          justify={pendingPickups.length < 6 ? "center" : "start"}
        >
          {pendingPickups.map((pickup) => (
            <Col
              key={pickup.id}
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={pendingPickups.length < 6 ? 6 : 4}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className="h-full hover:shadow-lg transition-shadow"
                  bodyStyle={{ padding: "24px" }}
                >
                  <div className="flex flex-col items-center space-y-4">
                    <Avatar size={64}>{pickup.studentName[0]}</Avatar>
                    <div className="text-center">
                      <Title
                        level={4}
                        className="mb-2 line-clamp-1"
                        style={{ WebkitLineClamp: 1 }}
                      >
                        {pickup.studentName}
                      </Title>
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
                    {/* <div className="text-gray-500">
                      <ClockCircleOutlined className="mr-1" />
                      <Text type="secondary">
                        Requested at {getTimeDisplay(pickup.requestTime)}
                      </Text>
                    </div> */}
                  </div>
                </Card>
              </motion.div>
            </Col>
          ))}
        </Row>
      </AnimatePresence>

      {pendingPickups.length === 0 && (
        <div className="text-center py-12 text-lg">
          <Text type="secondary">
            No students currently waiting for pickup.
          </Text>
        </div>
      )}
    </div>
  );
};

export default StudentPickupDisplay;
