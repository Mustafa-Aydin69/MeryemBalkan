'use client';

import { useState, useEffect } from 'react';
import { createClient } from "@supabase/supabase-js";
import { toast } from "sonner";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export interface Message {
  id: number;
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  message: string;
  date: string;
  status: 'Verildi' | 'Bekliyor';
}

export function useMessages() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const [messagesCurrentPage, setMessagesCurrentPage] = useState(1);
  const [messagesPerPage] = useState(10);
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [reply, setReply] = useState('');
  const [deleteMessageId, setDeleteMessageId] = useState<number | null>(null);
  const [isDeleteMessageModalOpen, setIsDeleteMessageModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch messages
  useEffect(() => {
    async function getMessages() {
      const { data, error } = await supabase.from("mesajlar").select("*");
      if (error) console.error(error);
      if (data) {
        setMessages(
          data.map((item) => ({
            id: item.id,
            name: item.name,
            email: item.email,
            phone: item.phone,
            serviceType: item.hizmet,
            message: item.mesaj,
            date: item.tarih?.slice(0, 10),
            status: item.cevap === "Verildi" ? "Verildi" : "Bekliyor",
          }))
        );
      }
    }
    getMessages();
  }, []);

  // Filtered messages
  const filteredMessages = messages.filter(
    (msg) =>
      msg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination
  const totalMessagesPages = Math.ceil(filteredMessages.length / messagesPerPage);
  const indexOfLastMessage = messagesCurrentPage * messagesPerPage;
  const indexOfFirstMessage = indexOfLastMessage - messagesPerPage;
  const currentMessages = filteredMessages.slice(indexOfFirstMessage, indexOfLastMessage);

  const handleMessagesPageChange = (pageNumber: number) => {
    setMessagesCurrentPage(pageNumber);
  };

  const getMessagesPaginationNumbers = () => {
    const delta = 2;
    const range: (number | string)[] = [];
    const rangeWithDots: (number | string)[] = [];

    for (let i = Math.max(2, messagesCurrentPage - delta); i <= Math.min(totalMessagesPages - 1, messagesCurrentPage + delta); i++) {
      range.push(i);
    }

    if (messagesCurrentPage - delta > 2) {
      rangeWithDots.push(1, '...');
    } else {
      rangeWithDots.push(1);
    }

    rangeWithDots.push(...range);

    if (messagesCurrentPage + delta < totalMessagesPages - 1) {
      rangeWithDots.push('...', totalMessagesPages);
    } else if (totalMessagesPages > 1) {
      rangeWithDots.push(totalMessagesPages);
    }

    return rangeWithDots;
  };

  // Delete message handlers
  const confirmDeleteMessage = (id: number) => {
    setDeleteMessageId(id);
    setIsDeleteMessageModalOpen(true);
  };

  const handleDeleteMessage = async () => {
    if (!deleteMessageId) return;

    setIsDeleting(true);
    const { error } = await supabase
      .from("mesajlar")
      .delete()
      .eq("id", deleteMessageId);

    setIsDeleting(false);

    if (error) {
      console.error("Mesaj silinirken hata oluştu:", error.message);
      alert("Mesaj silinemedi: " + error.message);
      return;
    }

    setMessages((prev) => prev.filter((m) => m.id !== deleteMessageId));
    setIsDeleteMessageModalOpen(false);
    setDeleteMessageId(null);
  };

  // Reply handler
  const handleSendReply = async () => {
    if (!selectedMessage) return;
    
    if (!reply.trim()) {
      alert('Lütfen bir cevap yazın!');
      return;
    }

    try {
      // Mail gönder
      const mailResponse = await fetch('/api/send-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: selectedMessage.email,
          customerName: selectedMessage.name,
          replyMessage: reply,
          originalMessage: selectedMessage.message,
          serviceType: selectedMessage.serviceType,
        }),
      });

      const mailResult = await mailResponse.json();

      if (mailResult.success) {
        // Supabase'de durumu güncelle
        const updateResult = await supabase
          .from('mesajlar')
          .update({ cevap: 'Verildi' })
          .eq('id', selectedMessage.id)
          .select();

        console.log('Supabase güncelleme sonucu:', updateResult);

        if (updateResult.error) {
          console.error('Supabase güncelleme hatası:', updateResult.error);
          alert('Mail gönderildi ancak durum güncellenemedi! Hata: ' + updateResult.error.message);
        } else {
          // State'i güncelle
          setMessages((prev) =>
            prev.map((m) =>
              m.id === selectedMessage.id ? { ...m, status: 'Verildi' } : m
            )
          );

          toast.success("Yanıt başarıyla gönderildi! ✅");
          setReply('');
          setSelectedMessage(null);
        }
      } else {
        throw new Error(mailResult.error || 'Mail gönderilemedi');
      }
    } catch (err: any) {
      console.error('Hata:', err);
      alert('Mail gönderilirken bir hata oluştu: ' + err.message);
    }
  };

  return {
    messages,
    filteredMessages,
    currentMessages,
    searchTerm,
    setSearchTerm,
    searchOpen,
    setSearchOpen,
    messagesCurrentPage,
    totalMessagesPages,
    handleMessagesPageChange,
    getMessagesPaginationNumbers,
    selectedMessage,
    setSelectedMessage,
    reply,
    setReply,
    handleSendReply,
    deleteMessageId,
    isDeleteMessageModalOpen,
    setIsDeleteMessageModalOpen,
    isDeleting,
    confirmDeleteMessage,
    handleDeleteMessage,
  };
}

