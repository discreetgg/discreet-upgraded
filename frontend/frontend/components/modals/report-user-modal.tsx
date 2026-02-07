import {
  SubscribeDialog,
  SubscribeDialogContent,
  SubscribeDialogDescription,
  SubscribeDialogFooter,
  SubscribeDialogHeader,
  SubscribeDialogTitle,
} from '@/components/ui/subscribe-dialog';
import { Dispatch, SetStateAction, useState } from 'react';
import { Button } from '../ui/button';
import { Check } from 'lucide-react';
import { toast } from 'sonner';
import { reportHandle } from '@/actions/block-unblock';

interface Props {
  reportModal: boolean;
  setReportModal: Dispatch<SetStateAction<boolean>>;
  reportTarget: ReportPayload['targetType'];
  reporterDiscordID: string;
  targetId: string;
  authorUsername: string;
}
const issueTypes = [
  {
    id: 'hate',
    label: 'Hate',
    description:
      'Slurs, Racist Or Sexist Stereotypes, Dehumanization, Incitement Of Fear Or Discrimination',
    reason: 'HATE',
  },
  {
    id: 'abuse',
    label: 'Abuse & Harassment',
    description:
      'Insults, Unwanted Sexual Content & Graphic Objectification, Unwanted NSFW & Graphic Content, Violent Event Denial',
    reason: 'ABUSE_HARASSMENT',
  },
  {
    id: 'violent',
    label: 'Violent Speech',
    description:
      'Violent Threats, Wish Of Harm, Glorification Of Violence, Incitement Of Violence, Coded Incitement Of Violence',
    reason: 'VIOLENCE_SPEECH',
  },
  {
    id: 'child',
    label: 'Child Safety',
    description:
      'Child Sexual Exploitation, Grooming, Physical Child Abuse, Underage User',
    reason: 'CHILD_SAFETY',
  },
  {
    id: 'illegal',
    label: 'Illegal & Regulated Behaviors',
    description:
      'Human Exploitation, Sexual Services, Drugs, Weapons, Endangered Species, Facilitating Illegal Activity',
    reason: 'ILLEGAL_REGULATED_BEHAVIORS',
  },
];
export default function ReportUserModal({
  reportModal,
  setReportModal,
  reportTarget,
  reporterDiscordID,
  targetId,
  authorUsername,
}: Props) {
  const [selectedIssue, setSelectedIssue] = useState('');
  const [description, setDescription] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue && !description.trim()) {
      toast.error('Please select an issue type or provide details.');
      return;
    }
    if (selectedIssue || description.trim()) {
      setReportModal(false);
      await reportHandle({
        payload: {
          targetType: reportTarget as ReportPayload['targetType'],
          targetId,
          reporterDiscordID,
          description: description.trim() ?? '',
          reason: selectedIssue ?? '',
        },
      })
        .then((res) => {
          console.log(res);
          if (res.status === 400)
            return toast.error('Failed to send report. Please try again.');
          toast.success('Report has been sent successfully.');
        })
        .catch(() => {
          toast.error('Failed to send report. Please try again.');
        });
    }
  };

  return (
    <SubscribeDialog open={reportModal} onOpenChange={setReportModal}>
      <SubscribeDialogContent className="bg-dark-charcoal md:px-8 px-2 sm:max-w-[542px] pb-4  md:rounded-3xl">
        <SubscribeDialogHeader className="items-center pt-10  gap-y-4 flex flex-col">
          {reportTarget === 'User' && (
            <span>
              Report{' '}
              <span className="text-accent-color">@{authorUsername}</span>
            </span>
          )}
          {reportTarget === 'Post' && (
            <span>
              Report <span className="text-accent-color">{authorUsername}</span>
              's Post
            </span>
          )}
          <SubscribeDialogTitle className="md:text-2xl">
            What type of issue are you reporting
          </SubscribeDialogTitle>
          <SubscribeDialogDescription className="sr-only">
            Report user or content
          </SubscribeDialogDescription>
        </SubscribeDialogHeader>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-2">
          {/* Description textarea - the narrative setup */}
          <div>
            <label className="block text-zinc-400 text-sm mb-2">
              Reasons For Reporting (Detailed Description):
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-32 bg-transparent border  border-charcoal rounded-lg p-3 text-white placeholder-zinc-600 focus:outline-none focus:border-none focus:ring-[0.5px] focus:ring-accent-color resize-none text-sm"
              placeholder="Please provide details..."
            />
          </div>

          <div
            data-vertical-mask
            className="space-y-3 py-4 max-h-96 overflow-y-auto pr-2 "
          >
            {issueTypes.map((issue) => (
              <label key={issue.id} className="block cursor-pointer group">
                <div
                  className={`p-4 rounded-lg border transition-all duration-200 ${
                    selectedIssue === issue.id
                      ? 'bg-accent-color/10 border-accent-color'
                      : 'bg-dark-charcoal/50 border-charcoal hover:border-zinc-700 hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-off-white font-medium mb-1">
                        {issue.label}
                      </div>

                      <div className="text-accent-text text-xs leading-relaxed">
                        {issue.description}
                      </div>
                    </div>

                    <div className="ml-4 mt-1">
                      <input
                        type="radio"
                        name="issueType"
                        value={issue.reason}
                        checked={selectedIssue === issue.reason}
                        onChange={(e) => setSelectedIssue(e.target.value)}
                        className="sr-only"
                      />
                      <div
                        data-active={selectedIssue === issue.reason}
                        className={`w-5 h-5 p-1 rounded-full border-2 border-accent-text data-[active=true]:bg-accent-color data-[active=true]:border-none flex items-center justify-center transition-all
													`}
                      >
                        {selectedIssue === issue.reason && (
                          <Check className="size-full text-black" />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </label>
            ))}
          </div>
          <SubscribeDialogFooter className="w-full gap-y-8 items-center flex flex-col mt-10">
            <Button
              type="submit"
              className="rounded flex items-center w-full gap-2.5 border  active:bg-transparent h-auto px-10 py-2 text-[15px] font-medium whitespace-nowrap border-accent-color bg-transparent shadow-[2px_3px_0_0_#FF007F] text-accent-color"
            >
              Report
            </Button>
          </SubscribeDialogFooter>
        </form>
      </SubscribeDialogContent>
    </SubscribeDialog>
  );
}
