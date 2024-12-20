import { useState, useEffect, useCallback } from 'react';
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from '../firebaseConfig';
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

export type SortOption = 'status' | 'email';
export type SortDirection = 'asc' | 'desc';

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
  const [sortBy, setSortBy] = useState<SortOption>('status');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const sortItems = useCallback((items: any[]) => {
    return [...items].sort((a, b) => {
      let aValue = sortBy === 'email' 
        ? (a.email || a.fromUserEmail || a.toUserEmail || '')
        : (a.status || 'accepted');
      let bValue = sortBy === 'email'
        ? (b.email || b.fromUserEmail || b.toUserEmail || '')
        : (b.status || 'accepted');

      if (sortDirection === 'desc') {
        [aValue, bValue] = [bValue, aValue];
      }

      return aValue.localeCompare(bValue);
    });
  }, [sortBy, sortDirection]);

  // Escuchar cambios en invitaciones recibidas
  useEffect(() => {
    if (!user?.email) return;

    setIsLoading(true);
    
    // Query para invitaciones recibidas
    const receivedQuery = query(
      collection(db, 'shareInvitations'),
      where('toUserEmail', '==', user.email)
    );

    // Query para invitaciones enviadas
    const sentQuery = query(
      collection(db, 'shareInvitations'),
      where('fromUserId', '==', user.uid)
    );

    // Query para amigos aceptados
    const userSharingQuery = query(
      collection(db, 'userSharing'),
      where('userId', '==', user.uid)
    );

    // Suscribirse a cambios en invitaciones recibidas
    const unsubscribeReceived = onSnapshot(receivedQuery, (snapshot) => {
      const pendingInvitations = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as ShareInvitation))
        .filter(inv => inv.status === 'pending');
      setReceivedInvitations(sortItems(pendingInvitations));
      setIsLoading(false);
    });

    // Suscribirse a cambios en invitaciones enviadas
    const unsubscribeSent = onSnapshot(sentQuery, async (snapshot) => {
      const sentInvitations = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      } as ShareInvitation));
      
      // Solo mostrar invitaciones pendientes o rechazadas
      const filteredInvitations = sentInvitations.filter(inv => 
        inv.status !== 'accepted'
      );
      
      setSentInvitations(sortItems(filteredInvitations));
    });

    // Suscribirse a cambios en amigos
    const unsubscribeSharing = onSnapshot(userSharingQuery, async (snapshot) => {
      if (!snapshot.empty) {
        const userData = snapshot.docs[0].data();
        setFriends(sortItems(userData.sharedWith || []));
      }
    });

    // Limpiar suscripciones al desmontar
    return () => {
      unsubscribeReceived();
      unsubscribeSent();
      unsubscribeSharing();
    };
  }, [user, sortItems]);


  const loadSharingData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const [received, sent, acceptedUsers] = await Promise.all([
        getReceivedInvitations(user),
        getSentInvitations(user),
        getAcceptedShareUsers(user)
      ]);

      // Filtrar invitaciones pendientes
      const pendingInvitations = received.filter(inv => inv.status === 'pending');
      setReceivedInvitations(sortItems(pendingInvitations));

      // Filtrar invitaciones enviadas para no mostrar las que ya están aceptadas
      const nonAcceptedSentInvitations = sent.filter(inv => 
        !acceptedUsers.some(user => user.email === inv.toUserEmail)
      );
      setSentInvitations(sortItems(nonAcceptedSentInvitations));

      // Establecer amigos aceptados
      setFriends(sortItems(acceptedUsers));
      setError(null);
    } catch (error) {
      setError(t('errors.sharingLoad'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setReceivedInvitations(prev => sortItems([...prev]));
    setSentInvitations(prev => sortItems([...prev]));
    setFriends(prev => sortItems([...prev]));
  }, [sortBy, sortDirection, sortItems]);

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
      await respondToInvitation(user, invitationId, response);
      // Inmediatamente recargar los datos
      await loadSharingData();
      setError(response === 'accepted' ? t('sharing.inviteAccepted') : t('sharing.inviteRejected'));
    } catch (error) {
      console.error('All retry attempts failed:', error);
      // If there's an error, reload the data to ensure UI is in sync
      await loadSharingData();
      // Show a more specific error message
      if (error instanceof Error && error.message === 'Failed to update sharing documents') {
        setError(t('errors.sharingUpdate'));
      } else {
        setError(t('errors.invitationResponse'));
      }
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

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
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
    sortBy,
    sortDirection,
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
    setError,
    setSortBy,
    toggleSortDirection,
    loadSharingData
  };
};
