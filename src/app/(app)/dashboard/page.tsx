"use client";

import MessageCard from "@/components/MessageCard";
import { Message } from "@/Model/User";
import { AcceptMEssageSchema } from "@/Schemas/AcceptMessageSchema";
import { zodResolver } from "@hookform/resolvers/zod";
import { Separator } from "@radix-ui/react-separator";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { Loader2, RefreshCcw } from "lucide-react";
import { User } from "next-auth";
import { useSession } from "next-auth/react";
import React, { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

function Dashboard() {
  const { data: session } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSwitchLoading, setIsSwitchLoading] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");

  const form = useForm({
    resolver: zodResolver(AcceptMEssageSchema),
    defaultValues: {
      acceptMessages: false,
    },
  });

  const { register, watch, setValue } = form;
  const acceptMessage = watch("acceptMessages");

  // Optimistic delete
  const handleDeleteMessage = (messageId: string) => {
    setMessages((prev) =>
      prev.filter((message) => message._id !== messageId)
    );
  };

  // Fetch accept message status
  const fetchAcceptMessage = useCallback(async () => {
    setIsSwitchLoading(true);
    try {
      const response = await axios.get("/api/accept-messages");
      setValue("acceptMessages", response.data.isAcceptingMessage);
    } catch (error) {
      toast.error("Error while checking message state");
    } finally {
      setIsSwitchLoading(false);
    }
  }, [setValue]);

  // Fetch messages
  const fetchMessages = useCallback(
    async (refresh: boolean = false) => {
      setIsLoading(true);
      try {
        const response = await axios.get("/api/get-messages", {
          withCredentials: true,
        });
        setMessages(response.data.messages || []);
        if (refresh) toast.success("Latest messages loaded");
      } catch (error) {
        toast.error("Error fetching messages");
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Generate profile URL (CLIENT ONLY)
  useEffect(() => {
    if (!session?.user) return;

    const user = session.user as User;
    const baseUrl = `${window.location.protocol}//${window.location.host}`;
    setProfileUrl(`${baseUrl}/u/${user.username}`);
  }, [session]);

  // Initial fetch
  useEffect(() => {
    if (!session?.user) return;
    fetchMessages();
    fetchAcceptMessage();
  }, [session, fetchMessages, fetchAcceptMessage]);

  // Toggle accept messages
  const handleSwitchChange = async () => {
    try {
      await axios.post("/api/accept-messages", {
        acceptMessage: !acceptMessage,
      });
      setValue("acceptMessages", !acceptMessage);
      toast.success("Settings updated");
    } catch (error) {
      toast.error("Failed to update setting");
    }
  };

  // Copy link
  const copyToClipboard = async () => {
    if (!profileUrl) return;
    await navigator.clipboard.writeText(profileUrl);
    toast.success("Copied to clipboard");
  };

  if (!session?.user) {
    return <div className="text-center mt-20">Please login</div>;
  }

  return (
    <div className="my-10 px-4 md:px-10 lg:px-20 py-8 bg-gradient-to-br from-blue-950 to-blue-900 rounded-2xl shadow-xl max-w-6xl mx-auto text-white">
      <h1 className="text-4xl font-bold mb-8 text-center">
        📬 User Dashboard
      </h1>

      {/* Profile Link */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">
          Copy Your Unique Link
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            value={profileUrl || "Loading..."}
            disabled
            className="w-full px-4 py-2 rounded-lg bg-gray-800 border border-gray-600"
          />
          <Button onClick={copyToClipboard}>Copy</Button>
        </div>
      </div>

      {/* Accept Messages */}
      <div className="mb-8 flex items-center gap-4">
        <Switch
          {...register("acceptMessages")}
          checked={acceptMessage}
          onCheckedChange={handleSwitchChange}
          disabled={isSwitchLoading}
        />
        <span>
          Accept Messages:{" "}
          <strong>{acceptMessage ? "On ✅" : "Off ❌"}</strong>
        </span>
      </div>

      <Separator className="bg-gray-500 h-px my-6" />

      {/* Refresh */}
      <div className="mb-6 text-center">
        <Button
          onClick={() => fetchMessages(true)}
          className="flex gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" /> Loading...
            </>
          ) : (
            <>
              <RefreshCcw /> Refresh Messages
            </>
          )}
        </Button>
      </div>

      {/* Messages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {messages.length > 0 ? (
          messages.map((message) => (
            <MessageCard
              key={message._id as string}
              message={message}
              onMessageDelete={handleDeleteMessage}
            />
          ))
        ) : (
          <p className="text-center text-gray-300">
            No messages available
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
