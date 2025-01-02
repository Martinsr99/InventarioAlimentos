import React from 'react';
import {
  IonAlert,
} from '@ionic/react';
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

  return (
    <IonAlert
      isOpen={isOpen}
      onDidDismiss={onDismiss}
      header={t('sharing.selectFriends')}
      inputs={friends.map(friend => ({
        type: 'checkbox',
        label: friend.email,
        value: friend.userId,
        checked: false
      }))}
      buttons={[
        {
          text: t('common.cancel'),
          role: 'cancel',
          handler: onDismiss
        },
        {
          text: t('common.share'),
          handler: (selectedIds: string[]) => {
            if (selectedIds && selectedIds.length > 0) {
              onShare(selectedIds);
            }
          }
        }
      ]}
    />
  );
};
