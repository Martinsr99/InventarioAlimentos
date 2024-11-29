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
import { ShareInvitation } from '../../services/types';
import './SharingSection.css';

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
  onDeleteFriend: (userId: string) => void;
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
  onDeleteInvite,
  onDeleteFriend
}) => {
  const { t } = useLanguage();

  const hasContent = friends.length > 0 || receivedInvitations.length > 0 || sentInvitations.length > 0;

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
        </IonItem>
        
        <IonButton 
          expand="block"
          onClick={onSendInvite}
          disabled={!isEmailValid}
          color={isEmailValid ? 'primary' : 'medium'}
          className="invite-button"
        >
          <IonIcon icon={personAddOutline} slot="start" />
          {t('sharing.sendInvite')}
        </IonButton>

        <div className="friends-section">
          <div className="friends-section-header">
            <IonIcon icon={peopleOutline} />
            <h2>{t('sharing.friendsSection')}</h2>
          </div>
          
          {hasContent ? (
            <IonList>
              {/* Accepted Friends */}
              {friends.map(friend => (
                <IonItem key={friend.userId} lines="none" className="friend-item">
                  <IonAvatar slot="start">
                    <IonImg src="/images/profile/apple.png" alt="User" />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{friend.email}</h2>
                    <IonBadge color="success" className="friend-status accepted">
                      {t('sharing.inviteAccepted')}
                    </IonBadge>
                    <div className="friend-actions">
                      <IonButton
                        color="danger"
                        fill="clear"
                        size="small"
                        className="delete-button"
                        onClick={() => onDeleteFriend(friend.userId)}
                      >
                        <IonIcon icon={trashOutline} slot="icon-only" />
                      </IonButton>
                    </div>
                  </IonLabel>
                </IonItem>
              ))}

              {/* Received Invitations */}
              {receivedInvitations.map(invitation => (
                <IonItem key={invitation.id} lines="none" className="friend-item">
                  <IonAvatar slot="start">
                    <IonImg src="/images/profile/apple.png" alt="User" />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{invitation.fromUserEmail}</h2>
                    <IonBadge color="warning" className="friend-status pending">
                      {t('sharing.invitePending')}
                    </IonBadge>
                    <div className="friend-actions">
                      <IonButton
                        color="success"
                        size="small"
                        onClick={() => onInvitationResponse(invitation.id, 'accepted')}
                      >
                        <IonIcon icon={checkmarkCircleOutline} slot="start" />
                        {t('sharing.accept')}
                      </IonButton>
                      <IonButton
                        color="danger"
                        size="small"
                        onClick={() => onInvitationResponse(invitation.id, 'rejected')}
                      >
                        <IonIcon icon={closeCircleOutline} slot="start" />
                        {t('sharing.reject')}
                      </IonButton>
                    </div>
                  </IonLabel>
                </IonItem>
              ))}

              {/* Sent Invitations */}
              {sentInvitations.map(invitation => (
                <IonItem key={invitation.id} lines="none" className="friend-item">
                  <IonAvatar slot="start">
                    <IonImg src="/images/profile/apple.png" alt="User" />
                  </IonAvatar>
                  <IonLabel>
                    <h2>{invitation.toUserEmail}</h2>
                    <IonBadge 
                      color={
                        invitation.status === 'accepted' ? 'success' :
                        invitation.status === 'rejected' ? 'danger' : 'warning'
                      } 
                      className={`friend-status ${invitation.status}`}
                    >
                      {t(`sharing.invite${invitation.status.charAt(0).toUpperCase() + invitation.status.slice(1)}`)}
                    </IonBadge>
                    <div className="friend-actions">
                      <IonButton
                        color="danger"
                        fill="clear"
                        size="small"
                        className="delete-button"
                        onClick={() => onDeleteInvite(invitation.id)}
                      >
                        <IonIcon icon={trashOutline} slot="icon-only" />
                      </IonButton>
                    </div>
                  </IonLabel>
                </IonItem>
              ))}
            </IonList>
          ) : (
            <div className="no-friends-text">
              {t('sharing.noFriends')}
            </div>
          )}
        </div>
      </IonCardContent>
    </IonCard>
  );
};
