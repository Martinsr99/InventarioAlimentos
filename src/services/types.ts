export interface ShareInvitation {
  id: string;
  fromUserId: string;
  fromUserEmail: string;
  toUserEmail: string;
  toUserId?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
}

export interface UserSharing {
  userId: string;
  email: string;
  sharedWith: Array<{ userId: string; email: string }>;
  createdAt: string;
}
