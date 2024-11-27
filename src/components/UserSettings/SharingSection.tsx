import React from 'react';
import {
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonItem,
  IonIcon,
  IonLabel,
  IonInput,
  IonButton,
  IonList,
  IonAvatar,
  IonImg,
  IonBadge,
  IonText
} from '@ionic/react';
import {
  mailOutline,
  personAddOutline,
  checkmarkCircle,
  closeCircle,
  peopleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  trashOutline
} from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShareInvitation } from '../../services/SharedProductsService';

interface SharingSectionProps {
  inviteEmail: string;
  isEmailValid: boolean;
  receivedInvitations: ShareInvitation[];
  sentInvitations: ShareInvitation[];
  friends: { userId: string; email: string }[];
  onEmailChange: (event: CustomEvent) => void;
  onSendInvite: () => Promise<void>;
  onInvitationResponse: (invitationId: string, response: 'accepted' | 'rejected') => Promise<void>;
  onDeleteInvite: (invitationId: string) => void;
}

export const SharingSection: React.FC<SharingSectionProps> = ({
  inviteEmail,
  isEmailValid,
  receivedInvitations,
  sentInvitations,
  friends,
  onEmailChange,
  onSendInvite,
  onInvitationResponse,
  onDeleteInvite
}) => {
  const { t } = useLanguage();

  return (
    <IonCard>
      <IonCardHeader>
        <IonCardTitle>{t('sharing.title')}</IonCardTitle>
      </IonCardHeader>
      <IonCardContent>
        <IonItem lines="none" className={`invite-input-container ${inviteEmail && (isEmailValid ? 'valid-email' : 'invalid-email')}`}>
          <IonIcon icon={mailOutline} slot="start" />
          <IonInput
            type="email"
            value={inviteEmail}
            onIonInput={onEmailChange}
            placeholder={t('sharing.enterEmail')}
          />
          {inviteEmail && (
            <IonIcon
              slot="end"
              icon={isEmailValid ? checkmarkCircle : closeCircle}
              color={isEmailValid ? 'success' : 'danger'}
              className="email-validation-icon"
            />
          )}
          <IonButton 
            slot="end" 
            onClick={onSendInvite}
            disabled={!isEmailValid}
            color={isEmailValid ? 'primary' : 'medium'}
            className={isEmailValid ? 'enabled-button' : ''}
          >
            <IonIcon icon={personAddOutline} slot="start" />
            {t('sharing.sendInvite')}
          </IonButton>
        </IonItem>

        {friends.length > 0 && (
          <>
            <h2>
              <IonIcon icon={peopleOutline} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              {t('sharing.friendsSection')}
            </h2>
            <IonList>
              {friends.map(friend => (
                <IonItem key={friend.userId}>
                  <IonAvatar slot="start">
                    <IonImg src="/images/profile/apple.png" alt="User" />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{friend.email}</h2>
                    <IonBadge color="success">
                      {t('sharing.inviteAccepted')}
                    </IonBadge>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          </>
        )}

        {receivedInvitations.length > 0 && (
          <>
            <h2>{t('sharing.receivedInvites')}</h2>
            <IonList>
              {receivedInvitations.map(invitation => (
                <IonItem key={invitation.id}>
                  <IonAvatar slot="start">
                    <IonImg src="/images/profile/apple.png" alt="User" />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{invitation.fromUserEmail}</h2>
                    <p>{t('sharing.invitePending')}</p>
                  </IonLabel>
                  <IonButton
                    slot="end"
                    color="success"
                    onClick={() => onInvitationResponse(invitation.id, 'accepted')}
                  >
                    <IonIcon icon={checkmarkCircleOutline} slot="start" />
                    {t('sharing.accept')}
                  </IonButton>
                  <IonButton
                    slot="end"
                    color="danger"
                    onClick={() => onInvitationResponse(invitation.id, 'rejected')}
                  >
                    <IonIcon icon={closeCircleOutline} slot="start" />
                    {t('sharing.reject')}
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          </>
        )}

        {sentInvitations.length > 0 && (
          <>
            <h2>{t('sharing.sentInvites')}</h2>
            <IonList>
              {sentInvitations.map(invitation => (
                <IonItem key={invitation.id}>
                  <IonAvatar slot="start">
                    <IonImg src="/images/profile/apple.png" alt="User" />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{invitation.toUserEmail}</h2>
                    <IonBadge color={
                      invitation.status === 'accepted' ? 'success' :
                      invitation.status === 'rejected' ? 'danger' : 'warning'
                    }>
                      {t(`sharing.invite${invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}`)}
                    </IonBadge>
                  </IonLabel>
                  <IonButton
                    slot="end"
                    color="danger"
                    fill="clear"
                    onClick={() => onDeleteInvite(invitation.id)}
                  >
                    <IonIcon icon={trashOutline} />
                  </IonButton>
                </IonItem>
              ))}
            </IonList>
          </>
        )}

        {receivedInvitations.length === 0 && sentInvitations.length === 0 && friends.length === 0 && (
          <IonText color="medium">
            <p>{t('sharing.noInvites')}</p>
          </IonText>
        )}
      </IonCardContent>
    </IonCard>
  );
};
