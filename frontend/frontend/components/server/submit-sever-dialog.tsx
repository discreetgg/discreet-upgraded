"use client";

import React from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { serverService } from "@/lib/server-service";
import { useGlobal } from "@/context/global-context-provider";
import { useState } from "react";
import { toast } from "sonner";
import { ComponentLoader } from "../ui/component-loader";

const FormSchema = z.object({
  name: z.string({ required_error: "Server name is required" }),
  link: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  bio: z.string().max(500, "Bio must be 500 characters or less").optional(),
  tags: z.string().optional(),
});

export const SubmitServerDialog = ({
  children,
  open: externalOpen,
  onOpenChange,
  serverId,
  initialValues,
  refreshServers,
}: {
  children: React.ReactNode;
  refreshServers?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  serverId?: string;
  initialValues?: {
    name?: string;
    link?: string;
    bio?: string;
    tags?: string[];
  };
}) => {
  const { user } = useGlobal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      name: "",
      link: "",
      bio: "",
      tags: "",
    },
  });

  // Sync external open state if controlled
  React.useEffect(() => {
    if (typeof externalOpen === "boolean") {
      setOpen(externalOpen);
    }
  }, [externalOpen]);

  // Notify parent on open change if handler provided
  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  // Prefill form when initialValues change (edit mode)
  React.useEffect(() => {
    if (initialValues) {
      form.reset({
        name: initialValues.name ?? "",
        link: initialValues.link ?? "",
        bio: initialValues.bio ?? "",
        tags: Array.isArray(initialValues.tags)
          ? initialValues.tags.join(", ")
          : (initialValues.tags as unknown as string) ?? "",
      });
    }
  }, [initialValues, form]);

  const onSubmit = async (data: z.infer<typeof FormSchema>) => {
    if (!user?.discordId) {
      toast.error("User not authenticated");
      return;
    }

    setIsSubmitting(true);

    try {
      // Parse tags string into array
      const tagsArray = data.tags
        ? data.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [];

      // Prepare payload for server service
      const payload = {
        name: data.name,
        link: data.link || "",
        bio: data.bio || "",
        tags: tagsArray,
      };

      let ok = false;
      if (serverId) {
        // Update server
        const response = await serverService.updateServer(serverId, payload);
        ok = Boolean(response);
        if (ok) {
          await refreshServers?.();
          console.log("Server updated successfully!");
          toast.success("Server updated successfully!");
        }
      } else {
        // Create server using the service
        const response = await serverService.createServer(
          user.discordId,
          payload
        );

        if (response) {
          await refreshServers?.();
          console.log("Server created successfully!");
          toast.success("Server created successfully!");
        }
      }

      if (ok) {
        // Reset form
        form.reset();
        // Close dialog
        handleOpenChange(false);
      }
    } catch (error: any) {
      const action = serverId ? "update" : "create";
      console.error(`Failed to ${action} server:`, error);
      toast.error(`Failed to ${serverId ? "update" : "create"} server`, {
        description: error.message || "An unexpected error occurred",
        duration: 5000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="flex items-center !max-w-2xl justify-center !w-full py-10 px-6">
        <Form {...form}>
          <form
            className=" w-full space-y-[27px]"
            onSubmit={form.handleSubmit(onSubmit)}
          >
            <h1 className="text-[32px] font-semibold ">Server Information</h1>
            <div className="bg-black rounded-2xl border border-[#232323]  overflow-hidden ">
              <div className="overflow-y-auto max-h-[650px] space-y-8 p-4">
                {/* Server Name Field */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium">
                        Server name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter server name"
                          className="bg-[#0F1114] border-[#0F1114] h-auto p-4 placeholder:text-[#9E9E9E] rounded-[8px] text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Server Link Field */}
                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium">
                        Server Link
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://discord.gg/your-server"
                          className="bg-[#0F1114] border-[#0F1114] h-auto p-4 placeholder:text-[#9E9E9E] rounded-[8px] text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Tags Field */}
                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-white font-medium">
                        Tags (comma-separated)
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="gaming, community, art"
                          className="bg-[#0F1114] border-[#0F1114] h-auto p-4 placeholder:text-[#9E9E9E] rounded-[8px] text-white"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Bio Field */}
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel className="text-white font-medium">
                          Bio
                        </FormLabel>
                        <span className="text-[#9E9E9E] text-sm">
                          * 500 Characters Max
                        </span>
                      </div>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe your server..."
                          className="bg-[#0F1114] border-[#0F1114] h-auto p-4 placeholder:text-[#9E9E9E] rounded-[8px] text-white min-h-[120px] resize-none"
                          maxLength={500}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button
                type="button"
                className="gap-2 !flex-1 h-auto flex items-center font-medium px-4 py-2 shadow-[2px_2px_0_0_#1F2227] text-lg border-[#1F2227] bg-[#0A0A0A] rounded border text-[#8A8C95]"
                onClick={() => form.reset()}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="gap-2 !flex-1 h-auto flex items-center font-medium px-4 py-2 shadow-[2px_2px_0_0_#FF007F] text-lg hover:bg-[#FF007F]/80 bg-[#FF007F] rounded text-[#0A0A0A] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <ComponentLoader className="text-[#0A0A0A]/80" />
                ) : null}
                {isSubmitting
                  ? serverId
                    ? "Updating"
                    : "Submitting"
                  : serverId
                  ? "Update Server"
                  : "Submit Server"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
