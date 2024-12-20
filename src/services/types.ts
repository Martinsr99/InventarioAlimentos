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
  invitationId?: string;
}

export interface Product {
  id: string;
  name: string;
  expiryDate: string;
  location: string;
  quantity: number;
  category?: string;
  notes: string;
  userId: string;
  addedAt: string;
  sharedWith?: string[];
}
