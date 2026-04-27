"use client";

import React, { useEffect, useState } from "react";
import Button from "./Button";
import Modal from "./Modal";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { ChatService } from "@/lib/services/chat.service";

interface ContactButtonProps {
  ownerPhone?: string | null;
  ownerName?: string;
  ownerEmail?: string | null;
  roomTitle?: string;
  ownerId?: string | null;
  postId?: string;
  roomId?: string;
  retentionPolicy?: "manual" | "3_days" | "7_days" | "30_days" | "forever";
}

export default function ContactButton({
  ownerPhone,
  ownerName = "Chủ phòng",
  ownerEmail,
  roomTitle = "Phòng cho thuê",
  ownerId,
  postId,
  roomId,
  retentionPolicy = "manual",
}: ContactButtonProps) {
  const [showModal, setShowModal] = useState(false);
  const [loadingChat, setLoadingChat] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      const { data } = await supabase.auth.getUser();
      if (mounted) setCurrentUserId(data.user?.id ?? null);
    };

    void loadCurrentUser();

    return () => {
      mounted = false;
    };
  }, []);

  const isOwner = Boolean(currentUserId && ownerId && currentUserId === ownerId);

  const handleChat = async () => {
    try {
      setLoadingChat(true);
      const { data: authData } = await supabase.auth.getUser();
      const currentUser = authData.user;

      if (!currentUser) {
        router.push(`/auth/login?redirect=${encodeURIComponent(window.location.pathname)}`);
        return;
      }

      if (!ownerId || currentUser.id === ownerId) {
        setShowModal(true);
        return;
      }

      const conversation = await ChatService.getOrCreateConversation({
        renterId: currentUser.id,
        ownerId,
        postId: postId ?? null,
        roomId: roomId ?? null,
        retentionPolicy,
      });

      router.push(`/chat/${conversation.conversation_id}`);
    } catch (error) {
      console.error(error);
      setShowModal(true);
    } finally {
      setLoadingChat(false);
    }
  };

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
        {!isOwner && (
          <Button
            variant="primary"
            size="md"
            onClick={handleChat}
            className="flex-1"
            title="Nhắn tin với chủ phòng"
            disabled={loadingChat}
          >
            {loadingChat ? "Đang mở chat..." : "💬 Nhắn tin"}
          </Button>
        )}
        {ownerPhone && (
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={handleWhatsApp}
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
