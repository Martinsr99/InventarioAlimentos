import React, { useState } from 'react';
import {
  IonItem,
  IonLabel,
  IonActionSheet,
  IonIcon,
} from '@ionic/react';
import { checkmark } from 'ionicons/icons';
import { useLanguage } from '../../../contexts/LanguageContext';

interface SharedUsersProps {
  users: { userId: string; email: string }[];
  selectedUsers: string[];
  onUsersChange: (value: string[]) => void;
}

const SharedUsersSelector: React.FC<SharedUsersProps> = ({
  users,
  selectedUsers,
  onUsersChange,
}) => {
  const { t } = useLanguage();
  const [showActionSheet, setShowActionSheet] = useState(false);

  const getSelectedUsersText = () => {
    if (selectedUsers.length === 0) {
      return t('products.selectSharedWith');
    }
    const selectedEmails = users
      .filter(user => selectedUsers.includes(user.userId))
      .map(user => user.email);
    if (selectedEmails.length === 1) {
      return selectedEmails[0];
    }
    // Display count without using translation variables
    return `${selectedEmails.length} ${t('sharing.friends')}`;
  };

  const handleUserSelect = (userId: string) => {
    const newSelection = selectedUsers.includes(userId)
      ? selectedUsers.filter(id => id !== userId)
      : [...selectedUsers, userId];
    onUsersChange(newSelection);
    return false; // Keep the action sheet open
  };

  return (
    <>
      <IonItem onClick={() => setShowActionSheet(true)} button>
        <IonLabel position="stacked">
          {t('products.sharedWith')} ({t('common.optional')})
        </IonLabel>
        <IonLabel>{getSelectedUsersText()}</IonLabel>
      </IonItem>

      <IonActionSheet
        isOpen={showActionSheet}
        onDidDismiss={() => setShowActionSheet(false)}
        cssClass="product-action-sheet"
        buttons={[
          ...users.map(user => ({
            text: user.email,
            icon: selectedUsers.includes(user.userId) ? checkmark : undefined,
            handler: () => handleUserSelect(user.userId),
            cssClass: selectedUsers.includes(user.userId) ? 'selected-user' : ''
          })),
          {
            text: t('common.done'),
            role: 'cancel'
          }
        ]}
        header={t('sharing.selectUsers')}
      />
    </>
  );
};

export default SharedUsersSelector;
