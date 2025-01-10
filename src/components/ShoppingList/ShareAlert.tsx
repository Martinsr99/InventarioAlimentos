import React, { useState } from 'react';
import {
  IonActionSheet,
  IonIcon,
} from '@ionic/react';
import { checkmark } from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';

interface ShareAlertProps {
  isOpen: boolean;
  onDismiss: () => void;
  onShare: (selectedFriendIds: string[]) => void;
  friends: { userId: string; email: string }[];
}

export const ShareAlert: React.FC<ShareAlertProps> = ({
  isOpen,
  onDismiss,
  onShare,
  friends,
}) => {
  const { t } = useLanguage();
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  const handleUserSelect = (userId: string) => {
    const newSelection = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    setSelectedUsers(newSelection);
    return false; // Keep the action sheet open
  };

  const handleDone = () => {
    if (selectedUsers.length > 0) {
      onShare(selectedUsers);
    }
    onDismiss();
    setSelectedUsers([]); // Reset selection
  };

  return (
    <IonActionSheet
      isOpen={isOpen}
      onDidDismiss={() => {
        onDismiss();
        setSelectedUsers([]); // Reset selection on dismiss
      }}
      cssClass="shopping-list-action-sheet"
      buttons={[
        ...friends.map(friend => ({
          text: friend.email,
          icon: selectedUsers.includes(friend.userId) ? checkmark : undefined,
          handler: () => handleUserSelect(friend.userId),
          cssClass: selectedUsers.includes(friend.userId) ? 'selected-user' : ''
        })),
        {
          text: t('common.done'),
          role: 'selected',
          handler: handleDone
        },
        {
          text: t('common.cancel'),
          role: 'cancel',
          handler: () => {
            setSelectedUsers([]); // Reset selection on cancel
          }
        }
      ]}
      header={t('sharing.selectFriends')}
    />
  );
};
