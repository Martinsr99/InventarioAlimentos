import { useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import {
  sendShareInvitation,
  getReceivedInvitations,
  getSentInvitations,
  respondToInvitation,
  deleteInvitation
} from '../services/InvitationService';
import {
  getAcceptedShareUsers,
  deleteFriend
} from '../services/FriendService';
import { ShareInvitation } from '../services/types';

export const useSharing = (user: User | null, t: (key: string) => string) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [receivedInvitations, setReceivedInvitations] = useState<ShareInvitation[]>([]);
  const [sentInvitations, setSentInvitations] = useState<ShareInvitation[]>([]);
  const [friends, setFriends] = useState<{ userId: string; email: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [invitationToDelete, setInvitationToDelete] = useState<string>('');
  const [friendToDelete, setFriendToDelete] = useState<string>('');

  useEffect(() => {
    loadSharingData();
  }, [user]);

  const loadSharingData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [received, sent, acceptedUsers] = await Promise.all([
        getReceivedInvitations(user),
        getSentInvitations(user),
        getAcceptedShareUsers(user)
      ]);

      const pendingInvitations = received.filter(inv => inv.status === 'pending');
      setReceivedInvitations(pendingInvitations);
      setSentInvitations(sent);
      setFriends(acceptedUsers);
      setError(null);
    } catch (error) {
      setError(t('errors.sharingLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (event: CustomEvent) => {
    const newEmail = event.detail.value || '';
    setInviteEmail(newEmail);
    setIsEmailValid(validateEmail(newEmail));
  };

  const handleSendInvite = async () => {
    if (!user || !isEmailValid) return;

    try {
      setIsLoading(true);
      await sendShareInvitation(user, inviteEmail);
      await loadSharingData();
      setInviteEmail('');
      setIsEmailValid(false);
      setError(t('sharing.inviteSent'));
    } catch (error: any) {
      setError(error.message === 'invitation_exists' 
        ? t('sharing.alreadyInvited') 
        : t('errors.invitationSend'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleInvitationResponse = async (invitationId: string, response: 'accepted' | 'rejected') => {
    if (!user) return;

    try {
      setIsLoading(true);
      // Optimistically update the UI
      setReceivedInvitations(prev => prev.filter(inv => inv.id !== invitationId));
      
      await respondToInvitation(user, invitationId, response);
      // Only reload data after the operation is complete
      await loadSharingData();
      setError(null);
    } catch (error) {
      // If there's an error, reload the data to ensure UI is in sync
      await loadSharingData();
      setError(t('errors.invitationResponse'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteInvitation = async () => {
    if (!user || !invitationToDelete) return;

    try {
      setIsLoading(true);
      await deleteInvitation(user, invitationToDelete);
      await loadSharingData();
      setError(t('sharing.deleteSuccess'));
    } catch (error) {
      setError(t('errors.invitationDelete'));
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setInvitationToDelete('');
    }
  };

  const handleDeleteFriend = async () => {
    if (!user || !friendToDelete) return;

    try {
      setIsLoading(true);
      await deleteFriend(user, friendToDelete);
      await loadSharingData();
      setError(t('sharing.deleteSuccess'));
    } catch (error) {
      setError(t('errors.invitationDelete'));
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
      setFriendToDelete('');
    }
  };

  const confirmDeleteInvitation = (invitationId: string) => {
    setInvitationToDelete(invitationId);
    setFriendToDelete('');
    setShowDeleteConfirm(true);
  };

  const confirmDeleteFriend = (userId: string) => {
    setFriendToDelete(userId);
    setInvitationToDelete('');
    setShowDeleteConfirm(true);
  };

  return {
    inviteEmail,
    isEmailValid,
    receivedInvitations,
    sentInvitations,
    friends,
    isLoading,
    error,
    showDeleteConfirm,
    invitationToDelete,
    friendToDelete,
    handleEmailChange,
    handleSendInvite,
    handleInvitationResponse,
    handleDeleteInvitation,
    handleDeleteFriend,
    confirmDeleteInvitation,
    confirmDeleteFriend,
    setShowDeleteConfirm,
    setInvitationToDelete,
    setFriendToDelete,
    setError
  };
};
