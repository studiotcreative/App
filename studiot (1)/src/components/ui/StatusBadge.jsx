import React from 'react';
import { Badge } from "@/components/ui/badge";
import { 
  FileEdit, 
  Eye, 
  Send, 
  CheckCircle2, 
  Rocket, 
  CheckCheck 
} from 'lucide-react';

const statusConfig = {
  draft: {
    label: 'Draft',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: FileEdit
  },
  internal_review: {
    label: 'Internal Review',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: Eye
  },
  sent_to_client: {
    label: 'Awaiting Approval',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: Send
  },
  approved: {
    label: 'Approved',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: CheckCircle2
  },
  ready_to_post: {
    label: 'Ready to Post',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: Rocket
  },
  posted: {
    label: 'Posted',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: CheckCheck
  }
};

export default function StatusBadge({ status, size = 'default' }) {
  const config = statusConfig[status] || statusConfig.draft;
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} font-medium ${size === 'sm' ? 'text-xs px-2 py-0.5' : ''}`}
    >
      <Icon className={`${size === 'sm' ? 'w-3 h-3 mr-1' : 'w-3.5 h-3.5 mr-1.5'}`} />
      {config.label}
    </Badge>
  );
}

export { statusConfig };