// Re-export lucide-react icons with project naming conventions
export {
  ArrowUp as ArrowUpIcon,
  Square as StopIcon,
  Paperclip as PaperclipIcon,
  Mic as MicrophoneIcon,
  MessageCircle as MessageIcon,
  X as CrossIcon,
  XCircle as CrossSmallIcon,
  Loader2 as LoaderIcon,
  Copy as CopyIcon,
  CheckCircle2 as CheckCircleFillIcon,
  Undo2 as UndoIcon,
  Redo2 as RedoIcon,
  ChevronDown as ChevronDownIcon,
  Sparkles as SparklesIcon,
  PenTool as PencilEditIcon,
  File as FileIcon,
  Maximize as FullscreenIcon,
  Image as ImageIcon,
  BarChart3 as SummarizeIcon,
  Terminal as TerminalWindowIcon,
  ThumbsUp as ThumbUpIcon,
  ThumbsDown as ThumbDownIcon,
  AlertTriangle as WarningIcon,
  SidebarOpen as SidebarLeftIcon,
  Bot as BotIcon,
  ChevronLeft as ChevronLeftIcon,
  Menu as MenuIcon,
  LineChart as LineChartIcon,
  RotateCcw as ClockRewind,
  Pen as PenIcon,
  Globe as GlobeIcon,
  Lock as LockIcon,
} from 'lucide-react';

// Keep AdaLinkLogo as custom since it's project-specific
export const AdaLinkLogo = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 18 18"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M7.24193 14.2402L3.12666 14.2127C2.53927 14.2127 1.49734 14.2471 1.46237 13.1434C1.44489 12.6414 2.10222 11.6993 2.34347 11.3107C3.73504 9.08264 5.02172 6.75828 6.38881 4.5474C6.74195 3.97318 7.06362 3.43336 7.39578 2.86946C7.75241 2.2643 7.99716 1.53536 8.75588 1.45628C9.71389 1.35313 9.94815 2.058 10.2803 2.63909C10.616 3.22705 10.9516 3.74625 11.2873 4.31702L13.3152 7.72791C13.8851 8.63909 14.8221 10.3514 15.3431 11.1319C15.5424 11.4276 15.6753 11.6752 15.8466 11.9709C15.9375 12.1256 16.0179 12.2803 16.0913 12.3973C16.413 12.8924 16.4969 13.3703 16.0354 13.8345C15.5809 14.2987 14.7662 14.1921 13.976 14.1921L11.3292 14.199C10.4656 14.199 10.7069 14.3503 9.93067 13.2534C9.74536 12.9921 9.59502 12.7789 9.43069 12.5417C9.32929 12.3938 9.26286 12.3319 9.17195 12.2013C9.05657 12.0293 9.0286 11.964 8.85028 11.8574C8.59504 12.3801 7.6685 13.4769 7.32585 14.0718L7.23494 14.2437L7.24193 14.2402ZM8.88175 17.9984C9.11601 17.8471 9.2209 17.5858 9.38873 17.3623C9.55656 17.1388 9.73837 16.9359 9.88522 16.7159C10.4656 15.8288 10.4901 15.6569 11.0635 15.6603C12.3327 15.6672 14.4026 15.7875 15.5844 15.65C16.8046 15.5056 17.6997 14.5703 17.8745 13.4116C18.0423 12.3216 17.2172 11.3142 16.5913 10.2448C15.011 7.54224 13.0984 4.51989 11.56 1.85169C10.9901 0.871752 10.4516 0.0155911 8.96217 -0.00160093C7.50416 -0.0187929 6.89229 0.816737 6.28742 1.83794L1.27706 10.2517C0.986862 10.7365 0.703652 11.1938 0.42394 11.6821C-0.670436 13.5835 0.497364 15.4127 2.29102 15.6328C3.48679 15.7772 5.48674 15.65 6.79439 15.6569C7.32235 15.6603 7.31536 15.7738 7.53913 16.0935L8.88175 18.0018V17.9984Z"
      fill="url(#paint0_linear_5942_399)"
    />
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.10583 12.3251L5.77362 12.3423L8.33649 7.85863C9.02878 6.57955 9.66163 8.18872 9.83295 8.48098L12.0182 12.3389L13.7454 12.3561L10.7036 6.96121C9.86092 5.56866 7.9414 5.5996 7.15121 6.95433C6.79807 7.56293 6.4764 8.11307 6.13026 8.74917L4.10933 12.3217L4.10583 12.3251Z"
      fill="url(#paint1_linear_5942_399)"
    />
    <defs>
      <linearGradient
        id="paint0_linear_5942_399"
        x1="17.7557"
        y1="19.486"
        x2="35.8632"
        y2="19.486"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#CB54FE" />
        <stop offset="1" stopColor="#8B0EFE" />
      </linearGradient>
      <linearGradient
        id="paint1_linear_5942_399"
        x1="21.4242"
        y1="19.6389"
        x2="31.6247"
        y2="19.6389"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#CB54FE" />
        <stop offset="1" stopColor="#8B0EFE" />
      </linearGradient>
    </defs>
  </svg>
);
