import React from 'react';
import {
  IonItem,
  IonIcon,
  IonLabel,
  IonInput,
  IonButton,
  IonList,
  IonAvatar,
  IonImg,
  IonBadge,
  IonCheckbox,
  IonToolbar,
  IonButtons,
  IonText,
} from '@ionic/react';
import {
  mailOutline,
  personAddOutline,
  checkmarkCircle,
  closeCircle,
  peopleOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  trashOutline,
  arrowUp,
  checkmarkOutline,
  closeOutline
} from 'ionicons/icons';
import { useLanguage } from '../../contexts/LanguageContext';
import { ShareInvitation } from '../../services/types';
import { SortOption, SortDirection } from '../../hooks/useSharing';
import './SharingSection.css';

interface SharingSectionProps {
  inviteEmail: string;
  isEmailValid: boolean;
  receivedInvitations: ShareInvitation[];
  sentInvitations: ShareInvitation[];
  friends: { userId: string; email: string }[];
  sortBy: SortOption;
  sortDirection: SortDirection;
  onEmailChange: (event: CustomEvent) => void;
  onSendInvite: () => Promise<void>;
  onInvitationResponse: (invitationId: string, response: 'accepted' | 'rejected') => Promise<void>;
  onDeleteInvite: (invitationId: string) => void;
  selectedFriends: string[];
  onToggleFriendSelection: (userId: string) => void;
  onSelectAllFriends: () => void;
  onDeselectAllFriends: () => void;
  onDeleteFriends: () => void;
  onSortByChange: (sortBy: SortOption) => void;
  onSortDirectionChange: () => void;
}

export const SharingSection: React.FC<SharingSectionProps> = ({
  inviteEmail,
  isEmailValid,
  receivedInvitations,
  sentInvitations,
  friends,
  sortBy,
  sortDirection,
  onEmailChange,
  onSendInvite,
  onInvitationResponse,
  onDeleteInvite,
  selectedFriends,
  onToggleFriendSelection,
  onSelectAllFriends,
  onDeselectAllFriends,
  onDeleteFriends,
  onSortByChange,
  onSortDirectionChange
}) => {
  const { t } = useLanguage();

  const hasContent = friends.length > 0 || receivedInvitations.length > 0 || sentInvitations.length > 0;

  const handleSortClick = (option: SortOption) => {
    if (sortBy === option) {
      onSortDirectionChange();
    } else {
      onSortByChange(option);
    }
  };

  return (
    <div className="sharing-section">
      <h2 className="settings-section-title">{t('sharing.title')}</h2>
      
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
          <div className="friends-header-left">
            <IonIcon icon={peopleOutline} />
            <h3>{t('sharing.friendsSection')}</h3>
          </div>
          <div className="friends-header-right">
            {friends.length > 0 && (
              <div className="selection-controls">
                {selectedFriends.length > 0 ? (
                  <>
                    <IonButton
                      fill="clear"
                      size="small"
                      onClick={onDeselectAllFriends}
                    >
                      <IonIcon icon={closeOutline} slot="start" />
                      {t('sharing.deselectAll')}
                    </IonButton>
                    <IonButton
                      color="danger"
                      size="small"
                      onClick={onDeleteFriends}
                      className="delete-selected-button"
                    >
                      <IonIcon icon={trashOutline} slot="start" />
                      {t('sharing.deleteSelected')}
                    </IonButton>
                  </>
                ) : (
                  <IonButton
                    fill="clear"
                    size="small"
                    onClick={onSelectAllFriends}
                  >
                    <IonIcon icon={checkmarkOutline} slot="start" />
                    {t('sharing.selectAll')}
                  </IonButton>
                )}
              </div>
            )}
            <div className="friends-sort-controls">
              <button 
                className={`sort-button ${sortBy === 'status' ? 'active' : ''}`}
                onClick={() => handleSortClick('status')}
              >
                {t('sharing.sortByStatus')}
                {sortBy === 'status' && (
                  <IonIcon 
                    icon={arrowUp} 
                    className={sortDirection === 'desc' ? 'desc' : ''}
                  />
                )}
              </button>
              <button 
                className={`sort-button ${sortBy === 'email' ? 'active' : ''}`}
                onClick={() => handleSortClick('email')}
              >
                {t('sharing.sortByEmail')}
                {sortBy === 'email' && (
                  <IonIcon 
                    icon={arrowUp} 
                    className={sortDirection === 'desc' ? 'desc' : ''}
                  />
                )}
              </button>
            </div>
          </div>
        </div>
        
        {hasContent ? (
          <IonList>
            {/* Accepted Friends */}
            {friends.map(friend => (
              <IonItem key={friend.userId} lines="none" className="friend-item">
                <IonCheckbox
                  slot="start"
                  checked={selectedFriends.includes(friend.userId)}
                  onIonChange={() => onToggleFriendSelection(friend.userId)}
                />
                <IonAvatar>
                  <IonImg src="/images/profile/apple.png" alt="User" />
                </IonAvatar>
                <IonLabel>
                  <h2>{friend.email}</h2>
                  <IonBadge color="success" className="friend-status accepted">
                    {t('sharing.inviteAccepted')}
                  </IonBadge>
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
    </div>
  );
};
