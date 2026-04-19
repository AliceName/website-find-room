"use client";

import React, { useState } from "react";
import Button from "./Button";
import Modal from "./Modal";

interface ContactButtonProps {
  ownerPhone?: string | null;
  ownerName?: string;
  ownerEmail?: string | null;
  roomTitle?: string;
}

export default function ContactButton({
  ownerPhone,
  ownerName = "Chủ phòng",
  ownerEmail,
  roomTitle = "Phòng cho thuê",
}: ContactButtonProps) {
  const [showModal, setShowModal] = useState(false);

  const handleWhatsApp = () => {
    if (ownerPhone) {
      const message = `Xin chào, tôi quan tâm đến phòng: ${roomTitle}`;
      const whatsappUrl = `https://wa.me/${ownerPhone.replace(/[^\d]/g, "")}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, "_blank");
    }
  };

  const handleCall = () => {
    if (ownerPhone) {
      window.location.href = `tel:${ownerPhone}`;
    }
  };

  const handleEmail = () => {
    if (ownerEmail) {
      const subject = `Quan tâm đến phòng: ${roomTitle}`;
      const body = `Xin chào ${ownerName},\n\nTôi quan tâm đến phòng bạn đăng: ${roomTitle}\n\nBạn có thể liên hệ với tôi để trao đổi thêm chi tiết.\n\nCảm ơn.`;
      window.location.href = `mailto:${ownerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    }
  };

  return (
    <>
      <div className="flex gap-2">
        {ownerPhone && (
          <>
            <Button
              variant="primary"
              size="md"
              onClick={handleWhatsApp}
              className="flex-1"
              title="Liên hệ qua WhatsApp"
            >
              💬 WhatsApp
            </Button>
            <Button
              variant="secondary"
              size="md"
              onClick={handleCall}
              title="Gọi điện"
            >
              ☎️
            </Button>
          </>
        )}
        {ownerEmail && (
          <Button
            variant="secondary"
            size="md"
            onClick={handleEmail}
            title="Gửi email"
          >
            📧
          </Button>
        )}
        <Button
          variant="ghost"
          size="md"
          onClick={() => setShowModal(true)}
          title="Xem thông tin liên hệ"
        >
          ℹ️
        </Button>
      </div>

      {/* Contact Info Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Thông tin liên hệ"
        type="info"
      >
        <div className="space-y-3">
          <div>
            <p className="text-xs text-gray-500">Chủ phòng</p>
            <p className="font-bold text-gray-900">{ownerName}</p>
          </div>
          {ownerPhone && (
            <div>
              <p className="text-xs text-gray-500">Điện thoại</p>
              <p className="font-bold text-gray-900">{ownerPhone}</p>
            </div>
          )}
          {ownerEmail && (
            <div>
              <p className="text-xs text-gray-500">Email</p>
              <p className="font-bold text-gray-900 break-all">{ownerEmail}</p>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
