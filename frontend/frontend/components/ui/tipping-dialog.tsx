"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type * as React from "react";

import { cn } from "@/lib/utils";
import { Icon } from "./icons";
import { Button } from "./button";

const MAX_DIALOG_BOX_WIDTH = "w-[600px] min-w-[600px]";

function Dialog({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Root>) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}

function DialogTrigger({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Trigger>) {
  return <DialogPrimitive.Trigger data-slot="dialog-trigger" {...props} />;
}

function DialogPortal({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Portal>) {
  return <DialogPrimitive.Portal data-slot="dialog-portal" {...props} />;
}

function DialogClose({
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Close>) {
  return <DialogPrimitive.Close data-slot="dialog-close" {...props} />;
}

function DialogOverlay({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Overlay>) {
  return (
    <div className="relative">
      <DialogPrimitive.Overlay
        data-slot="dialog-overlay"
        className={cn(
          "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 fixed inset-0 z-50 bg-black/80",
          "grid grid-rows-8  flex-col divide-y divide-x divide-[#1F2227] backdrop-blur-[10px]",

          className
        )}
        {...props}
      >
        <div className="row-span-1 w-full h-full flex items-center justify-between border-b border-[#1F2227]">
          <div className="w-full h-full" />
          <div
            className={cn(
              "w-full h-full border-r border-[#1F2227] border-l",
              MAX_DIALOG_BOX_WIDTH
            )}
          >
            <div className="relative pb-6 pl-1.5 flex items-end h-full">
              <DialogPrimitive.Close asChild className="">
                <Button className="space-x-2  text-[#8A8C95] !border-0 !shadow-none !bg-transparent hover:bg-transparent active:bg-transparent hover:text-[#F8F8F8] ">
                  <Icon.left className="size-4" />
                  <span className=" text-[15px] font-medium">Back to post</span>
                </Button>
              </DialogPrimitive.Close>
            </div>
          </div>
          <div className="w-full h-full" />
        </div>

        <div className="flex items-center justify-between w-full h-[550px] row-span-5">
          <div className=" w-full h-full" />

          {/* <div className="relative border-r-0">
          <DialogPrimitive.Close className="rounded border hover:bg-transparent active:bg-transparent h-auto px-4 py-3.5 text-[15px] font-medium whitespace-nowrap flex items-center gap-2 border-[#1E1E21] bg-[#0F1114] shadow-[2px_2px_0_0_#1E1E21] absolute right-6 top-[46px] z-50">
            <Icon.close />
            <span className="text-[#D4D4D8] text-[15px] font-medium">
              Close
            </span>
            <span className="sr-only">Close</span>
          </DialogPrimitive.Close>
        </div> */}

          <div
            className={cn(
              "relative col-span-10 lg:col-span-6 flex items-center justify-center border-[#1F2227] border-l border-r w-full h-full",
              MAX_DIALOG_BOX_WIDTH
            )}
          >
            {children}
            <Icon.dialogAddIcon className=" absolute -left-[7.9616445px] -top-[7.9616445px]" />
            <Icon.dialogAddIcon className=" absolute -right-[7.9616445px] -top-[7.9616445px]" />
            <Icon.dialogAddIcon className=" absolute -left-[7.9616445px] -bottom-[7.9616445px]" />
            <Icon.dialogAddIcon className=" absolute -right-[7.9616445px] -bottom-[7.9616445px]" />
          </div>
          <div className=" w-full h-full" />
        </div>
        <div className="row-span-2 w-full h-full flex items-center justify-between ">
          <div className="w-full h-full" />
          <div
            className={cn(
              "w-full h-full border-r border-[#1F2227] border-l",
              MAX_DIALOG_BOX_WIDTH
            )}
          />
          <div className="w-full h-full" />
        </div>
      </DialogPrimitive.Overlay>
    </div>
  );
}

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPortal data-slot="dialog-portal">
      <DialogOverlay onClick={(e) => e.stopPropagation()}>
        <DialogPrimitive.Content
          data-slot="dialog-content"
          className={cn(
            "bg-transparent border-0 shadow-none bg-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 duration-200 sm:max-w-lg",
            className
          )}
          {...props}
        >
          {children}
        </DialogPrimitive.Content>
      </DialogOverlay>
    </DialogPortal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("flex flex-col gap-2 text-center sm:text-left", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        "flex flex-col-reverse gap-2 sm:flex-row sm:justify-end",
        className
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lg leading-none font-semibold", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
};
