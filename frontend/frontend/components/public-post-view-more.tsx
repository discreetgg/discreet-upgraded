'use client';

import { Icon } from './ui/icons';
import { PostType } from '@/types/global';
import { Button } from './ui/button';
import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion as m } from 'motion/react';
import BlockUserModal from './modals/block-user-modal';
import ReportUserModal from './modals/report-user-modal';
import { useGlobal } from '@/context/global-context-provider';

interface Props {
  post: PostType;
}

export const PublicPostViewMore = ({ post }: Props) => {
  const { user: currentUser } = useGlobal();

  const [openModal, setOpenModal] = useState(false);
  const [blockModal, setBlockModal] = useState(false);
  const [reportModal, setReportModal] = useState(false);
  const [reportTarget, setReportTarget] =
    useState<ReportPayload['targetType']>('User');

  const modalRef = useRef<HTMLDivElement>(null);

  const handleOutsideClick = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      setOpenModal(false);
    }
  };

  useEffect(() => {
    document.addEventListener('mousedown', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, []);

  const MENU_ITEMS_PUBLIC = [
    {
      id: '1',
      target: 'User',
      title: 'Report user',
    },
    {
      id: '2',
      target: 'Post',
      title: 'Report Content',
    },
  ];

  if (!currentUser) return null;
  return (
    <>
      <div className="relative ">
        <Button
          disabled={openModal}
          variant={'ghost'}
          size={'ghost'}
          className="text-accent-text p-0"
          onClick={() => setOpenModal(!openModal)}
        >
          <Icon.more className="size-5" />
        </Button>
        <AnimatePresence>
          {openModal && (
            <m.div
              ref={modalRef}
              initial={{ opacity: 0, y: -15, scale: 0.7 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="shadow-[4px_4px_0_0_#1F2227] bg-[#0F1114] border-[#1E1E21] rounded-lg absolute flex flex-col gap-y-4x items-start divide-y divide-dark-border right-0 md:left-1/2 md:-translate-x-1/2 top-full mt-2 z-[49] min-w-max"
            >
              {MENU_ITEMS_PUBLIC.map((item) => (
                <Button
                  key={item.id}
                  onClick={() => {
                    setReportTarget(item.target as ReportPayload['targetType']);
                    setOpenModal(false);
                    setReportModal(true);
                  }}
                  variant={'ghost'}
                  size="ghost"
                  className="text-[15px] text-[#D4D4D8] m-0 rounded-none md:px-3 py-4 pr-10 w-full flex justify-start font-normal hover:text-white select-none"
                >
                  {item.title}
                </Button>
              ))}
              <Button
                onClick={() => {
                  setOpenModal(false);
                  setBlockModal(true);
                }}
                variant={'ghost'}
                size="ghost"
                className="text-[15px] text-[#D4D4D8] m-0 rounded-none md:px-3 py-4 pr-10 w-full flex justify-start font-normal hover:text-white"
              >
                Block{' '}
                <span className="text-accent-color">
                  @{post.author.username}
                </span>
              </Button>
            </m.div>
          )}
        </AnimatePresence>
      </div>
      {blockModal && (
        <BlockUserModal
          authorDiscordId={post.author.discordId}
          authorUsername={post.author.username}
          blockModal={blockModal}
          setBlockModal={setBlockModal}
        />
      )}
      {reportModal && (
        <ReportUserModal
          authorUsername={post.author.username}
          reportModal={reportModal}
          setReportModal={setReportModal}
          reportTarget={reportTarget}
          reporterDiscordID={currentUser.discordId}
          targetId={reportTarget === 'User' ? post.author._id : post._id}
        />
      )}
    </>
  );
};
